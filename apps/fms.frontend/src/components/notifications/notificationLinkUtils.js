/**
 * File:          notificationLinkUtils.js
 * Purpose:       Shared safe-link resolver for notification deep-links.
 *                Backend notifications now carry a top-level `link` field (relative in-app path).
 *                This util validates it before we navigate, to prevent open-redirect abuse.
 * Dependencies:  None.
 * Last Modified: 2025-01-15
 *
 * Key Functions:
 * - resolveSafeNotificationLink(raw): returns a safe relative path or null.
 */

// Allowed first-segment prefixes. Any link the backend attaches must start with "/" and match
// one of these prefixes. If it does not, we ignore it rather than navigate.
const ALLOWED_PREFIXES = [
    '/reports/',
    '/tanks/',
    '/tanks',
    '/vehicles/',
    '/issues/',
    '/active-events/',
    '/active-events',
    '/my-notifications',
];

/**
 * Validates a notification link and returns it if safe, otherwise null.
 * Rules:
 *  - Must be a non-empty string.
 *  - Must start with a single "/" (reject "//" and absolute URLs with schemes).
 *  - Must match one of the allowed in-app prefixes.
 *  - Max length 500.
 */
export function resolveSafeNotificationLink(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 500) return null;
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;

    const pathOnly = trimmed.split('?')[0].split('#')[0];
    const matches = ALLOWED_PREFIXES.some((prefix) => {
        if (prefix.endsWith('/')) return pathOnly.startsWith(prefix);
        return pathOnly === prefix || pathOnly.startsWith(prefix + '/') || pathOnly.startsWith(prefix + '?');
    });
    return matches ? trimmed : null;
}

export default resolveSafeNotificationLink;
