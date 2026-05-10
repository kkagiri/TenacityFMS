import React from 'react';

// Minimal base ticker component - will evolve with display density / refresh logic
export const BaseTicker = ({ title, children }) => {
  return (
    <div className="base-ticker border rounded shadow-sm p-3 bg-white dark:bg-gray-800">
      <div className="ticker-header font-semibold text-sm mb-2">{title}</div>
      <div className="ticker-body text-xs">{children || 'Content coming soon...'}</div>
    </div>
  );
};

export default BaseTicker;
