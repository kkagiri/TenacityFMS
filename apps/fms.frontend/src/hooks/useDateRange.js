import { useState, useMemo } from 'react';

/**
 * Custom hook for managing stable date ranges to prevent infinite re-renders
 * @param {number} defaultDays - Number of days to go back from today (default: 30)
 * @returns {object} - { dateRange, setDateRange, updateDateRange }
 */
export const useDateRange = (defaultDays = 30) => {
  const [dateRangeState, setDateRangeState] = useState(() => {
    const today = new Date();
    const defaultDaysAgo = new Date(today.getTime() - defaultDays * 24 * 60 * 60 * 1000);
    return [
      defaultDaysAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];
  });

  // Create stable reference for dateRange
  const dateRange = useMemo(() => dateRangeState, [dateRangeState]);

  // Helper function to update date range with validation
  const updateDateRange = useMemo(() => (newStartDate, newEndDate) => {
    if (!newStartDate || !newEndDate) {
      console.warn('Invalid date range provided');
      return;
    }

    const start = new Date(newStartDate);
    const end = new Date(newEndDate);

    if (start > end) {
      console.warn('Start date cannot be after end date');
      return;
    }

    setDateRangeState([
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    ]);
  }, []);

  return {
    dateRange,
    setDateRange: setDateRangeState,
    updateDateRange
  };
};
