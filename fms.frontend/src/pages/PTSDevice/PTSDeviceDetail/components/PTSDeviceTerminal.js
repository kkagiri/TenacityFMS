import React, { useState, useEffect, useRef } from "react";
import { Button } from "devextreme-react/button";
import ptsSignalRService from "../../../../signalR/ptsSignalRService";
import "./PTSDeviceTerminal.scss";

/**
 * PTSDeviceTerminal - Terminal-like panel for viewing device communication
 * Displays real-time logs and allows sending test commands
 */
const PTSDeviceTerminal = ({ device, isConnected }) => {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState("");
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Subscribe to device messages
  useEffect(() => {
    if (!isConnected || !device) return;

    const handleDeviceMessage = (data) => {
      if (data.deviceId === device.ptsid || data.ptsid === device.ptsid) {
        addLog("info", `Received: ${JSON.stringify(data)}`);
      }
    };

    const unsubscribe = ptsSignalRService.on("UploadStatus", handleDeviceMessage);

    return () => unsubscribe();
  }, [device, isConnected]);

  // Add log entry
  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  };

  // Handle send command
  const handleSendCommand = () => {
    if (!command.trim()) return;

    addLog("command", `> ${command}`);

    // TODO: Send command to device via SignalR or API
    addLog("warning", "Command sending not implemented yet");

    setCommand("");
  };

  // Clear logs
  const handleClear = () => {
    setLogs([]);
  };

  if (!isConnected) {
    return (
      <div className="pts-device-terminal">
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-circle-exclamation tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">
            Device Not Connected
          </h3>
          <p className="tw-text-sm tw-text-gray-500">
            Terminal requires an active WebSocket connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-terminal">
      <div className="terminal-header">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-terminal"></i>
          <span className="tw-font-semibold">Device Terminal - {device.ptsid}</span>
        </div>
        <Button
          text="Clear"
          icon="clear"
          onClick={handleClear}
          stylingMode="outlined"
          type="default"
        />
      </div>

      <div className="terminal-body" ref={terminalRef}>
        {logs.length === 0 ? (
          <div className="terminal-empty">
            <i className="fa-light fa-terminal tw-text-4xl tw-text-gray-400 tw-mb-2"></i>
            <p className="tw-text-sm tw-text-gray-500">
              Waiting for device messages...
            </p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`terminal-line ${log.type}`}>
              <span className="timestamp">[{log.timestamp}]</span>
              <span className="message">{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="terminal-input">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendCommand()}
          placeholder="Enter command (feature coming soon)..."
          className="tw-flex-1 tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded"
          disabled
        />
        <Button
          text="Send"
          icon="arrowright"
          onClick={handleSendCommand}
          type="default"
          disabled
        />
      </div>

      <div className="terminal-info">
        <i className="fa-light fa-circle-info tw-mr-2"></i>
        <span className="tw-text-xs tw-text-gray-600">
          This terminal displays real-time device communication. Command sending will be enabled in a future update.
        </span>
      </div>
    </div>
  );
};

export default PTSDeviceTerminal;
