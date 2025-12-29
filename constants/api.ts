/**
 * API Configuration Constants
 * Centralized configuration for external API requests
 */

export const APP_NAME = 'DailyHistoric';
export const APP_VERSION = '1.0.0';
export const CONTACT_EMAIL = 'app@dailyhistoric.com';

/**
 * Wikimedia-compliant User-Agent header
 * Format: <app-name>/<version> (<contact-email>) <library>/<version>
 * @see https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
 */
export const WIKIMEDIA_USER_AGENT = `${APP_NAME}/${APP_VERSION} (${CONTACT_EMAIL}) expo-image/1.0`;

/**
 * Headers for Wikimedia image requests
 * Both User-Agent and Api-User-Agent are included for compatibility
 */
export const WIKIMEDIA_HEADERS: Record<string, string> = {
  'User-Agent': WIKIMEDIA_USER_AGENT,
  'Api-User-Agent': WIKIMEDIA_USER_AGENT,
};
