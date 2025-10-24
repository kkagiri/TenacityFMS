import React, { memo } from "react";
import { Button } from "devextreme-react/button";
import { TileView } from "devextreme-react/tile-view";
import notify from "devextreme/ui/notify";
import PumpIcon from "../../../../components/icons/PumpIcon";

//Cursor: Memoized PumpSelectionStep component
const PumpSelectionStep = memo(
  ({
    availablePumps,
    activePumps,
    setSelectedPump,
    setStep,
    setActivePump,
    setShowFuelingPopup,
  }) => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>
          <i className="fas fa-gas-pump tw-mr-2"></i>Select Pump
        </h3>
        <div className="pump-selection-container">
          {availablePumps && availablePumps.length > 0 ? (
            <div className="dx-fieldset">
              <TileView
                items={availablePumps}
                baseItemHeight={220}
                baseItemWidth={200}
                itemMargin={15}
                itemRender={(item) => {
                  const isActive = activePumps.some(
                    (p) => p.pumpId === item.id
                  );
                  const isClickable =
                    item.status === "idle" ||
                    item.status === "nozzleUp" ||
                    item.status === "fueling";
                  const isSelectable = item.status === "idle";

                  return (
                    <div
                      className={`pump-tile ${
                        isSelectable ? "selectable" : ""
                      } ${isClickable ? "clickable" : "disabled"} ${
                        isActive ? "currently-active" : ""
                      }`}
                      style={{
                        padding: "15px",
                        borderRadius: "8px",
                        height: "100%",
                        border: isActive
                          ? "2px solid #4caf50"
                          : isSelectable
                          ? "1px solid #198754"
                          : "1px solid #ddd",
                        backgroundColor: isClickable ? "#f8f8f8" : "#eee",
                        opacity: isClickable ? 1 : 0.6,
                        cursor: isClickable ? "pointer" : "not-allowed",
                      }}
                    >
                      <div className="pump-icon-container">
                        <PumpIcon
                          className="pump-icon"
                          color={
                            isSelectable
                              ? "#198754"
                              : item.status === "offline"
                              ? "#dc3545"
                              : isActive
                              ? "#4caf50"
                              : "#6c757d"
                          }
                        />
                        {isActive && (
                          <div className="active-indicator-badge">
                            <i className="fas fa-circle"></i> Busy
                          </div>
                        )}
                        {item.status === "offline" && (
                          <div className="offline-indicator-badge">
                            <i className="fas fa-triangle-exclamation"></i>{" "}
                            Offline
                          </div>
                        )}
                      </div>
                      <h4>{item.name}</h4>
                      <p>
                        Status:{" "}
                        <span
                          style={{
                            fontWeight: "bold",
                            color:
                              item.status === "idle"
                                ? "green"
                                : item.status === "nozzleUp"
                                ? "orange"
                                : item.status === "fueling"
                                ? "blue"
                                : item.status === "endOfTransaction"
                                ? "#6f42c1"
                                : "red",
                          }}
                        >
                          {item.status === "idle"
                            ? "Available"
                            : item.status === "nozzleUp"
                            ? "Nozzle Lifted"
                            : item.status === "fueling"
                            ? "Fueling"
                            : item.status === "endOfTransaction"
                            ? "Completed"
                            : item.status === "offline"
                            ? "Offline"
                            : item.status}
                        </span>
                      </p>

                      {item.lastTransaction > 0 && (
                        <div className="last-transaction">
                          <small>
                            <i className="fas fa-receipt"></i> Last:
                            {item.lastAmount > 0 && (
                              <span className="last-amount">
                                {" "}
                                ${item.lastAmount.toFixed(2)}
                              </span>
                            )}
                            {item.lastVolume > 0 && (
                              <span className="last-volume">
                                {" "}
                                ({item.lastVolume.toFixed(2)}L)
                              </span>
                            )}
                          </small>
                        </div>
                      )}

                      {isActive && (
                        <div
                          className="button-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <Button
                            text="View Details"
                            type="success"
                            stylingMode="contained"
                            width="100%"
                            onClick={() => {
                              setActivePump(item);
                              setShowFuelingPopup(true);
                            }}
                            icon="fas fa-eye"
                            className="view-fueling-btn"
                          />
                        </div>
                      )}
                    </div>
                  );
                }}
                onItemClick={(e) => {
                  if (
                    e.itemData.status === "idle" ||
                    e.itemData.status === "nozzleUp"
                  ) {
                    setSelectedPump(e.itemData);
                    setStep("nozzle");
                  } else if (
                    e.itemData.status === "fueling" ||
                    e.itemData.status === "endOfTransaction"
                  ) {
                    setActivePump(e.itemData);
                    setShowFuelingPopup(true);
                  } else if (e.itemData.status === "offline") {
                    notify("This pump is offline.", "error", 2000);
                  } else if (e.itemData.status === "nozzleUp") {
                    notify(
                      "Nozzle is already lifted for this pump.",
                      "warning",
                      2000
                    );
                    setSelectedPump(e.itemData);
                    setStep("nozzle");
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-pumps-message">
              <div className="no-data-icon">
                <i className="fa-light fa-gas-pump"></i>
                <i className="fas fa-slash"></i>
              </div>
              <p>No pumps are available for this device.</p>
              <p className="no-data-subtext">
                Please check device configuration or connection status.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default PumpSelectionStep;
