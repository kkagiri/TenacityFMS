import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ActiveAlarmLayoutSimple from './layout/ActiveAlarmLayoutSimple';
import ActiveAlarmDashboard from './dashboard/ActiveAlarmDashboard';
import AlarmList from './components/AlarmList/AlarmList';
import AlarmDetails from './components/AlarmDetails/AlarmDetails';
import AlarmStatistics from './components/Statistics/AlarmStatistics';
import AlarmSettings from './components/Settings/AlarmSettings';

const ActiveAlarmMain = () => {
  return (
    <Routes>
      {/* Dashboard - default route */}
      <Route
        path="/"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Active Alarms Dashboard">
            <ActiveAlarmDashboard />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Alarm List with filtering */}
      <Route
        path="/list"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Active Alarms" pageSubtitle="Manage all active alarms">
            <AlarmList />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Alarm Details */}
      <Route
        path="/:id/details"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Alarm Details">
            <AlarmDetails />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Statistics */}
      <Route
        path="/statistics"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Alarm Statistics" pageSubtitle="View alarm trends and analytics">
            <AlarmStatistics />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Settings (includes escalation config, auto-processing, cooldowns) */}
      <Route
        path="/settings"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Alarm Settings" pageSubtitle="Cooldowns, escalation rules, auto-processing">
            <AlarmSettings />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Fallback - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/active-alarms" replace />} />
    </Routes>
  );
};

export default ActiveAlarmMain;
