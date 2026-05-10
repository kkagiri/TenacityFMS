/**
 * File: PTSDeviceTerminalTestPage.js
 * Purpose: ISOLATED test page for PTS terminal with its own SignalR connection
 * NO Redux, NO parent dependencies, COMPLETE isolation
 * Last Modified: 2025-11-11
 */

import React, { useState, useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";
import {
  resolveSignalRBaseUrl,
  buildHubUrl,
  createAccessTokenFactory
} from "../../signalR/signalRBaseService";
import "./PTSDeviceDetail/components/PTSDeviceTerminal.scss";

const PTSDeviceTerminalTestPage = () => {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [deviceId, setDeviceId] = useState(""); // User input
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const connectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const MAX_LOG_LINES = 500;

  // Scroll to bottom when logs update
  useEffect(() => {
    if (autoScroll && !isPaused && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, isPaused]);

  const addLog = (type, content) => {
    if (isPaused) return;

    const timestamp = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });

    setLogs((prevLogs) => {
      const newLog = { timestamp, type, content };
      const newLogs = [...prevLogs, newLog];
      return newLogs.slice(-MAX_LOG_LINES);
    });
  };

  const connectToSignalR = async () => {
    if (connectionRef.current) {
      await disconnectFromSignalR();
    }

    if (!deviceId.trim()) {
      addLog("error", "Please enter a device ID");
      return;
    }

    try {
      setConnectionStatus("Connecting...");

      // Resolve SignalR base URL (same as ptsSignalRService)
      const baseURL = await resolveSignalRBaseUrl("PTS");
      const fullHubUrl = buildHubUrl(baseURL, "", "/ptsHub");

      addLog("system", `Connecting to: ${fullHubUrl}`);

      // Build NEW connection for this test page only
      const connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          skipNegotiation: false,
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          accessTokenFactory: createAccessTokenFactory("PTS"),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Register ALL PTS events
      const events = [
        "uploadStatus",
        "uploadStatusUpdate",
        "nozzleStateChange",
        "fillingStatus",
        "pumpTransactionCompleted",
        "pumpOffline",
        "rfidTag",
        "uploadStatusTagRead",
        "probeStatusUpdate",
        "readerStatusUpdate",
        "fuelingEvent"
      ];

      events.forEach((eventName) => {
        connection.on(eventName, (data) => {
          console.log(`[TEST PAGE] ${eventName}:`, data);

          // Filter for our device only
          if (data?.PTSID === deviceId || data?.ptsid === deviceId ||
              data?.PTSId === deviceId || data?.deviceId === deviceId) {
            addLog(eventName, JSON.stringify(data, null, 2));
          }
        });
      });

      connection.onreconnecting(() => {
        setConnectionStatus("Reconnecting...");
        setIsConnected(false);
        addLog("system", "Connection lost - reconnecting...");
      });

      connection.onreconnected(() => {
        setConnectionStatus("Connected");
        setIsConnected(true);
        addLog("system", "Reconnected successfully");
      });

      connection.onclose(() => {
        setConnectionStatus("Disconnected");
        setIsConnected(false);
        addLog("system", "Connection closed");
      });

      await connection.start();
      connectionRef.current = connection;
      setIsConnected(true);
      setConnectionStatus("Connected");
      addLog("system", `Connected to PTS Hub - monitoring device: ${deviceId}`);

    } catch (err) {
      console.error("[TEST PAGE] Connection error:", err);
      setConnectionStatus("Error");
      addLog("error", `Failed to connect: ${err.message}`);
    }
  };

  const disconnectFromSignalR = async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        connectionRef.current = null;
        setIsConnected(false);
        setConnectionStatus("Disconnected");
        addLog("system", "Disconnected from PTS Hub");
      } catch (err) {
        console.error("[TEST PAGE] Disconnect error:", err);
      }
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleExport = () => {
    const content = logs
      .map((log) => `[${log.timestamp}] [${log.type}] ${log.content}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pts-terminal-test-${deviceId || "unknown"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = filterType === "all"
    ? logs
    : logs.filter((log) => log.type === filterType);

  const eventTypes = ["all", "system", "error", ...new Set(logs.map(l => l.type))];

  return (
    <div className="tw-h-screen tw-flex tw-flex-col tw-bg-gray-50">
      {/* Header */}
      <div className="tw-bg-white tw-border-b tw-px-6 tw-py-4">
        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
          <i className="fa-light fa-terminal tw-mr-3 tw-text-blue-600"></i>
          PTS Terminal Test Page (ISOLATED)
        </h1>
        <p className="tw-text-sm tw-text-gray-600">
          This is a completely isolated test - own SignalR connection, no Redux, no parent dependencies
        </p>
      </div>

      {/* Connection Controls */}
      <div className="tw-bg-white tw-border-b tw-px-6 tw-py-4 tw-flex tw-items-center tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <label className="tw-text-sm tw-font-semibold tw-text-gray-700">Device ID:</label>
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="Enter PTSID (e.g., PTS001)"
            className="tw-border tw-rounded tw-px-3 tw-py-2 tw-w-64"
            disabled={isConnected}
          />
        </div>

        {!isConnected ? (
          <button
            onClick={connectToSignalR}
            className="tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-semibold hover:tw-bg-green-700"
          >
            <i className="fa-light fa-plug tw-mr-2"></i>
            Connect
          </button>
        ) : (
          <button
            onClick={disconnectFromSignalR}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-semibold hover:tw-bg-red-700"
          >
            <i className="fa-light fa-plug-circle-xmark tw-mr-2"></i>
            Disconnect
          </button>
        )}

        <div className="tw-flex tw-items-center tw-gap-2 tw-ml-auto">
          <span className="tw-text-sm tw-font-semibold tw-text-gray-700">Status:</span>
          <span className={`tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-font-semibold ${
            isConnected ? "tw-bg-green-100 tw-text-green-800" :
            connectionStatus === "Connecting..." || connectionStatus === "Reconnecting..." ? "tw-bg-yellow-100 tw-text-yellow-800" :
            connectionStatus === "Error" ? "tw-bg-red-100 tw-text-red-800" :
            "tw-bg-gray-100 tw-text-gray-800"
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Terminal Controls */}
      <div className="tw-bg-gray-100 tw-px-6 tw-py-3 tw-flex tw-items-center tw-justify-between tw-border-b">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-semibold tw-text-gray-700">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="tw-border tw-rounded tw-px-3 tw-py-1 tw-text-sm"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              id="autoscroll-test"
            />
            <label htmlFor="autoscroll-test" className="tw-text-sm tw-text-gray-700">
              Auto-scroll
            </label>
          </div>

          <div className="tw-text-sm tw-text-gray-600">
            {filteredLogs.length} / {MAX_LOG_LINES} messages
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            onClick={handleTogglePause}
            className={`tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-font-semibold ${
              isPaused
                ? "tw-bg-yellow-500 tw-text-white hover:tw-bg-yellow-600"
                : "tw-bg-gray-300 tw-text-gray-700 hover:tw-bg-gray-400"
            }`}
          >
            <i className={`fa-light ${isPaused ? "fa-play" : "fa-pause"} tw-mr-2`}></i>
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            onClick={handleClear}
            className="tw-bg-gray-300 tw-text-gray-700 tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-font-semibold hover:tw-bg-gray-400"
          >
            <i className="fa-light fa-trash tw-mr-2"></i>
            Clear
          </button>

          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-font-semibold hover:tw-bg-blue-700 disabled:tw-opacity-50"
          >
            <i className="fa-light fa-download tw-mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="tw-flex-1 tw-overflow-hidden">
        <div className="terminal-container tw-h-full tw-bg-gray-900 tw-text-green-400 tw-font-mono tw-text-sm tw-overflow-y-auto tw-p-4">
          {filteredLogs.length === 0 ? (
            <div className="tw-text-gray-500 tw-text-center tw-py-8">
              {isPaused
                ? "Log paused - waiting for resume..."
                : !isConnected
                ? "Not connected - enter device ID and click Connect"
                : "Waiting for messages..."}
            </div>
          ) : (
            <div className="terminal-messages">
              {filteredLogs.map((log, idx) => (
                <div key={`${log.timestamp}-${idx}`} className={`terminal-message ${log.type}`}>
                  <span className="timestamp">{log.timestamp}</span>
                  <span className="type-badge">{log.type}</span>
                  <span className="content">{log.content}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="tw-bg-white tw-border-t tw-px-6 tw-py-3 tw-text-xs tw-text-gray-600">
        <div className="tw-flex tw-justify-between">
          <span>
            <i className="fa-light fa-info-circle tw-mr-2"></i>
            This page creates its own SignalR connection - completely isolated from main app
          </span>
          <span>
            Device: <strong>{deviceId || "Not set"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PTSDeviceTerminalTestPage;
