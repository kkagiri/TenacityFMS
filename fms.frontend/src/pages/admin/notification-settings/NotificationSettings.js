import React, { useState, useCallback } from "react";
import { TabPanel, LoadPanel } from "devextreme-react";
import NotificationCategoriesTab from "./NotificationCategoriesTab";
import NotificationPoliciesTab from "./NotificationPoliciesTab";
import "./NotificationSettings.css";

const NotificationSettings = () => {
  const [loading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      id: "categories",
      title: "Categories",
      icon: "fa-light fa-tags",
      component: NotificationCategoriesTab
    },
    {
      id: "policies",
      title: "Policies",
      icon: "fa-light fa-shield-check",
      component: NotificationPoliciesTab
    }
  ];

  const handleTabChange = useCallback((e) => {
    setSelectedTab(e.component.option("selectedIndex") ?? 0);
  }, []);

  return (
    <div className="notification-settings">
      <div className="notification-settings-header">
        <div className="header-content">
          <h1 className="settings-title">
            <i className="fa-light fa-bell tw-mr-3"></i>
            Notification Settings
          </h1>
          <p className="settings-subtitle">
            Manage notification categories, policies, and system-wide notification configuration
          </p>
        </div>
      </div>

      <div className="settings-content">
        <TabPanel
          selectedIndex={selectedTab}
          onSelectionChanged={handleTabChange}
          showNavButtons={false}
          dataSource={tabs}
          itemTitleRender={(tab) => (
            <span className="tab-title">
              <i className={`${tab.icon} tw-mr-2`}></i>
              {tab.title}
            </span>
          )}
          itemRender={(tab) => (
            <div className="tab-content">
              <tab.component />
            </div>
          )}
        />
      </div>

      <LoadPanel visible={loading} message="Loading notification settings..." />
    </div>
  );
};

export default NotificationSettings;
