/**
 * Navigation Service
 * Provides navigation capabilities from outside React components
 * Used by push notification service to navigate when notifications are tapped
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen
 * @param {string} name - Screen name
 * @param {object} params - Navigation params
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('[NavigationService] Navigator not ready, queuing navigation...');
    // Queue navigation for when navigator is ready
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 500);
  }
}

/**
 * Navigate to notification center
 * @param {object} notification - Optional notification data to show
 */
export function navigateToNotificationCenter(notification = null) {
  console.log('[NavigationService] Navigating to NotificationCenter', notification);
  navigate('NotificationCenter', { notification });
}

/**
 * Check if navigator is ready
 * @returns {boolean}
 */
export function isReady() {
  return navigationRef.isReady();
}

export default {
  navigationRef,
  navigate,
  navigateToNotificationCenter,
  isReady,
};
