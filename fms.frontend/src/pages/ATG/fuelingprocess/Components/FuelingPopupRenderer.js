import React from "react";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import ProgressBar from "devextreme-react/progress-bar";

//cluade import needed components
import "./../fuelingprocess.scss";

// Helper function to safely format currency
const formatCurrency = (value) => {
  const num = Number(value);
  if (!isNaN(num) && typeof num === "number") {
    return `KES${num.toFixed(0)}`;
  }
  return "KES 0.00"; // Fallback for invalid numbers
};

// Helper function to safely format volume
const formatVolume = (value) => {
  const num = Number(value);
  if (!isNaN(num) && typeof num === "number") {
    return `${num.toFixed(1)} L`;
  }
  return "0.00 L"; // Fallback for invalid numbers
};

const FuelingPopupRenderer = {
  renderFuelingProgressPopup: (
    showFuelingPopup,
    activePump,
    activeNozzle,
    fuelingVolume,
    fuelingCost,
    vehicleOrTag,
    stopFueling,
    setShowFuelingPopup
  ) => {
    // Determine progress percentage safely
    const maxVolumeEstimate = 45; // Replace with actual limit if available
    const currentVolume = Number(fuelingVolume) || 0;
    const progressPercent = Math.min(
      100,
      (currentVolume / maxVolumeEstimate) * 100
    );

    return (
      <Popup
        visible={showFuelingPopup}
        dragEnabled={false}
        showTitle={true}
        title={`Pump ${activePump?.id || "N/A"} - Nozzle ${
          activeNozzle?.id || "N/A"
        } - Fueling`}
        width={500}
        height={"auto"}
        showCloseButton={true}
        onHiding={() => setShowFuelingPopup(false)}
      >
        <div className="modern-fueling-progress">
          <div className="fueling-status">
            <span>Fueling in progress...</span>
            <div className="status-badge active">
              <i className="fa-solid fa-circle"></i> Active
            </div>
          </div>

          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="fueling-metrics">
            <div className="metric-card">
              <i className="fa-solid fa-tint"></i>
              <div className="metric-label">Volume</div>
              <div className="metric-value">{formatVolume(fuelingVolume)}</div>
            </div>

            <div className="metric-card">
              <i className="fa-solid fa-money-bill-wave"></i>
              <div className="metric-label">Amount</div>
              <div className="metric-value">{formatCurrency(fuelingCost)}</div>
            </div>
          </div>

          <div className="fueling-details">
            <div className="detail-row">
              <i className="fa-solid fa-gas-pump"></i>
              <span>
                Pump #{activePump?.id || "N/A"} -{" "}
                {activeNozzle?.fuelType || "Unknown Fuel"}
              </span>
            </div>
            <div className="detail-row">
              <i className="fa-solid fa-car"></i>
              <span>{vehicleOrTag || "No Vehicle/Tag"}</span>
            </div>
          </div>

          <Button
            text="Stop Fueling"
            type="danger"
            stylingMode="contained"
            onClick={stopFueling}
            width="100%"
            className="stop-button"
            icon="fa-light fa-hand-paper"
          />

          <Button
            text="Minimize"
            type="normal"
            stylingMode="outlined"
            onClick={() => setShowFuelingPopup(false)}
            width="100%"
            className="minimize-button"
            icon="fa-light fa-minus"
          />
        </div>
      </Popup>
    );
  },

  renderFuelingCompletePopup: (
    fuelingComplete,
    fuelingVolume,
    fuelingCost,
    activePump,
    activeNozzle,
    vehicleOrTag,
    completeFueling,
    transactionId
  ) => {
    return (
      <Popup
        visible={fuelingComplete}
        dragEnabled={false}
        showCloseButton
={false}
        showTitle={true}
        title="Fueling Complete"
        width={500}
        height={"auto"}
      >
        <div className="modern-fueling-complete">
          <div className="complete-icon">
            <i className="fa-solid fa-check-circle"></i>
          </div>

          <h3>Transaction Complete</h3>

          <div className="transaction-metrics">
            <div className="metric-card">
              <i className="fa-solid fa-tint"></i>
              <div className="metric-label">Volume</div>
              <div className="metric-value">{formatVolume(fuelingVolume)}</div>
            </div>

            <div className="metric-card">
              <i className="fa-solid fa-dollar-sign"></i>
              <div className="metric-label">Amount</div>
              <div className="metric-value">{formatCurrency(fuelingCost)}</div>
            </div>
          </div>

          <div className="transaction-details">
            <div className="detail-group">
              <div className="detail-row">
                <span className="detail-label">Transaction ID:</span>
                <span className="detail-value">{transactionId || "N/A"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Pump:</span>
                <span className="detail-value">
                  {activePump?.name || `Pump ${activePump?.id || "?"}`}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fuel Type:</span>
                <span className="detail-value">
                  {activeNozzle?.fuelType || "Unknown"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Vehicle/Tag:</span>
                <span className="detail-value">{vehicleOrTag || "N/A"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="transaction-actions">
            <Button
              text="Done"
              icon="check"
              type="success"
              stylingMode="contained"
              onClick={completeFueling}
            />
            <Button
              text="Print Receipt"
              icon="print"
              type="normal"
              stylingMode="outlined"
              onClick={() => {
                console.log("Simulating receipt print...");
                // Add actual print logic here if possible
                // window.print(); // This prints the whole page
              }}
              disabled={true}
            />
          </div>
        </div>
      </Popup>
    );
  },

  renderNavigationDialog: (
    showNavigationDialog,
    cancelNavigation,
    confirmNavigation
  ) => {
    return (
      <Popup
        visible={showNavigationDialog}
        dragEnabled={false}
        showCloseButton
={false}
        showTitle={true}
        title="Fueling in Progress"
        width={400}
        height={200}
      >
        <div className="navigation-dialog">
          <p>
            A fueling process is currently in progress. Are you sure you want to
            leave this page?
          </p>
          <div className="action-buttons">
            <Button
              text="Continue Fueling"
              type="default"
              onClick={cancelNavigation}
              stylingMode="contained"
            />
            <Button
              text="Leave Anyway"
              type="danger"
              onClick={confirmNavigation}
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>
    );
  },

  renderAllFuelingProcessesPopup: (
    showAllFuelingPopup,
    activeFuelingProcesses,
    availablePumps,
    onViewDetailsClick,
    setShowAllFuelingPopup
  ) => {
    return (
      <Popup
        visible={showAllFuelingPopup}
        dragEnabled={false}
        showCloseButton={true}
        showTitle={true}
        title="Active Fueling Processes"
        width={600}
        height="auto"
        maxWidth="90%"
        maxHeight="80vh"
        onHiding={() => setShowAllFuelingPopup(false)}
      >
        <div className="all-fueling-processes">
          {activeFuelingProcesses && activeFuelingProcesses.length > 0 ? (
            activeFuelingProcesses.map((process) => (
              <div
                key={process.key || `${process.pumpId}-${process.nozzleId}`}
                className="fueling-process-card"
              >
                <div className="process-header">
                  <h4>
                    <i className="fa-solid fa-gas-pump"></i>
                    {process.pumpName || `Pump ${process.pumpId}`}
                    {process.nozzleId ? ` - Nozzle ${process.nozzleId}` : ""}
                  </h4>
                  <span
                    className={`status-badge ${
                      process.status === "fueling" ? "active" : "completed"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        process.status === "fueling" ? "fa-circle" : "fa-check"
                      }`}
                    ></i>
                    {process.status === "fueling" ? "Active" : "Completed"}
                  </span>
                </div>

                <div className="process-details">
                  <div className="detail-row">
                    <span className="detail-label">Vehicle/Tag:</span>
                    <span className="detail-value">
                      {process.tag || process.vehicleReg || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fuel Type:</span>
                    <span className="detail-value">
                      {process.fuelType || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(process.volume) / 50) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="progress-metrics">
                    <div className="metric">
                      <i className="fa-solid fa-tint"></i>
                      <span>{formatVolume(process.volume)}</span>
                    </div>
                    <div className="metric">
                      <i className="fa-solid fa-dollar-sign"></i>
                      <span>{formatCurrency(process.cost)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  text="View Details"
                  type="default"
                  stylingMode="outlined"
                  width="100%"
                  onClick={() => {
                    const pumpToList = availablePumps.find(
                      (p) => p.id === process.pumpId
                    );
                    if (pumpToList) {
                      onViewDetailsClick(pumpToList);
                    } else {
                      console.warn("Could not find pump details for", process);
                    }
                  }}
                  icon="fa-light fa-eye"
                  disabled={process.status !== "fueling"}
                />
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#6c757d" }}>
              No active fueling processes.
            </p>
          )}
        </div>
      </Popup>
    );
  },
};

export default FuelingPopupRenderer;
