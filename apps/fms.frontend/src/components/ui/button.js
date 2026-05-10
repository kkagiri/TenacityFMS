import React from 'react';

const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'tw-bg-red-600 tw-text-white hover:tw-bg-red-700 tw-border-red-600';
      case 'outline':
        return 'tw-bg-transparent tw-text-gray-700 tw-border-gray-300 tw-border hover:tw-bg-gray-50';
      case 'secondary':
        return 'tw-bg-gray-100 tw-text-gray-900 hover:tw-bg-gray-200 tw-border-gray-200';
      case 'ghost':
        return 'tw-bg-transparent tw-text-gray-700 hover:tw-bg-gray-100';
      default:
        return 'tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700 tw-border-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'tw-px-3 tw-py-1.5 tw-text-sm';
      case 'lg':
        return 'tw-px-6 tw-py-3 tw-text-lg';
      default:
        return 'tw-px-4 tw-py-2 tw-text-sm';
    }
  };

  return (
    <button
      className={`tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-font-medium tw-transition-colors tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-blue-500 tw-disabled:opacity-50 tw-disabled:pointer-events-none ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };