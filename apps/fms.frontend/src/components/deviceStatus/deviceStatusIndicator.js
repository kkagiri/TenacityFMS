// src/components/DeviceStatusIndicator.js
import React from "react";
import { useSelector } from "react-redux";
import "./DeviceStatusIndicator.scss";

const DeviceStatusIndicator = () => {
  // Using the deviceSummary from the Redux store (as set by FETCH_ONLINE_DEVICES_SUCCESS)
  const deviceSummary = useSelector((state) => state.device.deviceSummary);
  const totalDevices = deviceSummary?.TotalConnectedDevices || 0;
  const webSocketPercentage = deviceSummary?.WebSocketPercentages || 0;

  return (
    <div className="device-status-indicator">
      <div className="device-icon">
        {/* If you have an icon (or a button) to display, insert it here.
            For example, you might use a Button component if needed:
            <Button icon="device" stylingMode="text" />
        */}
        <div className="dx-badge">{totalDevices}</div>
      </div>
      <span>
        {totalDevices} Devices Connected ({webSocketPercentage}% WebSocket)
      </span>
    </div>
  );
};

export default DeviceStatusIndicator;
