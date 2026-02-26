import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Tabs from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import FuelAuditDashboard from './FuelAuditDashboard';
import AuditList from './components/AuditList';
import AuditDetail from './components/AuditDetail';
import CreateAuditWizard from './components/CreateAuditWizard';
import GPSFleetMonitor from './components/GPSFleetMonitor';
import { usePermissions } from '../../../hooks/usePermissions';
import './FuelAuditMain.scss';

/**
 * Fuel Audit Main Component
 * Main entry point for the Fuel Audit module under Tank Stock
 *
 * The Create/Edit Wizard is rendered as a full page (no tabs/header)
 * Other views are rendered with tabs navigation
 *
 * Routes:
 * - /tankstock/fuel-audit/create - New audit wizard
 * - /tankstock/fuel-audit/edit/:reportId - Edit existing audit wizard
 * - /tankstock/fuel-audit/edit/:reportId/step/:stepNumber - Edit at specific step
 */
const FuelAuditMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { hasPermission } = usePermissions();

  // Check if user has fuel audit permission
  const isAdmin = hasPermission('_Create_FuelAudit');


  // Delay mounting of DevExtreme components to prevent DOM conflicts
  const [isReady, setIsReady] = useState(false);

  // Check if we're on the create or edit wizard page - do this BEFORE useEffect
  const isCreateWizard = location.pathname.includes('/fuel-audit/create');
  const isEditWizard = location.pathname.includes('/fuel-audit/edit');
  const isWizardMode = isCreateWizard || isEditWizard;

  useEffect(() => {
    // Skip delay for wizard page since it doesn't use DevExtreme tabs
    if (isWizardMode) {
      setIsReady(true);
      return;
    }
    // Small delay to ensure React has fully mounted before DevExtreme components render
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [isWizardMode]);

  // Tab configuration (excluding Create - it's a full page now)
  const tabData = useMemo(() => [
    { id: 0, text: "Dashboard", icon: "fa-light fa-chart-pie", path: "" },
    { id: 1, text: "Audit List", icon: "fa-light fa-list-check", path: "/list" },
    { id: 2, text: "GPS Fleet Monitor", icon: "fa-light fa-satellite", path: "/gps-monitor" }
  ], []);

  // Determine active tab from path
  useEffect(() => {
    if (isWizardMode || !isReady) return; // Don't update tabs when on wizard or not ready

    const currentPath = location.pathname.replace('/tankstock/fuel-audit', '');
    const index = tabData.findIndex(tab => {
      if (tab.path === "" && (currentPath === "" || currentPath === "/")) return true;
      return currentPath.startsWith(tab.path) && tab.path !== "";
    });
    if (index >= 0 && index !== activeTabIndex) {
      setActiveTabIndex(index);
    }
  }, [location.pathname, tabData, activeTabIndex, isWizardMode, isReady]);

  const handleTabChange = useCallback((e) => {
    const newIndex = e.itemIndex;
    setActiveTabIndex(newIndex);
    const basePath = '/tankstock/fuel-audit';
    navigate(`${basePath}${tabData[newIndex].path}`);
  }, [navigate, tabData]);

  // Render Create/Edit Wizard as full page (no header/tabs)
  if (isWizardMode) {
    return (
      <div className="fuel-audit-wizard-page tw-h-full tw-bg-gray-100">
        <Routes>
          <Route path="/create" element={<CreateAuditWizard />} />
          <Route path="/edit/:reportId" element={<CreateAuditWizard />} />
          <Route path="/edit/:reportId/step/:stepNumber" element={<CreateAuditWizard />} />
        </Routes>
      </div>
    );
  }

  // Show loading state until component is ready (prevents DevExtreme DOM conflicts)
  // Use plain div spinner instead of <i> to avoid font-awesome conflicts
  if (!isReady) {
    return (
      <div className="fuel-audit-main tw-h-full tw-flex tw-items-center tw-justify-center">
        <div className="tw-text-center">
          <div className="tw-w-8 tw-h-8 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-3"></div>
          <p className="tw-text-gray-500">Loading...</p>
        </div>
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
              <span className="tw-text-blue-600">📋</span>
              Fuel Audit System
            </h1>
            <p className="tw-text-gray-500 tw-text-sm tw-mt-1">
              Comprehensive fuel reconciliation with GPS integration
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            {isAdmin && (
              <Button
                text="New Audit"
                type="default"
                stylingMode="outlined"

                icon="fa-light fa-plus"
                onClick={() => navigate('/tankstock/fuel-audit/create')}
              />
            )}
          </div>
        </div>

        {/* Tabs - Use text-only tabs to avoid icon rendering issues */}
        <Tabs
          dataSource={tabData}
          selectedIndex={activeTabIndex}
          onItemClick={handleTabChange}
          keyExpr="id"
          displayExpr="text"
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
