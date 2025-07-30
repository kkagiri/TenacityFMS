import React from 'react';
import { Button } from 'devextreme-react';

const IssueAnalyticsPage = () => {
  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-analytics tw-text-6xl tw-text-orange-300 tw-mb-4"></i>
          <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900 tw-mb-2">Issue Analytics</h2>
          <p className="tw-text-gray-600 tw-mb-6">
            Advanced analytics and insights for issue tracking patterns, trends, and predictions.
          </p>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 tw-max-w-4xl tw-mx-auto tw-mt-8">
            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-chart-line tw-mr-2"></i>
                Trend Analysis
              </h3>
              <p className="tw-text-sm tw-text-gray-600">Identify patterns in issue occurrence and resolution</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-stopwatch tw-mr-2"></i>
                Performance Metrics
              </h3>
              <p className="tw-text-sm tw-text-gray-600">Measure response times and resolution efficiency</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h3 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-brain tw-mr-2"></i>
                Predictive Insights
              </h3>
              <p className="tw-text-sm tw-text-gray-600">AI-powered predictions for issue prevention</p>
            </div>
          </div>

          <Button
            text="Coming Soon"
            type="normal"
            stylingMode="outlined"
            disabled={true}
            className="tw-mt-6"
          />
        </div>
      </div>
    </div>
  );
};

export default IssueAnalyticsPage;
