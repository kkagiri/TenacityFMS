/**
 * File: IssueSettingsPage.js
 * Purpose: Main settings workspace for Issue Tracker configuration tabs
 * Dependencies: React, Redux, DevExtreme, issue tracker settings components
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - IssueSettingsPage: Hosts category/priority/status/template and system settings tabs
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataGrid, Column, Editing, RequiredRule } from 'devextreme-react/data-grid';
import Tabs from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import {
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import issueTrackerService from '../../../services/issueTrackerService';
import DeviceTypesSettingsPage from './DeviceTypesSettingsPage';
import IssueTemplatesSettingsPage from './IssueTemplatesSettingsPage';
import AlertConfigurationPage from '../../admin/alertConfiguration/AlertConfigurationPage';
import IssueMonitoringSystemConfigTab from './IssueMonitoringSystemConfigTab';

const SETTINGS_BASE_PATH = '/issue-tracker/settings';

const TAB_CONFIG = [
  { key: 'categories', text: 'Tags', icon: 'fa-light fa-tags', path: 'categories' },
  { key: 'priorities', text: 'Priorities', icon: 'fa-light fa-exclamation-triangle', path: 'priorities' },
  { key: 'statuses', text: 'Statuses', icon: 'fa-light fa-list-check', path: 'statuses' },
  { key: 'device-types', text: 'Device Types', icon: 'fa-light fa-microchip', path: 'device-types' },
  { key: 'templates', text: 'Templates', icon: 'fa-light fa-file-lines', path: 'templates' },
  { key: 'alert-config', text: 'Alert Config', icon: 'fa-light fa-bell-exclamation', path: 'alert-config' },
  { key: 'system-config', text: 'System Config', icon: 'fa-light fa-sliders', path: 'system-config' },
];

const IssueSettingsPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const issueTrackerState = useSelector(state => state.issueTracker);

  // Create immutable copies to prevent mutations
  const { categories, priorities, statuses, loading } = React.useMemo(() => ({
    categories: issueTrackerState.categories ? [...issueTrackerState.categories] : [],
    priorities: issueTrackerState.priorities ? [...issueTrackerState.priorities] : [],
    statuses: issueTrackerState.statuses ? [...issueTrackerState.statuses] : [],
    loading: { ...issueTrackerState.loading }
  }), [issueTrackerState]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab data with counts
  const tabData = useMemo(() => TAB_CONFIG.map((tab) => {
    let count = null;
    if (tab.key === 'categories') count = categories?.length || 0;
    if (tab.key === 'priorities') count = priorities?.length || 0;
    if (tab.key === 'statuses') count = statuses?.length || 0;
    return { ...tab, count };
  }), [categories?.length, priorities?.length, statuses?.length]);

  // Derive active tab from URL
  const activeTabIndex = useMemo(() => {
    const matchIndex = tabData.findIndex(
      (tab) => location.pathname === `${SETTINGS_BASE_PATH}/${tab.path}`
    );
    return matchIndex >= 0 ? matchIndex : 0;
  }, [location.pathname, tabData]);

  const activeTab = tabData[activeTabIndex];

  // Redirect to first tab if base path or invalid path
  useEffect(() => {
    const isBasePath =
      location.pathname === SETTINGS_BASE_PATH ||
      location.pathname === `${SETTINGS_BASE_PATH}/`;

    const isValidTabPath = tabData.some(
      (tab) => location.pathname === `${SETTINGS_BASE_PATH}/${tab.path}`
    );

    if (isBasePath || !isValidTabPath) {
      navigate(`${SETTINGS_BASE_PATH}/${tabData[0].path}`, { replace: true });
    }
  }, [location.pathname, navigate, tabData]);

  // Custom tab item renderer
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
        {item.count !== null && (
          <span className="tw-bg-blue-100 tw-text-blue-800 tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full">
            {item.count}
          </span>
        )}
      </div>
    );
  };

  // Handle tab change via URL navigation
  const handleTabSelectionChange = (e) => {
    const newIndex = e.itemIndex;
    const selectedTab = tabData[newIndex];
    if (selectedTab) {
      navigate(`${SETTINGS_BASE_PATH}/${selectedTab.path}`);
    }
  };

  const loadData = useCallback(async () => {
    try {
      // Load data sequentially to avoid Redux state mutation conflicts
      // Add small delays between dispatches to ensure state updates complete
      await dispatch(fetchIssueCategories());
      await new Promise(resolve => setTimeout(resolve, 50));

      await dispatch(fetchIssuePriorities());
      await new Promise(resolve => setTimeout(resolve, 50));

      await dispatch(fetchIssueStatuses());
    } catch (error) {
      console.error('Error loading data:', error);
      notify({
        message: 'Failed to load configuration data',
        type: 'error',
        displayTime: 4000
      });
    }
  }, [dispatch]);

  // Load data on component mount and when refresh is triggered
  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      loadData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [loadData, refreshTrigger]);

  // Categories DataGrid handlers - Fixed to prevent state mutation
  const handleCategoryRowInserting = async (e) => {
    try {
      // Remove ID field before sending to backend (auto-generated)
      const { id, ...categoryData } = e.data;
      await issueTrackerService.createIssueCategory(categoryData);

      notify({
        message: 'Category created successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating category:', error);
      notify({
        message: 'Failed to create category',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handleCategoryRowUpdating = async (e) => {
    try {
      const updatedData = { ...e.oldData, ...e.newData };
      await issueTrackerService.updateIssueCategory(e.oldData.id, updatedData);
      notify({
        message: 'Category updated successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating category:', error);
      notify({
        message: 'Failed to update category',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handleCategoryRowRemoving = async (e) => {
    try {
      await issueTrackerService.deleteIssueCategory(e.data.id);
      notify({
        message: 'Category deleted successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting category:', error);
      notify({
        message: 'Failed to delete category',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  // Priorities DataGrid handlers - Fixed to prevent state mutation
  const handlePriorityRowInserting = async (e) => {
    try {
      // Remove ID field before sending to backend (auto-generated)
      const { id, ...priorityData } = e.data;
      await issueTrackerService.createIssuePriority(priorityData);

      notify({
        message: 'Priority created successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating priority:', error);
      notify({
        message: 'Failed to create priority',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handlePriorityRowUpdating = async (e) => {
    try {
      const updatedData = { ...e.oldData, ...e.newData };
      await issueTrackerService.updateIssuePriority(e.oldData.id, updatedData);
      notify({
        message: 'Priority updated successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating priority:', error);
      notify({
        message: 'Failed to update priority',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handlePriorityRowRemoving = async (e) => {
    try {
      await issueTrackerService.deleteIssuePriority(e.data.id);
      notify({
        message: 'Priority deleted successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting priority:', error);
      notify({
        message: 'Failed to delete priority',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  // Statuses DataGrid handlers - Fixed to prevent state mutation
  const handleStatusRowInserting = async (e) => {
    try {
      // Remove ID field before sending to backend (auto-generated)
      const { id, ...statusData } = e.data;
      await issueTrackerService.createIssueStatus(statusData);

      notify({
        message: 'Status created successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating status:', error);
      notify({
        message: 'Failed to create status',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handleStatusRowUpdating = async (e) => {
    try {
      const updatedData = { ...e.oldData, ...e.newData };
      await issueTrackerService.updateIssueStatus(e.oldData.id, updatedData);
      notify({
        message: 'Status updated successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating status:', error);
      notify({
        message: 'Failed to update status',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  const handleStatusRowRemoving = async (e) => {
    try {
      await issueTrackerService.deleteIssueStatus(e.data.id);
      notify({
        message: 'Status deleted successfully',
        type: 'success',
        displayTime: 3000
      });

      // Cancel DataGrid's internal state update and refresh from Redux instead
      e.cancel = true;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting status:', error);
      notify({
        message: 'Failed to delete status',
        type: 'error',
        displayTime: 4000
      });
      e.cancel = true;
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab?.key) {
      case 'categories':
        return (
          <DataGrid
            dataSource={categories}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            wordWrapEnabled={true}
            onRowInserting={handleCategoryRowInserting}
            onRowUpdating={handleCategoryRowUpdating}
            onRowRemoving={handleCategoryRowRemoving}
            hoverStateEnabled={true}
            remoteOperations={false}
            repaintChangesOnly={true}
            cacheEnabled={false}
            stateStoring={{
              enabled: false
            }}
          >
            <Editing
              mode="row"
              allowAdding={true}
              allowUpdating={true}
              allowDeleting={true}
              useIcons={true}
              confirmDelete={true}
              texts={{
                confirmDeleteMessage: 'Are you sure you want to delete this tag?',
                addRow: 'Add Tag',
                editRow: 'Edit Tag',
                saveRowChanges: 'Save',
                cancelRowChanges: 'Cancel',
                deleteRow: 'Delete'
              }}
            />
            <Column dataField="id" caption="ID" width={80} allowEditing={false} />
            <Column dataField="name" caption="Tag Name">
              <RequiredRule message="Tag name is required" />
            </Column>
            <Column dataField="description" caption="Description" />
          </DataGrid>
        );

      case 'priorities':
        return (
          <DataGrid
            dataSource={priorities}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            wordWrapEnabled={true}
            onRowInserting={handlePriorityRowInserting}
            onRowUpdating={handlePriorityRowUpdating}
            onRowRemoving={handlePriorityRowRemoving}
            hoverStateEnabled={true}
            remoteOperations={false}
            repaintChangesOnly={true}
            cacheEnabled={false}
            stateStoring={{
              enabled: false
            }}
          >
            <Editing
              mode="row"
              allowAdding={true}
              allowUpdating={true}
              allowDeleting={true}
              useIcons={true}
              confirmDelete={true}
              texts={{
                confirmDeleteMessage: 'Are you sure you want to delete this priority?',
                addRow: 'Add Priority',
                editRow: 'Edit Priority',
                saveRowChanges: 'Save',
                cancelRowChanges: 'Cancel',
                deleteRow: 'Delete'
              }}
            />
            <Column dataField="id" caption="ID" width={80} allowEditing={false} />
            <Column dataField="name" caption="Priority Name">
              <RequiredRule message="Priority name is required" />
            </Column>
          </DataGrid>
        );

      case 'statuses':
        return (
          <DataGrid
            dataSource={statuses}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            wordWrapEnabled={true}
            onRowInserting={handleStatusRowInserting}
            onRowUpdating={handleStatusRowUpdating}
            onRowRemoving={handleStatusRowRemoving}
            hoverStateEnabled={true}
            remoteOperations={false}
            repaintChangesOnly={true}
            cacheEnabled={false}
            stateStoring={{
              enabled: false
            }}
          >
            <Editing
              mode="row"
              allowAdding={true}
              allowUpdating={true}
              allowDeleting={true}
              useIcons={true}
              confirmDelete={true}
              texts={{
                confirmDeleteMessage: 'Are you sure you want to delete this status?',
                addRow: 'Add Status',
                editRow: 'Edit Status',
                saveRowChanges: 'Save',
                cancelRowChanges: 'Cancel',
                deleteRow: 'Delete'
              }}
            />
            <Column dataField="id" caption="ID" width={80} allowEditing={false} />
            <Column dataField="status" caption="Status Name">
              <RequiredRule message="Status name is required" />
            </Column>
          </DataGrid>
        );

      case 'device-types':
        // Device Types (V2)
        return <DeviceTypesSettingsPage />;

      case 'templates':
        // Issue Templates (V2)
        return <IssueTemplatesSettingsPage />;

      case 'alert-config':
        // Alert Configuration
        return <AlertConfigurationPage />;

      case 'system-config':
        // Issue Monitoring System Configuration
        return <IssueMonitoringSystemConfigTab />;

      default:
        return null;
    }
  };

  if (loading.categories || loading.priorities || loading.statuses) {
    return (
      <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
        <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-justify-center tw-items-center tw-z-40">
          <div className="tw-text-center tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            <div className="tw-mt-4 tw-text-gray-600 tw-font-medium">
              Loading configuration data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-relative tw-bg-gray-50 tw-min-h-screen">
      <ScrollView className="issue-settings">
        <div className="tw-p-6">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-hidden">
            {/* Header */}
            <div className="tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-700 tw-text-white tw-p-6">
              <div className="tw-flex tw-justify-between tw-items-center">
                <div>
                  <h2 className="tw-text-2xl tw-font-semibold">Issue Tracker Configuration</h2>
                  <p className="tw-text-blue-100 tw-mt-1">
                    Manage categories, priorities, statuses, device types, templates, alert rules, and issue monitoring system settings
                  </p>
                </div>
                <Button
                  text="Refresh Data"
                  type="normal"
                  stylingMode="outlined"
                  icon="fa fa-refresh"
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className="tw-border-white tw-text-white hover:tw-bg-white hover:tw-text-blue-600"
                />
              </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs
              dataSource={tabData}
              selectedIndex={activeTabIndex}
              onItemClick={handleTabSelectionChange}
              width="100%"
              className="tw-mb-4"
              itemRender={renderTabItem}
            />

            {/* Tab Content */}
            <div className="tw-p-6">
              <div className="tw-mb-4">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  Manage Issue {activeTab?.text}
                </h3>
                <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                  {activeTab?.key === 'system-config'
                    ? 'Update runtime monitoring keys that control automatic issue generation behavior.'
                    : 'Use the DataGrid controls to add, edit, or delete configuration entries. Click the "Add" button in the toolbar to create new entries.'}
                </p>
              </div>
              {renderContent()}
            </div>
          </div>
        </div>
      </ScrollView>
    </div>
  );
};

export default IssueSettingsPage;
