import React from "react";
import "./PTSDeviceLiveInfo.scss";

/**
 * PTSDeviceLiveInfo - Displays live information from WebSocket connection
 * Shows real-time data like battery, CPU temp, tank levels, pump status, etc.
 */
const PTSDeviceLiveInfo = ({ device, liveData, isConnected }) => {
  // Merge device data with live data
  const displayData = liveData || device;

  if (!isConnected) {
    return (
      <div className="pts-device-live-info">
        <div className="tw-text-center tw-py-12">
          <span><i className="fa-light fa-circle-exclamation tw-text-6xl tw-text-gray-400 tw-mb-4"></i></span>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">
            Device Not Connected
          </h3>
          <p className="tw-text-sm tw-text-gray-500">
            This device is not connected via WebSocket. Live data is not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-live-info">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
        {/* System Status Card */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-server"></i></span>
            <h4>System Status</h4>
          </div>
          <div className="card-body">
            <div className="info-row">
              <label>Battery Voltage</label>
              <span className={`value ${
                (displayData.batteryVoltage || 0) < 11 ? "tw-text-red-600" : "tw-text-green-600"
              }`}>
                {displayData.batteryVoltage ? `${displayData.batteryVoltage}V` : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>CPU Temperature</label>
              <span className={`value ${
                (displayData.cpuTemperature || 0) > 50 ? "tw-text-red-600" : "tw-text-green-600"
              }`}>
                {displayData.cpuTemperature ? `${displayData.cpuTemperature}°C` : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>SD Card</label>
              <span className={`status-badge ${displayData.sdMounted ? "success" : "error"}`}>
                {displayData.sdMounted ? "Mounted" : "Not Mounted"}
              </span>
            </div>
            <div className="info-row">
              <label>Power Status</label>
              <span className={`status-badge ${
                displayData.ptsPowerDownDetected ? "error" : "success"
              }`}>
                {displayData.ptsPowerDownDetected ? "Power Down Detected" : "Normal"}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Info Card */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-signal-stream"></i></span>
            <h4>Connection Info</h4>
          </div>
          <div className="card-body">
            <div className="info-row">
              <label>Connection Type</label>
              <span className="value">
                {displayData.webSocketCapable ? "WebSocket" : "HTTP"}
              </span>
            </div>
            <div className="info-row">
              <label>Last Activity</label>
              <span className="value tw-text-sm">
                {displayData.lastActivity
                  ? new Date(displayData.lastActivity).toLocaleString()
                  : liveData?.receivedAt
                  ? new Date(liveData.receivedAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>Configuration ID</label>
              <span className="value tw-text-sm">{displayData.configurationId || "N/A"}</span>
            </div>
            <div className="info-row">
              <label>Firmware Date</label>
              <span className="value tw-text-sm">
                {displayData.firmwareDateTime
                  ? new Date(displayData.firmwareDateTime).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Live Updates Indicator */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-rss"></i></span>
            <h4>Live Updates</h4>
          </div>
          <div className="card-body">
            <div className="tw-text-center tw-py-4">
              <div className="live-indicator">
                <span className="pulse-dot"></span>
                <span className="tw-ml-2 tw-text-sm">Receiving Live Data</span>
              </div>
              {liveData && (
                <p className="tw-text-xs tw-text-gray-500 tw-mt-4">
                  Last update: {new Date(liveData.receivedAt || Date.now()).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections for pumps, tanks, etc. can be added here */}
      {displayData.pumps && (
        <div className="tw-mt-6">
          <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
            <span><i className="fa-light fa-gas-pump tw-mr-2"></i></span>
            Pump Status
          </h4>
          <div className="info-card">
            <div className="card-body">
              <pre className="tw-text-xs tw-bg-gray-50 tw-p-4 tw-rounded tw-overflow-auto">
                {JSON.stringify(displayData.pumps, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {displayData.tanks && displayData.tanks.length > 0 && (
        <div className="tw-mt-6">
          <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
            <span><i className="fa-light fa-truck-container tw-mr-2"></i></span>
            Tank Status
          </h4>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {displayData.tanks.map((tank, idx) => (
              <div key={idx} className="info-card">
                <div className="card-body">
                  <h5 className="tw-font-semibold tw-mb-2">{tank.name || `Tank ${idx + 1}`}</h5>
                  <div className="info-row">
                    <label>Level</label>
                    <span className="value">{tank.currentLevel || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <label>Capacity</label>
                    <span className="value">{tank.capacity || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PTSDeviceLiveInfo;
