/**
 * File: SystemConfigPage.js
 * Purpose: Admin System Configuration Management Page with Tree View by Category
 * Dependencies: Redux, DevExtreme TreeList, SystemConfig components
 * Last Modified: 2026-02-05
 *
 * Key Functions:
 * - buildTreeData(): Transforms flat config list into tree structure with category nodes
 * - handleCreate/handleEdit/handleDelete: CRUD operations for configurations
 * - renderToolbar(): Renders action toolbar with add, refresh, filters, import
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScrollView from "devextreme-react/scroll-view";
import Button from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import TreeList, {
  Column,
  FilterRow,
  Sorting,
  ColumnChooser,
  HeaderFilter,
  Toolbar,
  Item as TItems,
  StateStoring,
  LoadPanel,
  Selection,
  SearchPanel,
  Paging,
  Pager,
  Scrolling,
} from "devextreme-react/tree-list";
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
import SystemConfigViewPanel from "./components/SystemConfigViewPanel";
import SystemConfigFilters from "./components/SystemConfigFilters";
import SystemConfigBulkActions from "./components/SystemConfigBulkActions";
import SystemConfigImport from "./components/SystemConfigImport";

const SystemConfigPage = () => {
  const dispatch = useDispatch();
  const treeListRef = useRef(null);
  const { configurations, loading, saving, error, pagination, filters } =
    useSelector((state) => state.systemConfig);

  // State for UI management
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showViewPanel, setShowViewPanel] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [viewingConfig, setViewingConfig] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Transform flat configurations into tree structure with categories as parent nodes
  const treeData = useMemo(() => {
    if (!configurations || configurations.length === 0) return [];

    // Group configurations by category
    const categoryMap = new Map();

    configurations.forEach((config) => {
      const category = config.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category).push(config);
    });

    // Build tree structure
    const result = [];
    let categoryIndex = 0;

    categoryMap.forEach((configs, categoryName) => {
      // Create category node (parent)
      const categoryId = `category_${categoryIndex}`;
      result.push({
        id: categoryId,
        parentId: null,
        isCategory: true,
        configurationKey: categoryName,
        configurationValue: `${configs.length} configuration(s)`,
        description: `Category: ${categoryName}`,
        category: categoryName,
        dataType: "",
        isActive: configs.every((c) => c.isActive),
        isEditable: false,
        defaultValue: "",
        itemCount: configs.length,
      });

      // Add configuration items under this category
      configs.forEach((config) => {
        result.push({
          ...config,
          parentId: categoryId,
          isCategory: false,
        });
      });

      categoryIndex++;
    });

    return result;
  }, [configurations]);

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

  const handleView = useCallback((config) => {
    setViewingConfig(config);
    setShowViewPanel(true);
  }, []);

  const handleEditFromView = useCallback((config) => {
    setShowViewPanel(false);
    setViewingConfig(null);
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
    // Filter out category nodes from selection (only allow config items to be selected)
    const configKeys = e.selectedRowKeys.filter(
      (key) => !String(key).startsWith("category_")
    );
    setSelectedKeys(configKeys);
  }, []);

  const handleBulkAction = useCallback(() => {
    setShowBulkActions(true);
  }, []);

  const handleImportComplete = useCallback(() => {
    setShowImport(false);
    handleRefresh();
  }, [handleRefresh]);

  // Apply styling to category rows
  const onRowPrepared = useCallback((e) => {
    if (e.rowType === "data" && e.data?.isCategory) {
      e.rowElement.classList.add("category-row");
    }
  }, []);

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
      <TItems name="columnChooserButton" />
      <TItems name="searchPanel" />
    </Toolbar>
  );

  const renderStatusCell = (cellData) => {
    // Don't show status for category rows
    if (cellData.data.isCategory) {
      return null;
    }
    const isActive = cellData.value;
    return (
      <div className={`tw-flex tw-items-center tw-gap-2`}>
        <div
          className={`tw-w-3 tw-h-3 tw-rounded-full ${isActive ? "tw-bg-green-500" : "tw-bg-red-500"
            }`}
        ></div>
        <span
          className={`tw-text-sm tw-font-medium ${isActive ? "tw-text-green-700" : "tw-text-red-700"
            }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
    );
  };

  const renderActionCell = (cellData) => {
    const config = cellData.data;
    // Don't show actions for category rows
    if (config.isCategory) {
      return null;
    }
    return (
      <div className="tw-flex tw-gap-2">
        <Button
          icon="fa-light fa-eye"
          type="normal"
          stylingMode="text"
          hint="View Configuration"
          onClick={() => handleView(config)}
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

  // Custom cell render for the configuration key column (shows category or key)
  const renderKeyCell = (cellData) => {
    const data = cellData.data;
    if (data.isCategory) {
      return (
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-font-semibold tw-text-gray-800">
            {data.configurationKey}
          </span>
          <span className="tw-ml-2 tw-px-2 tw-py-0.5 tw-bg-blue-100 tw-text-blue-700 tw-text-xs tw-rounded-full">
            {data.itemCount}
          </span>
        </div>
      );
    }
    return (
      <span className="tw-text-gray-700">{data.configurationKey}</span>
    );
  };

  return (
    <ScrollView className="">
      <div className=" content content-block system-config-page">
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

        {/* Main TreeList Container */}
        <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-overflow-hidden system-config-tree">
          <TreeList
            ref={treeListRef}
            dataSource={treeData}
            keyExpr="id"
            parentIdExpr="parentId"
            showBorders={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={false}
            rowAlternationEnabled={false}
            repaintChangesOnly={false}
            selectedRowKeys={selectedKeys}
            onSelectionChanged={handleSelectionChanged}
            onRowPrepared={onRowPrepared}
            autoExpandAll={true}
            rootValue={null}
            noDataText="No configurations found. Create a new configuration to get started."
          >
            <Scrolling mode="standard" useNative={true} />
            <Paging enabled={true} defaultPageSize={20} />
            <Pager
              visible={true}
              showNavigationButtons={true}
              showPageSizeSelector={true}
              allowedPageSizes={[10, 20, 50, 100]}
              showInfo={true}
              infoText="Page {0} of {1} ({2} items)"
            />
            <StateStoring
              enabled={true}
              type="sessionStorage"
              storageKey="systemConfigTreeList"
            />
            <ColumnChooser enabled={true} mode="select" height={200} />
            <LoadPanel enabled={true} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Selection mode="multiple" recursive={false} />
            <Sorting mode="multiple" />
            <SearchPanel visible={true} width={200} placeholder="Search..." />

            {/* Toolbar */}
            {renderToolbar()}

            {/* Selection Column */}
            <Column type="selection" width={50} />

            {/* Configuration Key Column with Tree Expand */}
            <Column
              dataField="configurationKey"
              caption="Configuration Key / Category"
              minWidth={280}
              cellRender={renderKeyCell}
              allowHiding={false}
            />
            <Column
              dataField="configurationValue"
              caption="Value"
              minWidth={150}
            />
            <Column dataField="description" caption="Description" minWidth={150} />
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
              minWidth={80}
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
              minWidth={100}
              cellRender={renderActionCell}
              allowSorting={false}
              allowFiltering={false}
            />
          </TreeList>
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

        {showViewPanel && (
          <SystemConfigViewPanel
            visible={showViewPanel}
            config={viewingConfig}
            onClose={() => {
              setShowViewPanel(false);
              setViewingConfig(null);
            }}
            onEdit={handleEditFromView}
          />
        )}

        {showBulkActions && (
          <SystemConfigBulkActions
            selectedKeys={selectedKeys}
            onClearSelection={() => {
              setSelectedKeys([]);
              setShowBulkActions(false);
            }}
            onRefresh={handleRefresh}
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
