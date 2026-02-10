/**
 * File: IssueTemplatesSettingsPage.js
 * Purpose: Manage issue templates and auto-close configuration for Issue Tracker V2
 * Dependencies: React, Redux, DevExtreme DataGrid, issueTrackerV2Service
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueTemplatesSettingsPage: CRUD screen for issue templates
 * - renderBooleanCell: Read-only boolean renderer using native checkbox
 * - renderBooleanEditCell: Editable boolean renderer using native checkbox
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Editing,
  Paging,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Selection,
  ColumnChooser,
  RequiredRule,
  Lookup,
  Toolbar,
  Item as ToolbarItem,
  MasterDetail
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import {
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import AutoCloseConfigPanel from './AutoCloseConfigPanel';

/**
 * Issue Templates Settings Page
 * Manages issue templates for Issue Tracker V2 template system
 */
const IssueTemplatesSettingsPage = () => {
  const dispatch = useDispatch();
  const issueTrackerState = useSelector(state => state.issueTracker);
  const userState = useSelector(state => state.user);

  const [templates, setTemplates] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const dataGridRef = useRef(null);

  // Get priorities and statuses from Redux
  const priorities = issueTrackerState?.priorities || [];
  const statuses = issueTrackerState?.statuses || [];
  const users = userState?.users || [];

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load templates and device types in parallel
      const [templatesData, deviceTypesData] = await Promise.all([
        issueTrackerV2Service.getTemplates(),
        issueTrackerV2Service.getDeviceTypes()
      ]);

      setTemplates(templatesData || []);
      setDeviceTypes(deviceTypesData || []);

      // Load priorities and statuses from Redux if not already loaded
      if (!priorities.length) {
        dispatch(fetchIssuePriorities());
      }
      if (!statuses.length) {
        dispatch(fetchIssueStatuses());
      }
      // Load users for assignee lookup
      if (!users.length) {
        dispatch(fetchUsers());
      }
    } catch (error) {
      console.error('Error loading data:', error);
      notify({
        message: 'Failed to load templates data',
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch, priorities.length, statuses.length, users.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle row inserting
  const handleRowInserting = async (e) => {
    e.cancel = true;
    try {
      const newTemplate = {
        deviceTypeId: e.data.deviceTypeId,
        name: e.data.name,
        titleTemplate: e.data.titleTemplate || null,
        descriptionTemplate: e.data.descriptionTemplate || null,
        defaultPriorityId: e.data.defaultPriorityId || null,
        defaultStatusId: e.data.defaultStatusId || null,
        isActive: e.data.isActive !== false,
        defaultAssignee: e.data.defaultAssignee || null
      };

      await issueTrackerV2Service.createTemplate(newTemplate);
      await loadData();

      if (dataGridRef.current) {
        dataGridRef.current.instance.cancelEditData();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  // Handle row updating
  const handleRowUpdating = async (e) => {
    e.cancel = true;
    try {
      const updatedData = { ...e.oldData, ...e.newData };
      await issueTrackerV2Service.updateTemplate(e.key, {
        deviceTypeId: updatedData.deviceTypeId,
        name: updatedData.name,
        titleTemplate: updatedData.titleTemplate,
        descriptionTemplate: updatedData.descriptionTemplate,
        defaultPriorityId: updatedData.defaultPriorityId,
        defaultStatusId: updatedData.defaultStatusId,
        isActive: updatedData.isActive,
        defaultAssignee: updatedData.defaultAssignee || null
      });
      await loadData();

      if (dataGridRef.current) {
        dataGridRef.current.instance.cancelEditData();
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  // Handle row removing
  const handleRowRemoving = async (e) => {
    e.cancel = true;
    try {
      await issueTrackerV2Service.deleteTemplate(e.key);
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Custom cell render for boolean fields
  const renderBooleanCell = (cellInfo) => {
    return (
      <div className="tw-flex tw-justify-center">
        <input
          type="checkbox"
          checked={Boolean(cellInfo.value)}
          readOnly={true}
          className="tw-h-4 tw-w-4 tw-cursor-default"
        />
      </div>
    );
  };

  // Custom edit cell for boolean fields
  const renderBooleanEditCell = (cellInfo) => {
    return (
      <div className="tw-flex tw-justify-center">
        <input
          type="checkbox"
          checked={Boolean(cellInfo.value)}
          onChange={(event) => cellInfo.setValue(event.target.checked)}
          className="tw-h-4 tw-w-4 tw-cursor-pointer"
        />
      </div>
    );
  };

  // Master-detail component for auto-close config
  const renderMasterDetail = (e) => {
    const rowData = e?.data?.data || e?.data || {};
    const templateId = rowData?.id;
    const templateName = rowData?.name;

    if (templateId === undefined || templateId === null) {
      return (
        <div className="tw-p-4 tw-text-sm tw-text-red-600">
          Unable to load auto-close settings for this row. Template ID is missing.
        </div>
      );
    }

    return (
      <AutoCloseConfigPanel
        templateId={templateId}
        templateName={templateName}
        onConfigSaved={loadData}
      />
    );
  };

  if (loading && templates.length === 0) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="tw-p-4">
      <div className="tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-1">
          <i className="fa-light fa-file-lines tw-mr-2"></i>
          Issue Templates
        </h3>
        <p className="tw-text-sm tw-text-gray-500">
          Configure issue templates for each device type. Templates define default values and
          can have auto-close rules configured. Click on a row to expand and configure auto-close settings.
        </p>
      </div>

      <DataGrid
        ref={dataGridRef}
        dataSource={templates}
        keyExpr="id"
        showBorders={true}
        showRowLines={true}
        rowAlternationEnabled={true}
        columnAutoWidth={true}
        allowColumnResizing={true}
        allowColumnReordering={true}
        onRowInserting={handleRowInserting}
        onRowUpdating={handleRowUpdating}
        onRowRemoving={handleRowRemoving}
        className="tw-shadow-sm tw-rounded-lg"
      >
        <Editing
          mode="popup"
          allowAdding={true}
          allowUpdating={true}
          allowDeleting={true}
          useIcons={true}
          popup={{
            title: 'Issue Template',
            showTitle: true,
            width: 600,
            height: 'auto'
          }}
        />
        <Paging defaultPageSize={10} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <Selection mode="single" />
        <ColumnChooser enabled={true} mode="select" />

        <MasterDetail
          enabled={true}
          component={renderMasterDetail}
        />

        <Toolbar>
          <ToolbarItem name="addRowButton" />
          <ToolbarItem location="after">
            <Button
              icon="refresh"
              hint="Refresh"
              onClick={loadData}
            />
          </ToolbarItem>
          <ToolbarItem name="searchPanel" />
          <ToolbarItem name="columnChooserButton" />
        </Toolbar>

        <Column dataField="id" caption="ID" width={70} allowEditing={false} />
        <Column dataField="deviceTypeId" caption="Device Type" width={180}>
          <RequiredRule message="Device type is required" />
          <Lookup
            dataSource={deviceTypes}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        <Column dataField="name" caption="Template Name" width={200}>
          <RequiredRule message="Name is required" />
        </Column>
        <Column dataField="titleTemplate" caption="Title Template" width={250} />
        <Column dataField="descriptionTemplate" caption="Description Template" visible={false} />
        <Column dataField="defaultPriorityId" caption="Default Priority" width={150}>
          <Lookup
            dataSource={priorities}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        <Column dataField="defaultStatusId" caption="Default Status" width={150}>
          <Lookup
            dataSource={statuses}
            valueExpr="id"
            displayExpr={(item) => item ? (item.status || item.name || '') : ''}
          />
        </Column>
        <Column dataField="defaultAssignee" caption="Default Assignee" width={180}>
          <Lookup
            dataSource={users.map(u => ({
              id: u.id,
              displayName: `${u.userName || u.username || u.id}${u.email ? ` (${u.email})` : ''}`
            }))}
            valueExpr="id"
            displayExpr="displayName"
            allowClearing={true}
          />
        </Column>
        <Column
          dataField="isActive"
          caption="Active"
          width={80}
          dataType="boolean"
          cellRender={renderBooleanCell}
          editCellRender={renderBooleanEditCell}
        />
        <Column
          dataField="createdAt"
          caption="Created"
          dataType="datetime"
          width={150}
          allowEditing={false}
          format="yyyy-MM-dd HH:mm"
        />
        <Column type="buttons" width={110} />
      </DataGrid>
    </div>
  );
};

export default IssueTemplatesSettingsPage;
