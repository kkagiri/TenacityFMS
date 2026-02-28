/**
 * File:          VehicleTransferHistory.js
 * Purpose:       M365-styled vehicle transfer history tab with SlidePanel details
 * Dependencies:  DataGrid (DevExtreme), SlidePanel, VehicleTransferForm, VehicleTransferDetails
 * Last Modified: 2026-02-02
 *
 * Key Components:
 * - Transfer history DataGrid
 * - SlidePanel for form creation (1200px)
 * - SlidePanel for detail view (1200px)
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
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import SlidePanel from "../../../components/ui/SlidePanel";
import VehicleTransferForm from "./VehicleTransferForm";
import VehicleTransferDetails from "./VehicleTransferDetails";
import { usePermissions } from "../../../hooks/usePermissions";

import "./VehicleTransferHistory.scss";

const VehicleTransferHistory = ({ vehicleId }) => {
  const [transferData, setTransferData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission("_Create_VehicleTransfer");

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
    setShowFormPanel(true);
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDetailsPanel(true);
  };

  const handleCloseDetailsPanel = () => {
    setShowDetailsPanel(false);
    setSelectedTransfer(null);
  };

  const handleFormSuccess = () => {
    setShowFormPanel(false);
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

  // ── Status badge helper ──
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    const map = {
      completed:       { cls: "m365-badge--success",  text: "Completed" },
      approved:        { cls: "m365-badge--primary",   text: "Approved" },
      intransit:       { cls: "m365-badge--primary",   text: "In Transit" },
      pendingapproval: { cls: "m365-badge--warning",   text: "Pending Approval" },
      draft:           { cls: "m365-badge--neutral",   text: "Draft" },
      cancelled:       { cls: "m365-badge--error",     text: "Cancelled" },
      rejected:        { cls: "m365-badge--error",     text: "Rejected" },
      pending:         { cls: "m365-badge--warning",   text: "Pending" },
    };
    const info = map[s] || { cls: "m365-badge--neutral", text: status || "—" };
    return <span className={`m365-badge ${info.cls}`}>{info.text}</span>;
  };

  const renderStatusCell = (cellInfo) => getStatusBadge(cellInfo.value || "Pending");

  const renderActionsCell = (cellInfo) => {
    return (
      <div className="transfer-history__actions">
        <button
          className="m365-icon-btn"
          title="View Details"
          onClick={() => handleViewDetails(cellInfo.data)}
        >
          <i className="fa-light fa-eye" />
        </button>
        <button
          className="m365-icon-btn"
          title="Download PDF"
          onClick={() => handleDownloadPdf(cellInfo.data.transferId)}
        >
          <i className="fa-light fa-file-pdf" />
        </button>
        <button
          className="m365-icon-btn"
          title="Send Email"
          onClick={() => handleSendEmail(cellInfo.data.transferId)}
        >
          <i className="fa-light fa-envelope" />
        </button>
        {cellInfo.data.documentUrl && (
          <button
            className="m365-icon-btn"
            title="View Uploaded Document"
            onClick={() => window.open(cellInfo.data.documentUrl, "_blank")}
          >
            <i className="fa-light fa-file-arrow-down" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="vehicle-transfer-history">
      {/* ── Header ── */}
      <div className="transfer-history__header">
        <h3 className="transfer-history__title">
          <i className="fa-light fa-truck-moving" />
          Transfer History
        </h3>
        <div className="transfer-history__header-actions">
          <button className="m365-btn m365-btn--ghost" onClick={loadTransferHistory}>
            <i className="fa-light fa-arrows-rotate" /> Refresh
          </button>
          {isAdmin && (
            <button className="m365-btn m365-btn--primary" onClick={handleAddTransfer}>
              <i className="fa-light fa-plus" /> New Transfer
            </button>
          )}
        </div>
      </div>

      {/* ── Data Grid ── */}
      <DataGrid
        dataSource={transferData}
        showBorders={false}
        showRowLines={true}
        columnAutoWidth={true}
        rowAlternationEnabled={false}
        allowColumnResizing={true}
        keyExpr="transferId"
        hoverStateEnabled={true}
        onRowDblClick={(e) => handleViewDetails(e.data)}
      >
        <LoadPanel enabled={isLoading} />
        <FilterRow visible={false} />
        <SearchPanel visible={true} width={240} placeholder="Search…" />
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
              : "—"
          }
        />
        <Column
          dataField="status"
          caption="Status"
          width={130}
          cellRender={renderStatusCell}
        />
        <Column
          caption="Actions"
          width={120}
          cellRender={renderActionsCell}
          allowFiltering={false}
          allowSorting={false}
        />
      </DataGrid>

      {/* ── Create Transfer SlidePanel ── */}
      <SlidePanel
        open={showFormPanel}
        onClose={() => setShowFormPanel(false)}
        title="Create Vehicle Transfer"
        width={1200}
      >
        <VehicleTransferForm
          vehicleId={vehicleId}
          onClose={() => setShowFormPanel(false)}
          onSuccess={handleFormSuccess}
        />
      </SlidePanel>

      {/* ── Transfer Details SlidePanel ── */}
      <SlidePanel
        open={showDetailsPanel}
        onClose={handleCloseDetailsPanel}
        title={`Transfer Details — ${selectedTransfer?.deliveryNoteNumber || ""}`}
        width={1200}
      >
        {selectedTransfer && (
          <VehicleTransferDetails
            transfer={selectedTransfer}
            onClose={handleCloseDetailsPanel}
            onRefresh={() => {
              handleCloseDetailsPanel();
              loadTransferHistory();
            }}
          />
        )}
      </SlidePanel>
    </div>
  );
};

export default VehicleTransferHistory;
