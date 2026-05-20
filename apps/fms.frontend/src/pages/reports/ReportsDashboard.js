/**
 * File: ReportsDashboard.js
 * Purpose: Reports landing page — source catalog, quick actions for scheduling
 *          & monitoring, and data-management shortcuts.
 * Dependencies: React, react-router-dom, report source registry
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportsDashboard: Dynamic source catalog + quick-access cards
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllReportSources, getCategories, getReportSourcesByCategory } from './sources';
import { reportsRoutes } from './utils/navigationHelper';
import ModuleDashboard from '../../components/dashboard/ModuleDashboard';
import { usePermissions } from '../../hooks/usePermissions';
import './ReportsDashboard.scss';

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManageReportSchedules = hasPermission('_Manage_ReportSchedules');

  const categories = useMemo(() => getCategories(), []);

  return (
    <div className="reports-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">Reports Overview</h2>
        <p className="tw-text-gray-600">
          Select a report source to generate, schedule, or preview reports via JSReport.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="reports-dashboard__quick-actions tw-mb-8">
        <div
          className="stat-card tw-cursor-pointer hover:tw-shadow-md tw-transition-shadow"
          onClick={() => navigate(reportsRoutes.engine)}
        >
          <div className="stat-icon">
            <i className="fa-light fa-play tw-text-blue-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Run Report</h3>
            <p className="stat-description">Generate a report from any source</p>
          </div>
        </div>

        <div
          className="stat-card tw-cursor-pointer hover:tw-shadow-md tw-transition-shadow"
          onClick={() => navigate(reportsRoutes.templates)}
        >
          <div className="stat-icon">
            <i className="fa-light fa-file-code tw-text-purple-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Templates</h3>
            <p className="stat-description">Manage Handlebars report templates</p>
          </div>
        </div>

        {canManageReportSchedules && (
          <div
            className="stat-card tw-cursor-pointer hover:tw-shadow-md tw-transition-shadow"
            onClick={() => navigate(reportsRoutes.scheduling)}
          >
            <div className="stat-icon">
              <i className="fa-light fa-calendar-clock tw-text-green-500"></i>
            </div>
            <div className="stat-content">
              <h3 className="stat-title">Scheduling</h3>
              <p className="stat-description">Schedule and automate report delivery</p>
            </div>
          </div>
        )}

        <div
          className="stat-card tw-cursor-pointer hover:tw-shadow-md tw-transition-shadow"
          onClick={() => navigate(reportsRoutes.monitoring)}
        >
          <div className="stat-icon">
            <i className="fa-light fa-monitor-waveform tw-text-orange-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Monitoring</h3>
            <p className="stat-description">Track execution history & errors</p>
          </div>
        </div>
      </div>

      {/* Standardized Widget Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <ModuleDashboard
          moduleId="reports"
          title="Reports Analytics"
          icon="fa-solid fa-chart-pie"
          subtitle="Widget-based report analytics — execution stats and trends"
        />
      </div>

      {/* Report Source Catalog by Category */}
      {categories.map((category) => {
        const categoryName = typeof category === 'string' ? category : category.name;
        const sources = getReportSourcesByCategory(categoryName);
        if (sources.length === 0) return null;

        return (
          <div key={categoryName} className="tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-3">
              {categoryName}
            </h3>
            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="jsreport-card tw-cursor-pointer"
                  onClick={() => navigate(reportsRoutes.engineSource(source.id))}
                >
                  <i className={`${source.icon || 'fa-light fa-file-chart-column'} reports-dashboard__source-icon tw-text-3xl tw-text-blue-500 tw-mb-2`}></i>
                  <h4 className="tw-font-semibold tw-text-gray-800">{source.name}</h4>
                  <p className="tw-text-sm tw-text-gray-500">{source.description}</p>
                  <div className="tw-mt-2 tw-flex tw-gap-1">
                    {(source.supportedFormats || []).map((fmt) => (
                      <span
                        key={fmt}
                        className="tw-px-1.5 tw-py-0.5 tw-bg-gray-100 tw-text-gray-500 tw-rounded tw-text-[10px] tw-uppercase"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Data Management Quick Access */}
      <div className="recent-activity tw-mt-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Data Management</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div class="activity-icon-removed" style={{ display: 'none' }}>
              <i className="fa-light fa-upload tw-text-green-400"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
