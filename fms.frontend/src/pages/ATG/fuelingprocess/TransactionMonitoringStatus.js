/**
 * File: TransactionMonitoringStatus.js
 * Purpose: Mobile-aligned real-time transaction monitoring modal for web ATG fueling
 * Dependencies: React, Redux realtimeStatus, ptsSignalRService, DevExtreme Button/ProgressBar/LoadPanel
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - Tracks transaction lifecycle from upload status + SignalR event stream
 * - Displays live volume/amount, timing, pump state, connection, and fueling context
 * - Supports stop/cancel and completion actions through parent callbacks
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { ProgressBar } from "devextreme-react/progress-bar";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import "./TransactionMonitoringStatus.scss";

const TransactionStatus = {
  AUTHORIZED: "authorized",
  WAITING_NOZZLE: "waiting_nozzle",
  FUELING: "fueling",
  STOPPING: "stopping",
  END_OF_TRANSACTION: "end_of_transaction",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};
const PumpSnapshotType = {
  IDLE: "idle",
  FILLING: "filling",
  END_OF_TRANSACTION: "end_of_transaction",
  OFFLINE: "offline",
};

const toNumOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};
const toNumOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const pickNode = (node, pascalName, camelName) => node?.[pascalName] ?? node?.[camelName] ?? null;
const pickArray = (node, pascalName, camelName) => node?.[pascalName] ?? node?.[camelName] ?? [];

const buildSnapshot = (
  source,
  type,
  pumpId,
  { transactionField, volumeField, amountField, fallbackVolumeField, fallbackAmountField, nozzleField } = {}
) => {
  if (!source) return null;
  const ids = pickArray(source, "Ids", "ids");
  const index = ids.findIndex((id) => toNumOrNull(id) === toNumOrNull(pumpId));
  if (index === -1) return null;
  const transactions = transactionField ? pickArray(source, transactionField.pascal, transactionField.camel) : [];
  const volumes = volumeField ? pickArray(source, volumeField.pascal, volumeField.camel) : [];
  const amounts = amountField ? pickArray(source, amountField.pascal, amountField.camel) : [];
  const fallbackVolumes = fallbackVolumeField ? pickArray(source, fallbackVolumeField.pascal, fallbackVolumeField.camel) : [];
  const fallbackAmounts = fallbackAmountField ? pickArray(source, fallbackAmountField.pascal, fallbackAmountField.camel) : [];
  const nozzles = nozzleField ? pickArray(source, nozzleField.pascal, nozzleField.camel) : [];
  return {
    type,
    transactionId: toNumOrNull(transactions[index]),
    volume: toNumOrNull(volumes[index]) ?? toNumOrNull(fallbackVolumes[index]),
    amount: toNumOrNull(amounts[index]) ?? toNumOrNull(fallbackAmounts[index]),
    nozzle: toNumOrNull(nozzles[index]),
  };
};

const parsePumpSnapshot = (uploadStatus, pumpId) => {
  if (!uploadStatus || !pumpId) return null;
  const pumps = pickNode(uploadStatus, "Pumps", "pumps");
  if (!pumps) return null;
  return (
    buildSnapshot(pickNode(pumps, "FillingStatus", "fillingStatus"), PumpSnapshotType.FILLING, pumpId, {
      transactionField: { pascal: "Transactions", camel: "transactions" },
      volumeField: { pascal: "Volumes", camel: "volumes" },
      amountField: { pascal: "Amounts", camel: "amounts" },
      nozzleField: { pascal: "Nozzles", camel: "nozzles" },
    }) ||
    buildSnapshot(pickNode(pumps, "EndOfTransactionStatus", "endOfTransactionStatus"), PumpSnapshotType.END_OF_TRANSACTION, pumpId, {
      transactionField: { pascal: "Transactions", camel: "transactions" },
      volumeField: { pascal: "Volumes", camel: "volumes" },
      amountField: { pascal: "Amounts", camel: "amounts" },
      nozzleField: { pascal: "Nozzles", camel: "nozzles" },
    }) ||
    buildSnapshot(pickNode(pumps, "IdleStatus", "idleStatus"), PumpSnapshotType.IDLE, pumpId, {
      transactionField: { pascal: "LastTransactions", camel: "lastTransactions" },
      volumeField: { pascal: "LastVolumes", camel: "lastVolumes" },
      amountField: { pascal: "LastAmounts", camel: "lastAmounts" },
      fallbackVolumeField: { pascal: "Volumes", camel: "volumes" },
      fallbackAmountField: { pascal: "Amounts", camel: "amounts" },
      nozzleField: { pascal: "NozzlesUp", camel: "nozzlesUp" },
    }) ||
    buildSnapshot(pickNode(pumps, "OfflineStatus", "offlineStatus"), PumpSnapshotType.OFFLINE, pumpId)
  );
};

const matchTransaction = (incomingTransactionId, monitoredTransactionId) => {
  const monitored = toNumOrNull(monitoredTransactionId);
  if (monitored === null) return true;
  const incoming = toNumOrNull(incomingTransactionId);
  if (incoming === null) return false;
  return incoming === monitored;
};
const formatElapsed = (seconds) => {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};
const formatStatusText = (status) =>
  String(status || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const TransactionMonitoringStatus = ({
  deviceId,
  pumpId,
  transactionId,
  isVisible,
  onCancel,
  onComplete,
  connectionType = "Unknown",
}) => {
  const [status, setStatus] = useState(TransactionStatus.AUTHORIZED);
  const [volume, setVolume] = useState(0);
  const [amount, setAmount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPumpStatus, setCurrentPumpStatus] = useState(null);
  const [currentNozzle, setCurrentNozzle] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  const statusRef = useRef(status);
  const volumeRef = useRef(volume);
  const amountRef = useRef(amount);
  const startTimeRef = useRef(startTime);

  const uploadStatus = useSelector(
    (reduxState) => reduxState.realtimeStatus?.uploadStatusByDevice?.[deviceId]?.status || null
  );
  const fuelingContext = useSelector(
    (reduxState) => reduxState.realtimeStatus?.deviceFuelingContexts?.[deviceId]?.[toNumOrZero(pumpId)] || null
  );

  useEffect(() => {
    statusRef.current = status;
    volumeRef.current = volume;
    amountRef.current = amount;
    startTimeRef.current = startTime;
  }, [status, volume, amount, startTime]);

  const addStatusHistory = useCallback((entryStatus, entryVolume, entryAmount) => {
    const now = new Date();
    setStatusHistory((previous) => {
      const entry = {
        timestamp: now,
        status: entryStatus,
        volume: entryVolume === null || entryVolume === undefined ? null : Number(entryVolume),
        amount: entryAmount === null || entryAmount === undefined ? null : Number(entryAmount),
      };
      return [...previous.slice(-9), entry];
    });
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    setStatus(TransactionStatus.AUTHORIZED);
    setVolume(0);
    setAmount(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setCurrentPumpStatus(null);
    setCurrentNozzle(null);
    setLastUpdated(new Date());
    setStatusHistory([{ timestamp: new Date(), status: TransactionStatus.AUTHORIZED, volume: 0, amount: 0 }]);
  }, [isVisible, deviceId, pumpId, transactionId]);

  useEffect(() => {
    const handleConnectionStatusChanged = (connected) => {
      const nextConnected = Boolean(connected);
      setIsConnected(nextConnected);
      if (!nextConnected) {
        setStatus((currentStatus) => {
          if (currentStatus === TransactionStatus.COMPLETED || currentStatus === TransactionStatus.CANCELLED) {
            return currentStatus;
          }
          return TransactionStatus.DISCONNECTED;
        });
      }
    };
    const unsubscribe = ptsSignalRService.on("connectionStatusChanged", handleConnectionStatusChanged);
    handleConnectionStatusChanged(ptsSignalRService.isConnected);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !deviceId || !pumpId) return;
    const snapshot = parsePumpSnapshot(uploadStatus, pumpId);
    if (!snapshot) return;
    setCurrentPumpStatus(snapshot.type);
    setCurrentNozzle(snapshot.nozzle);
    setLastUpdated(new Date());

    const currentStatus = statusRef.current;
    const matchesTransaction = matchTransaction(snapshot.transactionId, transactionId);

    if (snapshot.type === PumpSnapshotType.FILLING) {
      if (snapshot.volume !== null) setVolume(snapshot.volume);
      if (snapshot.amount !== null) setAmount(snapshot.amount);
      if (
        currentStatus !== TransactionStatus.FUELING &&
        currentStatus !== TransactionStatus.COMPLETED &&
        currentStatus !== TransactionStatus.CANCELLED
      ) {
        setStatus(TransactionStatus.FUELING);
        if (!startTimeRef.current) setStartTime(Date.now());
        addStatusHistory(TransactionStatus.FUELING, snapshot.volume ?? volumeRef.current, snapshot.amount ?? amountRef.current);
      }
      return;
    }

    if (snapshot.type === PumpSnapshotType.END_OF_TRANSACTION) {
      if (!matchesTransaction) return;
      if (snapshot.volume !== null) setVolume(snapshot.volume);
      if (snapshot.amount !== null) setAmount(snapshot.amount);
      if (currentStatus !== TransactionStatus.END_OF_TRANSACTION && currentStatus !== TransactionStatus.COMPLETED) {
        setStatus(TransactionStatus.END_OF_TRANSACTION);
        addStatusHistory(
          TransactionStatus.END_OF_TRANSACTION,
          snapshot.volume ?? volumeRef.current,
          snapshot.amount ?? amountRef.current
        );
      }
      return;
    }

    if (snapshot.type === PumpSnapshotType.IDLE) {
      if (currentStatus === TransactionStatus.AUTHORIZED || currentStatus === TransactionStatus.WAITING_NOZZLE) {
        if (currentStatus !== TransactionStatus.WAITING_NOZZLE) {
          setStatus(TransactionStatus.WAITING_NOZZLE);
          addStatusHistory(TransactionStatus.WAITING_NOZZLE, snapshot.volume, snapshot.amount);
        }
        return;
      }

      const shouldComplete =
        (currentStatus === TransactionStatus.FUELING ||
          currentStatus === TransactionStatus.END_OF_TRANSACTION ||
          currentStatus === TransactionStatus.STOPPING) &&
        matchesTransaction;

      if (shouldComplete) {
        if (snapshot.volume !== null) setVolume(snapshot.volume);
        if (snapshot.amount !== null) setAmount(snapshot.amount);
        if (currentStatus !== TransactionStatus.COMPLETED) {
          setStatus(TransactionStatus.COMPLETED);
          addStatusHistory(TransactionStatus.COMPLETED, snapshot.volume ?? volumeRef.current, snapshot.amount ?? amountRef.current);
        }
      }
      return;
    }

    if (
      snapshot.type === PumpSnapshotType.OFFLINE &&
      currentStatus !== TransactionStatus.COMPLETED &&
      currentStatus !== TransactionStatus.CANCELLED
    ) {
      setStatus(TransactionStatus.DISCONNECTED);
      addStatusHistory(TransactionStatus.DISCONNECTED, volumeRef.current, amountRef.current);
    }
  }, [uploadStatus, isVisible, deviceId, pumpId, transactionId, addStatusHistory]);

  useEffect(() => {
    if (!isVisible || !deviceId || !pumpId) return;

    const handleFillingStatus = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) return;
      const eventPumpId = toNumOrNull(eventData.pumpId) ?? toNumOrNull(eventData.pump);
      if (eventPumpId !== toNumOrNull(pumpId)) return;

      const eventVolume = eventData.fillingData?.volume ?? eventData.volume ?? volumeRef.current;
      const eventAmount = eventData.fillingData?.amount ?? eventData.amount ?? amountRef.current;
      setVolume(toNumOrZero(eventVolume));
      setAmount(toNumOrZero(eventAmount));
      setStatus(TransactionStatus.FUELING);
      setLastUpdated(new Date());
      if (!startTimeRef.current) setStartTime(Date.now());
    };

    const handlePumpTransactionCompleted = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) return;
      const eventPumpId = toNumOrNull(eventData.pumpId) ?? toNumOrNull(eventData.pump);
      if (eventPumpId !== toNumOrNull(pumpId)) return;
      if (!matchTransaction(eventData.transactionId, transactionId)) return;

      const finalVolume = eventData.volume ?? eventData.transactionData?.volume ?? volumeRef.current;
      const finalAmount = eventData.amount ?? eventData.transactionData?.amount ?? amountRef.current;
      setVolume(toNumOrZero(finalVolume));
      setAmount(toNumOrZero(finalAmount));
      setStatus(TransactionStatus.COMPLETED);
      setLastUpdated(new Date());
      addStatusHistory(TransactionStatus.COMPLETED, finalVolume, finalAmount);
    };

    const handleFuelingEvent = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) return;
      const eventPumpId =
        toNumOrNull(eventData.fuelingData?.pumpId) ?? toNumOrNull(eventData.pumpId) ?? toNumOrNull(eventData.pump);
      if (eventPumpId !== null && eventPumpId !== toNumOrNull(pumpId)) return;
      const eventTransactionId = eventData.fuelingData?.transactionId || eventData.transactionId || eventData.transaction;
      if (!matchTransaction(eventTransactionId, transactionId)) return;

      const eventType = String(eventData.fuelingData?.type || eventData.type || eventData.eventType || "").toLowerCase();
      if (eventType.includes("started") || eventType.includes("filling") || eventType.includes("inprogress")) {
        if (!startTimeRef.current) setStartTime(Date.now());
        if (statusRef.current !== TransactionStatus.FUELING) {
          setStatus(TransactionStatus.FUELING);
          addStatusHistory(TransactionStatus.FUELING, volumeRef.current, amountRef.current);
        }
        setLastUpdated(new Date());
      }

      if (eventType.includes("completed") || eventType.includes("endoftransaction")) {
        if (statusRef.current !== TransactionStatus.END_OF_TRANSACTION) {
          setStatus(TransactionStatus.END_OF_TRANSACTION);
          addStatusHistory(TransactionStatus.END_OF_TRANSACTION, volumeRef.current, amountRef.current);
        }
        setLastUpdated(new Date());
      }
    };

    const unsubscribers = [
      ptsSignalRService.on("fillingStatus", handleFillingStatus),
      ptsSignalRService.on("pumpTransactionCompleted", handlePumpTransactionCompleted),
      ptsSignalRService.on("fuelingEvent", handleFuelingEvent),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    };
  }, [isVisible, deviceId, pumpId, transactionId, addStatusHistory]);

  useEffect(() => {
    const shouldTrackTime =
      isVisible &&
      startTime &&
      [TransactionStatus.FUELING, TransactionStatus.WAITING_NOZZLE, TransactionStatus.END_OF_TRANSACTION].includes(status);

    if (!shouldTrackTime) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isVisible, status, startTime]);

  useEffect(() => {
    if (!isVisible || !deviceId || !ptsSignalRService.isConnected) return;
    ptsSignalRService.requestDeviceStatus(deviceId).catch((error) => {
      console.error("[TransactionMonitoringStatus] Failed to request device status:", error);
    });
  }, [isVisible, deviceId]);

  const statusConfig = useMemo(() => {
    switch (status) {
      case TransactionStatus.AUTHORIZED:
        return { label: "Authorized", detail: "Pump authorized. Lift nozzle to begin fueling.", color: "#f59e0b", icon: "fa-light fa-key", progress: 15 };
      case TransactionStatus.WAITING_NOZZLE:
        return { label: "Waiting For Nozzle", detail: "Nozzle is down. Lift nozzle to start dispensing.", color: "#d97706", icon: "fa-light fa-hand-point-up", progress: 25 };
      case TransactionStatus.FUELING:
        return { label: "Fueling In Progress", detail: "Live volume and amount are updating.", color: "#2563eb", icon: "fa-light fa-gas-pump", progress: 65 };
      case TransactionStatus.STOPPING:
        return { label: "Stopping", detail: "Stop command sent. Waiting for pump idle state.", color: "#dc2626", icon: "fa-light fa-stop-circle", progress: 75 };
      case TransactionStatus.END_OF_TRANSACTION:
        return { label: "End Of Transaction", detail: "Dispensing ended. Finalize the transaction.", color: "#0ea5a4", icon: "fa-light fa-flag-checkered", progress: 90 };
      case TransactionStatus.COMPLETED:
        return { label: "Completed", detail: "Transaction values captured successfully.", color: "#15803d", icon: "fa-light fa-circle-check", progress: 100 };
      case TransactionStatus.CANCELLED:
        return { label: "Cancelled", detail: "Authorization/transaction was cancelled.", color: "#6b7280", icon: "fa-light fa-ban", progress: 0 };
      case TransactionStatus.DISCONNECTED:
        return { label: "Disconnected", detail: "Connection lost. Reconnect to continue monitoring.", color: "#b45309", icon: "fa-light fa-plug-circle-xmark", progress: 0 };
      default:
        return { label: "Error", detail: "Unexpected monitoring state.", color: "#dc2626", icon: "fa-light fa-triangle-exclamation", progress: 0 };
    }
  }, [status]);

  const canShowStop = status === TransactionStatus.FUELING;
  const canCancel = [
    TransactionStatus.AUTHORIZED,
    TransactionStatus.WAITING_NOZZLE,
    TransactionStatus.FUELING,
    TransactionStatus.ERROR,
  ].includes(status);
  const canComplete =
    status === TransactionStatus.END_OF_TRANSACTION ||
    status === TransactionStatus.COMPLETED ||
    (status === TransactionStatus.FUELING && currentPumpStatus === PumpSnapshotType.IDLE);

  const handleCancelTransaction = useCallback(async () => {
    if (!onCancel || !transactionId || !canCancel) return;
    setIsLoading(true);
    try {
      if (status === TransactionStatus.FUELING) setStatus(TransactionStatus.STOPPING);
      await onCancel(transactionId, "User cancelled from monitoring panel");
      setStatus(TransactionStatus.CANCELLED);
      setLastUpdated(new Date());
      addStatusHistory(TransactionStatus.CANCELLED, volumeRef.current, amountRef.current);
    } catch (error) {
      console.error("[TransactionMonitoringStatus] Failed to cancel transaction:", error);
      setStatus(TransactionStatus.ERROR);
      addStatusHistory(TransactionStatus.ERROR, volumeRef.current, amountRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [addStatusHistory, canCancel, onCancel, status, transactionId]);

  const handleCompleteTransaction = useCallback(async () => {
    if (!onComplete || !transactionId || !canComplete) return;
    setIsLoading(true);
    try {
      await onComplete(transactionId);
      setStatus(TransactionStatus.COMPLETED);
      setLastUpdated(new Date());
      addStatusHistory(TransactionStatus.COMPLETED, volumeRef.current, amountRef.current);
    } catch (error) {
      console.error("[TransactionMonitoringStatus] Failed to complete transaction:", error);
      setStatus(TransactionStatus.ERROR);
      addStatusHistory(TransactionStatus.ERROR, volumeRef.current, amountRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [addStatusHistory, canComplete, onComplete, transactionId]);

  const displayMode = useMemo(() => {
    if (fuelingContext?.mode) {
      return fuelingContext.mode;
    }

    if (fuelingContext?.sourceTankName || fuelingContext?.destinationTankName) {
      return "Transfer";
    }

    return "Vehicle";
  }, [
    fuelingContext?.mode,
    fuelingContext?.sourceTankName,
    fuelingContext?.destinationTankName,
  ]);
  const isTransferMode = String(displayMode || "").toLowerCase() === "transfer";
  const sourceTankDisplay =
    fuelingContext?.sourceTankName ||
    fuelingContext?.tankName ||
    (fuelingContext?.sourceTankId ? `Tank #${fuelingContext.sourceTankId}` : null);
  const destinationTankDisplay =
    fuelingContext?.destinationTankName ||
    (fuelingContext?.destinationTankId
      ? `Tank #${fuelingContext.destinationTankId}`
      : null);

  if (!isVisible || !transactionId) return null;

  return (
    <div className="tw-transaction-monitoring-overlay">
      <div className="tw-transaction-monitoring-modal">
        <LoadPanel visible={isLoading} showPane={true} message="Processing..." />

        <div className="tw-monitoring-header" style={{ borderTopColor: statusConfig.color }}>
          <div className="tw-header-main">
            <div className="tw-header-status-icon" style={{ backgroundColor: `${statusConfig.color}20` }}>
              <i className={statusConfig.icon} style={{ color: statusConfig.color }}></i>
            </div>
            <div className="tw-header-text">
              <h4 className="tw-header-title">Fueling Monitor</h4>
              <span className="tw-header-subtitle">TX #{transactionId}</span>
            </div>
          </div>
          <div className="tw-header-meta">
            <span className={`tw-connection-pill ${isConnected ? "tw-online" : "tw-offline"}`}>
              <i className={`fa-light ${isConnected ? "fa-wifi" : "fa-plug-circle-xmark"}`}></i>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="tw-connection-type">{connectionType}</span>
          </div>
        </div>

        <div className="tw-monitoring-body">
          <div className="tw-status-card">
            <div className="tw-status-row">
              <div>
                <div className="tw-status-label">{statusConfig.label}</div>
                <div className="tw-status-detail">{statusConfig.detail}</div>
              </div>
              <span className="tw-pump-chip">Pump #{pumpId}</span>
            </div>
            <ProgressBar value={statusConfig.progress} showStatus={false} className="tw-status-progress" />
          </div>

          <div className="tw-live-display">
            <div className="tw-live-cell">
              <span className="tw-live-label">Volume</span>
              <span className="tw-live-value">{toNumOrZero(volume).toFixed(2)} L</span>
            </div>
            <div className="tw-live-divider"></div>
            <div className="tw-live-cell">
              <span className="tw-live-label">Amount</span>
              <span className="tw-live-value">{toNumOrZero(amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="tw-details-grid">
            <div className="tw-detail-item"><span className="tw-detail-key">Elapsed</span><span className="tw-detail-value">{formatElapsed(elapsedSeconds)}</span></div>
            <div className="tw-detail-item"><span className="tw-detail-key">Pump State</span><span className="tw-detail-value">{formatStatusText(currentPumpStatus || "waiting")}</span></div>
            <div className="tw-detail-item"><span className="tw-detail-key">Nozzle</span><span className="tw-detail-value">{currentNozzle !== null && currentNozzle !== undefined ? `#${currentNozzle}` : "N/A"}</span></div>
            <div className="tw-detail-item"><span className="tw-detail-key">Mode</span><span className="tw-detail-value">{displayMode}</span></div>
          </div>

          {fuelingContext && (
            <div className="tw-context-card">
              <h5 className="tw-section-title">Fueling Context</h5>
              <div className="tw-context-row"><span className="tw-context-key">Mode</span><span className="tw-context-value">{displayMode || "N/A"}</span></div>
              {fuelingContext.vehicleName && <div className="tw-context-row"><span className="tw-context-key">Vehicle</span><span className="tw-context-value">{fuelingContext.vehicleName}</span></div>}
              {isTransferMode && sourceTankDisplay && <div className="tw-context-row"><span className="tw-context-key">Source Tank</span><span className="tw-context-value">{sourceTankDisplay}</span></div>}
              {isTransferMode && destinationTankDisplay && <div className="tw-context-row"><span className="tw-context-key">Destination Tank</span><span className="tw-context-value">{destinationTankDisplay}</span></div>}
              {!isTransferMode && fuelingContext.tankName && <div className="tw-context-row"><span className="tw-context-key">Tank</span><span className="tw-context-value">{fuelingContext.tankName}</span></div>}
              {fuelingContext.fueledByUserName && <div className="tw-context-row"><span className="tw-context-key">Operator</span><span className="tw-context-value">{fuelingContext.fueledByUserName}</span></div>}
              {fuelingContext.tag && <div className="tw-context-row"><span className="tw-context-key">Tag</span><span className="tw-context-value">{fuelingContext.tag}</span></div>}
            </div>
          )}

          <div className="tw-history-card">
            <h5 className="tw-section-title">Recent Updates</h5>
            {statusHistory.length === 0 ? (
              <div className="tw-history-empty">Waiting for updates...</div>
            ) : (
              <div className="tw-history-list">
                {statusHistory
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div key={`${entry.timestamp?.toISOString?.() || "history"}-${index}`} className="tw-history-row">
                      <span className="tw-history-time">{entry.timestamp?.toLocaleTimeString?.() || "--:--:--"}</span>
                      <span className="tw-history-status">{formatStatusText(entry.status)}</span>
                      <span className="tw-history-values">
                        {entry.volume !== null && entry.volume !== undefined ? `${toNumOrZero(entry.volume).toFixed(2)}L` : "-"}
                        {entry.amount !== null && entry.amount !== undefined ? ` / ${toNumOrZero(entry.amount).toFixed(2)}` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            {lastUpdated && <div className="tw-last-updated">Last update: {lastUpdated.toLocaleTimeString()}</div>}
          </div>
        </div>

        <div className="tw-monitoring-actions">
          {canShowStop && (
            <Button
              text="Stop Fueling"
              stylingMode="outlined"
              type="danger"
              disabled={isLoading}
              onClick={handleCancelTransaction}
              icon="fa-light fa-stop-circle"
            />
          )}

          {!canShowStop && canCancel && (
            <Button
              text="Cancel"
              stylingMode="outlined"
              type="danger"
              disabled={isLoading}
              onClick={handleCancelTransaction}
              icon="fa-light fa-ban"
            />
          )}

          {canComplete && (
            <Button
              text={status === TransactionStatus.COMPLETED ? "Finalize" : "Complete"}
              type="success"
              disabled={isLoading}
              onClick={handleCompleteTransaction}
              icon="fa-light fa-check-circle"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionMonitoringStatus;
