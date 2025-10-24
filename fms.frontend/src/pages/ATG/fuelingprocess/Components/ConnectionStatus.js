import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";

const ConnectionStatus = ({ deviceId, lastUpdated, onStatusChange }) => {
  const [status, setStatus] = useState("connecting");
  const [lastUpdateText, setLastUpdateText] = useState("Never");
  const [updateTimer, setUpdateTimer] = useState(null);

  // Get connection state from Redux store
  const isLiveDataEnabled = useSelector(
    (state) => state.realtimeStatus.isLiveDataEnabled
  );

  // Update status based on last update time
  useEffect(() => {
    if (!lastUpdated) {
      setStatus("disconnected");
      setLastUpdateText("Never");

      // Notify parent about status change
      if (onStatusChange) {
        onStatusChange("disconnected");
      }
      return;
    }

    const updateStatusText = () => {
      const now = new Date();
      const lastUpdate = new Date(lastUpdated);
      const diffSeconds = Math.round((now - lastUpdate) / 1000);

      let newStatus = status;

      if (diffSeconds < 10) {
        newStatus = "connected";
        setStatus(newStatus);
        setLastUpdateText("Just now");
      } else if (diffSeconds < 60) {
        newStatus = "connected";
        setStatus(newStatus);
        setLastUpdateText(`${diffSeconds} seconds ago`);
      } else if (diffSeconds < 300) {
        // 5 minutes
        newStatus = "connected";
        setStatus(newStatus);
        setLastUpdateText(`${Math.floor(diffSeconds / 60)} minutes ago`);
      } else if (diffSeconds < 1800) {
        // 30 minutes
        newStatus = "delayed";
        setStatus(newStatus);
        setLastUpdateText(`${Math.floor(diffSeconds / 60)} minutes ago`);
      } else {
        newStatus = "disconnected";
        setStatus(newStatus);
        setLastUpdateText(format(lastUpdate, "hh:mm:ss a"));
      }

      // Notify parent about status change
      if (onStatusChange && newStatus !== status) {
        onStatusChange(newStatus);
      }
    };

    // Update immediately
    updateStatusText();

    // Setup interval to update the text every second
    const timer = setInterval(updateStatusText, 1000);
    setUpdateTimer(timer);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lastUpdated, onStatusChange, status]);

  // Handle live data toggling
  useEffect(() => {
    if (!isLiveDataEnabled && status === "connected") {
      setStatus("paused");
      // Notify parent about status change
      if (onStatusChange) {
        onStatusChange("paused");
      }
    } else if (isLiveDataEnabled && status === "paused") {
      // Recheck status based on last update time
      const now = new Date();
      const lastUpdate = lastUpdated ? new Date(lastUpdated) : null;

      if (lastUpdate) {
        const diffSeconds = Math.round((now - lastUpdate) / 1000);
        let newStatus;

        if (diffSeconds < 300) {
          newStatus = "connected";
        } else if (diffSeconds < 1800) {
          newStatus = "delayed";
        } else {
          newStatus = "disconnected";
        }

        setStatus(newStatus);

        // Notify parent about status change
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    }
  }, [isLiveDataEnabled, status, lastUpdated, onStatusChange]);

  // Status icon and color mapping
  const statusConfig = {
    connecting: {
      icon: "fa-solid fa-spinner fa-spin",
      color: "#6c757d",
      text: "Connecting...",
    },
    connected: {
      icon: "fa-solid fa-signal",
      color: "#198754",
      text: "Connected",
    },
    delayed: {
      icon: "fa-solid fa-clock",
      color: "#ffc107",
      text: "Delayed",
    },
    disconnected: {
      icon: "fa-solid fa-plug",
      color: "#dc3545",
      text: "Disconnected",
    },
    paused: {
      icon: "fa-solid fa-pause",
      color: "#6c757d",
      text: "Paused",
    },
  };

  const { icon, color, text } =
    statusConfig[status] || statusConfig.disconnected;

  // Get device connection details from Redux //Cursor
  const deviceConnection = useSelector((state) => {
    const allConnections = state.ptsDevice.deviceConnections || {};
    return allConnections[deviceId] || null;
  });

  return (
    <div className="connection-status">
      <div className="status-indicator" style={{ color }}>
        <i className={icon}></i>
        <span className="status-text">{text}</span>
      </div>
      <div className="last-update">Last update: {lastUpdateText}</div>

      {/* Display connection type if available //Cursor */}
      {deviceConnection && (
        <div className="connection-details">
          <div className="connection-type">
            {deviceConnection.connectionType === "WebSocket" ? (
              <i className="fa-solid fa-wifi" title="WebSocket connection"></i>
            ) : (
              <i className="fa-solid fa-ethernet" title="HTTP connection"></i>
            )}
            <span>{deviceConnection.connectionType}</span>
          </div>
          <div className="connection-ip">
            {deviceConnection.ipAddress && (
              <span title="IP Address">{deviceConnection.ipAddress}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
