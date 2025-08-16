import React from 'react';

const AlarmList = () => {
  return (
    <div className="alarm-list">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-4">
          Active Alarms List
        </h2>
        <p className="tw-text-gray-600">
          This component will display a filterable, sortable list of all active alarms
          with actions for acknowledge, resolve, suppress, and escalate.
        </p>
        <div className="tw-mt-4 tw-text-sm tw-text-gray-500">
          Features to implement:
          <ul className="tw-list-disc tw-list-inside tw-mt-2">
            <li>Advanced filtering by priority, type, site, date range</li>
            <li>Real-time updates via SignalR</li>
            <li>Bulk selection and actions</li>
            <li>Sorting by various columns</li>
            <li>Pagination with configurable page sizes</li>
            <li>Quick action buttons for each alarm</li>
            <li>Context menu for additional actions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AlarmList;
