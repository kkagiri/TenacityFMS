/**
 * File:          VehicleTransferDetails.js
 * Purpose:       M365-styled detail view for a single vehicle transfer (inside SlidePanel)
 * Dependencies:  axiosInstance, m365-shared.scss tokens
 * Last Modified: 2026-02-02
 *
 * Key Components:
 * - Workflow action bar (approve / reject / dispatch / confirm receipt)
 * - Vehicle info, transfer route, driver & timing, equipment readings
 * - GPS equipment checkup, checkup items table, remarks, approvals
 */

import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import { fetchUsers } from "../../../redux/actions/userActions";
import { getUserId, getUserDisplayName } from "./vehicleTransferFormUtils";

import "./VehicleTransferDetails.scss";

const TABS = [
  { key: "details", label: "Details", icon: "fa-light fa-file-lines" },
  { key: "inspection", label: "Equipment Inspection", icon: "fa-light fa-clipboard-check" },
];

const VehicleTransferDetails = ({ transfer, onClose, onRefresh }) => {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.user?.users || []);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [approvalUserId, setApprovalUserId] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const workshopUsers = useMemo(
    () =>
      (Array.isArray(users) ? users : [])
        .filter((u) => u && typeof u === "object")
        .map((u) => ({ ...u, _id: getUserId(u), _name: getUserDisplayName(u), _email: u?.email || u?.Email || "" }))
        .filter((u) => u._id !== null && !u?.isDeleted && u._name && u._email),
    [users]
  );

  if (!transfer) {
    return (
      <div className="transfer-details__empty">
        <i className="fa-light fa-circle-info" />
        <span>No transfer data available</span>
      </div>
    );
  }

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
    const info = map[s] || { cls: "m365-badge--neutral", text: status || "-" };
    return <span className={`m365-badge ${info.cls}`}>{info.text}</span>;
  };

  // ── Submit for approval ──
  const handleSubmitForApproval = async () => {
    if (!approvalUserId) {
      notify("Please select a workshop manager first", "warning", 3000);
      return;
    }
    const selectedUser = workshopUsers.find((u) => String(u._id) === String(approvalUserId));
    if (!selectedUser) {
      notify("Selected user not found", "error", 3000);
      return;
    }
    setActionLoading(true);
    try {
      const response = await axiosInstance.post(
        `/vehicletransfers/${transfer.transferId}/submit-approval`,
        {
          workshopManagerEmail: selectedUser._email,
          workshopManagerName: selectedUser._name,
          approvalBaseUrl: window.location.origin,
        }
      );
      if (response.data?.isSuccess) {
        notify("Transfer submitted for approval", "success", 3000);
        if (onRefresh) onRefresh();
      } else {
        notify(response.data?.message || "Failed to submit", "error", 3000);
      }
    } catch (error) {
      notify(
        error.response?.data?.message || "An error occurred",
        "error",
        3000
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── Cancel transfer ──
  const handleCancelTransfer = async () => {
    if (!window.confirm("Are you sure you want to cancel this transfer?")) return;
    setActionLoading(true);
    try {
      const response = await axiosInstance.put(
        `/vehicletransfers/${transfer.transferId}/status`,
        { status: "Cancelled" }
      );
      if (response.data?.isSuccess) {
        notify("Transfer cancelled", "success", 3000);
        if (onRefresh) onRefresh();
      } else {
        notify(response.data?.message || "Failed to cancel", "error", 3000);
      }
    } catch (error) {
      notify(
        error.response?.data?.message || "An error occurred",
        "error",
        3000
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── Workflow action ──
  const handleWorkflowAction = async (endpoint, successMsg) => {
    setActionLoading(true);
    try {
      const response = await axiosInstance.post(
        `/vehicletransfers/${transfer.transferId}/${endpoint}`
      );
      if (response.data?.isSuccess) {
        notify(successMsg, "success", 3000);
        if (onRefresh) onRefresh();
      } else {
        notify(response.data?.message || "Action failed", "error", 3000);
      }
    } catch (error) {
      notify(
        error.response?.data?.message || "An error occurred",
        "error",
        3000
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── Date formatters ──
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ── Workflow action bar ──
  const renderActionBar = () => {
    const status = transfer.status?.toLowerCase();
    if (!status) return null;

    const buttons = [];

    if (status === "draft") {
      buttons.push(
        <div key="approval-selector" className="transfer-details__approval-selector">
          <select
            className="m365-select"
            value={approvalUserId}
            onChange={(e) => setApprovalUserId(e.target.value)}
          >
            <option value="">Select Workshop Manager…</option>
            {workshopUsers.map((u) => (
              <option key={u._id} value={u._id}>{u._name} ({u._email})</option>
            ))}
          </select>
        </div>,
        <button
          key="submit"
          className="m365-btn m365-btn--primary"
          disabled={actionLoading || !approvalUserId}
          onClick={() => handleSubmitForApproval()}
        >
          <i className="fa-light fa-paper-plane" /> Submit for Approval
        </button>,
        <button
          key="cancel"
          className="m365-btn m365-btn--danger"
          disabled={actionLoading}
          onClick={() => handleCancelTransfer()}
        >
          <i className="fa-light fa-ban" /> Cancel
        </button>
      );
    }

    if (status === "pendingapproval") {
      buttons.push(
        <button
          key="approve"
          className="m365-btn m365-btn--success"
          disabled={actionLoading}
          onClick={() => handleWorkflowAction("approve", "Transfer approved")}
        >
          <i className="fa-light fa-check" /> Approve
        </button>,
        <button
          key="reject"
          className="m365-btn m365-btn--danger"
          disabled={actionLoading}
          onClick={() => handleWorkflowAction("reject", "Transfer rejected")}
        >
          <i className="fa-light fa-xmark" /> Reject
        </button>
      );
    }

    if (status === "approved") {
      buttons.push(
        <button
          key="dispatch"
          className="m365-btn m365-btn--primary"
          disabled={actionLoading}
          onClick={() => handleWorkflowAction("dispatch", "Transfer dispatched")}
        >
          <i className="fa-light fa-truck-fast" /> Dispatch
        </button>
      );
    }

    if (status === "intransit") {
      buttons.push(
        <button
          key="confirm"
          className="m365-btn m365-btn--success"
          disabled={actionLoading}
          onClick={() => handleWorkflowAction("confirm-receipt", "Receipt confirmed")}
        >
          <i className="fa-light fa-clipboard-check" /> Confirm Receipt
        </button>
      );
    }

    if (buttons.length === 0) return null;

    return (
      <div className="transfer-details__action-bar">
        <i className="fa-light fa-bolt transfer-details__action-icon" />
        <span className="transfer-details__action-label">Actions</span>
        {buttons}
      </div>
    );
  };

  return (
    <div className="transfer-details">
      {/* ── Summary header ── */}
      <div className="transfer-details__summary">
        <div className="transfer-details__summary-left">
          <span className="transfer-details__meta">
            Created {formatDateTime(transfer.dateCreated)}
          </span>
        </div>
        {getStatusBadge(transfer.status)}
      </div>

      {/* ── Workflow actions ── */}
      {renderActionBar()}

      {/* ── Tabs ── */}
      <div className="m365-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`m365-tab${activeTab === tab.key ? " m365-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ DETAILS TAB ═══════ */}
      {activeTab === "details" && (
      <>

      {/* ── Vehicle Information ── */}
      <div className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-truck m365-section-group__icon" />
          <span className="m365-section-group__title">Vehicle Information</span>
        </div>
        <div className="m365-section-group__body">
          <div className="m365-info-grid m365-info-grid--4col">
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Vehicle No</span>
              <span className="m365-info-cell__value">{transfer.vehicleHyoungNo || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Reg. No</span>
              <span className="m365-info-cell__value">{transfer.vehicleNumberPlate || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Make &amp; Model</span>
              <span className="m365-info-cell__value">{transfer.makeModel || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Job Number</span>
              <span className="m365-info-cell__value">{transfer.jobNumber || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transfer Route & Driver ── */}
      <div className="transfer-details__two-col">
        {/* Route */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-route m365-section-group__icon" />
            <span className="m365-section-group__title">Transfer Route</span>
          </div>
          <div className="m365-section-group__body">
            <div className="transfer-details__route">
              <div className="transfer-details__route-site transfer-details__route-site--from">
                <span className="transfer-details__route-label">From</span>
                <span className="transfer-details__route-name">{transfer.fromSiteName || "—"}</span>
              </div>
              <i className="fa-light fa-arrow-right transfer-details__route-arrow" />
              <div className="transfer-details__route-site transfer-details__route-site--to">
                <span className="transfer-details__route-label">To</span>
                <span className="transfer-details__route-name">{transfer.toSiteName || "—"}</span>
              </div>
            </div>
            <div className="m365-info-row" style={{ marginTop: 12 }}>
              <span className="m365-info-row__label">Transfer Date</span>
              <span className="m365-info-row__value">{formatDate(transfer.transferDate)}</span>
            </div>
          </div>
        </div>

        {/* Driver & Timing */}
        <div className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-user m365-section-group__icon" />
            <span className="m365-section-group__title">Driver &amp; Timing</span>
          </div>
          <div className="m365-section-group__body">
            <div className="m365-info-row">
              <span className="m365-info-row__label">Driver</span>
              <span className="m365-info-row__value">{transfer.driverName || "—"}</span>
            </div>
            <div className="m365-info-row">
              <span className="m365-info-row__label">Phone</span>
              <span className="m365-info-row__value">{transfer.driverPhone || "—"}</span>
            </div>
            <div className="m365-info-row">
              <span className="m365-info-row__label">Departure</span>
              <span className="m365-info-row__value">{formatDateTime(transfer.departureTime)}</span>
            </div>
            <div className="m365-info-row">
              <span className="m365-info-row__label">Arrival</span>
              <span className="m365-info-row__value">{formatDateTime(transfer.arrivalTime)}</span>
            </div>
            {transfer.dispatchedAt && (
              <div className="m365-info-row">
                <span className="m365-info-row__label">Dispatched</span>
                <span className="m365-info-row__value">{formatDateTime(transfer.dispatchedAt)}</span>
              </div>
            )}
            {transfer.receivedAt && (
              <div className="m365-info-row">
                <span className="m365-info-row__label">Received</span>
                <span className="m365-info-row__value">{formatDateTime(transfer.receivedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Equipment Reading ── */}
      <div className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-gauge m365-section-group__icon" />
          <span className="m365-section-group__title">Equipment Reading</span>
        </div>
        <div className="m365-section-group__body">
          <div className="m365-info-grid m365-info-grid--4col">
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Current Reading</span>
              <span className="m365-info-cell__value m365-info-cell__value--lg">
                {transfer.currentReading || "—"}{" "}
                <span className="m365-info-cell__unit">{transfer.readingUnit || "hrs"}</span>
              </span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Next Service</span>
              <span className="m365-info-cell__value m365-info-cell__value--lg">
                {transfer.nextServiceReading || "—"}{" "}
                <span className="m365-info-cell__unit">{transfer.readingUnit || "hrs"}</span>
              </span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Fuel in Tank</span>
              <span className="m365-info-cell__value m365-info-cell__value--lg">
                {transfer.fuelInTank || "—"} <span className="m365-info-cell__unit">L</span>
              </span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Seal Number</span>
              <span className="m365-info-cell__value">{transfer.sealNumber || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Remarks ── */}
      {transfer.remarks && (
        <div className="m365-section-group transfer-details__remarks-section">
          <div className="m365-section-group__header">
            <i className="fa-light fa-comment m365-section-group__icon" />
            <span className="m365-section-group__title">Remarks</span>
          </div>
          <div className="m365-section-group__body">
            <p className="transfer-details__remarks-text">{transfer.remarks}</p>
          </div>
        </div>
      )}

      {/* ── Approvals ── */}
      <div className="m365-section-group">
        <div className="m365-section-group__header">
          <i className="fa-light fa-signature m365-section-group__icon" />
          <span className="m365-section-group__title">Approvals</span>
        </div>
        <div className="m365-section-group__body">
          <div className="m365-info-grid m365-info-grid--4col">
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Workshop Manager</span>
              <span className="m365-info-cell__value">{transfer.workshopManagerSign || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Sender</span>
              <span className="m365-info-cell__value">{transfer.senderName || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Receiver</span>
              <span className="m365-info-cell__value">{transfer.receiverUserName || transfer.receiverName || "—"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Approved By</span>
              <span className="m365-info-cell__value">{transfer.approverUserName || transfer.approvedBy || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Document download ── */}
      {transfer.documentUrl && (
        <div className="transfer-details__doc-action">
          <button
            className="m365-btn m365-btn--ghost"
            onClick={() => window.open(transfer.documentUrl, "_blank")}
          >
            <i className="fa-light fa-file-pdf" /> View Transfer Document
          </button>
        </div>
      )}

      </> /* end Details tab */
      )}

      {/* ═══════ EQUIPMENT INSPECTION TAB ═══════ */}
      {activeTab === "inspection" && (
      <>
        {/* ── GPS Equipment Checkup ── */}
        {(transfer.gpsDeviceId || transfer.fuelSensorId ||
          transfer.gpsDeviceCondition || transfer.fuelSensorCondition) && (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-satellite-dish m365-section-group__icon" />
              <span className="m365-section-group__title">GPS Equipment Checkup</span>
            </div>
            <div className="m365-section-group__body">
              <div className="transfer-details__two-col">
                {/* GPS Device */}
                <div className="transfer-details__device-card">
                  <h4 className="transfer-details__device-title">
                    <i className="fa-light fa-location-dot" /> GPS Device
                  </h4>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Device ID / Serial</span>
                    <span className="m365-info-row__value">{transfer.gpsDeviceId || "—"}</span>
                  </div>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Condition</span>
                    <span className="m365-info-row__value">{transfer.gpsDeviceCondition || "—"}</span>
                  </div>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Working</span>
                    <span className={`m365-info-row__value ${transfer.gpsDeviceWorking ? "transfer-details__yes" : "transfer-details__no"}`}>
                      {transfer.gpsDeviceWorking ? "Yes" : "No"}
                    </span>
                  </div>
                  {transfer.gpsDeviceRemarks && (
                    <div className="m365-info-row">
                      <span className="m365-info-row__label">Remarks</span>
                      <span className="m365-info-row__value">{transfer.gpsDeviceRemarks}</span>
                    </div>
                  )}
                </div>

                {/* Fuel Sensor */}
                <div className="transfer-details__device-card">
                  <h4 className="transfer-details__device-title">
                    <i className="fa-light fa-gas-pump" /> Fuel Sensor
                  </h4>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Sensor ID / Serial</span>
                    <span className="m365-info-row__value">{transfer.fuelSensorId || "—"}</span>
                  </div>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Condition</span>
                    <span className="m365-info-row__value">{transfer.fuelSensorCondition || "—"}</span>
                  </div>
                  <div className="m365-info-row">
                    <span className="m365-info-row__label">Working</span>
                    <span className={`m365-info-row__value ${transfer.fuelSensorWorking ? "transfer-details__yes" : "transfer-details__no"}`}>
                      {transfer.fuelSensorWorking ? "Yes" : "No"}
                    </span>
                  </div>
                  {transfer.fuelSensorRemarks && (
                    <div className="m365-info-row">
                      <span className="m365-info-row__label">Remarks</span>
                      <span className="m365-info-row__value">{transfer.fuelSensorRemarks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Checkup Items ── */}
        {transfer.checkupItems?.length > 0 ? (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-clipboard-check m365-section-group__icon" />
              <span className="m365-section-group__title">Checkup Items</span>
            </div>
            <div className="m365-section-group__body" style={{ padding: 0 }}>
              <table className="transfer-details__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th className="transfer-details__table-center">Good</th>
                    <th className="transfer-details__table-center">Fair</th>
                    <th className="transfer-details__table-center">Damaged</th>
                    <th className="transfer-details__table-center">Worn</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.checkupItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.serialNo}</td>
                      <td>{item.description}</td>
                      <td className="transfer-details__table-center">
                        {item.isGood && <i className="fa-solid fa-check" style={{ color: "#107c10" }} />}
                      </td>
                      <td className="transfer-details__table-center">
                        {item.isFair && <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />}
                      </td>
                      <td className="transfer-details__table-center">
                        {item.isDamaged && <i className="fa-solid fa-check" style={{ color: "#d13438" }} />}
                      </td>
                      <td className="transfer-details__table-center">
                        {item.isWorn && (
                          <span>
                            <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />
                            {item.wornPercentage && ` ${item.wornPercentage}%`}
                          </span>
                        )}
                      </td>
                      <td>{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="transfer-details__empty-section">
            <i className="fa-light fa-clipboard" />
            <span>No checkup items recorded</span>
          </div>
        )}

        {/* ── Tyre Details ── */}
        {transfer.tyreDetails?.length > 0 && (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-tire m365-section-group__icon" />
              <span className="m365-section-group__title">Tyre Details</span>
            </div>
            <div className="m365-section-group__body" style={{ padding: 0 }}>
              <table className="transfer-details__table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Brand</th>
                    <th>Size</th>
                    <th>Condition (%)</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.tyreDetails.map((tyre) => (
                    <tr key={tyre.id}>
                      <td>{tyre.position || "—"}</td>
                      <td>{tyre.brand || "—"}</td>
                      <td>{tyre.size || "—"}</td>
                      <td>
                        {tyre.condition != null ? (
                          <span className={`m365-badge ${
                            tyre.condition >= 70 ? "m365-badge--success" :
                            tyre.condition >= 40 ? "m365-badge--warning" : "m365-badge--error"
                          }`}>
                            {tyre.condition}%
                          </span>
                        ) : "—"}
                      </td>
                      <td>{tyre.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Battery Details ── */}
        {transfer.batteryDetails?.length > 0 && (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-car-battery m365-section-group__icon" />
              <span className="m365-section-group__title">Battery Details</span>
            </div>
            <div className="m365-section-group__body" style={{ padding: 0 }}>
              <table className="transfer-details__table">
                <thead>
                  <tr>
                    <th>Battery No.</th>
                    <th>Condition</th>
                    <th>Voltage (V)</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.batteryDetails.map((bat) => (
                    <tr key={bat.id}>
                      <td>{bat.batteryNumber || "—"}</td>
                      <td>{bat.condition || "—"}</td>
                      <td>{bat.voltage != null ? `${bat.voltage}V` : "—"}</td>
                      <td>{bat.remarks || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Service Filter Parts ── */}
        {transfer.serviceFilterPartsList?.length > 0 && (
          <div className="m365-section-group">
            <div className="m365-section-group__header">
              <i className="fa-light fa-filter m365-section-group__icon" />
              <span className="m365-section-group__title">Service Filter Parts</span>
            </div>
            <div className="m365-section-group__body" style={{ padding: 0 }}>
              <table className="transfer-details__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Part Number</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.serviceFilterPartsList.map((part, idx) => (
                    <tr key={idx}>
                      <td>{part.number || idx + 1}</td>
                      <td>{part.description || "—"}</td>
                      <td>{part.partNumber || "—"}</td>
                      <td>{part.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Empty state for inspection tab ── */}
        {!transfer.checkupItems?.length && !transfer.tyreDetails?.length &&
         !transfer.batteryDetails?.length && !transfer.serviceFilterPartsList?.length && (
          <div className="transfer-details__empty-section">
            <i className="fa-light fa-clipboard-question" />
            <span>No equipment inspection data recorded for this transfer</span>
          </div>
        )}

      </> /* end Equipment Inspection tab */
      )}
    </div>
  );
};

export default VehicleTransferDetails;
