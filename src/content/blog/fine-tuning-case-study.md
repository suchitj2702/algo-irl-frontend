## The Challenge

While building AlgoIRL, I faced a common but critical problem: **how do you transform generic LeetCode-style algorithm problems into company-specific, role-tailored interview questions at scale?**

The first POC I built for AlgoIRL used extensive prompt engineering with frontier models like GPT-5 and Claude Sonnet 4. And while these models produced incredible results, they came with two deal-breaking limitations, which I knew wouldn't scale:

1. **Cost**: $45+ per 1,000 transformations adds up fast (based on ~7K tokens/request at Claude Sonnet 4 model pricing)
2. **Latency**: P90 latency of 25 seconds creates poor user experiences

I needed a solution that maintained high quality while being fast and affordable enough for production use. This is the story of how I used **knowledge distillation** to achieve exactly that: a fine-tuned model that delivers **96% of the teacher model's quality, 10x P90 latency reduction, and 97% lower inference cost**.

## Quality Validation Pipeline

Before diving into knowledge distillation, I needed a way to prove numerically that one model’s transformation was better than another’s. So I built a provider-agnostic **LLM-as-a-judge** workflow that turns raw outputs into a single, consistent report card.

First, every model is fed the exact same collection of company/problem/role triplets. The deterministic sampling keeps the playing field level. If a score changes, it’s because the model behaved differently, not because it saw easier prompts.

Next, each output is evaluated along six dimensions that mirror the requirements of real interview content: **algorithmic correctness, company relevance, role specificity, scenario realism, technical accuracy, and parsing quality**. The judges follow detailed rubrics for each dimension, scoring on a 0.0 to 1.0 scale and explaining their reasoning with natural-language notes plus optional issue tags.

The judges themselves are an ensemble of Sonnet 4, GPT-5, and Gemini 2.5. For each transformation, the score for each dimensions is an average of the scores across all models. The prompts share a strict JSON schema (score, confidence, reasoning, issues). That makes the evaluation repeatable even months later.

Finally, their responses roll up into automated reports that highlight per-dimension averages, recurring mistakes, and parsing success rates. To keep the summary intuitive, the overall quality score is simply the average of the six dimension averages. Giving each dimension equal weight forces honesty. If a model nails realism but botches parsing, the headline number drops, and the report tells us exactly why.

Because the entire loop runs offline on cached data, testing a new teacher or student is as simple as exporting its outputs, dropping them into the pipeline, and reading the resulting scorecard.

![Quality Validation Pipeline]()

## Knowledge Distillation

For those who are not familiar with knowledge distillation, it's a student-teacher training strategy where a compact model learns from the richer logits of a large model, retaining most of the accuracy while slashing latency and cost. I found [A Survey on Knowledge Distillation of Large Language Models](https://arxiv.org/abs/2402.13116) to be an excellent resource to understand KD for LLMs. 

### Step 1: Selecting the Teacher Model

Before I could fine-tune a smaller model, I needed to answer a fundamental question: **Which frontier model produces the best transformations?**

Using the quality validation pipeline, each teacher candidate transformed the same prompts and earned a score on every dimension

