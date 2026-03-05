import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import FuelAuditDashboard from './FuelAuditDashboard';
import AuditList from './components/AuditList';
import AuditDetail from './components/AuditDetail';
import CreateAuditWizard from './components/CreateAuditWizard';
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
  const isDetailPage = location.pathname.includes('/fuel-audit/detail');
  const isWizardMode = isCreateWizard || isEditWizard;

  useEffect(() => {
    // Skip delay for wizard page since it doesn't use DevExtreme tabs
    if (isWizardMode || isDetailPage) {
      setIsReady(true);
      return;
    }
    // Small delay to ensure React has fully mounted before DevExtreme components render
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [isWizardMode, isDetailPage]);

  // Tab configuration (excluding Create - it's a full page now)
  const tabData = useMemo(() => [
    { id: 0, text: "Dashboard", icon: "fa-light fa-chart-pie", path: "" },
    { id: 1, text: "Audit List", icon: "fa-light fa-list-check", path: "/list" },
  ], []);

  // Determine active tab from path
  useEffect(() => {
    if (isWizardMode || isDetailPage || !isReady) return; // Don't update tabs when on wizard/detail or not ready

    const currentPath = location.pathname.replace('/tankstock/fuel-audit', '');
    const index = tabData.findIndex(tab => {
      if (tab.path === "" && (currentPath === "" || currentPath === "/")) return true;
      return currentPath.startsWith(tab.path) && tab.path !== "";
    });
    if (index >= 0 && index !== activeTabIndex) {
      setActiveTabIndex(index);
    }
  }, [location.pathname, tabData, activeTabIndex, isWizardMode, isReady]);

  const handleTabChange = useCallback((index) => {
    setActiveTabIndex(index);
    const basePath = '/tankstock/fuel-audit';
    navigate(`${basePath}${tabData[index].path}`);
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

  // Render Audit Detail as standalone page (no shell/tabs wrapper)
  if (isDetailPage) {
    return (
      <div className="fuel-audit-main tw-h-full tw-flex tw-flex-col" style={{ background: 'var(--fms-page-bg, #f9fafb)' }}>
        <Routes>
          <Route path="/detail/:auditId" element={<AuditDetail />} />
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
    <div className="fuel-audit-main tw-h-full tw-flex tw-flex-col" style={{ background: 'var(--fms-page-bg, #f9fafb)' }}>
      <div className="tw-p-4 tw-pb-0">
        <div className="tw-rounded-lg tw-shadow-sm tw-overflow-hidden fuel-audit-shell" style={{ background: 'var(--fms-surface, #ffffff)' }}>

          {/* M365 Tab bar */}
          <div className="m365-tabs fuel-audit-tabs tw-flex tw-items-center tw-justify-between tw-pr-4">
            <div className="tw-flex">
              {tabData.map((tab, index) => (
                <button
                  key={tab.id}
                  className={`m365-tab${activeTabIndex === index ? ' m365-tab--active' : ''}`}
                  onClick={() => handleTabChange(index)}
                  type="button"
                >
                  <i className={tab.icon}></i>
                  <span>{tab.text}</span>
                </button>
              ))}
            </div>
            {isAdmin && (
              <Button
                text="+ New Audit"
                type="default"
                stylingMode="outlined"
                onClick={() => navigate('/tankstock/fuel-audit/create')}
              />
            )}
          </div>

          {/* Content */}
          <div className="tw-p-4">
            <Routes>
              <Route index element={<FuelAuditDashboard />} />
              <Route path="/list" element={<AuditList />} />
              <Route path="*" element={<Navigate to="/tankstock/fuel-audit" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelAuditMain;
