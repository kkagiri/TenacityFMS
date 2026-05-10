import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'tw-bg-red-100 tw-text-red-800 tw-border-red-200';
      case 'outline':
        return 'tw-bg-transparent tw-text-gray-700 tw-border-gray-200 tw-border';
      case 'secondary':
        return 'tw-bg-gray-100 tw-text-gray-800 tw-border-gray-200';
      default:
        return 'tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200';
    }
  };

  return (
    <span
      className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-border ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };