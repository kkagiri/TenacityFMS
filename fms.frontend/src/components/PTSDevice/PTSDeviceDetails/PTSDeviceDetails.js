import React from "react";
import { Tabs, Tab } from "devextreme-react/tabs";
import { Button } from "devextreme-react/button";
import { CircularGauge } from "devextreme-react/circular-gauge";
import "./PTSDeviceDetails.scss";

const PTSDeviceDetails = ({ device }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  // Handle tab selection
  const handleTabSelect = (e) => {
    setActiveTab(e.value);
  };

  // Format status for rendering
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "online":
        return { icon: "fa-solid fa-circle-check", colorClass: "text-success" };
      case "warning":
        return {
          icon: "fa-solid fa-triangle-exclamation",
          colorClass: "text-warning",
        };
      case "offline":
        return {
          icon: "fa-solid fa-bolt-lightning",
          colorClass: "text-danger",
        };
      default:
        return {
          icon: "fa-solid fa-circle-question",
          colorClass: "text-secondary",
        };
    }
  };

  // Render system information panel
  const renderSystemInfo = () => {
    return (
      <div className="system-info-panel">
        <h4>System Information</h4>
        <div className="info-grid">
          <div className="info-box">
            <h5>Hardware</h5>
            <div className="info-details">
              <div className="info-item">
                <label>Battery</label>
                <span
                  className={device.batteryVoltage < 11 ? "text-danger" : ""}
                >
                  {device.batteryVoltage}V
                </span>
              </div>
              <div className="info-item">
                <label>CPU Temperature</label>
                <span
                  className={device.cpuTemperature > 50 ? "text-danger" : ""}
                >
                  {device.cpuTemperature}°C
                </span>
              </div>
              <div className="info-item">
                <label>Power Status</label>
                <div className="status-indicator">
                  <span
                    className={`status-dot ${
                      device.ptsPowerDownDetected ? "bg-danger" : "bg-success"
                    }`}
                  ></span>
                  <span>
                    {device.ptsPowerDownDetected
                      ? "Power Down Detected"
                      : "Normal"}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <label>SD Card</label>
                <div className="status-indicator">
                  <span
                    className={`status-dot ${
                      device.sdMounted ? "bg-success" : "bg-danger"
                    }`}
                  ></span>
                  <span>{device.sdMounted ? "Mounted" : "Not Mounted"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="info-box">
            <h5>Software</h5>
            <div className="info-details">
              <div className="info-item">
                <label>Configuration ID</label>
                <span>{device.configurationId}</span>
              </div>
              <div className="info-item">
                <label>Firmware Date</label>
                <span>
                  {device.firmwareDateTime instanceof Date
                    ? device.firmwareDateTime.toLocaleDateString()
                    : new Date(device.firmwareDateTime).toLocaleDateString()}
                </span>
              </div>
              <div className="info-item">
                <label>Startup Time</label>
                <span>{formatUptime(device.startupSeconds)}</span>
              </div>
              <div className="info-item">
                <label>Last Updated</label>
                <span>{device.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render pumps and fueling panel
  const renderPumpsInfo = () => {
    const idleStatus = device.pumps?.idleStatus;
    const fillingStatus = device.pumps?.fillingStatus;
    const offlineStatus = device.pumps?.offlineStatus;

    return (
      <div className="pumps-panel">
        <h4>Pumps & Fueling</h4>

        {/* Idle status */}
        {idleStatus && (
          <div className="status-section">
            <div className="status-header">
              <i className="fa-solid fa-chart-line text-primary"></i>
              <h5>Idle</h5>
            </div>

            {idleStatus.lastTransactions &&
            idleStatus.lastTransactions.length > 0 ? (
              <div className="transaction-grid">
                <p className="section-label">Last Transactions</p>
                {idleStatus.lastTransactions.map((transaction, i) => (
                  <div key={i} className="transaction-card">
                    <div className="transaction-header">
                      <span>Nozzle {idleStatus.lastNozzles[i]}</span>
                      <span>#{transaction}</span>
                    </div>
                    <div className="transaction-details">
                      <div>
                        <span className="value">
                          {idleStatus.lastVolumes[i]?.toFixed(1)}L
                        </span>
                        <span className="label">
                          @ ${idleStatus.lastPrices[i]?.toFixed(2)}/L
                        </span>
                      </div>
                      <div className="amount">
                        <span className="value">
                          ${idleStatus.lastAmounts[i]?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No recent transactions</p>
            )}
          </div>
        )}

        {/* Filling status */}
        {fillingStatus && (
          <div className="status-section">
            <div className="status-header active-fueling">
              <i className="fa-solid fa-gas-pump text-success"></i>
              <h5>Fueling in Progress</h5>
            </div>

            {fillingStatus.transactions &&
            fillingStatus.transactions.length > 0 ? (
              <div className="transaction-grid">
                {fillingStatus.transactions.map((transaction, i) => (
                  <div key={i} className="transaction-card active">
                    <div className="transaction-header">
                      <span>
                        <span className="active-dot"></span>
                        Nozzle {fillingStatus.nozzles[i]} • #{transaction}
                      </span>
                      <span>{fillingStatus.fuelGradeNames[i]}</span>
                    </div>
                    <div className="transaction-details">
                      <div>
                        <span className="value">
                          {fillingStatus.volumes[i]?.toFixed(1)}L
                        </span>
                        <span className="label">
                          @ ${fillingStatus.prices[i]?.toFixed(2)}/L
                        </span>
                      </div>
                      <div className="amount">
                        <span className="value">
                          ${fillingStatus.amounts[i]?.toFixed(2)}
                        </span>
                        <span className="label">
                          Tag: {formatTagId(fillingStatus.tags[i])}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No active fueling</p>
            )}
          </div>
        )}

        {/* Offline status */}
        {offlineStatus && (
          <div className="status-section">
            <div className="status-header error">
              <i className="fa-solid fa-triangle-exclamation text-danger"></i>
              <h5>Pump Offline</h5>
            </div>
            <div className="error-message">
              <p>
                Error {offlineStatus.errorCode}: {offlineStatus.errorMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render tanks panel
  const renderTanksInfo = () => {
    if (!device.tanks || device.tanks.length === 0) {
      return <div className="empty-message">No tank information available</div>;
    }

    return (
      <div className="tanks-panel">
        <h4>Tanks</h4>
        <div className="tanks-grid">
          {device.tanks.map((tank, index) => {
            // Find the corresponding probe measurement if available
            const probeMeasurement =
              device.probes?.onlineStatus?.measurements?.find(
                (m) => m.probeNumber === tank.probeNumber
              );

            return (
              <div key={tank.id} className="tank-card">
                <div className="tank-header">
                  <div className="tank-icon">
                    <i className="fa-solid fa-truck-container"></i>
                  </div>
                  <div className="tank-title">
                    <h5>{tank.name}</h5>
                    <span className="fuel-type">{tank.fuelType}</span>
                  </div>
                  <div className="tank-capacity">
                    <span className="current-level">
                      {tank.currentLevel.toLocaleString()} L
                    </span>
                    <span className="total-capacity">
                      of {tank.capacity.toLocaleString()} L
                    </span>
                  </div>
                </div>

                <div className="tank-level">
                  <div className="level-header">
                    <span>Fuel Level</span>
                    <span
                      className={
                        tank.fuelLevel > 60
                          ? "text-success"
                          : tank.fuelLevel > 30
                          ? "text-warning"
                          : "text-danger"
                      }
                    >
                      {tank.fuelLevel}%
                    </span>
                  </div>
                  <div className="level-bar">
                    <div
                      className={`level-fill ${
                        tank.fuelLevel > 60
                          ? "bg-success"
                          : tank.fuelLevel > 30
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                      style={{ width: `${tank.fuelLevel}%` }}
                    ></div>
                  </div>
                </div>

                {probeMeasurement && (
                  <div className="probe-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Temperature</label>
                        <span>{probeMeasurement.temperature}°C</span>
                      </div>
                      <div className="detail-item">
                        <label>Water Level</label>
                        <span>
                          {probeMeasurement.waterHeight} m (
                          {probeMeasurement.waterVolume} L)
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Product Height</label>
                        <span>{probeMeasurement.productHeight} m</span>
                      </div>
                      <div className="detail-item">
                        <label>Ullage</label>
                        <span>
                          {probeMeasurement.productUllage?.toLocaleString()} L
                        </span>
                      </div>
                    </div>

                    {/* Alarm indicators */}
                    {(device.probes.onlineStatus?.criticalHighProductAlarms?.[
                      probeMeasurement.probeNumber - 1
                    ] === 1 ||
                      device.probes.onlineStatus?.highProductAlarms?.[
                        probeMeasurement.probeNumber - 1
                      ] === 1 ||
                      device.probes.onlineStatus?.lowProductAlarms?.[
                        probeMeasurement.probeNumber - 1
                      ] === 1 ||
                      device.probes.onlineStatus?.criticalLowProductAlarms?.[
                        probeMeasurement.probeNumber - 1
                      ] === 1 ||
                      device.probes.onlineStatus?.highWaterAlarms?.[
                        probeMeasurement.probeNumber - 1
                      ] === 1 ||
                      device.probes.onlineStatus?.tankLeakageAlarms?.[
                        probeMeasurement.probeNumber - 1
                      ] === 1) && (
                      <div className="alarms">
                        {device.probes.onlineStatus
                          ?.criticalHighProductAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && (
                          <span className="alarm critical-high">
                            Critical High
                          </span>
                        )}
                        {device.probes.onlineStatus?.highProductAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && <span className="alarm high">High</span>}
                        {device.probes.onlineStatus?.lowProductAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && <span className="alarm low">Low</span>}
                        {device.probes.onlineStatus?.criticalLowProductAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && (
                          <span className="alarm critical-low">
                            Critical Low
                          </span>
                        )}
                        {device.probes.onlineStatus?.highWaterAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && <span className="alarm water">Water</span>}
                        {device.probes.onlineStatus?.tankLeakageAlarms?.[
                          probeMeasurement.probeNumber - 1
                        ] === 1 && (
                          <span className="alarm leakage">Leakage</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="tank-actions">
                  <Button
                    text="View History"
                    stylingMode="outlined"
                    type="default"
                    onClick={() =>
                      console.log(`View history for tank ${tank.id}`)
                    }
                  />
                  <Button
                    text="Tank Details"
                    stylingMode="outlined"
                    onClick={() =>
                      console.log(`View details for tank ${tank.id}`)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render reader/tag info
  const renderReaderInfo = () => {
    const onlineStatus = device.readers?.onlineStatus;
    const offlineStatus = device.readers?.offlineStatus;

    if (!onlineStatus && !offlineStatus) {
      return (
        <div className="empty-message">No reader information available</div>
      );
    }

    return (
      <div className="reader-panel">
        <h4>RFID Reader Status</h4>

        {onlineStatus && (
          <div className="reader-status">
            {onlineStatus.tags && onlineStatus.tags.length > 0 ? (
              <div className="tags-container">
                <p className="section-label">Recent Tags</p>
                <div className="tags-list">
                  {onlineStatus.tags.map((tag, i) => (
                    <div key={i} className="tag-chip">
                      {formatTagId(tag)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty-message">No recent tag reads</p>
            )}

            {onlineStatus.errors &&
              onlineStatus.errors.some((e) => e !== 0) && (
                <div className="reader-error">
                  <i className="fa-solid fa-triangle-exclamation text-danger"></i>
                  <span>Reader errors detected</span>
                </div>
              )}
          </div>
        )}

        {offlineStatus && (
          <div className="reader-offline">
            <div className="error-message">
              <i className="fa-solid fa-triangle-exclamation text-danger"></i>
              <span>
                Error {offlineStatus.errorCode}: {offlineStatus.errorMessage}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render fuel grades panel
  const renderFuelGradesInfo = () => {
    if (!device.fuelGrades || device.fuelGrades.length === 0) {
      return (
        <div className="empty-message">No fuel grade information available</div>
      );
    }

    return (
      <div className="fuel-grades-panel">
        <h4>Fuel Prices</h4>
        <div className="fuel-grades-grid">
          {device.fuelGrades.map((grade) => (
            <div key={grade.id} className="fuel-grade-card">
              <div className="grade-name">{grade.name}</div>
              <div className="grade-price">${grade.price?.toFixed(2)}/L</div>
              <div className="grade-details">
                <div className="detail-item">
                  <label>Expansion Coefficient</label>
                  <span>{grade.expansionCoefficient}</span>
                </div>
                {grade.blendTank1Id && (
                  <div className="detail-item">
                    <label>Blend Tank 1</label>
                    <span>
                      Tank {grade.blendTank1Id} ({grade.blendTank1Percentage}%)
                    </span>
                  </div>
                )}
                {grade.blendTank2Id && (
                  <div className="detail-item">
                    <label>Blend Tank 2</label>
                    <span>
                      Tank {grade.blendTank2Id} (
                      {100 - grade.blendTank1Percentage}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper functions
  const formatUptime = (seconds) => {
    if (!seconds) return "N/A";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const formatTagId = (tag) => {
    if (!tag) return "N/A";
    return `${tag.substring(0, 6)}...`;
  };

  // If no device data is provided, show a message
  if (!device) {
    return (
      <div className="pts-device-details empty">No device data available</div>
    );
  }

  return (
    <div className="pts-device-details">
      {/* Header with status and basic info */}
      <div className="details-header">
        <div className="status-badge">
          <i
            className={`${getStatusInfo(device.status).icon} ${
              getStatusInfo(device.status).colorClass
            }`}
          ></i>
          <span>
            {device.status
              ? device.status.charAt(0).toUpperCase() + device.status.slice(1)
              : "Unknown"}
          </span>
        </div>
        <div className="device-title">
          <h4>{device.id || device.ptsid}</h4>
          <span>{device.siteName}</span>
        </div>
        <div className="refresh-button">
          <Button
            icon="refresh"
            text="Refresh"
            onClick={() =>
              console.log(`Refresh data for ${device.id || device.ptsid}`)
            }
            stylingMode="outlined"
          />
        </div>
      </div>

      {/* Tabs for different sections of information */}
      <Tabs
        dataSource={[
          { text: "System Info", icon: "fa-solid fa-server" },
          { text: "Pumps & Fueling", icon: "fa-solid fa-gas-pump" },
          { text: "Tanks", icon: "fa-solid fa-truck-container" },
          { text: "Readers", icon: "fa-solid fa-tag" },
          { text: "Fuel Grades", icon: "fa-solid fa-dollar-sign" },
        ]}
        selectedIndex={activeTab}
        onItemClick={handleTabSelect}
        width="100%"
      />

      {/* Content based on selected tab */}
      <div className="tab-content">
        {activeTab === 0 && renderSystemInfo()}
        {activeTab === 1 && renderPumpsInfo()}
        {activeTab === 2 && renderTanksInfo()}
        {activeTab === 3 && renderReaderInfo()}
        {activeTab === 4 && renderFuelGradesInfo()}
      </div>
    </div>
  );
};

export default PTSDeviceDetails;
