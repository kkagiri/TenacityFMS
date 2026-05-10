import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`tw-flex tw-flex-col tw-space-y-1.5 tw-p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={`tw-text-lg tw-font-semibold tw-leading-none tw-tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p
      className={`tw-text-sm tw-text-gray-600 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`tw-p-6 tw-pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`tw-flex tw-items-center tw-p-6 tw-pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };