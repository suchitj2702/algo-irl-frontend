/**
 * Company Display Utilities
 * Provides consistent company name formatting across the application
 */

/**
 * Converts a company ID to its proper display name
 * @param companyId - The company identifier (e.g., 'meta', 'google')
 * @returns The formatted company display name (e.g., 'Meta', 'Google')
 */
export function getCompanyDisplayName(companyId: string): string {
  const companyMap: { [key: string]: string } = {
    'meta': 'Meta',
    'apple': 'Apple',
    'amazon': 'Amazon',
    'netflix': 'Netflix',
    'google': 'Google',
    'microsoft': 'Microsoft'
  };

  return companyMap[companyId] || companyId.charAt(0).toUpperCase() + companyId.slice(1);
}
