/**
 * File: VehicleTransferListPage.js
 * Purpose: M365 Admin Center style vehicle transfer list page with SlidePanel detail view.
 * Dependencies: DataGrid, SlidePanel, VehicleTransferDetails, axiosInstance, Redux
 * Last Modified: 2026-04-09
 *
 * Key Functions:
 * - loadTransfers(): Fetches all transfers with optional filters
 * - handleViewDetails(transfer): Opens detail side panel
 * - handleApprove/Reject/Dispatch/ConfirmReceipt: Workflow actions
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import DataGrid, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  Paging,
  Pager,
  Export,
  ColumnChooser,
  LoadPanel,
  Sorting,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import { getUserId, getUserDisplayName } from "./vehicleTransferFormUtils";
import axiosInstance from "../../../api/axiosInstance";
import SlidePanel from "../../../components/ui/SlidePanel";
import VehicleTransferDetails from "./VehicleTransferDetails";
import "./VehicleTransferListPage.scss";

const VehicleTransferListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dataGridRef = useRef(null);
  const sites = useSelector((state) => state.site.sites);
  const users = useSelector((state) => state.user?.users || []);

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalTransfer, setApprovalTransfer] = useState(null);
  const [approvalUserId, setApprovalUserId] = useState("");

  const workshopUsers = useMemo(
    () =>
      (Array.isArray(users) ? users : [])
        .filter((u) => u && typeof u === "object")
        .map((u) => ({ ...u, _id: getUserId(u), _name: getUserDisplayName(u), _email: u?.email || u?.Email || "" }))
        .filter((u) => u._id !== null && !u?.isDeleted && u._name && u._email),
    [users]
  );

  // Filter states
  const [filterSiteId, setFilterSiteId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchUsers()).catch(() => { });
    loadTransfers();
  }, [dispatch]);

  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSiteId) params.append("siteId", filterSiteId);
      if (filterStatus) params.append("status", filterStatus);
      if (filterDateFrom) params.append("fromDate", new Date(filterDateFrom).toISOString());
      if (filterDateTo) params.append("toDate", new Date(filterDateTo).toISOString());

      const response = await axiosInstance.get(`/vehicletransfers?${params.toString()}`);
      if (response.data?.isSuccess) {
        setTransfers(response.data.data || []);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      console.error("Error loading transfers:", error);
      notify("Failed to load transfers", "error", 3000);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [filterSiteId, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadTransfers();
  }, [filterSiteId, filterStatus, filterDateFrom, filterDateTo, loadTransfers]);

  const handleViewDetails = async (transfer) => {
    setShowDetailPanel(true);
    setDetailLoading(true);
    try {
      const res = await axiosInstance.get(`/vehicletransfers/${transfer.transferId}`);
      if (res.data?.isSuccess) {
        setSelectedTransfer(res.data.data || res.data.Data || transfer);
      } else {
        setSelectedTransfer(transfer);
      }
    } catch {
      setSelectedTransfer(transfer);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClosePanel = () => {
    setShowDetailPanel(false);
    setSelectedTransfer(null);
  };

  const handleCloseApprovalPanel = () => {
    setShowApprovalDialog(false);
    setApprovalTransfer(null);
    setApprovalUserId("");
  };

  const handlePanelRefresh = () => {
    handleClosePanel();
    loadTransfers();
  };

  // ── Status helpers ──

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    const map = {
      completed: { cls: "m365-badge--success", text: "Completed" },
      approved: { cls: "m365-badge--primary", text: "Approved" },
      intransit: { cls: "m365-badge--primary", text: "In Transit" },
      pendingapproval: { cls: "m365-badge--warning", text: "Pending Approval" },
      draft: { cls: "m365-badge--neutral", text: "Draft" },
      cancelled: { cls: "m365-badge--error", text: "Cancelled" },
      rejected: { cls: "m365-badge--error", text: "Rejected" },
      pending: { cls: "m365-badge--warning", text: "Pending" },
    };
    const info = map[s] || { cls: "m365-badge--neutral", text: status || "-" };
    return <span className={`m365-badge ${info.cls}`}>{info.text}</span>;
  };

  const statusCellRender = (cellData) => getStatusBadge(cellData.value);

  const dateCellRender = (cellData) => {
    if (!cellData.value) return <span style={{ color: "#a19f9d" }}>—</span>;
    return new Date(cellData.value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ── Workflow actions ──

  const handleSubmitForApproval = (transfer) => {
    setApprovalTransfer(transfer);
    setApprovalUserId("");
    setShowApprovalDialog(true);
  };

  const handleConfirmSubmitForApproval = async () => {
    if (!approvalUserId || !approvalTransfer) return;
    const selectedUser = workshopUsers.find((u) => String(u._id) === String(approvalUserId));
    if (!selectedUser) {
      notify("Selected user not found", "error", 3000);
      return;
    }
    try {
      const response = await axiosInstance.post(`/vehicletransfers/${approvalTransfer.transferId}/submit-approval`, {
        workshopManagerEmail: selectedUser._email,
        workshopManagerName: selectedUser._name,
        approvalBaseUrl: window.location.origin,
      });
      if (response.data?.isSuccess) {
        notify("Transfer submitted for approval", "success", 3000);
        handleCloseApprovalPanel();
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to submit for approval", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to submit for approval", "error", 3000);
    }
  };

  const handleCancelTransfer = async (transfer) => {
    if (!window.confirm(`Cancel transfer #${transfer.transferId} for ${transfer.vehicleHyoungNo}?`)) return;
    try {
      const response = await axiosInstance.put(`/vehicletransfers/${transfer.transferId}/status`, {
        status: "Cancelled",
      });
      if (response.data?.isSuccess) {
        notify("Transfer cancelled", "success", 3000);
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to cancel transfer", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to cancel transfer", "error", 3000);
    }
  };

  const handleApprove = async (transfer) => {
    if (!window.confirm(`Approve transfer #${transfer.transferId} for ${transfer.vehicleHyoungNo}?`)) return;
    try {
      const response = await axiosInstance.post(`/vehicletransfers/${transfer.transferId}/approve`, {
        approverName: "",
      });
      if (response.data?.isSuccess) {
        notify("Transfer approved successfully", "success", 3000);
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to approve transfer", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to approve transfer", "error", 3000);
    }
  };

  const handleReject = async (transfer) => {
    const reason = window.prompt(`Reject transfer #${transfer.transferId}? Enter reason:`);
    if (reason === null) return;
    try {
      const response = await axiosInstance.post(`/vehicletransfers/${transfer.transferId}/reject`, {
        reason: reason || "Rejected",
      });
      if (response.data?.isSuccess) {
        notify("Transfer rejected", "success", 3000);
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to reject transfer", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to reject transfer", "error", 3000);
    }
  };

  const handleDispatch = async (transfer) => {
    if (!window.confirm(`Dispatch vehicle ${transfer.vehicleHyoungNo} from ${transfer.fromSiteName} to ${transfer.toSiteName}?`)) return;
    try {
      const response = await axiosInstance.post(`/vehicletransfers/${transfer.transferId}/dispatch`);
      if (response.data?.isSuccess) {
        notify("Vehicle dispatched successfully", "success", 3000);
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to dispatch transfer", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to dispatch transfer", "error", 3000);
    }
  };

  const handleConfirmReceipt = async (transfer) => {
    const remarks = window.prompt(`Confirm receipt of vehicle ${transfer.vehicleHyoungNo}? Enter optional remarks:`);
    if (remarks === null) return;
    try {
      const response = await axiosInstance.post(`/vehicletransfers/${transfer.transferId}/confirm-receipt`, {
        remarks: remarks || "",
      });
      if (response.data?.isSuccess) {
        notify("Vehicle receipt confirmed successfully", "success", 3000);
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to confirm receipt", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to confirm receipt", "error", 3000);
    }
  };

  const handleDeleteTransfer = async (transfer) => {
    if (!window.confirm(`Delete transfer #${transfer.transferId} for ${transfer.vehicleHyoungNo || transfer.deliveryNoteNumber || "this vehicle"}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/vehicletransfers/${transfer.transferId}`);
      if (response.data?.isSuccess) {
        notify("Transfer deleted", "success", 3000);
        if (selectedTransfer?.transferId === transfer.transferId) {
          handleClosePanel();
        }
        loadTransfers();
      } else {
        notify(response.data?.message || "Failed to delete transfer", "error", 3000);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Failed to delete transfer", "error", 3000);
    }
  };

  // ── Cell renders ──

  const actionsCellRender = (cellData) => {
    const status = cellData.data.status?.toLowerCase();
    const canDelete = status === "draft" || status === "pending";

    return (
      <div className="transfer-actions">
        <button
          className="m365-icon-btn"
          title="View Details"
          onClick={() => handleViewDetails(cellData.data)}
        >
          <i className="fa-light fa-eye" />
        </button>
        {status === "draft" && (
          <>
            <button
              className="m365-icon-btn"
              title="Edit Draft"
              onClick={() => navigate(`/vehicles/transfers/edit/${cellData.data.transferId}`)}
            >
              <i className="fa-light fa-pen-to-square" />
            </button>
            <button
              className="m365-icon-btn m365-icon-btn--primary"
              title="Submit for Approval"
              onClick={() => handleSubmitForApproval(cellData.data)}
            >
              <i className="fa-light fa-paper-plane" />
            </button>
            <button
              className="m365-icon-btn m365-icon-btn--danger"
              title="Cancel"
              onClick={() => handleCancelTransfer(cellData.data)}
            >
              <i className="fa-light fa-ban" />
            </button>
          </>
        )}
        {canDelete && (
          <button
            className="m365-icon-btn m365-icon-btn--danger"
            title="Delete Transfer"
            onClick={() => handleDeleteTransfer(cellData.data)}
          >
            <i className="fa-light fa-trash" />
          </button>
        )}
        {status === "pendingapproval" && (
          <>
            <button
              className="m365-icon-btn m365-icon-btn--success"
              title="Approve"
              onClick={() => handleApprove(cellData.data)}
            >
              <i className="fa-light fa-check" />
            </button>
            <button
              className="m365-icon-btn m365-icon-btn--danger"
              title="Reject"
              onClick={() => handleReject(cellData.data)}
            >
              <i className="fa-light fa-xmark" />
            </button>
          </>
        )}
        {status === "approved" && (
          <button
            className="m365-icon-btn"
            title="Dispatch"
            onClick={() => handleDispatch(cellData.data)}
          >
            <i className="fa-light fa-truck-fast" />
          </button>
        )}
        {status === "intransit" && (
          <button
            className="m365-icon-btn m365-icon-btn--success"
            title="Confirm Receipt"
            onClick={() => handleConfirmReceipt(cellData.data)}
          >
            <i className="fa-light fa-box-check" />
          </button>
        )}
      </div>
    );
  };

  const handleClearFilters = () => {
    setFilterSiteId("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters = filterSiteId || filterStatus || filterDateFrom || filterDateTo;

  return (
    <div className="vehicle-transfer-list-page">
      {/* ── M365 Page Header ── */}
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-truck-arrow-right m365-page-header__icon" />
          <h2 className="m365-page-header__title">
            Vehicle Transfers
            <span className="m365-page-header__count">{transfers.length}</span>
          </h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--ghost" onClick={() => loadTransfers()}>
            <i className="fa-light fa-arrows-rotate" /> Refresh
          </button>
          <button className="m365-btn m365-btn--primary" onClick={() => navigate("/vehicles/transfers/new")}>
            <i className="fa-light fa-plus" /> New Transfer
          </button>
        </div>
      </div>

      {/* ── M365 Filter Bar ── */}
      <div className="m365-filters">
        <select
          className="m365-select"
          value={filterSiteId}
          onChange={(e) => setFilterSiteId(e.target.value)}
        >
          <option value="">All Sites</option>
          {(sites || []).map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>

        <select
          className="m365-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="PendingApproval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="InTransit">In Transit</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          className="m365-date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          title="From date"
        />

        <input
          type="date"
          className="m365-date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          title="To date"
        />

        {hasActiveFilters && (
          <button className="m365-btn m365-btn--text" onClick={handleClearFilters}>
            <i className="fa-light fa-xmark" /> Clear
          </button>
        )}
      </div>

      {/* ── Data Grid ── */}
      <div className="transfer-grid-container">
        <DataGrid
          ref={dataGridRef}
          dataSource={transfers}
          keyExpr="transferId"
          width="100%"
          showBorders={false}
          showRowLines={true}
          allowColumnResizing={true}
          columnResizingMode="widget"
          columnAutoWidth={true}
          wordWrapEnabled={true}
          height="100%"
          hoverStateEnabled={true}
          rowAlternationEnabled={false}
          onRowDblClick={(e) => handleViewDetails(e.data)}
        >
          <LoadPanel enabled={loading} />
          <Selection mode="single" />
          <SearchPanel visible={true} width={250} placeholder="Search transfers…" />
          <HeaderFilter visible={true} />
          <FilterRow visible={false} />
          <Sorting mode="multiple" />
          <Paging defaultPageSize={20} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
            showInfo={true}
            showNavigationButtons={true}
          />
          <ColumnChooser enabled={true} mode="select" />
          <Export enabled={true} allowExportSelectedData={false} />

          <Column dataField="transferId" caption="ID" width={60} alignment="center" />
          <Column
            dataField="vehicleHyoungNo"
            caption="Vehicle No"
            minWidth={100}
            fixed={true}
            fixedPosition="left"
          />
          <Column dataField="vehicleNumberPlate" caption="Reg. No" width={110} />
          <Column dataField="fromSiteName" caption="From Site" width={140} />
          <Column dataField="toSiteName" caption="To Site" width={140} />
          <Column
            dataField="transferDate"
            caption="Transfer Date"
            width={120}
            cellRender={dateCellRender}
            dataType="date"
          />
          <Column dataField="driverName" caption="Driver" width={130} />
          <Column
            dataField="status"
            caption="Status"
            width={130}
            cellRender={statusCellRender}
          />
          <Column dataField="deliveryNoteNumber" caption="Del. Note" width={100} />
          <Column
            caption="Actions"
            width={190}
            fixed={true}
            fixedPosition="right"
            cellRender={actionsCellRender}
            allowFiltering={false}
            allowSorting={false}
          />
        </DataGrid>
      </div>

      {/* ── Detail Side Panel ── */}
      <SlidePanel
        open={showDetailPanel}
        onClose={handleClosePanel}
        title={`Transfer #${selectedTransfer?.deliveryNoteNumber || selectedTransfer?.transferId || ""}`}
        width="min(1440px, calc(100vw - 32px))"
      >
        {detailLoading ? (
          <div className="tw-flex tw-items-center tw-justify-center tw-py-16">
            <i className="fa-light fa-spinner-third fa-spin tw-text-2xl tw-text-gray-400" />
          </div>
        ) : selectedTransfer ? (
          <VehicleTransferDetails
            transfer={selectedTransfer}
            onClose={handleClosePanel}
            onRefresh={handlePanelRefresh}
          />
        ) : null}
      </SlidePanel>

      {/* ── Approval Manager Selector Dialog ── */}
      <SlidePanel
        open={showApprovalDialog}
        onClose={handleCloseApprovalPanel}
        title="Submit for Approval"
        width={520}
        panelClassName="transfer-approval-panel"
      >
        <div className="transfer-approval-panel__content">
          <div className="transfer-approval-panel__hero">
            <div className="transfer-approval-panel__hero-icon">
              <i className="fa-light fa-paper-plane-top" />
            </div>
            <div className="transfer-approval-panel__hero-copy">
              <h4>Route Transfer for Review</h4>
              <p>
                Send transfer <strong>#{approvalTransfer?.deliveryNoteNumber || approvalTransfer?.transferId || "-"}</strong>
                {" "}to a workshop manager for approval.
              </p>
            </div>
          </div>

          <div className="transfer-approval-panel__summary">
            <div className="transfer-approval-panel__summary-item">
              <span className="transfer-approval-panel__summary-label">Vehicle</span>
              <span className="transfer-approval-panel__summary-value">{approvalTransfer?.vehicleHyoungNo || "-"}</span>
            </div>
            <div className="transfer-approval-panel__summary-item">
              <span className="transfer-approval-panel__summary-label">Route</span>
              <span className="transfer-approval-panel__summary-value">
                {approvalTransfer?.fromSiteName || "-"} to {approvalTransfer?.toSiteName || "-"}
              </span>
            </div>
            <div className="transfer-approval-panel__summary-item">
              <span className="transfer-approval-panel__summary-label">Transfer Date</span>
              <span className="transfer-approval-panel__summary-value">
                {approvalTransfer?.transferDate
                  ? new Date(approvalTransfer.transferDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : "-"}
              </span>
            </div>
          </div>

          <div className="transfer-approval-panel__form">
            <label className="transfer-approval-panel__label" htmlFor="approvalUserId">
              Workshop Manager
            </label>
            <select
              id="approvalUserId"
              className="m365-select transfer-approval-panel__select"
              value={approvalUserId}
              onChange={(e) => setApprovalUserId(e.target.value)}
            >
              <option value="">Select Workshop Manager…</option>
              {workshopUsers.map((u) => (
                <option key={u._id} value={u._id}>{u._name} ({u._email})</option>
              ))}
            </select>
            <p className="transfer-approval-panel__hint">
              The selected manager receives the approval email link for this transfer.
            </p>
          </div>

          <div className="transfer-approval-panel__footer">
            <button className="m365-btn m365-btn--ghost" onClick={handleCloseApprovalPanel}>
              Cancel
            </button>
            <button
              className="m365-btn m365-btn--primary"
              disabled={!approvalUserId}
              onClick={handleConfirmSubmitForApproval}
            >
              <i className="fa-light fa-paper-plane" /> Submit
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
};

export default VehicleTransferListPage;
