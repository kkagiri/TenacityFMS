/**
 * File: VolumeCorrectionMain.js
 * Purpose: Render the tank volume correction workspace with M365-style navigation and workflow panels.
 * Dependencies: React, Redux Toolkit hooks, usePermissions, volume correction tab components
 * Last Modified: 2026-03-06
 *
 * Key Functions/Components:
 * - VolumeCorrectionMain: Hosts workflow tabs, sidebar guidance, and clear-all action.
 * - handleTabSelectionChange(): Switches active workflow tab and lazy-loads content.
 * - renderContent(): Resolves the active workflow panel.
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveTab,
  selectActiveTab,
  clearAllResults
} from '../../../redux/slices/tankVolumeCorrectionSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import SequenceDetection from './tabs/SequenceDetection';
import CorrectionPlanning from './tabs/CorrectionPlanning';
import CorrectionExecution from './tabs/CorrectionExecution';
import CorrectionHistory from './tabs/CorrectionHistory';
import DataQualityCheck from './tabs/DataQualityCheck';
import './volumeCorrection.scss';

/**
 * Tank Volume Data Correction Main Component
 *
 * Implements DETECT-ANALYZE-CORRECT-VERIFY workflow
 * for identifying and resolving corrupted tank volume data
 *
 * PHASES:
 * 1. DETECT: Identify sequence breaks and corrupted data
 * 2. ANALYZE: Generate correction plans
 * 3. CORRECT: Execute corrections using 4 strategies
 * 4. QUALITY CHECK: Validate data for quality issues
 * 5. VERIFY: View correction history and audit trail
 */
const VolumeCorrectionMain = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);
  const { hasPermission } = usePermissions();
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));

  // Check permissions - requires admin role
  const canRead = hasPermission('_Read_TankStock');
  const canUpdate = hasPermission('_Update_TankStock');

  // Permission gate
  if (!canRead) {
    return (
      <div className="tvcc-container">
        <div className="tvcc-permission-denied">
          <div className="tvcc-permission-icon">
            <i className="fa-light fa-lock"></i>
          </div>
          <h2>Access Restricted</h2>
          <p>
            You don't have permission to access the Tank Volume Data Correction system.
          </p>
          <p className="tvcc-permission-hint">
            Please contact your system administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // Tab configuration
  const tabData = [
    {
      text: "Detect Corruption",
      icon: "fa-light fa-magnifying-glass",
      description: "Find sequence breaks and validate volumes"
    },
    {
      text: "Plan Correction",
      icon: "fa-light fa-clipboard-list",
      description: "Analyze breaks and generate correction strategy"
    },
    {
      text: "Execute Fix",
      icon: "fa-light fa-wand-magic-sparkles",
      description: "Apply corrections using 4 different strategies"
    },
    {
      text: "Data Quality",
      icon: "fa-light fa-magnifying-glass-chart",
      description: "Check for negative volumes and data quality issues"
    },
    {
      text: "Audit Trail",
      icon: "fa-light fa-clock-rotate-left",
      description: "View correction history and tracking"
    }
  ];

  // Handle tab change and lazy loading
  const handleTabSelectionChange = (newIndex) => {
    dispatch(setActiveTab(newIndex));
    setLoadedTabs(prev => new Set([...prev, newIndex]));
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return loadedTabs.has(0) && <SequenceDetection />;
      case 1:
        return loadedTabs.has(1) && <CorrectionPlanning />;
      case 2:
        return loadedTabs.has(2) && <CorrectionExecution />;
      case 3:
        return loadedTabs.has(3) && <DataQualityCheck />;
      case 4:
        return loadedTabs.has(4) && <CorrectionHistory />;
      default:
        return null;
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all results and selections? This cannot be undone.')) {
      dispatch(clearAllResults());
    }
  };

  return (
    <div className="tvcc-container">
      <div className="tvcc-header">
        <div className="tvcc-header-content">
          <div className="tvcc-header-text">
            <h1>Tank Volume Data Correction</h1>
            <p>
              Detect, analyze, and correct corrupted tank volume history data
            </p>
          </div>
          {canRead && (
            <button
              className="tvcc-clear-button"
              onClick={handleClearAll}
              title="Clear all results"
            >
              <i className="fa-light fa-broom"></i>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="tvcc-content">
        <div className="tvcc-tabs-wrapper">
          <div className="tvcc-tab-nav" role="tablist" aria-label="Tank volume correction workflow tabs">
            {tabData.map((tab, index) => {
              const isActive = activeTab === index;

              return (
                <button
                  key={tab.text}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`tvcc-tab-button ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabSelectionChange(index)}
                >
                  <i className={tab.icon}></i>
                  <span className="tvcc-tab-button-texts">
                    <span className="tvcc-tab-caption">{tab.text}</span>
                    <span className="tvcc-tab-description">{tab.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="tvcc-tab-content">
            {renderContent()}
          </div>
        </div>

        {/* Info Panel */}
        <div className="tvcc-info-sidebar">
          <div className="tvcc-info-card">
            <h4>
              <i className="fa-light fa-circle-info"></i>
              Workflow Guide
            </h4>
            <ol className="tvcc-workflow-steps">
              <li>
                <span className="tvcc-step-number">1</span>
                <div>
                  <strong>Detect</strong>
                  <p>Scan for sequence breaks and corrupted volumes</p>
                </div>
              </li>
              <li>
                <span className="tvcc-step-number">2</span>
                <div>
                  <strong>Plan</strong>
                  <p>Generate correction strategy based on breaks found</p>
                </div>
              </li>
              <li>
                <span className="tvcc-step-number">3</span>
                <div>
                  <strong>Execute</strong>
                  <p>Apply fixes using optimal correction strategy</p>
                </div>
              </li>
              <li>
                <span className="tvcc-step-number">4</span>
                <div>
                  <strong>Quality</strong>
                  <p>Validate data quality for negative volumes and anomalies</p>
                </div>
              </li>
              <li>
                <span className="tvcc-step-number">5</span>
                <div>
                  <strong>Verify</strong>
                  <p>Review audit trail and confirm corrections</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="tvcc-info-card">
            <h4>
              <i className="fa-light fa-circle-question"></i>
              Correction Strategies
            </h4>
            <div className="tvcc-strategies-list">
              <div className="tvcc-strategy-item">
                <strong className="tvcc-strategy-label tvcc-strategy-primary">
                  RECALCULATE
                </strong>
                <p>Bulk rebuild from opening stock</p>
              </div>
              <div className="tvcc-strategy-item">
                <strong className="tvcc-strategy-label tvcc-strategy-secondary">
                  MANUAL
                </strong>
                <p>Override with verified value</p>
              </div>
              <div className="tvcc-strategy-item">
                <strong className="tvcc-strategy-label tvcc-strategy-tertiary">
                  SINGLE
                </strong>
                <p>Fix isolated broken transaction</p>
              </div>
              <div className="tvcc-strategy-item">
                <strong className="tvcc-strategy-label tvcc-strategy-quaternary">
                  FROM POINT
                </strong>
                <p>Fix multi-date corruption</p>
              </div>
            </div>
          </div>

          {!canUpdate && (
            <div className="tvcc-readonly-warning">
              <i className="fa-light fa-triangle-exclamation"></i>
              <span>Read-only mode - corrections disabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolumeCorrectionMain;
