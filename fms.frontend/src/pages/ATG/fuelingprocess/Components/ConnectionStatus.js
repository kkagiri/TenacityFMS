import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";

const ConnectionStatus = ({ deviceId, lastUpdated, onStatusChange }) => {
  const [lastUpdateText, setLastUpdateText] = useState("Never");
  const [displayStatus, setDisplayStatus] = useState("connecting");
  const [gracePeriodActive, setGracePeriodActive] = useState(false);
  const disconnectTimerRef = React.useRef(null);
  const previousStatusRef = React.useRef("connecting");

  // Grace period configuration (in seconds)
  const DISCONNECT_GRACE_PERIOD = 60; // 60 seconds grace period before showing disconnected
  const RECONNECT_GRACE_PERIOD = 5;   // 5 seconds to confirm reconnection

  // Get live connection status from Redux (Redis-backed data)
  const deviceConnectionStatus = useSelector((state) => {
    const connectionStatuses = state.deviceConnections?.connectionStatuses || {};
    return connectionStatuses[deviceId] || null;
  });

  // Get live data toggle state
  const isLiveDataEnabled = useSelector(
    (state) => state.realtimeStatus.isLiveDataEnabled
  );

  // Map Redis status to UI status
  const mapRedisStatusToUI = (redisStatus) => {
    if (!redisStatus) return "disconnected";

    const statusLower = redisStatus.toLowerCase();
    if (statusLower === "active" || statusLower === "connected") return "connected";
    if (statusLower === "idle") return "delayed";
    return "disconnected";
  };

  // Get current status from Redis data
  const currentStatus = deviceConnectionStatus?.status
    ? mapRedisStatusToUI(deviceConnectionStatus.status)
    : "connecting";

  // Handle status changes with grace period
  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    // Status changed from connected/delayed to disconnected - start grace period
    if ((previousStatus === "connected" || previousStatus === "delayed") &&
        currentStatus === "disconnected") {

      if (!gracePeriodActive) {
        console.log(`[ConnectionStatus] Device ${deviceId} disconnected, starting ${DISCONNECT_GRACE_PERIOD}s grace period`);
        setGracePeriodActive(true);
        setDisplayStatus("delayed"); // Show as delayed during grace period

        // Start grace period timer
        disconnectTimerRef.current = setTimeout(() => {
          console.log(`[ConnectionStatus] Grace period expired for device ${deviceId}, showing disconnected`);
          setDisplayStatus("disconnected");
          setGracePeriodActive(false);
          if (onStatusChange) {
            onStatusChange("disconnected");
          }
        }, DISCONNECT_GRACE_PERIOD * 1000);
      }
    }
    // Status changed from disconnected to connected - cancel grace period
    else if (currentStatus === "connected" || currentStatus === "delayed") {
      if (gracePeriodActive) {
        console.log(`[ConnectionStatus] Device ${deviceId} reconnected during grace period, canceling disconnect timer`);
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        setGracePeriodActive(false);
      }

      setDisplayStatus(currentStatus);
      if (onStatusChange) {
        onStatusChange(currentStatus);
      }
    }
    // Status is connecting or remained the same
    else if (currentStatus !== "disconnected") {
      setDisplayStatus(currentStatus);
      if (onStatusChange && currentStatus !== previousStatus) {
        onStatusChange(currentStatus);
      }
    }
    // Already disconnected and no grace period
    else if (!gracePeriodActive) {
      setDisplayStatus("disconnected");
      if (onStatusChange && currentStatus !== previousStatus) {
        onStatusChange("disconnected");
      }
    }

    previousStatusRef.current = currentStatus;

    // Cleanup timer on unmount
    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
    };
  }, [currentStatus, gracePeriodActive, deviceId, onStatusChange]);

  // Update last update text based on lastSeen from Redis
  useEffect(() => {
    const updateLastUpdateText = () => {
      const lastSeen = deviceConnectionStatus?.lastSeen || lastUpdated;

      if (!lastSeen) {
        setLastUpdateText("Never");
        return;
      }

      const now = new Date();
      const lastUpdate = new Date(lastSeen);
      const diffSeconds = Math.round((now - lastUpdate) / 1000);

      if (diffSeconds < 10) {
        setLastUpdateText("Just now");
      } else if (diffSeconds < 60) {
        setLastUpdateText(`${diffSeconds} seconds ago`);
      } else if (diffSeconds < 3600) {
        setLastUpdateText(`${Math.floor(diffSeconds / 60)} minutes ago`);
      } else {
        setLastUpdateText(format(lastUpdate, "hh:mm:ss a"));
      }
    };

    // Update immediately
    updateLastUpdateText();

    // Update every second
    const timer = setInterval(updateLastUpdateText, 1000);
    return () => clearInterval(timer);
  }, [deviceConnectionStatus?.lastSeen, lastUpdated]);  // Status icon and color mapping
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
      text: gracePeriodActive ? "Reconnecting..." : "Delayed",
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
    statusConfig[displayStatus] || statusConfig.disconnected;

  return (
    <div className="connection-status">
      <div className="status-indicator" style={{ color }}>
        <i className={icon}></i>
        <span className="status-text">{text}</span>
        {gracePeriodActive && (
          <span className="tw-ml-1 tw-text-xs tw-text-yellow-600" title="Grace period active - brief disconnection">
            (grace)
          </span>
        )}
      </div>
      <div className="last-update tw-text-xs tw-whitespace-nowrap">
        Last update: {lastUpdateText}
      </div>

      {/* Display connection type and IP from Redis data */}
      {deviceConnectionStatus && (
        <div className="connection-details tw-flex tw-gap-2 tw-text-xs tw-mt-1 tw-flex-wrap">
          <div className="connection-type tw-flex tw-items-center tw-gap-1">
            {deviceConnectionStatus.connectionType === "WebSocket" ? (
              <i className="fa-solid fa-wifi" title="WebSocket connection"></i>
            ) : (
              <i className="fa-solid fa-ethernet" title="HTTP connection"></i>
            )}
            <span className="tw-hidden md:tw-inline">{deviceConnectionStatus.connectionType || "Unknown"}</span>
          </div>
          {deviceConnectionStatus.ipAddress && (
            <div className="connection-ip tw-flex tw-items-center">
              <span title="IP Address" className="tw-text-xs tw-text-gray-600">
                {deviceConnectionStatus.ipAddress}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
