/**
 * Utility functions for detecting and handling in-app browsers
 * that don't support Google OAuth (403: disallowed_useragent error)
 *
 * References:
 * - https://felixcarmona.com/solving-google-login-issues-linkedin-ios/
 * - Google OAuth security policy (April 2017)
 */

/**
 * Detects if the app is running in LinkedIn's iOS in-app browser
 * and automatically redirects to Safari to enable Google OAuth
 *
 * This uses the x-safari URL scheme which is supported on iOS 17+
 * Format: x-safari-https://example.com
 */
export function redirectFromLinkedInIOS(): void {
  if (typeof window === 'undefined') return;

  const userAgent = window.navigator.userAgent;
  const url = window.location.href;

  // Detect LinkedIn iOS in-app browser
  if (
    userAgent.includes('Mobile') &&
    (userAgent.includes('iPhone') || userAgent.includes('iPad')) &&
    userAgent.includes('LinkedInApp')
  ) {
    console.log('[IN-APP BROWSER] Detected LinkedIn iOS, redirecting to Safari');

    // Use x-safari URL scheme (iOS 17+) to open in Safari
    window.location.href = 'x-safari-' + url;
  }
}

/**
 * Detects if running in any common in-app browser that blocks Google OAuth
 *
 * Common in-app browsers that block OAuth:
 * - LinkedIn
 * - Instagram
 * - Facebook & Messenger
 * - Twitter
 * - TikTok
 *
 * @returns true if in an in-app browser, false otherwise
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor;

  // LinkedIn
  if (ua.includes('LinkedInApp')) return true;

  // Instagram
  if (ua.includes('Instagram')) return true;

  // Facebook & Messenger
  if (ua.includes('FBAN') || ua.includes('FBAV')) return true;

  // Twitter
  if (ua.includes('TwitterAndroid') || ua.includes('Twitter for iPhone')) return true;

  // TikTok
  if (ua.includes('musical_ly') || ua.includes('TikTok')) return true;

  return false;
}

/**
 * Gets a user-friendly message about which in-app browser is detected
 * Useful for displaying specific instructions to users
 *
 * @returns Browser name or null if not in an in-app browser
 */
export function getInAppBrowserName(): string | null {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent || navigator.vendor;

  if (ua.includes('LinkedInApp')) return 'LinkedIn';
  if (ua.includes('Instagram')) return 'Instagram';
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook';
  if (ua.includes('TwitterAndroid') || ua.includes('Twitter for iPhone')) return 'Twitter';
  if (ua.includes('musical_ly') || ua.includes('TikTok')) return 'TikTok';

  return null;
}
