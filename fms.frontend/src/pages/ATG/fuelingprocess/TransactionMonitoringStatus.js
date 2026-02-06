/**
 * File: TransactionMonitoringStatus.js
 * Purpose: Mobile-style real-time transaction monitoring modal for ATG web fueling process
 * Dependencies: ptsSignalRService, Redux realtimeStatus, DevExtreme Button/ProgressBar/LoadPanel
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - Track transaction lifecycle using UploadStatus + SignalR events
 * - Display live volume/amount/progress + fueling context
 * - Support stop/cancel and manual complete actions
 * - Maintain concise status history for operator visibility
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import { ProgressBar } from "devextreme-react/progress-bar";
import { LoadPanel } from "devextreme-react/load-panel";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import "./TransactionMonitoringStatus.scss";

const TransactionStatus = {
  AUTHORIZED: "authorized",
  WAITING_NOZZLE: "waiting_nozzle",
  FUELING: "fueling",
  END_OF_TRANSACTION: "end_of_transaction",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ERROR: "error",
  DISCONNECTED: "disconnected",
};

const PumpSnapshotType = {
  IDLE: "idle",
  FILLING: "filling",
  END_OF_TRANSACTION: "endOfTransaction",
  OFFLINE: "offline",
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getSection = (container, pascalName, camelName) =>
  container?.[pascalName] || container?.[camelName] || null;

const getArray = (section, pascalName, camelName) =>
  section?.[pascalName] || section?.[camelName] || [];

const getPumpSnapshotFromUploadStatus = (statusPayload, targetPumpId) => {
  if (!statusPayload || !targetPumpId) {
    return null;
  }

  const pumps = statusPayload.pumps || statusPayload.Pumps;
  if (!pumps) {
    return null;
  }

  const readSnapshot = (
    section,
    statusType,
    {
      transactionField,
      volumeField,
      amountField,
      nozzleField,
      fallbackVolumeField,
      fallbackAmountField,
    } = {}
  ) => {
    if (!section) return null;

    const ids = getArray(section, "Ids", "ids");
    const index = ids.findIndex(
      (pumpId) => toNumberOrNull(pumpId) === toNumberOrNull(targetPumpId)
    );

    if (index === -1) {
      return null;
    }

    const transactions = transactionField
      ? getArray(section, transactionField.pascal, transactionField.camel)
      : [];

    const volumes = volumeField
      ? getArray(section, volumeField.pascal, volumeField.camel)
      : [];

    const amounts = amountField
      ? getArray(section, amountField.pascal, amountField.camel)
      : [];

    const fallbackVolumes = fallbackVolumeField
      ? getArray(section, fallbackVolumeField.pascal, fallbackVolumeField.camel)
      : [];

    const fallbackAmounts = fallbackAmountField
      ? getArray(section, fallbackAmountField.pascal, fallbackAmountField.camel)
      : [];

    const nozzles = nozzleField
      ? getArray(section, nozzleField.pascal, nozzleField.camel)
      : [];

    return {
      type: statusType,
      index,
      transactionId: toNumberOrNull(transactions[index]),
      volume:
        toNumberOrNull(volumes[index]) ?? toNumberOrNull(fallbackVolumes[index]),
      amount:
        toNumberOrNull(amounts[index]) ?? toNumberOrNull(fallbackAmounts[index]),
      nozzle: toNumberOrNull(nozzles[index]),
    };
  };

  const fillingSnapshot = readSnapshot(
    getSection(pumps, "FillingStatus", "fillingStatus"),
    PumpSnapshotType.FILLING,
    {
      transactionField: { pascal: "Transactions", camel: "transactions" },
      volumeField: { pascal: "Volumes", camel: "volumes" },
      amountField: { pascal: "Amounts", camel: "amounts" },
      nozzleField: { pascal: "Nozzles", camel: "nozzles" },
    }
  );

  if (fillingSnapshot) {
    return fillingSnapshot;
  }

  const eotSnapshot = readSnapshot(
    getSection(pumps, "EndOfTransactionStatus", "endOfTransactionStatus"),
    PumpSnapshotType.END_OF_TRANSACTION,
    {
      transactionField: { pascal: "Transactions", camel: "transactions" },
      volumeField: { pascal: "Volumes", camel: "volumes" },
      amountField: { pascal: "Amounts", camel: "amounts" },
      nozzleField: { pascal: "Nozzles", camel: "nozzles" },
    }
  );

  if (eotSnapshot) {
    return eotSnapshot;
  }

  const idleSnapshot = readSnapshot(
    getSection(pumps, "IdleStatus", "idleStatus"),
    PumpSnapshotType.IDLE,
    {
      transactionField: {
        pascal: "LastTransactions",
        camel: "lastTransactions",
      },
      volumeField: { pascal: "LastVolumes", camel: "lastVolumes" },
      amountField: { pascal: "LastAmounts", camel: "lastAmounts" },
      nozzleField: { pascal: "NozzlesUp", camel: "nozzlesUp" },
      fallbackVolumeField: { pascal: "Volumes", camel: "volumes" },
      fallbackAmountField: { pascal: "Amounts", camel: "amounts" },
    }
  );

  if (idleSnapshot) {
    return idleSnapshot;
  }

  return readSnapshot(
    getSection(pumps, "OfflineStatus", "offlineStatus"),
    PumpSnapshotType.OFFLINE
  );
};

const isMatchingTransaction = (eventTransactionId, monitoredTransactionId) => {
  const monitored = toNumberOrNull(monitoredTransactionId);
  if (monitored === null) {
    return true;
  }

  const incoming = toNumberOrNull(eventTransactionId);
  if (incoming === null) {
    return false;
  }

  return incoming === monitored;
};

const formatElapsed = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const TransactionMonitoringStatus = ({
  deviceId,
  pumpId,
  transactionId,
  isVisible,
  onCancel,
  onComplete,
  connectionType = "Unknown",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(TransactionStatus.AUTHORIZED);
  const [volume, setVolume] = useState(0);
  const [amount, setAmount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPumpStatus, setCurrentPumpStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);

  const uploadStatus = useSelector(
    (reduxState) =>
      reduxState.realtimeStatus?.uploadStatusByDevice?.[deviceId]?.status
  );

  const fuelingContext = useSelector(
    (reduxState) =>
      reduxState.realtimeStatus?.deviceFuelingContexts?.[deviceId]?.[pumpId]
  );

  const statusRef = useRef(status);
  const volumeRef = useRef(volume);
  const amountRef = useRef(amount);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  const addStatusHistory = useCallback((entryStatus, entryVolume, entryAmount) => {
    const now = new Date();
    setStatusHistory((previousEntries) => {
      const nextEntry = {
        timestamp: now,
        status: entryStatus,
        volume:
          entryVolume === null || entryVolume === undefined
            ? null
            : Number(entryVolume),
        amount:
          entryAmount === null || entryAmount === undefined
            ? null
            : Number(entryAmount),
      };

      return [...previousEntries.slice(-9), nextEntry];
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
    setLastUpdated(new Date());
    setStatusHistory([]);
  }, [isVisible, transactionId, pumpId, deviceId]);

  useEffect(() => {
    const handleConnectionStatusChanged = (connected) => {
      setIsConnected(Boolean(connected));
      if (!connected) {
        setStatus((currentStatus) =>
          currentStatus === TransactionStatus.COMPLETED ||
          currentStatus === TransactionStatus.CANCELLED
            ? currentStatus
            : TransactionStatus.DISCONNECTED
        );
      }
    };

    const unsubscribe = ptsSignalRService.on(
      "connectionStatusChanged",
      handleConnectionStatusChanged
    );

    handleConnectionStatusChanged(ptsSignalRService.isConnected);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !deviceId || !pumpId) {
      return;
    }

    const pumpSnapshot = getPumpSnapshotFromUploadStatus(uploadStatus, pumpId);
    if (!pumpSnapshot) {
      return;
    }

    setCurrentPumpStatus(pumpSnapshot.type);
    setLastUpdated(new Date());

    const currentStatus = statusRef.current;
    const transactionMatches = isMatchingTransaction(
      pumpSnapshot.transactionId,
      transactionId
    );

    if (pumpSnapshot.type === PumpSnapshotType.FILLING) {
      if (pumpSnapshot.volume !== null && pumpSnapshot.volume !== undefined) {
        setVolume(pumpSnapshot.volume);
      }

      if (pumpSnapshot.amount !== null && pumpSnapshot.amount !== undefined) {
        setAmount(pumpSnapshot.amount);
      }

      if (
        currentStatus !== TransactionStatus.FUELING &&
        currentStatus !== TransactionStatus.COMPLETED &&
        currentStatus !== TransactionStatus.CANCELLED
      ) {
        setStatus(TransactionStatus.FUELING);
        if (!startTimeRef.current) {
          setStartTime(Date.now());
        }
        addStatusHistory(
          TransactionStatus.FUELING,
          pumpSnapshot.volume,
          pumpSnapshot.amount
        );
      }

      return;
    }

    if (pumpSnapshot.type === PumpSnapshotType.END_OF_TRANSACTION) {
      if (!transactionMatches) {
        return;
      }

      if (pumpSnapshot.volume !== null && pumpSnapshot.volume !== undefined) {
        setVolume(pumpSnapshot.volume);
      }

      if (pumpSnapshot.amount !== null && pumpSnapshot.amount !== undefined) {
        setAmount(pumpSnapshot.amount);
      }

      if (
        currentStatus !== TransactionStatus.END_OF_TRANSACTION &&
        currentStatus !== TransactionStatus.COMPLETED
      ) {
        setStatus(TransactionStatus.END_OF_TRANSACTION);
        addStatusHistory(
          TransactionStatus.END_OF_TRANSACTION,
          pumpSnapshot.volume,
          pumpSnapshot.amount
        );
      }

      return;
    }

    if (pumpSnapshot.type === PumpSnapshotType.IDLE) {
      if (
        currentStatus === TransactionStatus.AUTHORIZED ||
        currentStatus === TransactionStatus.WAITING_NOZZLE
      ) {
        setStatus(TransactionStatus.WAITING_NOZZLE);
        return;
      }

      const shouldComplete =
        (currentStatus === TransactionStatus.FUELING ||
          currentStatus === TransactionStatus.END_OF_TRANSACTION) &&
        transactionMatches;

      if (shouldComplete) {
        if (pumpSnapshot.volume !== null && pumpSnapshot.volume !== undefined) {
          setVolume(pumpSnapshot.volume);
        }

        if (pumpSnapshot.amount !== null && pumpSnapshot.amount !== undefined) {
          setAmount(pumpSnapshot.amount);
        }

        if (currentStatus !== TransactionStatus.COMPLETED) {
          setStatus(TransactionStatus.COMPLETED);
          addStatusHistory(
            TransactionStatus.COMPLETED,
            pumpSnapshot.volume,
            pumpSnapshot.amount
          );
        }
      }

      return;
    }

    if (
      pumpSnapshot.type === PumpSnapshotType.OFFLINE &&
      currentStatus !== TransactionStatus.COMPLETED &&
      currentStatus !== TransactionStatus.CANCELLED
    ) {
      setStatus(TransactionStatus.DISCONNECTED);
      addStatusHistory(
        TransactionStatus.DISCONNECTED,
        volumeRef.current,
        amountRef.current
      );
    }
  }, [uploadStatus, isVisible, deviceId, pumpId, transactionId, addStatusHistory]);

  useEffect(() => {
    if (!isVisible || !transactionId || !deviceId || !pumpId) {
      return undefined;
    }

    const handleFillingStatus = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) {
        return;
      }

      const eventPumpId =
        toNumberOrNull(eventData.pumpId) ?? toNumberOrNull(eventData.pump);

      if (eventPumpId !== toNumberOrNull(pumpId)) {
        return;
      }

      const eventVolume =
        eventData.fillingData?.volume ?? eventData.volume ?? volumeRef.current;
      const eventAmount =
        eventData.fillingData?.amount ?? eventData.amount ?? amountRef.current;

      setVolume(Number(eventVolume) || 0);
      setAmount(Number(eventAmount) || 0);
      setStatus(TransactionStatus.FUELING);
      setLastUpdated(new Date());

      if (!startTimeRef.current) {
        setStartTime(Date.now());
      }
    };

    const handlePumpTransactionCompleted = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) {
        return;
      }

      const eventPumpId =
        toNumberOrNull(eventData.pumpId) ?? toNumberOrNull(eventData.pump);

      if (eventPumpId !== toNumberOrNull(pumpId)) {
        return;
      }

      if (!isMatchingTransaction(eventData.transactionId, transactionId)) {
        return;
      }

      const finalVolume =
        eventData.volume ?? eventData.transactionData?.volume ?? volumeRef.current;
      const finalAmount =
        eventData.amount ?? eventData.transactionData?.amount ?? amountRef.current;

      setVolume(Number(finalVolume) || 0);
      setAmount(Number(finalAmount) || 0);
      setStatus(TransactionStatus.COMPLETED);
      setLastUpdated(new Date());
      addStatusHistory(TransactionStatus.COMPLETED, finalVolume, finalAmount);
    };

    const handleFuelingEvent = (eventData) => {
      if (!eventData || eventData.deviceId !== deviceId) {
        return;
      }

      const typeValue =
        eventData.fuelingData?.type ||
        eventData.type ||
        eventData.eventType ||
        "";

      const eventType = String(typeValue).toLowerCase();
      const eventPumpId =
        toNumberOrNull(eventData.fuelingData?.pumpId) ??
        toNumberOrNull(eventData.pumpId) ??
        toNumberOrNull(eventData.pump);

      if (eventPumpId !== null && eventPumpId !== toNumberOrNull(pumpId)) {
        return;
      }

      const eventTxnId =
        eventData.fuelingData?.transactionId ||
        eventData.transactionId ||
        eventData.transaction;

      if (!isMatchingTransaction(eventTxnId, transactionId)) {
        return;
      }

      if (
        eventType.includes("started") ||
        eventType.includes("filling") ||
        eventType.includes("inprogress")
      ) {
        if (!startTimeRef.current) {
          setStartTime(Date.now());
        }

        setStatus(TransactionStatus.FUELING);
        setLastUpdated(new Date());
      }

      if (
        eventType.includes("completed") ||
        eventType.includes("endoftransaction")
      ) {
        setStatus(TransactionStatus.END_OF_TRANSACTION);
        setLastUpdated(new Date());
      }
    };

    const unsubscribers = [
      ptsSignalRService.on("fillingStatus", handleFillingStatus),
      ptsSignalRService.on(
        "pumpTransactionCompleted",
        handlePumpTransactionCompleted
      ),
      ptsSignalRService.on("fuelingEvent", handleFuelingEvent),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [
    isVisible,
    transactionId,
    deviceId,
    pumpId,
    addStatusHistory,
  ]);

  useEffect(() => {
    const shouldTrackElapsed =
      isVisible &&
      (status === TransactionStatus.FUELING ||
        status === TransactionStatus.END_OF_TRANSACTION) &&
      startTime;

    if (!shouldTrackElapsed) {
      return undefined;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, status, startTime]);

  useEffect(() => {
    if (!isVisible || !deviceId) {
      return;
    }

    if (ptsSignalRService.isConnected) {
      ptsSignalRService.requestDeviceStatus(deviceId).catch((error) => {
        console.error(
          "[TransactionMonitoringStatus] Failed to request device status:",
          error
        );
      });
    }
  }, [isVisible, deviceId]);

  const statusConfig = useMemo(() => {
    switch (status) {
      case TransactionStatus.AUTHORIZED:
        return {
          label: "Authorized",
          detail: "Pump authorized. Lift nozzle to begin fueling.",
          color: "#1d4ed8",
          icon: "fa-light fa-key",
          progress: 15,
        };
      case TransactionStatus.WAITING_NOZZLE:
        return {
          label: "Waiting for Nozzle",
          detail: "Nozzle is down. Lift nozzle to start transaction.",
          color: "#d97706",
          icon: "fa-light fa-hand-point-up",
          progress: 25,
        };
      case TransactionStatus.FUELING:
        return {
          label: "Fueling In Progress",
          detail: "Live dispensing data is updating in real time.",
          color: "#2563eb",
          icon: "fa-light fa-gas-pump",
          progress: 65,
        };
      case TransactionStatus.END_OF_TRANSACTION:
        return {
          label: "End Of Transaction",
          detail: "Dispensing ended. Confirm completion to finalize.",
          color: "#059669",
          icon: "fa-light fa-flag-checkered",
          progress: 90,
        };
      case TransactionStatus.COMPLETED:
        return {
          label: "Completed",
          detail: "Transaction completed and ready to close.",
          color: "#15803d",
          icon: "fa-light fa-circle-check",
          progress: 100,
        };
      case TransactionStatus.CANCELLED:
        return {
          label: "Cancelled",
          detail: "Transaction has been cancelled.",
          color: "#dc2626",
          icon: "fa-light fa-ban",
          progress: 0,
        };
      case TransactionStatus.DISCONNECTED:
        return {
          label: "Disconnected",
          detail: "Connection lost. Waiting to re-establish live updates.",
          color: "#b45309",
          icon: "fa-light fa-plug-circle-xmark",
          progress: 0,
        };
      default:
        return {
          label: "Error",
          detail: "Unexpected transaction monitoring state.",
          color: "#dc2626",
          icon: "fa-light fa-triangle-exclamation",
          progress: 0,
        };
    }
  }, [status]);

  const canCancel =
    status === TransactionStatus.AUTHORIZED ||
    status === TransactionStatus.WAITING_NOZZLE ||
    status === TransactionStatus.FUELING ||
    status === TransactionStatus.END_OF_TRANSACTION;

  const canComplete =
    status === TransactionStatus.END_OF_TRANSACTION ||
    (status === TransactionStatus.FUELING && currentPumpStatus === PumpSnapshotType.IDLE);

  const handleCancelTransaction = useCallback(async () => {
    if (!canCancel || !transactionId || !onCancel) {
      return;
    }

    setIsLoading(true);
    try {
      await onCancel(transactionId, "User cancelled from monitoring panel");
      setStatus(TransactionStatus.CANCELLED);
      setLastUpdated(new Date());
      addStatusHistory(
        TransactionStatus.CANCELLED,
        volumeRef.current,
        amountRef.current
      );
    } catch (error) {
      console.error(
        "[TransactionMonitoringStatus] Failed to cancel transaction:",
        error
      );
      setStatus(TransactionStatus.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [canCancel, transactionId, onCancel, addStatusHistory]);

  const handleCompleteTransaction = useCallback(async () => {
    if (!canComplete || !transactionId || !onComplete) {
      return;
    }

    setIsLoading(true);
    try {
      await onComplete(transactionId);
      setStatus(TransactionStatus.COMPLETED);
      setLastUpdated(new Date());
      addStatusHistory(
        TransactionStatus.COMPLETED,
        volumeRef.current,
        amountRef.current
      );
    } catch (error) {
      console.error(
        "[TransactionMonitoringStatus] Failed to complete transaction:",
        error
      );
      setStatus(TransactionStatus.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [canComplete, transactionId, onComplete, addStatusHistory]);

  if (!isVisible || !transactionId) {
    return null;
  }

  return (
    <div className="tw-transaction-monitoring-overlay">
      <div className="tw-transaction-monitoring-modal">
        <LoadPanel visible={isLoading} showPane={true} message="Processing..." />

        <div className="tw-monitoring-header">
          <div className="tw-monitoring-title-wrap">
            <h4 className="tw-monitoring-title">Fueling Monitoring</h4>
            <span className="tw-transaction-id">TX #{transactionId}</span>
          </div>

          <div className="tw-monitoring-connection">
            <span
              className={`tw-connection-pill ${
                isConnected ? "tw-online" : "tw-offline"
              }`}
            >
              <i
                className={`fa-light ${
                  isConnected ? "fa-signal-stream" : "fa-plug-circle-xmark"
                }`}
              ></i>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="tw-connection-type">{connectionType}</span>
          </div>
        </div>

        <div className="tw-monitoring-body">
          <div className="tw-status-card">
            <div className="tw-status-main">
              <div
                className="tw-status-icon"
                style={{ backgroundColor: `${statusConfig.color}20` }}
              >
                <i
                  className={statusConfig.icon}
                  style={{ color: statusConfig.color }}
                ></i>
              </div>

              <div className="tw-status-text-wrap">
                <div className="tw-status-label">{statusConfig.label}</div>
                <div className="tw-status-detail">{statusConfig.detail}</div>
              </div>
            </div>

            <ProgressBar
              value={statusConfig.progress}
              showStatus={false}
              className="tw-status-progress"
            />
          </div>

          <div className="tw-metrics-grid">
            <div className="tw-metric-card">
              <span className="tw-metric-label">Pump / Nozzle</span>
              <span className="tw-metric-value">#{pumpId}</span>
              <span className="tw-metric-sub">
                {currentPumpStatus || "waiting"}
              </span>
            </div>

            <div className="tw-metric-card">
              <span className="tw-metric-label">Volume</span>
              <span className="tw-metric-value">{Number(volume).toFixed(2)} L</span>
              <span className="tw-metric-sub">Dispensed</span>
            </div>

            <div className="tw-metric-card">
              <span className="tw-metric-label">Amount</span>
              <span className="tw-metric-value">{Number(amount).toFixed(2)}</span>
              <span className="tw-metric-sub">Cost</span>
            </div>

            <div className="tw-metric-card">
              <span className="tw-metric-label">Elapsed</span>
              <span className="tw-metric-value">{formatElapsed(elapsedSeconds)}</span>
              <span className="tw-metric-sub">MM:SS</span>
            </div>
          </div>

          {fuelingContext && (
            <div className="tw-context-card">
              <h5 className="tw-section-title">Fueling Context</h5>

              <div className="tw-context-row">
                <span className="tw-context-key">Mode</span>
                <span className="tw-context-value">{fuelingContext.mode || "N/A"}</span>
              </div>

              {fuelingContext.vehicleName && (
                <div className="tw-context-row">
                  <span className="tw-context-key">Vehicle</span>
                  <span className="tw-context-value">{fuelingContext.vehicleName}</span>
                </div>
              )}

              {fuelingContext.tankName && (
                <div className="tw-context-row">
                  <span className="tw-context-key">Tank</span>
                  <span className="tw-context-value">{fuelingContext.tankName}</span>
                </div>
              )}

              {fuelingContext.fueledByUserName && (
                <div className="tw-context-row">
                  <span className="tw-context-key">Operator</span>
                  <span className="tw-context-value">
                    {fuelingContext.fueledByUserName}
                  </span>
                </div>
              )}

              {fuelingContext.tag && (
                <div className="tw-context-row">
                  <span className="tw-context-key">Tag</span>
                  <span className="tw-context-value">{fuelingContext.tag}</span>
                </div>
              )}
            </div>
          )}

          <div className="tw-history-card">
            <h5 className="tw-section-title">Recent Updates</h5>

            {statusHistory.length === 0 ? (
              <div className="tw-history-empty">
                Waiting for transaction updates...
              </div>
            ) : (
              <div className="tw-history-list">
                {statusHistory
                  .slice()
                  .reverse()
                  .map((entry, entryIndex) => (
                    <div key={`${entry.timestamp?.toISOString?.() || "time"}-${entryIndex}`} className="tw-history-row">
                      <span className="tw-history-time">
                        {entry.timestamp?.toLocaleTimeString?.() || "--:--:--"}
                      </span>
                      <span className="tw-history-status">{entry.status}</span>
                      <span className="tw-history-values">
                        {entry.volume !== null && entry.volume !== undefined
                          ? `${Number(entry.volume).toFixed(2)}L`
                          : "-"}
                        {entry.amount !== null && entry.amount !== undefined
                          ? ` / ${Number(entry.amount).toFixed(2)}`
                          : ""}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {lastUpdated && (
              <div className="tw-last-updated">
                Last update: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="tw-monitoring-actions">
          {canCancel && (
            <Button
              text={
                status === TransactionStatus.FUELING
                  ? "Stop / Cancel"
                  : "Cancel Transaction"
              }
              type="danger"
              stylingMode="outlined"
              disabled={isLoading}
              onClick={handleCancelTransaction}
              icon="fa-light fa-ban"
            />
          )}

          {canComplete && (
            <Button
              text="Complete Transaction"
              type="success"
              disabled={isLoading}
              onClick={handleCompleteTransaction}
              icon="fa-light fa-flag-checkered"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionMonitoringStatus;
