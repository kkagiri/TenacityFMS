import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  ColumnChooser,
  Export,
  Selection,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import "./PTSDeviceList.scss";

const PTSDeviceList = ({
  devices = [],
  isLoading = false,
  onRefresh,
  onPumpService,
  onAddDevice,
  unknownDevices = [],
  onFetchUnknownDevices,
}) => {
  const dataGridRef = useRef(null);
  const navigate = useNavigate();
  const [unknownDevicesPopupVisible, setUnknownDevicesPopupVisible] = useState(false);

  // Memoize devices to prevent unnecessary re-renders
  const stableDevices = React.useMemo(() => {
    return devices.map(device => ({
      ...device,
      // Ensure stable ID
      id: device.id || device.ptsid
    }));
  }, [devices]);

  // Handle row click - navigate to device detail page
  const handleRowClick = (e) => {
    // Don't navigate if clicking on action buttons
    if (e.event?.target?.closest('.dx-button')) {
      return;
    }
    const deviceId = e.data.id || e.data.ptsid;
    navigate(`/admin/ptsdevice/${deviceId}`);
  };

  // Handle show unknown devices popup
  const handleShowUnknownDevices = () => {
    if (onFetchUnknownDevices) {
      onFetchUnknownDevices();
    }
    setUnknownDevicesPopupVisible(true);
  };

  // Render the action buttons
  const renderActionCell = (cellData) => {
    const deviceId = cellData.data.id || cellData.data.ptsid;

    return (
      <div className="tw-flex tw-gap-2 tw-justify-center">
        <Button
          icon="fa-light fa-gas-pump"
          hint="Pump Service"
          onClick={(e) => {
            e.event.stopPropagation();
            if (onPumpService) onPumpService(deviceId);
          }}
          stylingMode="text"
        />
      </div>
    );
  };

  // Render boolean values as "Yes" or "No"
  const renderBooleanCell = (data) => {
    return data ? "Yes" : "No";
  };

  // Format boolean values from API
  const formatBoolean = (data) => {
    if (data === 1 || data === true) return true;
    return false;
  };

  // Render status cell with icon
  const renderStatusCell = (cellData) => {
    const status = cellData.data.status || "unknown";

    let iconClass = "";
    let statusText = "";

    switch (status.toLowerCase()) {
      case "online":
        iconClass = "fa-solid fa-circle-check text-success";
        statusText = "Online";
        break;
      case "warning":
        iconClass = "fa-solid fa-triangle-exclamation text-warning";
        statusText = "Warning";
        break;
      case "offline":
        iconClass = "fa-solid fa-bolt-lightning text-danger";
        statusText = "Offline";
        break;
      default:
        iconClass = "fa-solid fa-circle-question text-secondary";
        statusText = "Unknown";
    }

    return (
      <div className="d-flex align-items-center">
        <i className={`${iconClass} me-2`}></i>
        <span>{statusText}</span>
      </div>
    );
  };

  return (
    <div className="pts-device-list">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-500 tw-text-sm">
          <i className="fa-light fa-circle-info"></i>
          <span>Select device to view detail</span>
        </div>
        <div className="user-details__action-buttons">
          <Button
            icon="fa-light fa-question-circle"
            text="Unknown Devices"
            hint="View connected but unregistered devices"
            onClick={handleShowUnknownDevices}
            stylingMode="outlined"
            type="default"
            className="user-details__action-btn--first"
          />
          <Button
            icon="plus"
            text="Add PTS Device"
            hint="Add new PTS device"
            onClick={onAddDevice}
            stylingMode="outlined"
            type="default"
          />
          <Button
            icon="refresh"
            text="Refresh"
            hint="Refresh device list"
            onClick={onRefresh}
            disabled={isLoading}
            stylingMode="outlined"
            type="success"
            className="user-details__action-btn--last"
          />
        </div>
      </div>

      <DataGrid
        ref={dataGridRef}
        dataSource={stableDevices}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        repaintChangesOnly={true}
        height="auto"
        width="100%"
        loadPanel={{ enabled: isLoading }}
        keyExpr="id"
        onRowClick={handleRowClick}
        hoverStateEnabled={true}
      >
        <Selection mode="single" />
        <Paging defaultPageSize={10} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[5, 10, 20]}
          showInfo={true}
        />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <ColumnChooser enabled={true} />
        <Export enabled={true} allowExportSelectedData={true} />

        <Column
          dataField="id"
          caption="PTS ID"
          width={150}
          cellRender={(data) => data.data.ptsid || data.data.id}
        />
        <Column
          dataField="ptsName"
          caption="PTS Name"
          minWidth={150}
          cellRender={(data) => data.data.ptsName || data.data.ptsid || '-'}
        />
        <Column dataField="siteName" caption="Site Name" minWidth={150} />
        <Column
          dataField="status"
          caption="Status"
          minWidth={120}
          cellRender={renderStatusCell}
        />
        <Column
          dataField="lastUpdated"
          caption="Last Updated"
          dataType="string"
          minWidth={120}
        />
        <Column
          dataField="isActive"
          caption="Activated"
          minWidth={100}
          alignment="center"
          cellRender={(cell) =>
            renderBooleanCell(formatBoolean(cell.data.isActive))
          }
        />
        <Column
          caption="Actions"
          width={150}
          alignment="center"
          cellRender={renderActionCell}
          fixed={true}
          fixedPosition="right"
          allowFiltering={false}
          allowSorting={false}
        />
      </DataGrid>

      {/* Unknown Devices Popup */}
      <Popup
        visible={unknownDevicesPopupVisible}
        onHiding={() => setUnknownDevicesPopupVisible(false)}
        title="Unknown Connected Devices"
        showCloseButton={true}
        width="auto"
        height="auto"
        maxWidth={600}
        maxHeight={500}
      >
        <div className="tw-p-4">
          {unknownDevices && unknownDevices.length > 0 ? (
            <div>
              <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                These devices are connected but not registered in the system.
              </p>
              <div className="tw-space-y-2">
                {unknownDevices.map((deviceId, index) => (
                  <div
                    key={deviceId || index}
                    className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200"
                  >
                    <div className="tw-flex tw-items-center tw-gap-3">
                      <i className="fa-light fa-microchip tw-text-orange-500"></i>
                      <span className="tw-font-medium tw-text-gray-800">
                        {deviceId}
                      </span>
                    </div>
                    <Button
                      icon="plus"
                      text="Register"
                      hint="Register this device"
                      onClick={() => {
                        setUnknownDevicesPopupVisible(false);
                        if (onAddDevice) onAddDevice(deviceId);
                      }}
                      stylingMode="outlined"
                      type="default"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="tw-text-center tw-py-8">
              <i className="fa-light fa-check-circle tw-text-4xl tw-text-green-500 tw-mb-4"></i>
              <p className="tw-text-gray-600">
                No unknown devices connected.
              </p>
              <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
                All connected devices are registered in the system.
              </p>
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default PTSDeviceList;
