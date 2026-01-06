//Cursor - Admin System Configuration Management Page
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScrollView from "devextreme-react/scroll-view";
import Button from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  Sorting,
  ColumnChooser,
  HeaderFilter,
  Toolbar,
  Item as TItems,
  Export,
  StateStoring,
  LoadPanel,
  Selection,
} from "devextreme-react/data-grid";
import "./SystemConfigPage.scss";
import {
  fetchSystemConfigurations,
  createSystemConfiguration,
  updateSystemConfiguration,
  deleteSystemConfiguration,
  clearCurrentSystemConfiguration,
  clearSystemConfigurationError,
  setSystemConfigurationFilter,
} from "../../../redux/actions/systemConfigActions";

import SystemConfigForm from "./components/SystemConfigForm";
import SystemConfigFilters from "./components/SystemConfigFilters";
import SystemConfigBulkActions from "./components/SystemConfigBulkActions";
import SystemConfigImport from "./components/SystemConfigImport";

const SystemConfigPage = () => {
  const dispatch = useDispatch();
  const gridRef = useRef(null);
  const { configurations, loading, saving, error, pagination, filters } =
    useSelector((state) => state.systemConfig);

  // State for UI management
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const exportFormats = ["xlsx"];

  // Load configurations on component mount
  useEffect(() => {
    dispatch(
      fetchSystemConfigurations({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      })
    );
  }, [dispatch, pagination.page, pagination.pageSize, filters, refreshTrigger]);

  // Error handling
  useEffect(() => {
    if (error) {
      notify(error, "error", 4000);
      dispatch(clearSystemConfigurationError());
    }
  }, [error, dispatch]);

  // Handlers
  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingConfig(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((config) => {
    setEditingConfig(config);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (configId) => {
      try {
        await dispatch(deleteSystemConfiguration(configId));
        notify("Configuration deleted successfully", "success", 3000);
        handleRefresh();
      } catch (error) {
        notify("Failed to delete configuration", "error", 4000);
      }
    },
    [dispatch, handleRefresh]
  );

  const handleSave = useCallback(
    async (configData) => {
      try {
        if (editingConfig) {
          await dispatch(
            updateSystemConfiguration({
              ...configData,
              id: editingConfig.id,
            })
          );
          notify("Configuration updated successfully", "success", 3000);
        } else {
          await dispatch(createSystemConfiguration(configData));
          notify("Configuration created successfully", "success", 3000);
        }
        setShowForm(false);
        setEditingConfig(null);
        handleRefresh();
      } catch (error) {
        notify("Failed to save configuration", "error", 4000);
      }
    },
    [dispatch, editingConfig, handleRefresh]
  );

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingConfig(null);
    dispatch(clearCurrentSystemConfiguration());
  }, [dispatch]);

  const handleFilterChange = useCallback(
    (newFilters) => {
      dispatch(setSystemConfigurationFilter(newFilters));
    },
    [dispatch]
  );

  const handleSelectionChanged = useCallback((e) => {
    setSelectedKeys(e.selectedRowKeys);
  }, []);

  const handleBulkAction = useCallback(() => {
    setShowBulkActions(true);
  }, []);

  const handleBulkComplete = useCallback(() => {
    setShowBulkActions(false);
    setSelectedKeys([]);
    handleRefresh();
  }, [handleRefresh]);

  const handleImportComplete = useCallback(() => {
    setShowImport(false);
    handleRefresh();
  }, [handleRefresh]);

  // Render functions
  const renderToolbar = () => (
    <Toolbar>
      <TItems location="before" locateInMenu="auto">
        <Button
          text="Add Configuration"
          type="default"
          stylingMode="contained"
          icon="fa-light fa-plus"
          onClick={handleCreate}
          disabled={loading || saving}
        />
      </TItems>
      <TItems location="before" locateInMenu="auto">
        <Button
          text="Refresh"
          type="normal"
          stylingMode="outlined"
          icon="fa-light fa-refresh"
          onClick={handleRefresh}
          disabled={loading}
        />
      </TItems>
      <TItems location="before" locateInMenu="auto">
        <Button
          text={`Filters ${showFilters ? "(On)" : ""}`}
          type="normal"
          stylingMode="outlined"
          icon="fa-light fa-filter"
          onClick={() => setShowFilters(!showFilters)}
        />
      </TItems>
      <TItems location="before" locateInMenu="auto">
        <Button
          text="Import"
          type="normal"
          stylingMode="outlined"
          icon="fa-light fa-upload"
          onClick={() => setShowImport(true)}
        />
      </TItems>
      {selectedKeys.length > 0 && (
        <TItems location="before" locateInMenu="auto">
          <Button
            text={`Bulk Actions (${selectedKeys.length})`}
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-tasks"
            onClick={handleBulkAction}
          />
        </TItems>
      )}
      <TItems name="exportButton" locateInMenu="auto" />
      <TItems name="columnChooserButton" />
      <TItems name="searchPanel" />
    </Toolbar>
  );

  const renderStatusCell = (cellData) => {
    const isActive = cellData.value;
    return (
      <div className={`tw-flex tw-items-center tw-gap-2`}>
        <div
          className={`tw-w-3 tw-h-3 tw-rounded-full ${
            isActive ? "tw-bg-green-500" : "tw-bg-red-500"
          }`}
        ></div>
        <span
          className={`tw-text-sm tw-font-medium ${
            isActive ? "tw-text-green-700" : "tw-text-red-700"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
    );
  };

  const renderActionCell = (cellData) => {
    const config = cellData.data;
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="fa-light fa-edit"
          type="normal"
          stylingMode="text"
          hint="Edit Configuration"
          onClick={() => handleEdit(config)}
        />
        <Button
          icon="fa-light fa-trash"
          type="normal"
          stylingMode="text"
          hint="Delete Configuration"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete this configuration?"
              )
            ) {
              handleDelete(config.id);
            }
          }}
        />
      </div>
    );
  };

  return (
    <ScrollView className="">
      <div className=" content content-block">
        {/* Filters Panel */}
        {showFilters && (
          <div className="tw-mb-6 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
            <SystemConfigFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Main Data Grid Container */}
        <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-overflow-hidden">
          <DataGrid
            ref={gridRef}
            dataSource={configurations || []}
            keyExpr="id"
            showBorders={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={false}
            rowAlternationEnabled={true}
            repaintChangesOnly={true}
            selectedRowKeys={selectedKeys}
            onSelectionChanged={handleSelectionChanged}
            noDataText="No configurations found. Create a new configuration to get started."
          >
            <Export
              enabled={true}
              allowExportSelectedData={true}
              formats={exportFormats}
            />
            <StateStoring
              enabled={true}
              type="sessionStorage"
              storageKey="systemConfigGrid"
            />
            <Paging enabled={true} defaultPageSize={30} />
            <ColumnChooser enabled={true} mode="select" height={200} />
            <LoadPanel enabled={true} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Selection mode="multiple" />
            <Sorting mode="multiple" />

            {/* Toolbar */}
            {renderToolbar()}

            {/* Selection Column */}
            <Column type="selection" width={50} />

            {/* Data Columns */}
            <Column
              dataField="configurationKey"
              caption="Configuration Key"
              width={200}
              fixed={true}
              allowHiding={false}
            />
            <Column
              dataField="configurationValue"
              caption="Value"
              minWidth={100}
            />
            <Column dataField="description" caption="Description" width={150} />
            <Column dataField="category" caption="Category" minWidth={120} />
            <Column dataField="dataType" caption="Data Type" minWidth={100} />
            <Column
              dataField="isActive"
              caption="Status"
              minWidth={100}
              cellRender={renderStatusCell}
            />
            <Column
              dataField="isEditable"
              caption="Editable"
              minWidth={100}
              dataType="boolean"
            />

            <Column
              dataField="defaultValue"
              caption="Default Value"
              minWidth={130}
            />

            {/* Actions Column */}
            <Column
              caption="Actions"
              minWidth={140}
              cellRender={renderActionCell}
              allowSorting={false}
              allowFiltering={false}
            />
          </DataGrid>
        </div>

        {/* Modals and Popups */}
        {showForm && (
          <SystemConfigForm
            visible={showForm}
            config={editingConfig}
            onSave={handleSave}
            onCancel={handleFormCancel}
            saving={saving}
          />
        )}

        {showBulkActions && (
          <SystemConfigBulkActions
            visible={showBulkActions}
            selectedIds={selectedKeys}
            onComplete={handleBulkComplete}
            onCancel={() => setShowBulkActions(false)}
          />
        )}

        {showImport && (
          <SystemConfigImport
            visible={showImport}
            onImportComplete={handleImportComplete}
            onClose={() => setShowImport(false)}
          />
        )}
      </div>
    </ScrollView>
  );
};

export default SystemConfigPage;
