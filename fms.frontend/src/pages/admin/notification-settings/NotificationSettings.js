import React, { useState, useCallback } from "react";
import { TabPanel, Tabs, LoadPanel } from "devextreme-react";
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
    setSelectedTab(e.selectedIndex);
  }, []);

  return (
    <div className="notification-settings-container">
      <div className="settings-header">
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
        <Tabs
          selectedIndex={selectedTab}
          onSelectionChanged={handleTabChange}
          className="settings-tabs"
          showNavButtons={false}
        >
          {tabs.map((tab, index) => (
            <TabPanel
              key={tab.id}
              title={
                <span className="tab-title">
                  <i className={`${tab.icon} tw-mr-2`}></i>
                  {tab.title}
                </span>
              }
            >
              <div className="tab-content">
                <tab.component />
              </div>
            </TabPanel>
          ))}
        </Tabs>
      </div>

      <LoadPanel visible={loading} message="Loading notification settings..." />
    </div>
  );
};

export default NotificationSettings;
