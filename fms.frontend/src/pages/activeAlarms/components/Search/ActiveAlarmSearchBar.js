import React from 'react';

const ActiveAlarmSearchBar = ({ placeholder = "Search alarms..." }) => {
  return (
    <div className="alarm-search-bar">
      <div className="tw-relative">
        <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-pl-3 tw-flex tw-items-center tw-pointer-events-none">
          <i className="fa-light fa-search tw-text-gray-400"></i>
        </div>
        <input
          type="text"
          className="tw-block tw-w-full tw-pl-10 tw-pr-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-leading-5 tw-bg-white placeholder:tw-text-gray-500 focus:tw-outline-none focus:tw-placeholder-gray-400 focus:tw-ring-1 focus:tw-ring-red-500 focus:tw-border-red-500 tw-text-sm"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default ActiveAlarmSearchBar;
