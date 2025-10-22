/**
 * Problem Title Extraction Utility
 *
 * Removes company-specific prefixes and interview context from problem titles
 * to display clean, concise problem names in the UI.
 *
 * Example transformations:
 * - "Meta Technical Interview Question: Two Sum" → "Two Sum"
 * - "Google Interview Question: Binary Search" → "Binary Search"
 * - "Technical Interview Question: Valid Parentheses" → "Valid Parentheses"
 * - "Amazon Coding Question: Longest Substring" → "Longest Substring"
 */

import { getCompanyDisplayName } from './companyDisplay';

/**
 * Extracts the clean problem title by removing company-specific prefixes
 * and interview context markers.
 *
 * @param fullTitle - The full title from the API (may include company prefix)
 * @param companyId - Optional company identifier for company-specific extraction
 * @returns The clean problem title without prefixes
 *
 * @example
 * extractCleanProblemTitle("Meta Technical Interview Question: Two Sum", "meta")
 * // Returns: "Two Sum"
 *
 * @example
 * extractCleanProblemTitle("Google Interview Question: Binary Search")
 * // Returns: "Binary Search"
 *
 * @example
 * extractCleanProblemTitle("Two Sum")
 * // Returns: "Two Sum" (no prefix to remove)
 */
export function extractCleanProblemTitle(fullTitle: string, companyId?: string): string {
  // Handle edge cases
  if (!fullTitle || fullTitle.trim().length === 0) {
    return fullTitle;
  }

  const trimmed = fullTitle.trim();
  const patterns: RegExp[] = [];

  // STEP 1: Try company-specific patterns first (most specific)
  if (companyId) {
    const companyName = getCompanyDisplayName(companyId);

    // Pattern: "{Company} Technical Interview Question: {Title}"
    patterns.push(
      new RegExp(`^${companyName}\\s+Technical\\s+Interview\\s+Question:\\s*(.+)$`, 'i')
    );

    // Pattern: "{Company} Interview Question: {Title}"
    patterns.push(
      new RegExp(`^${companyName}\\s+Interview\\s+Question:\\s*(.+)$`, 'i')
    );

    // Pattern: "{Company} Coding Question: {Title}"
    patterns.push(
      new RegExp(`^${companyName}\\s+Coding\\s+Question:\\s*(.+)$`, 'i')
    );

    // Pattern: "{Company} Technical Question: {Title}"
    patterns.push(
      new RegExp(`^${companyName}\\s+Technical\\s+Question:\\s*(.+)$`, 'i')
    );
  }

  // STEP 2: Generic patterns (work for any company or unknown company)
  // These patterns match any word followed by interview-related keywords

  // Pattern: "{AnyCompany} Technical Interview Question: {Title}"
  patterns.push(
    /^[A-Za-z]+\s+Technical\s+Interview\s+Question:\s*(.+)$/i
  );

  // Pattern: "{AnyCompany} Interview Question: {Title}"
  patterns.push(
    /^[A-Za-z]+\s+Interview\s+Question:\s*(.+)$/i
  );

  // Pattern: "{AnyCompany} Coding Question: {Title}"
  patterns.push(
    /^[A-Za-z]+\s+Coding\s+Question:\s*(.+)$/i
  );

  // Pattern: "{AnyCompany} Technical Question: {Title}"
  patterns.push(
    /^[A-Za-z]+\s+Technical\s+Question:\s*(.+)$/i
  );

  // STEP 3: Generic patterns without company name

  // Pattern: "Technical Interview Question: {Title}"
  patterns.push(
    /^Technical\s+Interview\s+Question:\s*(.+)$/i
  );

  // Pattern: "Interview Question: {Title}"
  patterns.push(
    /^Interview\s+Question:\s*(.+)$/i
  );

  // Pattern: "Coding Question: {Title}"
  patterns.push(
    /^Coding\s+Question:\s*(.+)$/i
  );

  // Pattern: "Technical Question: {Title}"
  patterns.push(
    /^Technical\s+Question:\s*(.+)$/i
  );

  // STEP 4: Try each pattern in order (most specific to least specific)
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extractedTitle = match[1].trim();

      // Additional validation: ensure we extracted something meaningful
      if (extractedTitle.length > 0) {
        return extractedTitle;
      }
    }
  }

  // STEP 5: No pattern matched, return original title
  // This ensures we never return an empty string or break the UI
  return trimmed;
}

/**
 * Batch extracts clean titles for multiple problems.
 * Useful for processing entire study plans or problem lists.
 *
 * @param problems - Record of problem IDs to full titles
 * @param companyId - Optional company identifier
 * @returns Record of problem IDs to clean titles
 */
export function extractCleanTitlesMap(
  problems: Record<string, string>,
  companyId?: string
): Record<string, string> {
  const cleanTitles: Record<string, string> = {};

  Object.entries(problems).forEach(([problemId, fullTitle]) => {
    cleanTitles[problemId] = extractCleanProblemTitle(fullTitle, companyId);
  });

  return cleanTitles;
}
