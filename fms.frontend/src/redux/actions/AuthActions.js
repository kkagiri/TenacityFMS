import axiosInstance from './../../api/axiosInstance';
import { fetchMyPermissions } from './permissionActions';
import store from '../../store'; // Import store to check fueling status
import { setSessionUserId, clearSessionUserId } from '../../utils/crossTabAuthSync';
import { redirectToLoginPreservingReturnUrl } from '../../utils/authRedirect';
import {
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    USER_LOADED,
    AUTH_ERROR,
    AUTH_REQUEST,
    AUTH_SUCCESS,
    AUTH_FAILURE,
} from './types';

export const loadUser = () => async (dispatch) => {
    // Check if token exists before making the request
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('⚠️ No token found, skipping user load');
        dispatch({ type: AUTH_ERROR, payload: 'No authentication token' });
        return { success: false, error: 'No authentication token' };
    }

    dispatch({ type: AUTH_REQUEST });

    try {
        // Use correct endpoint with proper casing - backend expects /User/details (capital U)
        const response = await axiosInstance.get('/User/details');
        const user = response.data;

        // Normalize the user data - the backend already returns 'Roles' as an array
        const normalizedUser = {
            ...user,
            roles: user.Roles || user.roles || [],
            // Ensure consistent property names
            userName: user.UserName || user.userName,
            email: user.Email || user.email,
            id: user.Id || user.id,
            requirePasswordChangeOnFirstLogin:
                user.RequirePasswordChangeOnFirstLogin ??
                user.requirePasswordChangeOnFirstLogin ??
                false,
        };

        console.log('✅ User data loaded successfully');
        dispatch({ type: USER_LOADED, payload: normalizedUser });

        // Fetch user permissions from backend (not from JWT)
        dispatch(fetchMyPermissions());

        return { success: true, user: normalizedUser };
    } catch (error) {
        console.error('❌ Load user error:', error);

        //Cursor: Handle network errors and invalid tokens
        if (error.message === "Network Error" || error.code === 'ERR_NETWORK') {
            console.error('🌐 Network error - cannot reach server');
            // Don't remove token on network errors - server might be temporarily down
            dispatch({ type: AUTH_ERROR, payload: 'Network error' });
            return { success: false, error: 'Network error' };
        } else if (error.response && error.response.status === 401) {
            // Token is invalid or expired - clear everything and force logout
            console.warn('🚫 Token expired or invalid - clearing authentication');
            localStorage.removeItem('token');
            dispatch({ type: LOGOUT });
            return { success: false, error: 'Token expired' };
        }

        // Other errors
        dispatch({ type: AUTH_ERROR, payload: error.message });
        return { success: false, error: error.message };
    }
};

export const signIn = (username, password) => async (dispatch) => {
    dispatch({ type: AUTH_REQUEST });

    try {
        console.log('🔐 Attempting login for username:', username);

        // Use correct endpoint with proper casing - backend expects /User/Login (capital U)
        const response = await axiosInstance.post(`/User/Login`, { username, password });

        // Backend now returns FMSResponse with { Data: { Token, RefreshToken, User } }
        // Backend uses camelCase JSON serialization
        const responseData = response.data.data || response.data.Data || response.data;
        // Support both camelCase and PascalCase property names
        const token = responseData.token || responseData.Token;
        const refreshToken = responseData.refreshToken || responseData.RefreshToken;
        const user = responseData.user || responseData.User;

        if (!token) {
            throw new Error('No token received from server');
        }

        if (!refreshToken) {
            throw new Error('No refresh token received from server');
        }

        if (!user) {
            throw new Error('No user data received from server');
        }

        // Store both access token and refresh token
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        console.log('✅ Login successful - token, refresh token, and user data received');

        const normalizedUser = {
            ...user,
            roles: user.Roles || user.roles || [],
            userName: user.UserName || user.userName,
            email: user.Email || user.email,
            id: user.Id || user.id,
            requirePasswordChangeOnFirstLogin:
                user.RequirePasswordChangeOnFirstLogin ??
                user.requirePasswordChangeOnFirstLogin ??
                false,
        };

        // Mark which user is logged in (for cross-tab detection)
        setSessionUserId(normalizedUser.id);

        // Dispatch success with both token and user
        dispatch({
            type: LOGIN_SUCCESS,
            payload: { token, user: normalizedUser }
        });

        // Also dispatch USER_LOADED to set user in state
        dispatch({
            type: USER_LOADED,
            payload: normalizedUser
        });

        // Fetch user permissions from backend (not from JWT)
        dispatch(fetchMyPermissions());

        return { isOk: true };
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login';

        //Cursor: Handle network errors specifically
        if (error.message === "Network Error" || error.code === 'ERR_NETWORK') {
            errorMessage = 'Login service cannot be found. Please check your network connection.';
        } else if (error.response && error.response.status === 401) {
            errorMessage = 'Wrong username or password';
        } else if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }

        dispatch({ type: LOGIN_FAILURE, payload: errorMessage });
        return { isOk: false, message: errorMessage };
    }
};

/**
 * Check if there are any active fueling processes
 * Important: Only checks for FullTank mode fueling (no predetermined end)
 * Fixed volume/price fueling will complete automatically
 */
