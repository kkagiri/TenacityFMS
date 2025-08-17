import React from 'react';
import AlarmCard from '../../pages/activeAlarms/components/shared/AlarmCard';

// Example usage of AlarmCard in main dashboard
const DashboardAlarmWidget = () => {
  // Mock data - replace with actual Redux selector or API call
  const alarmStatistics = {
    criticalCount: 5,
    activeCount: 12,
    acknowledgedCount: 8,
    resolvedTodayCount: 15,
    recentAlarms: [
      {
        id: 1,
        message: "Tank A01 low volume warning",
        priority: "Critical",
        triggeredAt: new Date().toISOString()
      },
      {
        id: 2,
        message: "Device offline: PTS-001",
        priority: "High",
        triggeredAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 3,
        message: "Unauthorized access attempt",
        priority: "Critical",
        triggeredAt: new Date(Date.now() - 600000).toISOString()
      }
    ]
  };

  return (
    <div className="dashboard-alarm-widget">
      {/* Summary card for main dashboard */}
      <AlarmCard
        type="summary"
        statistics={alarmStatistics}
        showActions={true}
        showDetails={true}
        className="tw-mb-6"
      />
    </div>
  );
};

export default DashboardAlarmWidget;
