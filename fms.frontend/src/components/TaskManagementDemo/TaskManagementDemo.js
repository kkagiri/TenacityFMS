import React from 'react';
import { Button } from 'devextreme-react/button';
import { useNavigate } from 'react-router-dom';
import './TaskManagementDemo.scss';

const TaskManagementDemo = () => {
  const navigate = useNavigate();

  const handleNavigateToDemo = () => {
    navigate('/task-management');
  };

  const handleNavigateToSampleDemo = () => {
    navigate('/task-management/sample-demo');
  };

  const handleNavigateToAnalytics = () => {
    navigate('/task-management/analytics');
  };

  return (
    <div className="task-demo-widget tw-p-6 tw-bg-white tw-rounded-lg tw-shadow-md tw-border tw-border-gray-200">
      <div className="tw-flex tw-items-center tw-mb-4">
        <i className="fa-light fa-tasks tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-1">
            Task Management Demo
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            Explore the complete task management system with sample data and analytics
          </p>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
        <Button
          text="Main Dashboard"
          icon="fa-light fa-chart-line"
          type="default"
          stylingMode="outlined"
          onClick={handleNavigateToDemo}
          width="100%"
          height={40}
        />

        <Button
          text="Sample Demo"
          icon="fa-light fa-flask"
          type="default"
          stylingMode="outlined"
          onClick={handleNavigateToSampleDemo}
          width="100%"
          height={40}
        />

        <Button
          text="Analytics"
          icon="fa-light fa-chart-bar"
          type="default"
          stylingMode="outlined"
          onClick={handleNavigateToAnalytics}
          width="100%"
          height={40}
        />
      </div>

      <div className="tw-mt-4 tw-p-3 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-200">
        <p className="tw-text-xs tw-text-blue-700 tw-mb-2">
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          <strong>Quick Start:</strong>
        </p>
        <ol className="tw-text-xs tw-text-blue-600 tw-list-decimal tw-list-inside tw-space-y-1">
          <li>Click "Sample Demo" to generate test data</li>
          <li>Use "Analytics" to view reports and charts</li>
          <li>Check "Main Dashboard" for task management</li>
        </ol>
      </div>
    </div>
  );
};

export default TaskManagementDemo;
