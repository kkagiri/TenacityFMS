import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Provider Management Layout
 * Common layout wrapper for all provider management pages
 */
const ProviderManagementLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/admin/providers/dashboard",
      icon: "fa-light fa-gauge-high",
    },
    {
      id: "configuration",
      title: "Configuration",
      path: "/admin/providers/configuration",
      icon: "fa-light fa-gear",
    },
    {
      id: "assignments",
      title: "Vehicle Assignments",
      path: "/admin/providers/assignments",
      icon: "fa-light fa-truck",
    },
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  const isActiveTab = (path) => {
    return (
      location.pathname === path ||
      (location.pathname === "/admin/providers" && path.includes("dashboard"))
    );
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">
              <i className="fa-light fa-network-wired tw-mr-3 tw-text-blue-600"></i>
              Provider Management
            </h1>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage GPS tracking providers, configurations, and health
              monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200">
        <div className="tw-px-6">
          <nav className="tw-flex tw-space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={`
                  tw-py-4 tw-px-1 tw-border-b-2 tw-font-medium tw-text-sm tw-transition-colors
                  ${
                    isActiveTab(tab.path)
                      ? "tw-border-blue-500 tw-text-blue-600"
                      : "tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700 hover:tw-border-gray-300"
                  }
                `}
              >
                <i className={`${tab.icon} tw-mr-2`}></i>
                {tab.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="tw-flex-1 tw-overflow-auto tw-bg-gray-50">{children}</div>
    </div>
  );
};

export default ProviderManagementLayout;