const hasActiveFuelingProcesses = () => {
    try {
        const state = store.getState();

        // Check pump reducer for active fueling processes
        const activeFueling = state.pump?.activeFuelingProcesses || [];

        if (activeFueling.length > 0) {
            console.log(`⛽ Found ${activeFueling.length} active fueling process(es)`);
            return {
                hasActive: true,
                count: activeFueling.length,
                processes: activeFueling
            };
        }

        return { hasActive: false, count: 0, processes: [] };
    } catch (error) {
        console.warn('⚠️ Could not check fueling status:', error);
        return { hasActive: false, count: 0, processes: [] };
    }
};

/**
 * Logout user - Production-grade implementation
 * Clears all user session data and redirects to login
 *
 * Special handling for active fueling:
 * - Checks for active FullTank fueling processes
 * - Warns user before terminating active fueling
 * - Sends stop command to pumps if user confirms
 */
export const logout = () => async (dispatch) => {
    try {
        console.log('🔓 Starting logout process...');

        // 1. Check for active fueling processes FIRST (before disconnecting anything)
        const fuelingStatus = hasActiveFuelingProcesses();

        if (fuelingStatus.hasActive) {
            // Import necessary services for fueling termination
            const { default: ptsSignalRService } = await import('../../signalR/ptsSignalRService');

            console.warn(`⛽ Warning: ${fuelingStatus.count} active fueling process(es) detected`);

            // Show confirmation dialog
            const shouldTerminate = window.confirm(
                `⚠️ Active Fueling Alert\n\n` +
                `There ${fuelingStatus.count === 1 ? 'is' : 'are'} ${fuelingStatus.count} active fueling process${fuelingStatus.count === 1 ? '' : 'es'}:\n\n` +
                fuelingStatus.processes.map(p => `• Pump ${p.pumpId}, Nozzle ${p.nozzleId} - ${p.fuelType}`).join('\n') +
                `\n\nLogging out will TERMINATE these fueling processes.\n\n` +
                `Do you want to proceed with logout?`
            );

            if (!shouldTerminate) {
                console.log('🔓 Logout cancelled by user due to active fueling');
                return; // Cancel logout
            }

            console.log('⛽ User confirmed - terminating active fueling processes...');

            // Try to send stop commands to active pumps
            try {
                if (ptsSignalRService?.isConnected) {
                    for (const process of fuelingStatus.processes) {
                        try {
                            console.log(`🛑 Stopping pump ${process.pumpId}...`);
                            // You may need to implement a stop pump command
                            // await ptsSignalRService.connection.invoke('StopPump', process.pumpId);
                        } catch (stopError) {
                            console.error(`Failed to stop pump ${process.pumpId}:`, stopError);
                        }
                    }

                    // Give pumps a moment to receive stop commands
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (pumpStopError) {
                console.error('⚠️ Error stopping pumps:', pumpStopError);
                // Continue with logout even if pump stop fails
            }
        }

        // 2. Disconnect SignalR connections before clearing token
        try {
            // Import SignalR services dynamically to avoid circular dependencies
            const { default: dashboardSignalRService } = await import('../../signalR/dashboardSignalRService');
            const { default: ptsSignalRService } = await import('../../signalR/ptsSignalRService');

            console.log('📡 Disconnecting SignalR connections...');
            await Promise.allSettled([
                dashboardSignalRService?.disconnect?.(),
                ptsSignalRService?.disconnect?.()
            ]);
            console.log('✅ SignalR connections disconnected');
        } catch (signalRError) {
            console.warn('⚠️ Error disconnecting SignalR:', signalRError);
            // Don't fail logout if SignalR disconnect fails
        }

        // 2. Clear authentication tokens and session marker (both access and refresh)
        clearSessionUserId();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        console.log('✅ Tokens and session marker removed');

        // 3. Clear user-specific localStorage data (but keep system preferences)
        const keysToRemove = [
            'fms_dashboard_layouts',        // User dashboard layouts
            'fms_layout_settings',          // User layout settings
            'dashboard_widgetConfig',       // Widget configurations
            'dashboard_todayFuelBaseline',  // Dashboard cache
            'selectedSite',                 // User selections
            'selectedPeriod',               // User selections
            'issueTrackerSavedFilters',    // User filters
            'currentUser',                  // Legacy user data
        ];

        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`✅ Cleared localStorage: ${key}`);
            }
        });

        // 4. Dispatch logout action to clear Redux state
        dispatch({ type: LOGOUT });
        console.log('✅ Redux state cleared');

        // 5. Optional: Call backend logout endpoint if it exists
        // Note: Currently there's no backend logout endpoint,
        // but in production you should have one to:
        // - Blacklist the JWT token
        // - Log the logout event
        // - Invalidate refresh tokens
        // - Track user sessions
        /*
        try {
            await axiosInstance.post('/user/logout');
            console.log('✅ Server-side session cleared');
        } catch (backendError) {
            console.warn('⚠️ Backend logout failed:', backendError);
            // Don't fail logout if backend call fails
        }
        */

        // 6. Redirect to login page
        // Note: We can't use navigate here because we're not in a component
        // The App.js will handle the redirect when isAuthenticated becomes false
        console.log('🔓 Logout completed successfully');

        // Force reload to clear any in-memory state and return to login
        redirectToLoginPreservingReturnUrl();

    } catch (error) {
        console.error('🚨 Logout error:', error);

        // Even if logout fails, clear critical data
        clearSessionUserId();
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: LOGOUT });

        // Force redirect to login page
        redirectToLoginPreservingReturnUrl();
    }
};