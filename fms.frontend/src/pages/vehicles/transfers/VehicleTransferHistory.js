/**
 * VehicleTransferHistory.js
 * Component to display vehicle transfer history
 * Uses DevExtreme DataGrid with pagination
 */

import React, { useState, useEffect, useCallback } from "react";
import { DataGrid } from "devextreme-react/data-grid";
import {
  Column,
  Paging,
  FilterRow,
  SearchPanel,
  Export,
  LoadPanel,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import { Popup, ScrollView } from "devextreme-react";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import VehicleTransferForm from "./VehicleTransferForm";
import VehicleTransferDetails from "./VehicleTransferDetails";
import { usePermissions } from "../../../hooks/usePermissions";

import "./VehicleTransferHistory.scss";

const VehicleTransferHistory = ({ vehicleId }) => {
  const [transferData, setTransferData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const { hasRole } = usePermissions();
  const isAdmin = hasRole("Admin") || hasRole("SuperAdmin");

  const loadTransferHistory = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);

      const response = await axiosInstance.get(
        `/vehicletransfers/vehicle/${vehicleId}`
      );

      if (response.data?.isSuccess) {
        const data = response.data.data || [];
        const processedData = data.map((item) => ({
          ...item,
          transferDate: item.transferDate ? new Date(item.transferDate) : null,
          departureTime: item.departureTime
            ? new Date(item.departureTime)
            : null,
          arrivalTime: item.arrivalTime ? new Date(item.arrivalTime) : null,
          dateCreated: item.dateCreated ? new Date(item.dateCreated) : null,
        }));
        setTransferData(processedData);
      } else {
        throw new Error(response.data?.message || "Failed to load transfers");
      }
    } catch (error) {
      console.error("Error loading transfer history:", error);
      notify(
        error.message || "Failed to load transfer history",
        "error",
        3000
      );
      setTransferData([]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadTransferHistory();
  }, [loadTransferHistory]);

  const handleAddTransfer = () => {
    if (!vehicleId) {
      notify(
        "Vehicle context missing. Please open from a specific vehicle.",
        "warning",
        3000
      );
      return;
    }
    setSelectedTransfer(null);
    setShowFormPopup(true);
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsPopup(true);
  };

  const handleFormSuccess = () => {
    setShowFormPopup(false);
    loadTransferHistory();
    notify("Vehicle transfer created successfully", "success", 3000);
  };

  const handleDownloadPdf = async (transferId) => {
    try {
      const response = await axiosInstance.get(
        `/vehicletransfers/${transferId}/pdf`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Transfer_Report_${transferId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify("PDF downloaded successfully", "success", 3000);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      notify("Failed to download PDF report", "error", 3000);
    }
  };

  const handleSendEmail = async (transferId) => {
    const recipients = prompt(
      "Enter email recipients (comma-separated):",
      ""
    );
    if (!recipients) return;

    try {
      const response = await axiosInstance.post(
        `/vehicletransfers/${transferId}/send-email`,
        { recipients }
      );

      if (response.data?.isSuccess) {
        notify("Email sent successfully", "success", 3000);
      } else {
        throw new Error(response.data?.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      notify(error.message || "Failed to send email", "error", 3000);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "tw-bg-green-100 tw-text-green-800";
      case "intransit":
        return "tw-bg-blue-100 tw-text-blue-800";
      case "cancelled":
        return "tw-bg-red-100 tw-text-red-800";
      case "pending":
      default:
        return "tw-bg-yellow-100 tw-text-yellow-800";
    }
  };

  const renderStatusCell = (cellInfo) => {
    const status = cellInfo.value || "Pending";
    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusBadgeClass(
          status
        )}`}
      >
        {status}
      </span>
    );
  };

  const renderActionsCell = (cellInfo) => {
    return (
      <div className="tw-flex tw-gap-1">
        <Button
          icon="fa-light fa-eye"
          hint="View Details"
          stylingMode="text"
          onClick={() => handleViewDetails(cellInfo.data)}
        />
        <Button
          icon="fa-light fa-file-pdf"
          hint="Download PDF Report"
          stylingMode="text"
          onClick={() => handleDownloadPdf(cellInfo.data.transferId)}
        />
        <Button
          icon="fa-light fa-envelope"
          hint="Send Email Report"
          stylingMode="text"
          onClick={() => handleSendEmail(cellInfo.data.transferId)}
        />
        {cellInfo.data.documentUrl && (
          <Button
            icon="fa-light fa-file-arrow-down"
            hint="View Uploaded Document"
            stylingMode="text"
            onClick={() => window.open(cellInfo.data.documentUrl, "_blank")}
          />
        )}
      </div>
    );
  };

  return (
    <div className="vehicle-transfer-history">
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-truck-moving tw-mr-2"></i>
          Transfer History
        </h3>
        {isAdmin && (
          <Button
            text="New Transfer"
            icon="fa-light fa-plus"
            type="default"
            stylingMode="contained"
            onClick={handleAddTransfer}
          />
        )}
      </div>

      {/* Data Grid */}
      <DataGrid
        dataSource={transferData}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        keyExpr="transferId"
        className="tw-rounded-lg"
      >
        <LoadPanel enabled={isLoading} />
        <FilterRow visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <Paging defaultPageSize={10} />
        <Export enabled={true} allowExportSelectedData={false} />

        <Column
          dataField="deliveryNoteNumber"
          caption="Delivery Note"
          width={120}
        />
        <Column
          dataField="transferDate"
          caption="Transfer Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={120}
          sortOrder="desc"
        />
        <Column dataField="fromSiteName" caption="From Site" width={150} />
        <Column dataField="toSiteName" caption="To Site" width={150} />
        <Column dataField="driverName" caption="Driver" width={120} />
        <Column
          dataField="currentReading"
          caption="Reading"
          width={100}
          customizeText={(cellInfo) =>
            cellInfo.value
              ? `${cellInfo.value} ${cellInfo.data?.readingUnit || "hrs"}`
              : "-"
          }
        />
        <Column
          dataField="status"
          caption="Status"
          width={100}
          cellRender={renderStatusCell}
        />
        <Column
          caption="Actions"
          width={100}
          cellRender={renderActionsCell}
          allowFiltering={false}
          allowSorting={false}
        />
      </DataGrid>

      {/* Transfer Form Popup */}
      <Popup
        visible={showFormPopup}
        onHiding={() => setShowFormPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title="Create Vehicle Transfer"
        width="90%"
        height="90%"
        maxWidth={1200}
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <VehicleTransferForm
            vehicleId={vehicleId}
            onClose={() => setShowFormPopup(false)}
            onSuccess={handleFormSuccess}
          />
        </ScrollView>
      </Popup>

      {/* Transfer Details Popup */}
      <Popup
        visible={showDetailsPopup}
        onHiding={() => setShowDetailsPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Transfer Details - ${selectedTransfer?.deliveryNoteNumber || ""}`}
        width="90%"
        height="90%"
        maxWidth={1000}
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <VehicleTransferDetails
            transfer={selectedTransfer}
            onClose={() => setShowDetailsPopup(false)}
          />
        </ScrollView>
      </Popup>
    </div>
  );
};

export default VehicleTransferHistory;
