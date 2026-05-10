import React from 'react';

const Progress = ({
  value = 0,
  max = 100,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max(value, 0), max);

  return (
    <div
      className={`tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-2 ${className}`}
      {...props}
    >
      <div
        className="tw-bg-blue-600 tw-h-2 tw-rounded-full tw-transition-all tw-duration-300 tw-ease-in-out"
        style={{ width: `${(percentage / max) * 100}%` }}
      />
    </div>
  );
};

export { Progress };