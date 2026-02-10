/**
 * File: crossTabAuthSync.js
 * Purpose: Synchronizes authentication state across browser tabs.
 *          When a user logs out or logs in as a different user in one tab,
 *          all other tabs detect the change and react accordingly.
 * Dependencies: Redux store, AuthActions (LOGOUT type)
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - initCrossTabAuthSync(store): Start listening for auth changes from other tabs
 * - cleanupCrossTabAuthSync(): Stop listening (for unmount)
 * - setSessionUserId(userId): Mark the current session's user for change detection
 */

import { LOGOUT } from '../redux/actions/types';

let storageListener = null;
let currentStore = null;

/**
 * Generates a unique session fingerprint from the JWT token.
 * We store the user ID in localStorage so other tabs can detect
 * when a DIFFERENT user has logged in (not just a token refresh).
 */
const SESSION_USER_KEY = 'fms_session_user_id';

/**
 * Set the current session's user ID in localStorage.
 * Called after successful login.
 */
export function setSessionUserId(userId) {
    if (userId) {
        localStorage.setItem(SESSION_USER_KEY, String(userId));
    }
}

/**
 * Clear the session user ID from localStorage.
 * Called during logout.
 */
export function clearSessionUserId() {
    localStorage.removeItem(SESSION_USER_KEY);
}

/**
 * Initialize cross-tab authentication synchronization.
 * Listens for localStorage changes made by OTHER tabs and reacts:
 *
 * 1. Token REMOVED (logout in another tab) → force logout here
 * 2. Token CHANGED to a different user → force logout here (different user logged in)
 * 3. Token SET (login in another tab) → do nothing (user can manually refresh)
 *
 * @param {Object} store - Redux store instance
 */
export function initCrossTabAuthSync(store) {
    if (storageListener) {
        // Already initialized
        return;
    }

    currentStore = store;

    storageListener = (event) => {
        // Only react to changes in the 'token' key
        if (event.key === 'token') {
            handleTokenChange(event);
        }

        // Also react to session user ID changes (detects different user login)
        if (event.key === SESSION_USER_KEY) {
            handleUserChange(event);
        }
    };

    window.addEventListener('storage', storageListener);
    console.log('🔄 Cross-tab auth sync initialized');
}

/**
 * Handle token changes from another tab.
 */
function handleTokenChange(event) {
    const { oldValue, newValue } = event;

    // Case 1: Token was REMOVED in another tab (logout)
    if (oldValue && !newValue) {
        console.warn('🔄 [Cross-Tab] Token removed in another tab - logging out this tab');
        forceLogoutCurrentTab();
        return;
    }

    // Case 2: Token was CHANGED (could be a different user login or a token refresh)
    // We use the session user ID to distinguish between refresh vs different user
    if (oldValue && newValue && oldValue !== newValue) {
        // Token changed - check if it's a different user by looking at session user ID
        // The actual user ID check happens in the SESSION_USER_KEY handler
        console.log('🔄 [Cross-Tab] Token changed in another tab');
    }
}

/**
 * Handle user ID changes from another tab.
 * This fires when a different user logs in on another tab.
 */
function handleUserChange(event) {
    const { oldValue, newValue } = event;

    if (!currentStore) return;

    const currentState = currentStore.getState();
    const currentUser = currentState?.auth?.user;

    // If there's a current user in this tab and the session user changed to someone else
    if (currentUser && newValue && String(currentUser.id || currentUser.Id) !== newValue) {
        console.warn(
            `🔄 [Cross-Tab] Different user logged in on another tab (was: ${currentUser.id || currentUser.Id}, now: ${newValue}). Forcing logout.`
        );
        forceLogoutCurrentTab();
        return;
    }

    // If session user was cleared (logout)
    if (oldValue && !newValue) {
        console.warn('🔄 [Cross-Tab] Session user cleared in another tab');
        // Token removal handler already covers this case
    }
}

/**
 * Force logout in the current tab.
 * Dispatches LOGOUT to Redux and redirects to login page.
 */
function forceLogoutCurrentTab() {
    if (!currentStore) return;

    try {
        // Disconnect SignalR connections silently
        disconnectSignalR();

        // Clear local auth data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem(SESSION_USER_KEY);

        // Dispatch logout to clear Redux state
        currentStore.dispatch({ type: LOGOUT });

        // Hard redirect to login (clears all in-memory state)
        window.location.href = '/login';
    } catch (error) {
        console.error('🔄 [Cross-Tab] Error during forced logout:', error);
        // Even on error, redirect to login
        window.location.href = '/login';
    }
}

/**
 * Best-effort SignalR disconnect during cross-tab logout.
 */
async function disconnectSignalR() {
    try {
        const { default: dashboardSignalRService } = await import('../signalR/dashboardSignalRService');
        const { default: ptsSignalRService } = await import('../signalR/ptsSignalRService');

        await Promise.allSettled([
            dashboardSignalRService?.disconnect?.(),
            ptsSignalRService?.disconnect?.(),
        ]);
    } catch (e) {
        // Ignore - best effort
    }
}

/**
 * Cleanup the cross-tab auth sync listener.
 * Call on app unmount.
 */
export function cleanupCrossTabAuthSync() {
    if (storageListener) {
        window.removeEventListener('storage', storageListener);
        storageListener = null;
        currentStore = null;
        console.log('🔄 Cross-tab auth sync cleaned up');
    }
}
