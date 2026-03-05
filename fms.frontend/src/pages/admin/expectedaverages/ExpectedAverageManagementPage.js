/**
 * File: ExpectedAverageManagementPage.js
 * Purpose: M365-styled admin page for expected fuel average management with side-panel driven workflows.
 * Dependencies: react, devextreme-react/load-panel, module sub-components
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - ExpectedAverageManagementPage: Root page shell with M365 tabs and tab-specific management views.
 */
import React, { useState } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';

import TemplateManagement from './components/TemplateManagement';
import VehicleAssignmentManagement from './components/VehicleAssignmentManagement';
import ReferenceDataManagement from './components/ReferenceDataManagement';

import './ExpectedAverageManagement.scss';

/**
 * Expected Fuel Average Management Page
 * Admin interface for managing expected fuel average templates and vehicle assignments
 * Refactored to use Redux and split components
 */
const ExpectedAverageManagementPage = () => {
  const [selectedTab, setSelectedTab] = useState('templates');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'templates', text: 'Templates', icon: 'fa-light fa-file-invoice' },
    { id: 'vehicle-assignments', text: 'Vehicle Assignments', icon: 'fa-light fa-truck' },
    { id: 'reference-data', text: 'Reference Data', icon: 'fa-light fa-database' }
  ];

  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
  };

  return (
    <div className="expected-average-management tw-p-4 tw-h-full tw-flex tw-flex-col">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-xl tw-font-bold" style={{ color: 'var(--fms-text-primary, #374151)' }}>
          Expected Fuel Average Management
        </h2>
      </div>

      <div className="tw-rounded-lg tw-shadow-sm tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden expected-average-shell" style={{ background: 'var(--fms-surface, #ffffff)' }}>
        <div className="m365-tabs expected-average-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`m365-tab${selectedTab === tab.id ? ' m365-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              type="button"
            >
              <i className={tab.icon}></i>
              <span>{tab.text}</span>
            </button>
          ))}
        </div>

        <div className="tw-flex-1 tw-p-4 tw-overflow-auto">
          {selectedTab === 'templates' && <TemplateManagement />}
          {selectedTab === 'vehicle-assignments' && <VehicleAssignmentManagement />}
          {selectedTab === 'reference-data' && <ReferenceDataManagement />}
        </div>
      </div>

      <LoadPanel
        shadingColor="rgba(0,0,0,0.4)"
        position={{ of: '#gridContainer' }}
        visible={isLoading}
        showIndicator={true}
        showPane={true}
        shading={true}
        closeOnOutsideClick={false}
      />
    </div>
  );
};

export default ExpectedAverageManagementPage;
