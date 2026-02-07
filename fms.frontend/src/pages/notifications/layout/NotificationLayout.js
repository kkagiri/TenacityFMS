import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from 'devextreme-react/tabs';
import { notificationRoutes } from '../utils/navigationHelper';
import NotificationHelpPopup from '../components/NotificationHelpPopup';
import './NotificationLayout.scss';

/**
 * Notification Module Layout
 * Uses tab navigation (similar to Provider Management) for clean integration with Admin layout
 */
const NotificationLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [helpPopupVisible, setHelpPopupVisible] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'dashboard', text: 'Dashboard', icon: 'fa-light fa-chart-line', path: notificationRoutes.dashboard },
      { id: 'policies', text: 'Notification Rules', icon: 'fa-light fa-shield', path: notificationRoutes.policies },
      { id: 'categories', text: 'Categories', icon: 'fa-light fa-tags', path: notificationRoutes.categories },
      { id: 'recipients', text: 'Recipient Groups', icon: 'fa-light fa-users-gear', path: notificationRoutes.recipients },
      { id: 'alert-configuration', text: 'Alert Thresholds', icon: 'fa-light fa-sliders', path: notificationRoutes.alertConfiguration },
      { id: 'history', text: 'History', icon: 'fa-light fa-clock-rotate-left', path: notificationRoutes.history },
      { id: 'email-config', text: 'Email Settings', icon: 'fa-light fa-envelope-open-text', path: notificationRoutes.emailConfig },
    ],
    []
  );

  const handleTabClick = (path) => {
    navigate(path);
  };

  const selectedIndex = useMemo(() => {
    const pathname = location.pathname;

    // Check for exact or prefix match
    const idx = tabs.findIndex((t) => {
      if (t.path === notificationRoutes.dashboard) {
        // Dashboard is base path - exact match or with trailing slash
        return pathname === t.path || pathname === t.path + '/';
      }
      return pathname.startsWith(t.path);
    });

    if (idx >= 0) return idx;
    // default route maps to dashboard
    return 0;
  }, [location.pathname, tabs]);

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">
              <i className="fa-light fa-bell tw-mr-3 tw-text-blue-600"></i>
              Notification System
            </h1>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage notification rules, categories, recipients, and delivery settings
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <button
              onClick={() => setHelpPopupVisible(true)}
              className="tw-inline-flex tw-items-center tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-600 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors"
              title="Help"
            >
              <i className="fa-light fa-circle-question tw-mr-2"></i>
              Help
            </button>
            <button
              onClick={() => navigate(notificationRoutes.policyCreate)}
              className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-border tw-border-transparent tw-rounded-md hover:tw-bg-blue-700 tw-transition-colors"
            >
              <i className="fa-light fa-plus tw-mr-2"></i>
              Create Policy
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation using DevExtreme Tabs */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200">
        <div className="tw-px-6">
          <Tabs
            dataSource={tabs}
            selectedIndex={selectedIndex}
            onItemClick={(e) => handleTabClick(e.itemData.path)}
            width="100%"
            itemRender={(item) => (
              <span className="tw-flex tw-items-center tw-gap-2">
                <i className={item.icon}></i>
                {item.text}
              </span>
            )}
            className="tw-pt-2"
          />
        </div>
      </div>

      {/* Content Area - conditionally remove padding for full-width grids */}
      <div className="tw-flex-1 tw-overflow-auto tw-bg-gray-50">{children}</div>

      {/* Help Popup */}
      <NotificationHelpPopup
        visible={helpPopupVisible}
        onHiding={() => setHelpPopupVisible(false)}
      />
    </div>
  );
};

export default NotificationLayout;
