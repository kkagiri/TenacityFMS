import React from 'react';

const VehicleReportsPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">Vehicle Reports</h2>
        <p className="tw-text-gray-600 tw-mb-6">
          Generate comprehensive reports for fleet analytics and insights
        </p>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6 tw-mb-8">
          <div className="tw-bg-blue-50 tw-p-6 tw-rounded-lg tw-border tw-border-blue-200 tw-cursor-pointer hover:tw-bg-blue-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-chart-bar tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800">Fleet Performance</h3>
            </div>
            <p className="tw-text-blue-600 tw-text-sm tw-mb-4">
              Overall fleet performance metrics and KPIs
            </p>
            <button className="tw-text-blue-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>

          <div className="tw-bg-green-50 tw-p-6 tw-rounded-lg tw-border tw-border-green-200 tw-cursor-pointer hover:tw-bg-green-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-gas-pump tw-text-2xl tw-text-green-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-green-800">Fuel Efficiency</h3>
            </div>
            <p className="tw-text-green-600 tw-text-sm tw-mb-4">
              Detailed fuel consumption and efficiency analysis
            </p>
            <button className="tw-text-green-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>

          <div className="tw-bg-yellow-50 tw-p-6 tw-rounded-lg tw-border tw-border-yellow-200 tw-cursor-pointer hover:tw-bg-yellow-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-wrench tw-text-2xl tw-text-yellow-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-yellow-800">Maintenance</h3>
            </div>
            <p className="tw-text-yellow-600 tw-text-sm tw-mb-4">
              Maintenance schedules, costs, and history reports
            </p>
            <button className="tw-text-yellow-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>

          <div className="tw-bg-purple-50 tw-p-6 tw-rounded-lg tw-border tw-border-purple-200 tw-cursor-pointer hover:tw-bg-purple-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-route tw-text-2xl tw-text-purple-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-purple-800">Route Analysis</h3>
            </div>
            <p className="tw-text-purple-600 tw-text-sm tw-mb-4">
              Route optimization and travel pattern insights
            </p>
            <button className="tw-text-purple-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>

          <div className="tw-bg-red-50 tw-p-6 tw-rounded-lg tw-border tw-border-red-200 tw-cursor-pointer hover:tw-bg-red-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-red-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-red-800">Cost Analysis</h3>
            </div>
            <p className="tw-text-red-600 tw-text-sm tw-mb-4">
              Operational costs and budget analysis reports
            </p>
            <button className="tw-text-red-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>

          <div className="tw-bg-indigo-50 tw-p-6 tw-rounded-lg tw-border tw-border-indigo-200 tw-cursor-pointer hover:tw-bg-indigo-100 tw-transition-colors">
            <div className="tw-flex tw-items-center tw-mb-4">
              <i className="fa-light fa-user-check tw-text-2xl tw-text-indigo-600 tw-mr-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-indigo-800">Driver Performance</h3>
            </div>
            <p className="tw-text-indigo-600 tw-text-sm tw-mb-4">
              Driver behavior and performance metrics
            </p>
            <button className="tw-text-indigo-700 tw-font-medium tw-text-sm hover:tw-underline">
              Generate Report →
            </button>
          </div>
        </div>

        <div className="tw-bg-gray-50 tw-p-6 tw-rounded-lg tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Custom Report Builder</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Report Type</label>
              <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                <option>Select report type...</option>
                <option>Fleet Overview</option>
                <option>Fuel Analysis</option>
                <option>Maintenance Summary</option>
                <option>Cost Report</option>
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Date Range</label>
              <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>Custom range</option>
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Format</label>
              <select className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
                <option>Email</option>
              </select>
            </div>
          </div>

          <button className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-lg tw-font-medium hover:tw-bg-blue-700 tw-transition-colors">
            <i className="fa-light fa-download tw-mr-2"></i>
            Generate Custom Report
          </button>
        </div>

        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Recent Reports</h3>
          <div className="tw-space-y-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-file-pdf tw-text-red-500 tw-mr-3"></i>
                <div>
                  <p className="tw-font-medium tw-text-gray-800">Fleet Performance - December 2024</p>
                  <p className="tw-text-sm tw-text-gray-600">Generated on Jan 5, 2025</p>
                </div>
              </div>
              <button className="tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium tw-text-sm">
                Download
              </button>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-file-excel tw-text-green-500 tw-mr-3"></i>
                <div>
                  <p className="tw-font-medium tw-text-gray-800">Fuel Efficiency Q4 2024</p>
                  <p className="tw-text-sm tw-text-gray-600">Generated on Jan 3, 2025</p>
                </div>
              </div>
              <button className="tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium tw-text-sm">
                Download
              </button>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-file-csv tw-text-blue-500 tw-mr-3"></i>
                <div>
                  <p className="tw-font-medium tw-text-gray-800">Maintenance Report - December</p>
                  <p className="tw-text-sm tw-text-gray-600">Generated on Jan 1, 2025</p>
                </div>
              </div>
              <button className="tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium tw-text-sm">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleReportsPage;
