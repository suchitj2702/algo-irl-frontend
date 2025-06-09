// Blind75 data structure - shared across components
export const blind75Data = {
  "Arrays & Hashing": [
    { "slug": "contains-duplicate", "difficulty": "Easy" },
    { "slug": "valid-anagram", "difficulty": "Easy" },
    { "slug": "two-sum", "difficulty": "Easy" },
    { "slug": "group-anagrams", "difficulty": "Medium" },
    { "slug": "top-k-frequent-elements", "difficulty": "Medium" },
    { "slug": "encode-and-decode-strings", "difficulty": "Medium" },
    { "slug": "product-of-array-except-self", "difficulty": "Medium" },
    { "slug": "longest-consecutive-sequence", "difficulty": "Medium" }
  ],
  "Two Pointers": [
    { "slug": "valid-palindrome", "difficulty": "Easy" },
    { "slug": "3sum", "difficulty": "Medium" },
    { "slug": "container-with-most-water", "difficulty": "Medium" }
  ],
  "Sliding Window": [
    { "slug": "best-time-to-buy-and-sell-stock", "difficulty": "Easy" },
    { "slug": "longest-substring-without-repeating-characters", "difficulty": "Medium" },
    { "slug": "longest-repeating-character-replacement", "difficulty": "Medium" },
    { "slug": "minimum-window-substring", "difficulty": "Hard" }
  ],
  "Stack": [
    { "slug": "valid-parentheses", "difficulty": "Easy" }
  ],
  "Binary Search": [
    { "slug": "find-minimum-in-rotated-sorted-array", "difficulty": "Medium" },
    { "slug": "search-in-rotated-sorted-array", "difficulty": "Medium" }
  ],
  "Linked List": [
    { "slug": "reverse-linked-list", "difficulty": "Easy" },
    { "slug": "merge-two-sorted-lists", "difficulty": "Easy" },
    { "slug": "linked-list-cycle", "difficulty": "Easy" },
    { "slug": "reorder-list", "difficulty": "Medium" },
    { "slug": "remove-nth-node-from-end-of-list", "difficulty": "Medium" },
    { "slug": "merge-k-sorted-lists", "difficulty": "Hard" }
  ],
  "Trees": [
    { "slug": "invert-binary-tree", "difficulty": "Easy" },
    { "slug": "maximum-depth-of-binary-tree", "difficulty": "Easy" },
    { "slug": "same-tree", "difficulty": "Easy" },
    { "slug": "subtree-of-another-tree", "difficulty": "Easy" },
    { "slug": "lowest-common-ancestor-of-a-binary-search-tree", "difficulty": "Easy" },
    { "slug": "binary-tree-level-order-traversal", "difficulty": "Medium" },
    { "slug": "validate-binary-search-tree", "difficulty": "Medium" },
    { "slug": "kth-smallest-element-in-a-bst", "difficulty": "Medium" },
    { "slug": "construct-binary-tree-from-preorder-and-inorder-traversal", "difficulty": "Medium" },
    { "slug": "binary-tree-maximum-path-sum", "difficulty": "Hard" },
    { "slug": "serialize-and-deserialize-binary-tree", "difficulty": "Hard" }
  ],
  "Heap / Priority Queue": [
    { "slug": "find-median-from-data-stream", "difficulty": "Hard" }
  ],
  "Backtracking": [
    { "slug": "combination-sum", "difficulty": "Medium" },
    { "slug": "word-search", "difficulty": "Medium" }
  ],
  "Tries": [
    { "slug": "implement-trie-prefix-tree", "difficulty": "Medium" },
    { "slug": "design-add-and-search-words-data-structure", "difficulty": "Medium" },
    { "slug": "word-search-ii", "difficulty": "Hard" }
  ],
  "Graphs": [
    { "slug": "number-of-islands", "difficulty": "Medium" },
    { "slug": "clone-graph", "difficulty": "Medium" },
    { "slug": "pacific-atlantic-water-flow", "difficulty": "Medium" },
    { "slug": "course-schedule", "difficulty": "Medium" },
    { "slug": "graph-valid-tree", "difficulty": "Medium" },
    { "slug": "number-of-connected-components-in-an-undirected-graph", "difficulty": "Medium" }
  ],
  "Advanced Graphs": [
    { "slug": "alien-dictionary", "difficulty": "Hard" }
  ],
  "1-D Dynamic Programming": [
    { "slug": "climbing-stairs", "difficulty": "Easy" },
    { "slug": "house-robber", "difficulty": "Medium" },
    { "slug": "house-robber-ii", "difficulty": "Medium" },
    { "slug": "longest-palindromic-substring", "difficulty": "Medium" },
    { "slug": "palindromic-substrings", "difficulty": "Medium" },
    { "slug": "decode-ways", "difficulty": "Medium" },
    { "slug": "coin-change", "difficulty": "Medium" },
    { "slug": "maximum-product-subarray", "difficulty": "Medium" },
    { "slug": "word-break", "difficulty": "Medium" },
    { "slug": "longest-increasing-subsequence", "difficulty": "Medium" }
  ],
  "2-D Dynamic Programming": [
    { "slug": "unique-paths", "difficulty": "Medium" },
    { "slug": "longest-common-subsequence", "difficulty": "Medium" }
  ],
  "Greedy": [
    { "slug": "maximum-subarray", "difficulty": "Medium" },
    { "slug": "jump-game", "difficulty": "Medium" }
  ],
  "Intervals": [
    { "slug": "insert-interval", "difficulty": "Medium" },
    { "slug": "merge-intervals", "difficulty": "Medium" },
    { "slug": "non-overlapping-intervals", "difficulty": "Medium" },
    { "slug": "meeting-rooms", "difficulty": "Easy" },
    { "slug": "meeting-rooms-ii", "difficulty": "Medium" }
  ],
  "Math & Geometry": [
    { "slug": "rotate-image", "difficulty": "Medium" },
    { "slug": "spiral-matrix", "difficulty": "Medium" },
    { "slug": "set-matrix-zeroes", "difficulty": "Medium" }
  ],
  "Bit Manipulation": [
    { "slug": "number-of-1-bits", "difficulty": "Easy" },
    { "slug": "counting-bits", "difficulty": "Easy" },
    { "slug": "reverse-bits", "difficulty": "Easy" },
    { "slug": "missing-number", "difficulty": "Easy" },
    { "slug": "sum-of-two-integers", "difficulty": "Medium" }
  ]
};

export type TopicName = keyof typeof blind75Data;

export const getAllProblems = () => {
  return Object.values(blind75Data).flat();
};

export const getProblemsByTopic = (topic: TopicName) => {
  return blind75Data[topic] || [];
};

export const getTopicNames = (): TopicName[] => {
  return Object.keys(blind75Data) as TopicName[];
}; 