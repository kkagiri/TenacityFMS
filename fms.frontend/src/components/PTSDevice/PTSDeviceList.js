import React, { useRef } from "react";
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
import LiveStatusControl from "../LiveStatus/LiveStatusControl";
import "./PTSDeviceList.scss";

const PTSDeviceList = ({
  devices = [],
  isLoading = false,
  onRefresh,
  onEdit,
  onDiagnose,
  onPumpService,
  onAddDevice,
}) => {
  const dataGridRef = useRef(null);
  const navigate = useNavigate();

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
    const deviceId = e.data.id || e.data.ptsid;
    navigate(`/admin/ptsdevice/${deviceId}`);
  };

  // Render the action buttons
  const renderActionCell = (cellData) => {
    const deviceId = cellData.data.id || cellData.data.ptsid;

    return (
      <div className="tw-flex tw-gap-2 tw-justify-center">
        <Button
          icon="fa-light fa-edit"
          hint="Edit Device"
          onClick={(e) => {
            e.event.stopPropagation();
            if (onEdit) onEdit(deviceId);
          }}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-gas-pump"
          hint="Pump Service"
          onClick={(e) => {
            e.event.stopPropagation();
            if (onPumpService) onPumpService(deviceId);
          }}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-stethoscope"
          hint="Diagnose"
          onClick={(e) => {
            e.event.stopPropagation();
            if (onDiagnose) onDiagnose(deviceId);
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
      <div className="device-list-toolbar">
        <Button
          icon="refresh"
          onClick={onRefresh}
          disabled={isLoading}
          text="Refresh"
        />
        <LiveStatusControl compact={true} />
        <Button icon="plus" onClick={onAddDevice} text="Add PTS Device" />
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
          width={120}
          cellRender={(data) => data.data.ptsid || data.data.id}
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
          dataField="tanks"
          caption="Tanks"
          calculateCellValue={(rowData) => {
            return rowData.tanks
              ? `${rowData.tanks.length} ${
                  rowData.tanks.length === 1 ? "tank" : "tanks"
                }`
              : "0 tanks";
          }}
          minWidth={100}
        />
        <Column
          dataField="batteryVoltage"
          caption="Battery"
          format="#.# V"
          minWidth={100}
        />
        <Column
          dataField="cpuTemperature"
          caption="CPU Temp"
          format="#°C"
          minWidth={100}
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
    </div>
  );
};

export default PTSDeviceList;
