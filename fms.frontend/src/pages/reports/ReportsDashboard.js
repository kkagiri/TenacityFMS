import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ReportsDashboard.scss';

const ReportsDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="reports-dashboard">
      <div className="dashboard-header">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">Reports Overview</h2>
        <p className="tw-text-gray-600">Access and generate various fuel management reports</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-light fa-chart-bar tw-text-blue-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Consumption Reports</h3>
            <p className="stat-description">Vehicle fuel consumption analysis</p>
            <div className="stat-actions">
              <button className="btn btn-primary" onClick={() => navigate('/reports/consumption-refills')}>
                View Reports
              </button>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-light fa-upload tw-text-green-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Data Import</h3>
            <p className="stat-description">Import fuel report data from external sources</p>
            <div className="stat-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/reports/fuel-importer')}>
                Import Data
              </button>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-light fa-chart-line tw-text-purple-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Analytics</h3>
            <p className="stat-description">Advanced fuel usage analytics and trends</p>
            <div className="stat-actions">
              <button className="btn btn-outline" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-light fa-file-export tw-text-orange-500"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Export Reports</h3>
            <p className="stat-description">Export reports to PDF, Excel, or HTML formats</p>
            <div className="stat-actions">
              <button className="btn btn-primary" onClick={() => navigate('/reports/viewer')}>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JsReport Section */}
      <div className="jsreport-section tw-mt-8">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
          <i className="fa-light fa-file-code tw-mr-2 tw-text-blue-500"></i>
          Report Builder (JsReport)
        </h3>
        <div className="tw-grid tw-grid-cols-3 tw-gap-4">
          <div
            className="jsreport-card tw-cursor-pointer"
            onClick={() => navigate('/reports/viewer')}
          >
            <i className="fa-light fa-eye tw-text-3xl tw-text-green-500 tw-mb-2"></i>
            <h4 className="tw-font-semibold tw-text-gray-800">Report Viewer</h4>
            <p className="tw-text-sm tw-text-gray-500">Generate and preview reports with filters</p>
          </div>
          <div
            className="jsreport-card tw-cursor-pointer"
            onClick={() => navigate('/reports/designer')}
          >
            <i className="fa-light fa-edit tw-text-3xl tw-text-blue-500 tw-mb-2"></i>
            <h4 className="tw-font-semibold tw-text-gray-800">Template Designer</h4>
            <p className="tw-text-sm tw-text-gray-500">Create and edit Handlebars templates</p>
          </div>
          <div
            className="jsreport-card tw-cursor-pointer"
            onClick={() => navigate('/reports/templates')}
          >
            <i className="fa-light fa-folder-open tw-text-3xl tw-text-purple-500 tw-mb-2"></i>
            <h4 className="tw-font-semibold tw-text-gray-800">Template Manager</h4>
            <p className="tw-text-sm tw-text-gray-500">Manage all report templates</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Quick Access</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <i className="fa-light fa-gas-pump tw-text-blue-400"></i>
            </div>
            <div className="activity-content">
              <h4>Fuel Consumption by Vehicle</h4>
              <p className="tw-text-sm tw-text-gray-600">View detailed consumption patterns for each vehicle</p>
            </div>
            <div className="activity-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate('/reports/consumption-refills')}
              >
                View Report
              </button>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <i className="fa-light fa-upload tw-text-green-400"></i>
            </div>
            <div className="activity-content">
              <h4>Import Fuel Data</h4>
              <p className="tw-text-sm tw-text-gray-600">Upload and process fuel report files</p>
            </div>
            <div className="activity-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate('/reports/fuel-importer')}
              >
                Import Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
