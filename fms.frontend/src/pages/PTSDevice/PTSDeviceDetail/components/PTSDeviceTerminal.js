/**
 * File: PTSDeviceTerminal.js
 * Purpose: Render a terminal-style view streaming raw PTS SignalR messages for a device
 * Dependencies: React, ptsSignalRService, TailwindCSS styles via PTSDeviceTerminal.scss
 * Last Modified: 2025-11-11
 *
 * Key Components:
 * - PTSDeviceTerminal: Displays live message feed with filtering, pause, and export controls
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ptsSignalRService from "../../../../signalR/ptsSignalRService";
import "./PTSDeviceTerminal.scss";

/**
 * PTSDeviceTerminal - Terminal-like panel for viewing device communication
 * Displays real-time raw PTS messages from SignalR
 *
 * Monitors all PTS SignalR events:
 * - UploadStatus: Full device status updates
 * - UploadStatusUpdate: Device status changes
 * - NozzleStateChange: Nozzle up/down events
 * - FillingStatus: Active fueling data
 * - PumpTransactionCompleted: Transaction completion
 * - PumpOffline: Pump offline notifications
 * - ReceiveRFIDTag: RFID tag reads
 * - UploadstatusTagRead: Tag read from upload status
 * - ProbeStatusUpdate: Tank probe updates
 * - ReaderStatusUpdate: RFID reader status
 */
