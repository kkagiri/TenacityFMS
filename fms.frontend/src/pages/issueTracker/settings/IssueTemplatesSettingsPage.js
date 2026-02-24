/**
 * File: IssueTemplatesSettingsPage.js
 * Purpose: Manage issue templates and template actions for Issue Tracker V2
 * Dependencies: React, Redux, DevExtreme DataGrid, Popup, issueTrackerV2Service
 * Last Modified: 2026-02-23
 *
 * Key Functions/Components:
 * - IssueTemplatesSettingsPage: CRUD screen for issue templates
 * - Completion Actions button opens a popup with TemplateActionsPanel
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
  Item as ToolbarItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';
import {
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import TemplateActionsPanel from './TemplateActionsPanel';

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
  const [actionsPopup, setActionsPopup] = useState({ visible: false, templateId: null, templateName: '' });
  const [actionCounts, setActionCounts] = useState({});
  const [showGuide, setShowGuide] = useState(false);
  const dataGridRef = useRef(null);

  const openActionsPopup = (templateId, templateName) => {
    setActionsPopup({ visible: true, templateId, templateName });
  };

  const closeActionsPopup = () => {
    setActionsPopup({ visible: false, templateId: null, templateName: '' });
    // Refresh action counts when closing the actions popup
    loadActionCounts(templates);
  };

  // Get priorities and statuses from Redux
  const priorities = issueTrackerState?.priorities || [];
  const statuses = issueTrackerState?.statuses || [];
  const users = userState?.users || [];

  // Load action counts for all templates
  const loadActionCounts = useCallback(async (templateList) => {
    const counts = {};
    await Promise.all(
      (templateList || []).map(async (t) => {
        try {
          const actions = await issueTrackerV2Service.getTemplateActions(t.id);
          counts[t.id] = Array.isArray(actions) ? actions.filter(a => a.isActive).length : 0;
        } catch { counts[t.id] = 0; }
      })
    );
    setActionCounts(counts);
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load templates and device types in parallel
      const [templatesData, deviceTypesData] = await Promise.all([
        issueTrackerV2Service.getTemplates(),
        issueTrackerV2Service.getDeviceTypes()
      ]);

      const tList = templatesData || [];
      setTemplates(tList);
      setDeviceTypes(deviceTypesData || []);

      // Load action counts
      loadActionCounts(tList);

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
  }, [dispatch, priorities.length, statuses.length, users.length, loadActionCounts]);

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

  // Render the Completion Actions button with count badge in each template row
  const renderActionsCell = (cellInfo) => {
    const row = cellInfo.data;
    const count = actionCounts[row.id] || 0;
    return (
      <button
        type="button"
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs tw-font-medium tw-transition-colors tw-border tw-border-gray-200 hover:tw-border-blue-400 hover:tw-bg-blue-50 tw-bg-white tw-text-gray-700 hover:tw-text-blue-700"
        onClick={() => openActionsPopup(row.id, row.name)}
        title="Manage Completion Actions"
      >
        <i className="fa-light fa-list-check tw-text-sm"></i>
        <span>Actions</span>
        <span className={`tw-inline-flex tw-items-center tw-justify-center tw-min-w-[18px] tw-h-[18px] tw-rounded-full tw-text-[10px] tw-font-bold ${count > 0
          ? 'tw-bg-blue-100 tw-text-blue-700'
          : 'tw-bg-gray-100 tw-text-gray-400'
          }`}>{count}</span>
      </button>
    );
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
      {/* ─── Header with collapsible setup guide ─── */}
      <div className="tw-mb-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-1">
              <i className="fa-light fa-file-lines tw-mr-2"></i>
              Issue Templates
            </h3>
            <p className="tw-text-sm tw-text-gray-500">
              Templates define how issues are created and completed for each device type.
            </p>
          </div>
          <button
            type="button"
            className={`tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-medium tw-px-3 tw-py-1.5 tw-rounded-lg tw-border tw-transition-colors ${showGuide
              ? 'tw-bg-blue-50 tw-border-blue-200 tw-text-blue-700'
              : 'tw-bg-white tw-border-gray-200 tw-text-gray-600 hover:tw-border-blue-300 hover:tw-text-blue-600'
              }`}
            onClick={() => setShowGuide(!showGuide)}
          >
            <i className={`fa-light ${showGuide ? 'fa-circle-xmark' : 'fa-circle-question'} tw-text-sm`}></i>
            {showGuide ? 'Hide Guide' : 'Setup Guide'}
          </button>
        </div>

        {/* Collapsible setup guide */}
        {showGuide && (
          <div className="tw-mt-3 tw-p-4 tw-rounded-lg tw-bg-gradient-to-r tw-from-blue-50 tw-to-indigo-50 tw-border tw-border-blue-200">
            <p className="tw-text-xs tw-font-semibold tw-text-blue-800 tw-uppercase tw-tracking-wide tw-mb-3">
              <i className="fa-light fa-route tw-mr-1"></i>  How Template Setup Works
            </p>
            <div className="tw-flex tw-gap-3">
              {/* Step 1 */}
              <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-blue-100">
                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
                  <span className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-bold">1</span>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-800">Create a Template</span>
                </div>
                <p className="tw-text-[11px] tw-text-gray-600 tw-leading-relaxed">
                  Click <strong>+</strong> to add a template. Pick a <strong>Device Type</strong>, give it a name, and set defaults (priority, status, assignee). This template auto-fills fields when someone creates an issue.
                </p>
              </div>
              {/* Step 2 */}
              <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-blue-100">
                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
                  <span className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-bold">2</span>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-800">Add Completion Actions</span>
                </div>
                <p className="tw-text-[11px] tw-text-gray-600 tw-leading-relaxed">
                  Click the <strong>Actions</strong> button on a template row to define what steps technicians must record when completing an issue (e.g. "Replace Device", "Install Camera").
                </p>
              </div>
              {/* Step 3 */}
              <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-blue-100">
                <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1.5">
                  <span className="tw-w-5 tw-h-5 tw-rounded-full tw-bg-blue-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-bold">3</span>
                  <span className="tw-text-xs tw-font-semibold tw-text-gray-800">Users See the Wizard</span>
                </div>
                <p className="tw-text-[11px] tw-text-gray-600 tw-leading-relaxed">
                  When someone marks an issue as complete, a <strong>step-by-step wizard</strong> appears showing your configured actions. They select which actions they performed and fill in details.
                </p>
              </div>
            </div>
            <div className="tw-mt-3 tw-flex tw-items-start tw-gap-2 tw-p-2 tw-rounded tw-bg-amber-50 tw-border tw-border-amber-200">
              <i className="fa-light fa-lightbulb tw-text-amber-500 tw-text-sm tw-mt-0.5"></i>
              <p className="tw-text-[11px] tw-text-amber-800">
                <strong>Tip:</strong> Even issues without a template will show the wizard — the user can add custom actions on-the-fly. Templates just pre-configure the available actions.
              </p>
            </div>
          </div>
        )}
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
        <Column
          caption="Completion"
          width={110}
          fixed={true}
          fixedPosition="right"
          allowEditing={false}
          allowSorting={false}
          allowFiltering={false}
          allowReordering={false}
          cellRender={renderActionsCell}
          alignment="center"
        />
        <Column type="buttons" width={110} fixed={true} fixedPosition="right" />
      </DataGrid>

      {/* Completion Actions Popup */}
      <Popup
        visible={actionsPopup.visible}
        onHiding={closeActionsPopup}
        title={`Completion Actions — ${actionsPopup.templateName}`}
        showTitle={true}
        showCloseButton={true}
        width={900}
        height={520}
        minWidth={600}
        minHeight={350}
        maxHeight="90vh"
        dragEnabled={true}
        resizeEnabled={true}
        contentRender={() => (
          actionsPopup.templateId ? (
            <TemplateActionsPanel
              templateId={actionsPopup.templateId}
              templateName={actionsPopup.templateName}
            />
          ) : null
        )}
      />
    </div>
  );
};

export default IssueTemplatesSettingsPage;
