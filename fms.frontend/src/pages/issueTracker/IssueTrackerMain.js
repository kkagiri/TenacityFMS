import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import IssueTrackerLayout from './layout/IssueTrackerLayout';
import IssueTrackerPage from './IssueTrackerPage';
import IssueTrackerFormPage from './IssueTrackerFormPage';
import IssueTicketsPage from './tickets/IssueTicketsPage';
import IssueReportsPage from './reports/IssueReportsPage';
import IssueAnalyticsPage from './analytics/IssueAnalyticsPage';
import IssueSettingsPage from './settings/IssueSettingsPage';
import IssueFiltersPage from './filters/IssueFiltersPage';
import IssueNotificationsPage from './notifications/IssueNotificationsPage';

const IssueTrackerMain = () => {
  return (
    <IssueTrackerLayout>
      <Routes>
        {/* Default route - Issue Tracker Dashboard */}
        <Route index element={<IssueTrackerPage />} />
        <Route path="/" element={<IssueTrackerPage />} />
        <Route path="/dashboard" element={<IssueTrackerPage />} />

        {/* Feature routes */}
        <Route path="/tickets" element={<IssueTicketsPage />} />
        <Route path="/create" element={<IssueTrackerFormPage />} />
        <Route path="/edit/:id" element={<IssueTrackerFormPage />} />
        <Route path="/reports" element={<IssueReportsPage />} />
        <Route path="/analytics" element={<IssueAnalyticsPage />} />
        <Route path="/settings" element={<IssueSettingsPage />} />
        <Route path="/filters" element={<IssueFiltersPage />} />
        <Route path="/notifications" element={<IssueNotificationsPage />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/issue-tracker" replace />} />
      </Routes>
    </IssueTrackerLayout>
  );
};

export default IssueTrackerMain;