const PTSDeviceTerminal = ({ device, isConnected }) => {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const maxLogs = 500; // Maximum number of logs to keep in buffer
  const terminalRef = useRef(null);
  const autoScrollRef = useRef(true);
  const isPausedRef = useRef(false); // Use ref to avoid recreating subscriptions on pause/unpause

  // Log component mount and connection status
  useEffect(() => {
    console.log(`[PTSDeviceTerminal] Component mounted/updated`);
    console.log(`[PTSDeviceTerminal] Device:`, device);
    console.log(`[PTSDeviceTerminal] IsConnected prop:`, isConnected);
    console.log(`[PTSDeviceTerminal] PTS Service Status:`, ptsSignalRService.getConnectionStatus());
  }, [device, isConnected]);

  // Keep ref in sync with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Filter options (matching camelCase event names from ptsSignalRService)
  const filterOptions = [
    { value: "all", label: "All Messages" },
    { value: "uploadStatus", label: "Upload Status" },
    { value: "uploadStatusUpdate", label: "Status Updates" },
    { value: "nozzleStateChange", label: "Nozzle Events" },
    { value: "fillingStatus", label: "Filling" },
    { value: "pumpTransactionCompleted", label: "Transactions" },
    { value: "pumpOffline", label: "Pump Offline" },
    { value: "rfidTag", label: "RFID Tags" },
    { value: "uploadStatusTagRead", label: "Tag Reads" },
    { value: "probeStatusUpdate", label: "Probes" },
    { value: "readerStatusUpdate", label: "Readers" },
    { value: "fuelingEvent", label: "Fueling Events" },
  ];

  // Auto-scroll to bottom when new logs arrive (if not paused and auto-scroll enabled)
  useEffect(() => {
    if (!isPaused && autoScrollRef.current && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  // Detect manual scroll - disable auto-scroll if user scrolls up
  const handleScroll = () => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      autoScrollRef.current = isAtBottom;
    }
  };

  // Subscribe to ALL device SignalR messages
  // Only active when this tab is visible (controlled by parent passing isActive prop)
  useEffect(() => {
    if (!device?.ptsid) {
      console.log(`[PTSDeviceTerminal] ⏭️ No device ID - skipping subscriptions`);
      return;
    }

    // Important: Only subscribe if this is the active terminal tab
    // This prevents multiple tabs from fighting over the same SignalR events
    console.log(`[PTSDeviceTerminal] 🔧 Terminal mounted - setting up subscriptions for device: ${device.ptsid}`);

    const deviceId = device.ptsid;
    const subscriptions = [];

    console.log(`[PTSDeviceTerminal] 🔧 Setting up subscriptions for device: ${deviceId}`);

    // Helper to add log entry (simple and direct like test page)
    const addLog = (eventType, data) => {
      // Check pause state from ref (not closure) to avoid stale values
      if (isPausedRef.current) {
        console.log(`[PTSDeviceTerminal] ⏸️ Skipping log - paused`);
        return;
      }

      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        eventType,
        data,
        deviceId: data.deviceId || data.ptsid || deviceId,
      };

      console.log(`[PTSDeviceTerminal] ✓ Adding log entry:`, eventType, logEntry);

      // Direct state update - no batching, no refs
      setLogs((prev) => {
        const newLogs = [...prev, logEntry];
        return newLogs.slice(-maxLogs);
      });
    };

    // Subscribe to all PTS events (using camelCase as defined in ptsSignalRService)
    const ptsEvents = [
      "uploadStatus",               // Was: UploadStatus
      "uploadStatusUpdate",         // Was: UploadStatusUpdate
      "nozzleStateChange",          // Was: NozzleStateChange
      "fillingStatus",              // Was: FillingStatus
      "pumpTransactionCompleted",   // Was: PumpTransactionCompleted
      "pumpOffline",                // Was: PumpOffline
      "rfidTag",                    // Was: ReceiveRFIDTag
      "uploadStatusTagRead",        // Was: UploadstatusTagRead
      "probeStatusUpdate",          // Was: ProbeStatusUpdate
      "readerStatusUpdate",         // Was: ReaderStatusUpdate
      "fuelingEvent",               // Was: FuelingEvent
    ];

    ptsEvents.forEach((eventType) => {
      const handler = (data) => {
        console.log(`[PTSDeviceTerminal] 📨 Received ${eventType}:`, {
          messageDeviceId: data.deviceId,
          expectedDeviceId: deviceId,
          matches: data.deviceId === deviceId || data.ptsid === deviceId || data.DeviceId === deviceId,
          data: data
        });

        // Only log if it's for this device
        if (
          data.deviceId === deviceId ||
          data.ptsid === deviceId ||
          data.DeviceId === deviceId
        ) {
          addLog(eventType, data);
        } else {
          console.log(`[PTSDeviceTerminal] ⏭️ Skipping message - device ID mismatch`);
        }
      };

      const unsubscribe = ptsSignalRService.on(eventType, handler);
      subscriptions.push(unsubscribe);
      console.log(`[PTSDeviceTerminal] ✓ Subscribed to ${eventType}`);
    });

    console.log(`[PTSDeviceTerminal] ✅ All ${ptsEvents.length} subscriptions active`);

    // Cleanup subscriptions
    return () => {
      console.log(`[PTSDeviceTerminal] 🧹 Cleaning up ${subscriptions.length} subscriptions`);
      subscriptions.forEach((unsub) => unsub());
    };
  }, [device?.ptsid]); // Removed isPaused from deps - we use ref instead

  // Format JSON for display with syntax highlighting
  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  // Get event type color (matching camelCase event names from ptsSignalRService)
  const getEventTypeColor = (eventType) => {
    const colors = {
      uploadStatus: "tw-text-blue-600",
      uploadStatusUpdate: "tw-text-blue-500",
      nozzleStateChange: "tw-text-purple-600",
      fillingStatus: "tw-text-green-600",
      pumpTransactionCompleted: "tw-text-indigo-600",
      pumpOffline: "tw-text-red-600",
      rfidTag: "tw-text-yellow-600",
      uploadStatusTagRead: "tw-text-yellow-500",
      probeStatusUpdate: "tw-text-teal-600",
      readerStatusUpdate: "tw-text-cyan-600",
      fuelingEvent: "tw-text-orange-600",
    };
    return colors[eventType] || "tw-text-gray-600";
  };

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  // Clear logs
  const handleClear = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs to file
  const handleExport = useCallback(() => {
    if (logs.length === 0) {
      return;
    }

    const logsText = logs
      .map((log) => {
        return `[${log.timestamp}] ${log.eventType}\n${formatJson(log.data)}\n`;
      })
      .join("\n");

  const blob = new Blob([logsText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pts-terminal-${device?.ptsid ?? "unknown"}-${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, device?.ptsid]);

  // Filter logs based on selected filter - memoized to prevent recalculation
  const filteredLogs = useMemo(() => {
    return filterType === "all"
      ? logs
      : logs.filter((log) => log.eventType === filterType);
  }, [logs, filterType]);

  // Memoize rendered log lines to prevent re-creation on every render
  const renderedLogs = useMemo(() => {
    if (filteredLogs.length === 0) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
          <i className="fa-light fa-terminal tw-text-6xl tw-text-gray-600 tw-mb-4"></i>
          <p className="tw-text-gray-500 tw-mb-2">
            {isPaused ? "Message capture paused" : "Waiting for device messages..."}
          </p>
          <p className="tw-text-xs tw-text-gray-600">
            {isConnected
              ? "Messages will appear here when device sends data"
              : "Device is not connected via WebSocket"}
          </p>
        </div>
      );
    }

    return (
      <div className="tw-space-y-2">
        {filteredLogs.map((log, idx) => (
          <div
            key={`${log.timestamp}-${idx}`}
            className="terminal-line tw-border-l-2 tw-border-gray-700 tw-pl-3 tw-py-2 hover:tw-bg-gray-800 tw-transition-colors"
          >
            {/* Log Header */}
            <div className="tw-flex tw-items-center tw-gap-3 tw-mb-1">
              <span className="tw-text-xs tw-text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`tw-font-semibold ${getEventTypeColor(log.eventType)}`}>
                {log.eventType}
              </span>
              {log.deviceId && (
                <span className="tw-text-xs tw-text-gray-400">
                  [{log.deviceId}]
                </span>
              )}
            </div>

            {/* Log Data */}
            <pre className="tw-text-xs tw-text-gray-300 tw-whitespace-pre-wrap tw-break-words">
              {formatJson(log.data)}
            </pre>
          </div>
        ))}
      </div>
    );
  }, [filteredLogs, isPaused, isConnected]);

  if (!device) {
    return (
      <div className="pts-device-terminal">
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-circle-exclamation tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">
            No Device Selected
          </h3>
          <p className="tw-text-sm tw-text-gray-500">
            Please select a device to view terminal output.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-terminal">
      {/* Terminal Header with Controls */}
      <div className="terminal-header tw-flex tw-flex-col md:tw-flex-row tw-gap-4 tw-p-4 tw-bg-gray-800 tw-border-b tw-border-gray-700">
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1">
          <i className="fa-light fa-terminal tw-text-green-400"></i>
          <span className="tw-font-semibold tw-text-gray-100">
            Device Terminal - {device.ptsid}
          </span>
          <span className="tw-text-xs tw-text-gray-400">
            ({filteredLogs.length} messages)
          </span>
        </div>

  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          {/* Filter Dropdown */}
          <label className="tw-inline-flex tw-flex-col">
            <span className="tw-sr-only">Filter messages</span>
            <select
              className="tw-bg-gray-900 tw-border tw-border-gray-600 tw-text-gray-100 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-min-w-[160px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* Pause Button */}
          <button
            type="button"
            className={`tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-gray-600 tw-rounded tw-text-sm tw-text-gray-100 tw-bg-transparent tw-transition-colors tw-duration-150 tw-cursor-pointer hover:tw-bg-gray-700 ${
              isPaused ? "tw-border-green-500 tw-text-green-400 tw-bg-gray-800" : ""
            }`}
            onClick={handleTogglePause}
            title={isPaused ? "Resume message capture" : "Pause message capture"}
          >
            <i className={isPaused ? "fa-light fa-play" : "fa-light fa-pause"}></i>
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* Clear Button */}
          <button
            type="button"
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-red-500 tw-rounded tw-text-sm tw-text-red-400 tw-bg-transparent tw-transition-colors tw-duration-150 tw-cursor-pointer hover:tw-bg-red-900 hover:tw-bg-opacity-30"
            onClick={handleClear}
            title="Clear all messages"
          >
            <i className="fa-light fa-trash"></i>
            <span>Clear</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-gray-600 tw-rounded tw-text-sm tw-text-gray-100 tw-bg-transparent tw-transition-colors tw-duration-150 tw-cursor-pointer hover:tw-bg-gray-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
            onClick={handleExport}
            title="Export logs to file"
            disabled={filteredLogs.length === 0}
          >
            <i className="fa-light fa-download"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        className="terminal-body tw-bg-gray-900 tw-p-4 tw-overflow-auto tw-font-mono tw-text-sm"
        ref={terminalRef}
        onScroll={handleScroll}
        style={{ height: "500px", maxHeight: "70vh" }}
      >
        {renderedLogs}
      </div>

      {/* Terminal Info Footer */}
      <div className="terminal-footer tw-p-3 tw-bg-gray-800 tw-border-t tw-border-gray-700">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-text-xs tw-text-gray-400">
          <div className="tw-flex tw-items-center tw-gap-2">
            <i className={`fa-light fa-circle ${isConnected ? 'tw-text-green-500' : 'tw-text-red-500'}`}></i>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-filter"></i>
            <span>Filter: {filterOptions.find(f => f.value === filterType)?.label}</span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-database"></i>
            <span>Buffer: {logs.length}/{maxLogs}</span>
          </div>

          {isPaused && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-yellow-500">
              <i className="fa-light fa-pause"></i>
              <span>PAUSED</span>
            </div>
          )}

          {!autoScrollRef.current && !isPaused && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-blue-500">
              <i className="fa-light fa-arrow-down"></i>
              <span>Scroll to bottom for auto-scroll</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders from parent
export default React.memo(PTSDeviceTerminal, (prevProps, nextProps) => {
  // Only re-render if device ID or connection status actually changes
  return (
    prevProps.device?.ptsid === nextProps.device?.ptsid &&
    prevProps.isConnected === nextProps.isConnected
  );
});
