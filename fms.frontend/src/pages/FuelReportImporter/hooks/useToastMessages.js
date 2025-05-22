import { useState } from 'react';

/**
 * Hook for managing toast messages in the Fuel Report Importer
 */
const useToastMessages = ({
  setToastVisible,
  setToastMessage,
  setToastType
}) => {
  // Internal state for tracking toast display
  const [toastTimeout, setToastTimeout] = useState(null);

  /**
   * Displays a toast message with the specified type
   * @param {string} message - The message to display
   * @param {string} type - The message type (info, success, error, warning)
   * @param {number} duration - Display duration in ms (default 3000)
   */
  const showToast = (message, type = 'info', duration = 3000) => {
    // Clear any existing timeout
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    // Set toast properties
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    // Auto-hide after duration
    const timeout = setTimeout(() => {
      setToastVisible(false);
    }, duration);

    // Store timeout reference for cleanup
    setToastTimeout(timeout);
  };

  /**
   * Hides the current toast message immediately
   */
  const hideToast = () => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToastVisible(false);
  };

  return {
    showToast,
    hideToast
  };
};

export default useToastMessages;
