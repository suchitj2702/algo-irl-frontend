import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import fineTuningCaseStudy from '../../../docs/blog_post_fine_tuning_case_study.md?raw';
import { Footer } from '../Footer';
import { cn } from '@/lib/utils';
import { getDiagramComponent } from './diagrams/CaseStudyDiagrams';
import type { Components } from 'react-markdown';

const firstHeadingIndex = fineTuningCaseStudy.indexOf('## ');
const heroMarkdown =
  firstHeadingIndex === -1 ? fineTuningCaseStudy : fineTuningCaseStudy.slice(0, firstHeadingIndex);
const bodyMarkdown = firstHeadingIndex === -1 ? '' : fineTuningCaseStudy.slice(firstHeadingIndex);

const publishedOn = 'September 14, 2025';
const readingTimeMinutes = Math.ceil(fineTuningCaseStudy.split(/\s+/).filter(Boolean).length / 250);
const tags = ['Case Study', 'Knowledge Distillation', 'Fine-Tuning'];

const sectionLinks = Array.from(bodyMarkdown.matchAll(/^## (.+)$/gm)).map((match) => {
  const title = match[1].trim();
  return {
    title,
    slug: slugify(title)
  };
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((child) => extractText(child)).join('');
  }
  if (typeof children === 'object' && children !== null && 'props' in children) {
    // @ts-expect-error children typing
    return extractText(children.props?.children ?? '');
  }
  return '';
}

const createMarkdownComponents = (variant: 'hero' | 'body'): Components => ({
  h2: ({ children }) => (
    <h2
      id={variant === 'body' ? slugify(extractText(children)) : undefined}
      className={cn(
        'font-playfair tracking-tight',
        variant === 'hero'
          ? 'text-4xl md:text-5xl text-content mb-6'
          : 'text-3xl md:text-4xl text-content mb-6'
      )}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className={cn(
        'font-semibold',
        variant === 'hero' ? 'text-xl text-content mt-6 mb-3' : 'text-2xl text-content mt-8 mb-3'
      )}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className={cn('font-semibold text-base uppercase tracking-wide text-primary mb-3')}>
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p
      className={cn(
        'leading-relaxed',
        variant === 'hero' ? 'text-content-muted text-lg mb-5' : 'text-content-muted text-lg mb-5'
      )}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      className={cn(
        'space-y-3 pl-5 marker:text-primary list-disc',
        variant === 'hero' ? 'text-content-muted' : 'text-content-muted'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={cn(
        'space-y-3 pl-6 list-decimal',
        variant === 'hero' ? 'text-content-muted' : 'text-content-muted'
      )}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className={cn('font-semibold text-content')}>
      {children}
    </strong>
  ),
  hr: () => <hr className="my-12 border-outline-subtle/30" />,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded-md bg-panel-100 px-2 py-0.5 text-sm text-content">{children}</code>
    ) : (
      <code className="block whitespace-pre-wrap rounded-2xl bg-panel-100 p-4 text-sm text-content">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-2xl border border-outline-subtle/40 bg-panel-50 p-6 text-sm text-content">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary underline-offset-4 hover:opacity-80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-outline-subtle/30 bg-white">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-panel-100 text-xs uppercase text-content-muted tracking-widest">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-outline-subtle/20">{children}</tbody>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold text-content">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 text-content-muted">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/60 pl-4 italic text-content">{children}</blockquote>
  ),
  img: ({ alt }) => {
    const diagram = getDiagramComponent(alt);
    if (diagram) {
      return (
        <figure className="my-12 space-y-3">
          <div>{diagram}</div>
          {alt && <figcaption className="text-sm text-content-muted">{alt}</figcaption>}
        </figure>
      );
    }
    return null;
  }
});

export function FineTuningCaseStudyPage() {
  return (
    <div className="bg-panel-50 text-content font-sans">
      <header className="border-b border-outline-subtle/30 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-content-muted">Product Notebook</p>
            <div className="flex flex-wrap gap-4 text-sm text-content-muted">
              <span>{publishedOn}</span>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-outline-subtle/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-content-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents('hero')}>
            {heroMarkdown}
          </ReactMarkdown>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block sticky top-24 self-start space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-content-muted">Sections</p>
            <nav className="space-y-2 text-sm">
              {sectionLinks.map((section) => (
                <a
                  key={section.slug}
                  href={`#${section.slug}`}
                  className="block rounded-full px-4 py-2 text-content-muted hover:text-content hover:bg-panel-100 transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="prose prose-lg max-w-none text-content prose-h2:text-3xl prose-h3:text-2xl prose-p:text-lg prose-strong:text-content prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={createMarkdownComponents('body')}>
              {bodyMarkdown}
            </ReactMarkdown>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
