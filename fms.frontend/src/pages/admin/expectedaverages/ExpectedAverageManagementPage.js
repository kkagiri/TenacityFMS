import React, { useState } from 'react';
import Tabs from 'devextreme-react/tabs';
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 0, text: 'Templates', icon: 'fa-light fa-file-invoice' },
    { id: 1, text: 'Vehicle Assignments', icon: 'fa-light fa-truck' },
    { id: 2, text: 'Reference Data', icon: 'fa-light fa-database' }
  ];

  const handleTabChange = (e) => {
    setSelectedTab(e.itemData.id);
  };

  return (
    <div className="expected-average-management tw-p-4 tw-h-full tw-flex tw-flex-col">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">
          Expected Fuel Average Management
        </h2>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden">
        <div className="tw-border-b tw-border-gray-200">
          <Tabs
            dataSource={tabs}
            selectedIndex={selectedTab}
            onItemClick={handleTabChange}
            itemRender={(item) => (
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className={item.icon}></i>
                <span>{item.text}</span>
              </div>
            )}
          />
        </div>

        <div className="tw-flex-1 tw-p-4 tw-overflow-auto">
          {selectedTab === 0 && <TemplateManagement />}
          {selectedTab === 1 && <VehicleAssignmentManagement />}
          {selectedTab === 2 && <ReferenceDataManagement />}
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
