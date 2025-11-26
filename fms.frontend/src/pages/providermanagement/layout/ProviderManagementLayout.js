import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Tabs from "devextreme-react/tabs";

/**
 * Provider Management Layout
 * Common layout wrapper for all provider management pages
 */
const ProviderManagementLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = useMemo(
    () => [
      { id: "dashboard", text: "Dashboard", path: "/admin/providers/dashboard" },
      { id: "configuration", text: "Configuration", path: "/admin/providers/configuration" },
      { id: "assignments", text: "Vehicle Assignments", path: "/admin/providers/assignments" },
      { id: "map-devices", text: "Map GPS Devices", path: "/admin/providers/map-devices" },
    ],
    []
  );

  const handleTabClick = (path) => {
    navigate(path);
  };

  const selectedIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => location.pathname.startsWith(t.path));
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
              Provider Management
            </h1>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Manage GPS tracking providers, configurations, and health
              monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation using DevExtreme Tabs (StockManagement-style) */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200">
        <div className="tw-px-6">
          <Tabs
            dataSource={tabs}
            selectedIndex={selectedIndex}
            onItemClick={(e) => handleTabClick(e.itemData.path)}
            width="100%"
            itemRender={(item) => <span>{item.text}</span>}
            className="tw-pt-2"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="tw-flex-1 tw-overflow-auto tw-bg-gray-50">{children}</div>
    </div>
  );
};

export default ProviderManagementLayout;
