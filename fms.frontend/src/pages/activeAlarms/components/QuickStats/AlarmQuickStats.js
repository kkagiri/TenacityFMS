import React from 'react';
import { useSelector } from 'react-redux';
import AlarmCard from '../shared/AlarmCard';

const AlarmQuickStats = ({ compact = false, type = 'compact' }) => {
  const { statistics, loadingStates } = useSelector(state => state.activeAlarm);

  if (loadingStates.fetchingStatistics) {
    return (
      <div className={`alarm-quick-stats ${compact ? 'compact' : ''}`}>
        <div className="tw-animate-pulse">
          <div className="tw-h-4 tw-bg-gray-300 tw-rounded tw-mb-2"></div>
          <div className="tw-h-6 tw-bg-gray-300 tw-rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <AlarmCard
      type={type}
      statistics={statistics}
      showActions={!compact}
      className="alarm-quick-stats"
    />
  );
};

export default AlarmQuickStats;
