import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Tabs from 'devextreme-react/tabs';
import FuelAuditDashboard from './FuelAuditDashboard';
import AuditList from './components/AuditList';
import AuditDetail from './components/AuditDetail';
import CreateAuditWizard from './components/CreateAuditWizard';
import GPSFleetMonitor from './components/GPSFleetMonitor';
import './FuelAuditMain.scss';

/**
 * Fuel Audit Main Component
 * Main entry point for the Fuel Audit module under Tank Stock
 *
 * The Create Wizard is rendered as a full page (no tabs/header)
 * Other views are rendered with tabs navigation
 */
const FuelAuditMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Check if we're on the create wizard page
  const isCreateWizard = location.pathname.includes('/fuel-audit/create');

  // Tab configuration (excluding Create - it's a full page now)
  const tabData = useMemo(() => [
    { text: "Dashboard", icon: "fa-light fa-chart-pie", path: "" },
    { text: "Audit List", icon: "fa-light fa-list-check", path: "/list" },
    { text: "GPS Fleet Monitor", icon: "fa-light fa-satellite", path: "/gps-monitor" }
  ], []);

  // Determine active tab from path
  React.useEffect(() => {
    if (isCreateWizard) return; // Don't update tabs when on wizard

    const currentPath = location.pathname.replace('/tankstock/fuel-audit', '');
    const index = tabData.findIndex(tab => {
      if (tab.path === "" && (currentPath === "" || currentPath === "/")) return true;
      return currentPath.startsWith(tab.path) && tab.path !== "";
    });
    if (index >= 0 && index !== activeTabIndex) {
      setActiveTabIndex(index);
    }
  }, [location.pathname, tabData, activeTabIndex, isCreateWizard]);

  const handleTabChange = useCallback((e) => {
    const newIndex = e.itemIndex;
    setActiveTabIndex(newIndex);
    const basePath = '/tankstock/fuel-audit';
    navigate(`${basePath}${tabData[newIndex].path}`);
  }, [navigate, tabData]);

  const renderTabItem = useCallback((item) => (
    <div className="tw-flex tw-items-center tw-gap-2 tw-px-2">
      <i className={item.icon}></i>
      <span>{item.text}</span>
    </div>
  ), []);

  // Render Create Wizard as full page (no header/tabs)
  if (isCreateWizard) {
    return (
      <div className="fuel-audit-wizard-page tw-h-full tw-bg-gray-100">
        <Routes>
          <Route path="/create" element={<CreateAuditWizard />} />
        </Routes>
      </div>
    );
  }

  // Render normal layout with tabs
  return (
    <div className="fuel-audit-main tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-file-invoice tw-text-blue-600"></i>
              Fuel Audit System
            </h1>
            <p className="tw-text-gray-500 tw-text-sm tw-mt-1">
              Comprehensive fuel reconciliation with GPS integration
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <button
              onClick={() => navigate('/tankstock/fuel-audit/create')}
              className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-flex tw-items-center tw-gap-2 hover:tw-bg-blue-700 tw-transition-colors"
            >
              <i className="fa-light fa-plus"></i>
              New Audit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          dataSource={tabData}
          selectedIndex={activeTabIndex}
          onItemClick={handleTabChange}
          itemRender={renderTabItem}
          scrollByContent={true}
          showNavButtons={true}
          className="fuel-audit-tabs"
        />
      </div>

      {/* Content */}
      <div className="tw-flex-1 tw-overflow-auto">
        <Routes>
          <Route index element={<FuelAuditDashboard />} />
          <Route path="/list" element={<AuditList />} />
          <Route path="/detail/:auditId" element={<AuditDetail />} />
          <Route path="/gps-monitor" element={<GPSFleetMonitor />} />
          <Route path="*" element={<Navigate to="/tankstock/fuel-audit" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default FuelAuditMain;
