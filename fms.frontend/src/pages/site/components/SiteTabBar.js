/**
 * File:          SiteTabBar.js
 * Purpose:       All / Active / Inactive tab strip with counts — M365 underline indicator
 * Dependencies:  SitePage.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - activeTab  (string):  "all" | "active" | "inactive"
 * - onTabChange (func):   Callback with new tab value
 * - counts     (object):  { all, active, inactive }
 */
import React from "react";

const TABS = [
  { key: "all", label: "All Sites" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const SiteTabBar = ({ activeTab, onTabChange, counts = {} }) => (
  <div className="m365-site-tabs">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        className={`m365-tab${activeTab === tab.key ? " m365-tab--active" : ""}`}
        onClick={() => onTabChange(tab.key)}
      >
        {tab.label}
        {counts[tab.key] != null && (
          <span className="m365-tab-count">{counts[tab.key]}</span>
        )}
      </button>
    ))}
  </div>
);

export default SiteTabBar;