I tested three leading models ("leading" in September 2025):
- **GPT-5** (OpenAI's latest)
- **Claude Sonnet 4** (Anthropic's latest)
- **Gemini 2.5 Pro** (Google's flagship)

#### The Results (Spoiler: Claude Sonnet 4 Wins)

![Teacher Model Comparison](./diagrams/blog/teacher-selection-radar.png)

**Overall Quality Scores:**
- Claude Sonnet 4 **(Winner)**: 0.795/1.0
- GPT-5: 0.764/1.0
- Gemini 2.5 Pro: 0.721/1.0

##### Why Claude 4 Emerged as the Clear Winner

The raw scores told a consistent story: Claude held meaningful leads on the dimensions that actually break production pipelines when they slip.

| Dimension | Claude Sonnet 4 | GPT-5 | Gemini 2.5 Pro | Why it mattered |
|-----------|-----------------|-------|----------------|-----------------|
| **Algorithmic Correctness** | **0.95** | 0.91 | 0.86 | Claude almost never mangled the underlying algorithm, so we could trust it on hard graph/dp problems. |
| **Parsing Quality** | **0.91** | 0.83 | 0.78 | Claude’s outputs stayed perfectly structured, which meant minimal post-processing hacks. |
| **Technical Accuracy** | **0.87** | 0.82 | 0.75 | Constraints, data types, and complexity claims lined up with the source prompt. |
| **Company Relevance** | **0.78** | 0.74 | 0.70 | Small but real edge. Claude incorporated company products/scale metrics more consistently. |
| **Role Specificity** | 0.63 | **0.66** | 0.58 | Claude lagged slightly because it sometimes reused generic tooling. GPT-5 edged it out here. |
| **Scenario Realism** | 0.64 | **0.65** | 0.62 | Both top models were close, but Claude’s higher reliability elsewhere outweighed this tie. |

Even in the two dimensions where GPT-5 nudged ahead (role specificity and scenario realism), the margin was tiny and often surfaced edge cases rather than systemic issues. Meanwhile, Claude’s double-digit wins on algorithmic fidelity and parsing quality removed whole classes of failure modes.

For structured data tasks, consistency and reliability matter more than occasional brilliance. Claude's architectural focus on instruction following made it the ideal teacher model.

### Step 2: Building the Data Generation Pipeline

With the teacher model selected, I faced the next challenge: **How do you generate thousands of diverse, high-quality training examples efficiently?**

#### A Combinatorial Approach to Diversity

Rather than manually crafting examples, I used a **combinatorial generation system** that mixes and matches three ingredients:

- **Companies (15)** - spanning FAANG, fintech, enterprise SaaS, and fast-growing startups. Each profile captured 20+ products, 25+ technologies, scale metrics, and role-specific pain points.
- **Problems (100)** - randomly sampled from the curated 2000+ problem dataset, balanced across Easy/Medium/Hard
- **Roles (5)** - Backend, ML, Frontend, Infrastructure, and Security

Multiply 15 × 100 × 5 and you get **7500 transformations**

#### Quality Assurance Through Validation

Not every AI-generated transformation is perfect. I implemented a **parsing validation pipeline** that checks every output before including it in training data:

**Validation checks:**
1. Required sections present (title, problem statement, function signature, examples)
1. Example completeness (proper input/output pairs)
1. Structural consistency (can be reliably parsed)
1. Technical accuracy (no hallucinated constraints)

**The Result**:
- Generated: 7,500 transformations
- Validated: 6,532 passed all checks (87.3% success rate)
- Filtered: 968 rejected (12.7% - incomplete or malformed)

![Quality Funnel](./diagrams/blog/quality-validation-funnel.png)
*Funnel diagram: 7,500 generated → 6,532 validated → 6,032 training + 1,064 validation*

#### Final Training Dataset Characteristics

The final high-quality dataset contained:

- **Total Examples**: 6,032 training + 1,064 validation
- **Total Tokens**: 42.5 million
- **Average Length**: 7,051 tokens per example
- **Role Distribution**: Backend (1,510), ML (1,208), Frontend (1,205), Infrastructure (1,055), Security (1,054)
- **Complexity Mix**: Easy (2,011), Medium (2,814), Hard (1,207)

Quality validation is not optional. Filtering 12.7% of outputs prevented garbage data from corrupting our fine-tuned model. In machine learning, garbage in truly means garbage out.

---

### Step 3: Fine-Tuning Multiple Open-Source Models

Now came the critical experiment: **Which student model could best learn from our teacher?**

I tested three different approaches, each representing a different production tradeoff:

1. **GPT-4.1-nano** - OpenAI API fine-tuning (convenience + reliability)
2. **Qwen3-Coder-30B** - Self-hosted LoRA (maximum control)
3. **Meta Llama 3.1 8B** - Together.ai serverless LoRA (cost optimization)

### Experiment 1: GPT-4.1-nano (OpenAI API)

**Training Configuration:**
```json
{
  "model": "gpt-4.1-nano",
  "training_examples": 6032,
  "validation_examples": 1064,
  "total_tokens": 42500000,
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": "auto",
    "learning_rate_multiplier": "auto"
  }
}
```

**Training Process:**
- Duration: ~2 hours
- Final training loss: 0.285 (strong convergence)
- Validation loss: 0.315 (minimal overfitting)
- Token processing rate: ~20M tokens/hour

**Performance:**
| Metric | Result |
|--------|--------|
| Quality Score | 0.784/1.0 (96% of Claude Sonnet 4) |
| P90 Latency | 2.5s (10x improvement vs 25s baseline) |
| Cost per 1K | $1.30 (see calculation below) |
| Parsing Success | 92.3% (reliable structure) |
| API Reliability | 99%+ uptime |

**Cost Calculation (GPT-4.1-nano fine-tuned):**
```
Average tokens per transformation (from training data):
  - Input: ~5,000 tokens (problem + company context + role info)
  - Output: ~2,000 tokens (transformed problem)
  - Total: ~7,000 tokens/request

GPT-4.1-nano fine-tuned pricing (per 1M tokens):
  - Input: $0.10/1M → $0.0005/request
  - Output: $0.40/1M → $0.0008/request
  - Per-request cost: ~$0.0013

Cost per 1,000 transformations: $1.30
```

**Findings:** The model retained nearly all of the teacher's quality while dramatically improving response times. With OpenAI handling infrastructure, there's no DevOps overhead—just a simple API call. The economics work at any reasonable scale, making this the clear winner for production deployment.

---

### Experiment 2: Qwen3-Coder-30B (Self-Hosted LoRA)

For this experiment, I used **LoRA (Low-Rank Adaptation)**, a parameter-efficient fine-tuning technique. Let's break down what each parameter means:

**LoRA Configuration Explained:**

```python
lora_config = {
    "r": 16,                    # LoRA rank
    "lora_alpha": 32,           # Alpha parameter
    "lora_dropout": 0.0,        # Dropout rate
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"]
}
```

**Parameter Breakdown:**

*r (rank)* = **16**
- Number of dimensions in the low-rank decomposition
- Lower rank = fewer trainable parameters, faster training, less expressive
- Higher rank = more parameters, slower training, more expressive
- **16 is the sweet spot** for most tasks (balances quality and efficiency)
- Range: typically 4 - 64

*lora_alpha* = **32**
- Scaling factor for LoRA weight updates
- Controls the magnitude of adaptations to the base model
- **Best practice**: Set to 2× the rank (16 × 2 = 32)
- Higher values = stronger task adaptation
- Lower values = more conservative, stays closer to base model

*lora_dropout* = **0.0**
- Regularization to prevent overfitting during training
- 0.0 = no dropout (we chose this because our data is high-quality)
- Use 0.05 - 0.1 if you observe overfitting on validation set
- Not needed when training data is diverse and validated

*target_modules* = **attention layers**
- Which model layers to apply LoRA to
- *q_proj*, *k_proj*, *v_proj* = Query, Key, Value attention projections
- *o_proj* = Output projection
- These are the most impactful layers for task adaptation

**Training Hyperparameters:**

```python
training_args = {
    "num_train_epochs": 3,
    "per_device_train_batch_size": 2,
    "gradient_accumulation_steps": 8,
    "learning_rate": 2e-4,
    "max_grad_norm": 1.0
}
```

*num_train_epochs* = **3**
- 3 epochs is standard for LoRA fine-tuning

*per_device_train_batch_size* = **2**
- Limited by GPU memory (30B model is large, requires small batches)
- With the H100-80GB GPUs, 2 was the maximum

*gradient_accumulation_steps* = **8**
- Accumulate gradients over 8 steps before updating weights
- **Effective batch size** = 2 × 8 = 16
- Allows larger effective batches without exceeding GPU memory

*learning_rate* = **2e-4 (0.0002)**
- LoRA uses **higher learning rates** than full fine-tuning (which uses ~1e-5)
- Why? LoRA only updates small adapter weights, not the full model
- Range for LoRA: typically 1e-4 to 5e-4

**Infrastructure Requirements:**
- Hardware: 2× NVIDIA H100-80GB SXM GPUs
- Training time: ~2 hours
- Monthly hosting cost: **$3,200/month** (single machine, continuous operation)

**Performance:**

| Metric | Result |
|--------|--------|
| Quality Score | 0.71/1.0 (much below 0.792 baseline) |
| P90 Latency | 20s (not much improvement over Claude baseline) |
| Cost per 1K | $5.50 (see calculation below) |
| Parsing Success | 79% (structural issues) |
| Maintenance | High DevOps complexity |

**Cost Calculation (Self-hosted Qwen3-Coder-30B):**
```
Infrastructure: 2× H100-80GB @ $3,200/month
Estimated throughput: ~580 transformations/month (at 20s/request)
Effective cost per 1K: $5.50 (hosting amortized)

Note: Self-hosted costs are dominated by GPU rental,
not per-token pricing. Lower utilization = higher per-unit cost.
```

**Findings:** Despite being a larger model, quality fell short of both the baseline and the GPT-4.1-nano experiment. Latency remained in the same ballpark as Claude, eliminating the speed advantage we were hoping for. The fixed GPU hosting costs made this approach expensive regardless of usage, and the DevOps burden of managing GPUs, scaling, and monitoring added complexity without any measurable benefit.

---

### Experiment 3: Meta Llama 3.1 8B (Together.ai Serverless)

For a cost-optimization experiment, I fine-tuned a smaller model using **[Together.ai's](https://together.ai) serverless platform**.

**Together.ai Configuration:**

```python
together_config = {
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "lora_config": {
        "r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.0
    },
    "training_config": {
        "epochs": 3,
        "batch_size": 4,
        "learning_rate": 1e-4
    },
    "inference_config": {
        "temperature": 0.7,
        "top_p": 0.9
    }
}
```

**Key Differences from Qwen Experiment:**

*batch_size* = **4** (vs 2 for Qwen)
- Smaller model (8B vs 30B) allows larger batches
- More memory available per example
- Faster training throughput

*learning_rate* = **1e-4** (vs 2e-4 for Qwen)
- Lower learning rate for smaller model
- Smaller models are more sensitive to large updates
- More conservative training to prevent instability

**Inference Parameters:**

*temperature* = **0.7**
- Controls randomness/creativity during generation
- Range: 0.0 (deterministic) to 2.0 (very creative)
- 0.7 balances consistency with natural variation
- Lower (0.3) = more consistent but robotic
- Higher (1.0+) = more creative but less reliable

*top_p* = **0.9** (nucleus sampling)
- Only sample from tokens comprising top 90% of probability mass
- Prevents sampling very unlikely tokens
- Improves output quality by filtering noise
- Range: 0.0 to 1.0 (1.0 = consider all tokens)

**Performance:**

| Metric | Result |
|--------|--------|
| Quality Score | 0.68/1.0 |
| P90 Latency | 15s (still above acceptable threshold) |
| Cost per 1K | $2.00 (see calculation below) |
| Parsing Success | 76% (poor structural output) |
| Instruction Following | 0.72 (struggled with complex prompts) |

**Cost Calculation (Together.ai Llama 3.1 8B fine-tuned):**
```
Average tokens per transformation (from training data):
  - Input: ~5,000 tokens (problem + company context + role info)
  - Output: ~2,000 tokens (transformed problem)
  - Total: ~7,000 tokens/request

Together.ai Llama 3.1 8B fine-tuned pricing (per 1M tokens):
  - Input: $0.20/1M → $0.001/request
  - Output: $0.50/1M → $0.001/request
  - Per-request cost: ~$0.002

Cost per 1,000 transformations: $2.00
```

**Findings:** The smaller model simply couldn't capture the sophistication of the teacher. Quality dropped noticeably, and the model struggled with complex multi-step instructions. Structural output was unreliable—parsing failed nearly a quarter of the time. While Together.ai's serverless approach eliminated hosting headaches, the quality gap made this a non-starter for production.

---

### Model Comparison: The Complete Picture

![Model Comparison Matrix](./diagrams/blog/model-comparison-matrix.png)

**Key Insights:**

1. **Model size ≠ Quality**: The 30B parameter Qwen didn't outperform the smaller GPT-4.1-nano
2. **Architecture matters**: GPT-4.1-nano's architecture better suited for instruction following
3. **Platform choice impacts results**: API reliability and optimization gave GPT-4.1-nano an edge
4. **Cost optimization requires tradeoffs**: Cheapest option (Llama 8B) had unacceptable quality
5. **LoRA parameters are sensitive**: Same LoRA config (r=16, alpha=32) produced very different results

---

### The result

![Evaluation Framework](./diagrams/blog/evaluation-framework-6d.png)
*Hexagonal diagram showing the 6 evaluation dimensions*

**1. Algorithmic Correctness (0.982/1.0)** Excellent
- Does the transformation preserve the exact algorithm?
- Are complexity requirements (time/space) maintained?
- Are input/output types identical to the original?

**2. Company Relevance (0.749/1.0)** Good
- Is the company context authentic and accurate?
- Does it align with the company's actual products/technologies?
- Are scale metrics realistic for the company?

**3. Role Specificity (0.568/1.0)** Needs Improvement
- Does it use role-appropriate technologies?
- Are scenarios realistic for this engineering role?
- Is the technical depth appropriate for the role?

**4. Scenario Realism (0.596/1.0)** Needs Improvement
- Does it sound like a real interview question?
- Is the business context natural, not forced?
- Would an interviewer actually ask this?

**5. Technical Accuracy (0.885/1.0)** Excellent
- Are constraints correctly specified?
- Is technical terminology accurate?
- Are edge cases and optimizations appropriate?

**6. Parsing Quality (0.923/1.0)** Excellent
- Can the output be reliably parsed programmatically?
- Are all required sections present and well-formatted?
- Is the structure consistent across examples?

![Evaluation Comparison](./diagrams/blog/evaluation-comparison-bars.png)

**Key Insight**: Multi-dimensional evaluation reveals nuanced quality. Overall score (0.784) is excellent, but breaking it down shows exactly where to improve (role specificity and scenario realism need work, while algorithmic correctness is nearly perfect).

---

## Economics

Let's talk numbers. Fine-tuning requires upfront investment, was it worth it?

### Cost Calculation Methodology

All cost comparisons use consistent token-based calculations derived from our training dataset (average 7,051 tokens per example):

```
Average tokens per transformation (measured from training data):
  - Input tokens: ~5,000 (original problem + company context + role info)
  - Output tokens: ~2,000 (transformed problem)
  - Total: ~7,000 tokens/request

Claude Sonnet 4 pricing (per 1M tokens):
  - Input: $3.00/1M tokens
  - Output: $15.00/1M tokens

GPT-4.1-nano fine-tuned pricing (per 1M tokens):
  - Input: $0.10/1M tokens
  - Output: $0.40/1M tokens
```

**Per-Request Cost Breakdown:**

| Model | Input Cost (5K tokens) | Output Cost (2K tokens) | Total/Request | Cost per 1K |
|-------|------------------------|-------------------------|---------------|-------------|
| Claude Sonnet 4 | $0.015 | $0.03 | $0.045 | **$45.00** |
| GPT-4.1-nano (fine-tuned) | $0.0005 | $0.0008 | $0.0013 | **$1.30** |

**Cost reduction: 97.1%**

### Cost Breakdown

**One-Time Setup Costs:**

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Training data (Claude Sonnet 4) | 6,032 | $0.05 | $301.60 |
| Fine-tuning API fees (OpenAI) | 1 job | ~$50 | $50.00 |
| **Total Setup Investment** | | | **$351.6** |

**Ongoing Inference Costs:**

| Monthly Volume | Claude Sonnet 4 | Fine-tuned GPT-4.1-nano | Monthly Savings |
|----------------|-----------------|-------------------------|-----------------|
| 1,000 inferences | $45.00 | $1.30 | $43.70 |
| 10,000 inferences | $450.00 | $13.00 | $437.00 |
| 100,000 inferences | $4,500.00 | $130.00 | $4,370.00 |
| 1,000,000 inferences | $45,000.00 | $1,300.00 | $43,700.00 |

**Break-Even Analysis:**

```
Setup cost: $351.63
Savings per inference: $0.0437
Break-even point: $351.63 / $0.0437 = ~8,000 inferences
```

At AlgoIRL's expected production volume of 10K+ transformations/month, I **break even in the first month**

### Total Cost of Ownership (12 Month Projection)

![Projected Cost Growth](./diagrams/blog/projected-cost-growth.png)

The gap between Claude Sonnet 4 and the fine-tuned GPT-4.1-nano widens dramatically as volume increases. The one-time setup cost of $351.60 becomes negligible compared to the accumulated savings, which exceed **$10,000** over the 12-month period, even with conservative growth estimates.

---

## Key Learnings & Best Practices

After running 3+ months of experiments and processing 10K+ production inferences, here's what I learned.

#### Teacher Selection Matters a lot

I tested GPT-5, Claude Sonnet 4, and Gemini 2.5 Pro using multi-dimensional evaluation rather than just overall scores. Claude Sonnet 4 outperformed GPT-5 for our structured output task with superior parsing quality (0.92 vs 0.84), better instruction-following consistency, and more reliable algorithmic preservation. Always empirically test teacher models on your specific task. Marketing benchmarks don't predict your use case.

#### Garbage in, garbage out

My previous experience working in ML research taught me a very important lesson, a lesson, I learnt the hard way (a story for another day). "Garbage in, garbage out". I would argue that data quality is the single most important factor in determining model success. I validated every training example with parsing checks and rejected 12.7% of outputs (968/7,500) while tracking failure modes and statistics. Building validation into your pipeline from day one and filter bad training data aggressively can save you a lot of headache down the line.

#### LoRA Parameters

A low *lora_rank* (~4 - 8) means fast training but quality suffers, 16 is the sweet spot balancing quality and efficiency, and too high (64+) yields marginal gains with much slower training. 

For *lora_alpha*, use 2x the rank (e.g., rank = 16 → alpha = 32), where higher alpha means stronger task adaptation and lower alpha stays closer to the base model. 

LoRA uses a *learning_rate* of 1e-4 to 2e-4 (higher than full fine-tuning), with smaller models (8B) preferring the lower end and larger models (30B+) handling higher rates. Start with proven defaults (r = 16, alpha = 32, lr = 1e-4), then iterate based on validation loss curves.

#### Model Size ≠ Quality

GPT-4.1-nano (~6B estimated) scored 0.784, Qwen3-Coder (30B) scored 0.71, and Llama 3.1 (8B) scored 0.68. GPT-4.1-nano won despite fewer parameters due to superior base model architecture, better instruction-following design, optimization for structured output tasks, and high-quality pre-training data. Evaluate multiple models empirically—architecture and training quality matter more than raw parameter count.

### Room to Grow

The fine-tuned model delivers strong results on algorithmic correctness (0.98), parsing quality (0.92), and technical accuracy (0.89). The next iteration will focus on three dimensions with room to grow:

##### Role Specificity (0.57)

Currently, transformations emphasize company context. I will incorporate deeper role-specific toolchains and workflows, making questions feel even more tailored to backend vs. ML vs. infrastructure engineers.

##### Scenario Realism (0.60)

The model produces well-structured scenarios. Adding real interview patterns and conversational flows will make outputs feel more natural and interview-ready.

##### Company Relevance (0.75)
Strong foundation, but static company profiles limit freshness. Integrating dynamic company intelligence (recent launches, acquisitions, tech stack changes) will hopefully push this closer to 0.85+.

The path forward is clear, **richer training data, not architectural changes**. The model architecture works; the next gains come from better inputs.

### What's Next

**Multi-Teacher Distillation:**
- Combine knowledge from Claude 4.5 + GPT-5.1 + Gemini 3 Pro
- Ensemble teacher outputs for training data
- Potentially capture strengths of multiple models

**Active Learning:**
- Identify low-confidence predictions
- Get teacher model feedback on challenging examples
- Continuously improve without full retraining

**Dynamic Model Selection:**
- Use smaller/faster model for simple transformations
- Route complex cases to larger model
- Optimize cost-quality tradeoff per request

**Edge Deployment:**
- Deploy models closer to users (regional endpoints)
- Reduce network latency
- Improve international user experience

---

### Try It on AlgoIRL

Want to see the fine-tuned model in action? Visit [AlgoIRL](https://algoirl.com) and experience:
- Company-specific interview question generation
- Role-tailored algorithm transformations
- Instant results powered by our fine-tuned model

**Questions or want to discuss fine-tuning for your use case?** Reach out to me!

---

**Keywords:** fine-tuning, knowledge distillation, LLM, production AI, GPT, Claude, LoRA, model evaluation, cost optimization, latency optimization

---

### Further Reading
- [OpenAI Fine-Tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [LoRA: Low-Rank Adaptation Paper](https://arxiv.org/abs/2106.09685)
- [Knowledge Distillation Overview](https://arxiv.org/abs/1503.02531)
- [LLM Evaluation Best Practices](https://www.anthropic.com/index/evaluating-ai-systems)
