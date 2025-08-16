import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ActiveAlarmLayoutSimple from './layout/ActiveAlarmLayoutSimple';
import ActiveAlarmDashboard from './dashboard/ActiveAlarmDashboard';
import AlarmList from './components/AlarmList/AlarmList';
import AlarmDetails from './components/AlarmDetails/AlarmDetails';
import AlarmStatistics from './components/Statistics/AlarmStatistics';
import AlarmSettings from './components/Settings/AlarmSettings';
import AlarmReports from './components/Reports/AlarmReports';
import EscalationManager from './components/Escalation/EscalationManager';
import AutoProcessing from './components/AutoProcessing/AutoProcessing';
import CreateAlarm from './components/CreateAlarm/CreateAlarm';
import BulkActions from './components/BulkActions/BulkActions';
import TestAlarmGenerator from './components/TestAlarmGenerator';

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

      {/* Create New Alarm */}
      <Route
        path="/create"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Create Alarm" pageSubtitle="Manually create a new alarm">
            <CreateAlarm />
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

      {/* Bulk Actions */}
      <Route
        path="/bulk-actions"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Bulk Actions" pageSubtitle="Perform operations on multiple alarms">
            <BulkActions />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Escalation Manager */}
      <Route
        path="/escalation"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Escalation Manager" pageSubtitle="Manage alarm escalation rules">
            <EscalationManager />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Auto-Processing Configuration */}
      <Route
        path="/auto-processing"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Auto-Processing" pageSubtitle="Configure automatic alarm processing">
            <AutoProcessing />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Alarm Reports" pageSubtitle="Generate and view alarm reports">
            <AlarmReports />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Alarm Settings" pageSubtitle="Configure alarm system settings">
            <AlarmSettings />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Test Alarm Generator */}
      <Route
        path="/test-generator"
        element={
          <ActiveAlarmLayoutSimple pageTitle="Test Alarm Generator" pageSubtitle="Generate test alarms for system verification">
            <TestAlarmGenerator />
          </ActiveAlarmLayoutSimple>
        }
      />

      {/* Fallback - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/active-alarms" replace />} />
    </Routes>
  );
};

export default ActiveAlarmMain;
