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
    { value: "uploadStatusUpdate", label: "Upload Status" },
    { value: "deviceStatusUpdate", label: "Device Status" },
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

  // Auto-scroll to top when new logs arrive (newest first)
  useEffect(() => {
    if (!isPaused && autoScrollRef.current && terminalRef.current) {
      terminalRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  // Detect manual scroll - disable auto-scroll if user scrolls down
  const handleScroll = () => {
    if (terminalRef.current) {
      const { scrollTop } = terminalRef.current;
      // Auto-scroll is enabled when at the top
      autoScrollRef.current = scrollTop < 10;
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

      // Prepend new logs (newest first) and limit buffer size
      setLogs((prev) => {
        const newLogs = [logEntry, ...prev];
        return newLogs.slice(0, maxLogs);
      });
    };

    // Subscribe to all PTS events (using camelCase as defined in ptsSignalRService)
    const ptsEvents = [
      "uploadStatusUpdate",         // Full status updates from device
      "deviceStatusUpdate",         // Device connection status changes
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
      uploadStatusUpdate: "tw-text-blue-600",
      deviceStatusUpdate: "tw-text-emerald-600",
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
          <span><i className="fa-light fa-terminal tw-text-6xl tw-text-gray-600 tw-mb-4"></i></span>
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

    // Render collapsible JSON section
    const renderJsonSection = (label, data, defaultOpen = false) => {
      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return null;
      }
      return (
        <details className="tw-ml-2 tw-my-1" open={defaultOpen}>
          <summary className="tw-cursor-pointer tw-text-xs tw-text-gray-400 hover:tw-text-gray-200 tw-select-none">
            <span className="tw-font-medium">{label}</span>
            <span className="tw-text-gray-500 tw-ml-2">
              {Array.isArray(data) ? `[${data.length} items]` : `{${Object.keys(data).length} keys}`}
            </span>
          </summary>
          <pre className="tw-text-xs tw-text-gray-300 tw-whitespace-pre-wrap tw-break-words tw-ml-4 tw-mt-1 tw-bg-gray-800 tw-bg-opacity-50 tw-p-2 tw-rounded">
            {formatJson(data)}
          </pre>
        </details>
      );
    };

    // Render smart formatted log data
    const renderLogData = (data) => {
      // For uploadStatusUpdate, show structured view
      if (data.status && typeof data.status === 'object') {
        const { status, fuelingContexts, ...rest } = data;
        const { pumps, probes, readers, fuelGrades, ...statusRest } = status || {};

        return (
          <div className="tw-text-xs tw-text-gray-300">
            {/* Key metrics at a glance */}
            <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-2 tw-p-2 tw-bg-gray-800 tw-bg-opacity-30 tw-rounded">
              {status?.batteryVoltage && (
                <span className="tw-text-green-400">
                  <span className="tw-text-gray-500">Battery:</span> {(status.batteryVoltage / 1000).toFixed(2)}V
                </span>
              )}
              {status?.cpuTemperature && (
                <span className={status.cpuTemperature > 60 ? 'tw-text-red-400' : 'tw-text-blue-400'}>
                  <span className="tw-text-gray-500">CPU:</span> {status.cpuTemperature}°C
                </span>
              )}
              {status?.sdMounted !== undefined && (
                <span className={status.sdMounted ? 'tw-text-green-400' : 'tw-text-red-400'}>
                  <span className="tw-text-gray-500">SD:</span> {status.sdMounted ? 'Mounted' : 'Not Mounted'}
                </span>
              )}
              {status?.configurationId && (
                <span className="tw-text-purple-400">
                  <span className="tw-text-gray-500">Config:</span> {status.configurationId}
                </span>
              )}
            </div>

            {/* Collapsible sections */}
            {renderJsonSection('Pumps', pumps)}
            {renderJsonSection('Probes', probes)}
            {renderJsonSection('Readers', readers)}
            {renderJsonSection('Fuel Grades', fuelGrades)}
            {renderJsonSection('Fueling Contexts', fuelingContexts)}
            {Object.keys(statusRest).length > 0 && renderJsonSection('Other Status', statusRest)}
            {Object.keys(rest).length > 0 && renderJsonSection('Message Info', rest)}
          </div>
        );
      }

      // For other event types, show formatted JSON
      return (
        <pre className="tw-text-xs tw-text-gray-300 tw-whitespace-pre-wrap tw-break-words tw-bg-gray-800 tw-bg-opacity-30 tw-p-2 tw-rounded">
          {formatJson(data)}
        </pre>
      );
    };

    // Copy message to clipboard
    const handleCopyMessage = async (log) => {
      try {
        const textToCopy = JSON.stringify(log.data, null, 2);
        await navigator.clipboard.writeText(textToCopy);
        // Visual feedback handled by button state
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    return (
      <div className="tw-space-y-3">
        {filteredLogs.map((log, idx) => (
          <div
            key={`${log.timestamp}-${idx}`}
            className="terminal-line tw-relative tw-border-l-4 tw-border-gray-600 tw-pl-4 tw-pr-10 tw-py-3 tw-bg-gray-800 tw-bg-opacity-40 tw-rounded-r hover:tw-bg-opacity-60 tw-transition-colors"
          >
            {/* Copy Button - positioned at top right */}
            <button
              type="button"
              className="tw-absolute tw-top-2 tw-right-2 tw-p-1.5 tw-text-gray-500 hover:tw-text-gray-200 hover:tw-bg-gray-700 tw-rounded tw-transition-colors tw-opacity-60 hover:tw-opacity-100"
              onClick={() => handleCopyMessage(log)}
              title="Copy message to clipboard"
            >
              <span><i className="fa-light fa-copy tw-text-sm"></i></span>
            </button>

            {/* Log Header */}
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-mb-2">
              <span className="tw-text-sm tw-font-mono tw-text-gray-400">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded tw-text-sm ${getEventTypeColor(log.eventType)} tw-bg-gray-700 tw-bg-opacity-50`}>
                {log.eventType}
              </span>
              {log.deviceId && (
                <span className="tw-text-xs tw-text-gray-500 tw-font-mono">
                  {log.deviceId}
                </span>
              )}
            </div>

            {/* Log Data */}
            {renderLogData(log.data)}
          </div>
        ))}
      </div>
    );
  }, [filteredLogs, isPaused, isConnected]);

  if (!device) {
    return (
      <div className="pts-device-terminal">
        <div className="tw-text-center tw-py-12">
          <span><i className="fa-light fa-circle-exclamation tw-text-6xl tw-text-gray-400 tw-mb-4"></i></span>
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
          <span><i className="fa-light fa-terminal tw-text-green-400"></i></span>
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
            <span key={`pause-icon-${isPaused}`}>
              <i className={isPaused ? "fa-light fa-play" : "fa-light fa-pause"}></i>
            </span>
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* Clear Button */}
          <button
            type="button"
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-border tw-border-red-500 tw-rounded tw-text-sm tw-text-red-400 tw-bg-transparent tw-transition-colors tw-duration-150 tw-cursor-pointer hover:tw-bg-red-900 hover:tw-bg-opacity-30"
            onClick={handleClear}
            title="Clear all messages"
          >
            <span><i className="fa-light fa-trash"></i></span>
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
            <span><i className="fa-light fa-download"></i></span>
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
            {/* Wrap icon in span with key to prevent FontAwesome DOM conflicts */}
            <span key={`conn-icon-${isConnected}`}>
              <i className={`fa-light fa-circle ${isConnected ? 'tw-text-green-500' : 'tw-text-red-500'}`}></i>
            </span>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <span><i className="fa-light fa-filter"></i></span>
            <span>Filter: {filterOptions.find(f => f.value === filterType)?.label}</span>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <span><i className="fa-light fa-database"></i></span>
            <span>Buffer: {logs.length}/{maxLogs}</span>
          </div>

          {isPaused && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-yellow-500">
              <span><i className="fa-light fa-pause"></i></span>
              <span>PAUSED</span>
            </div>
          )}

          {!autoScrollRef.current && !isPaused && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-blue-500">
              <span><i className="fa-light fa-arrow-up"></i></span>
              <span>Scroll to top for auto-scroll</span>
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
