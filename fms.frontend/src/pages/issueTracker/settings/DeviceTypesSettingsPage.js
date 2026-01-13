import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Toolbar,
  Item as ToolbarItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Switch } from 'devextreme-react/switch';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

/**
 * Device Types Settings Page
 * Manages device types for Issue Tracker V2 template system
 */
const DeviceTypesSettingsPage = () => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const dataGridRef = useRef(null);

  // Load device types
  const loadDeviceTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await issueTrackerV2Service.getDeviceTypes();
      setDeviceTypes(data || []);
    } catch (error) {
      console.error('Error loading device types:', error);
      notify({
        message: 'Failed to load device types',
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeviceTypes();
  }, [loadDeviceTypes]);

  // Handle row inserting
  const handleRowInserting = async (e) => {
    e.cancel = true; // Cancel default behavior
    try {
      const newDeviceType = {
        name: e.data.name,
        description: e.data.description || null,
        isMonitored: e.data.isMonitored || false,
        monitoringEndpoint: e.data.monitoringEndpoint || null
      };

      await issueTrackerV2Service.createDeviceType(newDeviceType);
      await loadDeviceTypes();

      // Clear any pending changes
      if (dataGridRef.current) {
        dataGridRef.current.instance.cancelEditData();
      }
    } catch (error) {
      console.error('Error creating device type:', error);
    }
  };

  // Handle row updating
  const handleRowUpdating = async (e) => {
    e.cancel = true; // Cancel default behavior
    try {
      const updatedData = { ...e.oldData, ...e.newData };
      await issueTrackerV2Service.updateDeviceType(e.key, {
        name: updatedData.name,
        description: updatedData.description,
        isMonitored: updatedData.isMonitored,
        monitoringEndpoint: updatedData.monitoringEndpoint
      });
      await loadDeviceTypes();

      if (dataGridRef.current) {
        dataGridRef.current.instance.cancelEditData();
      }
    } catch (error) {
      console.error('Error updating device type:', error);
    }
  };

  // Handle row removing
  const handleRowRemoving = async (e) => {
    e.cancel = true; // Cancel default behavior
    try {
      await issueTrackerV2Service.deleteDeviceType(e.key);
      await loadDeviceTypes();
    } catch (error) {
      console.error('Error deleting device type:', error);
    }
  };

  // Custom cell render for boolean fields
  const renderBooleanCell = (cellInfo) => {
    return (
      <div className="tw-flex tw-justify-center">
        <Switch
          value={cellInfo.value}
          disabled={true}
          width={50}
        />
      </div>
    );
  };

  // Custom edit cell for boolean fields
  const renderBooleanEditCell = (cellInfo) => {
    return (
      <Switch
        value={cellInfo.value}
        onValueChanged={(e) => cellInfo.setValue(e.value)}
        width={50}
      />
    );
  };

  if (loading && deviceTypes.length === 0) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-600">Loading device types...</span>
      </div>
    );
  }

  return (
    <div className="tw-p-4">
      <div className="tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-1">
          <i className="fa-light fa-microchip tw-mr-2"></i>
          Device Types
        </h3>
        <p className="tw-text-sm tw-text-gray-500">
          Manage device types that can have issue templates. Device types with monitoring enabled
          can be used for auto-close functionality.
        </p>
      </div>

      <DataGrid
        ref={dataGridRef}
        dataSource={deviceTypes}
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
            title: 'Device Type',
            showTitle: true,
            width: 500,
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
              onClick={loadDeviceTypes}
            />
          </ToolbarItem>
          <ToolbarItem name="searchPanel" />
          <ToolbarItem name="columnChooserButton" />
        </Toolbar>

        <Column dataField="id" caption="ID" width={70} allowEditing={false} />
        <Column dataField="name" caption="Name" width={200}>
          <RequiredRule message="Name is required" />
        </Column>
        <Column dataField="description" caption="Description" />
        <Column
          dataField="isMonitored"
          caption="Monitored"
          width={100}
          dataType="boolean"
          cellRender={renderBooleanCell}
          editCellRender={renderBooleanEditCell}
        />
        <Column
          dataField="monitoringEndpoint"
          caption="Monitoring Endpoint"
          width={250}
          visible={false}
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

export default DeviceTypesSettingsPage;
