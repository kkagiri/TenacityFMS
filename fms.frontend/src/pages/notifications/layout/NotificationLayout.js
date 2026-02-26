import React from 'react';

/**
 * File: NotificationLayout.js
 * Purpose: Minimal wrapper for notification module content.
 *          Navigation is handled by the Admin sidebar expandable sub-menu.
 * Dependencies: None
 * Last Modified: 2025-01-01
 */
const NotificationLayout = ({ children }) => {
  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      <div className="tw-flex-1 tw-overflow-auto tw-bg-gray-50">{children}</div>
    </div>
  );
};

export default NotificationLayout;
