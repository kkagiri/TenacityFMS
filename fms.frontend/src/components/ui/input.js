import React from 'react';

const Input = ({
  className = '',
  type = 'text',
  ...props
}) => {
  return (
    <input
      type={type}
      className={`tw-flex tw-h-10 tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-ring-offset-white tw-file:border-0 tw-file:bg-transparent tw-file:text-sm tw-file:font-medium tw-placeholder:text-gray-500 tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-blue-500 tw-focus-visible:ring-offset-2 tw-disabled:cursor-not-allowed tw-disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

export { Input };