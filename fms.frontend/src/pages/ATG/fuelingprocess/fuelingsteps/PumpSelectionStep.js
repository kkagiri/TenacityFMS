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
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        <h3 className="tw-flex-shrink-0 tw-mb-4">
          <i className="fas fa-gas-pump tw-mr-2"></i>Select Pump
        </h3>
        <div className="pump-selection-container tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
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
                        padding: "16px",
                        borderRadius: "12px",
                        height: "100%",
                        border: isActive
                          ? "2px solid #4caf50"
                          : isSelectable
                          ? "2px solid #198754"
                          : "1px solid #dee2e6",
                        backgroundColor: isClickable ? "#ffffff" : "#f8f9fa",
                        opacity: isClickable ? 1 : 0.7,
                        cursor: isClickable ? "pointer" : "not-allowed",
                        boxShadow: isClickable
                          ? "0 2px 4px rgba(0,0,0,0.1)"
                          : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Header with pump icon and badge */}
                      <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                        <div className="pump-icon-container tw-relative">
                          <PumpIcon
                            className="pump-icon"
                            style={{ width: "56px", height: "56px" }}
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
                        </div>
                        {isActive && (
                          <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-bg-green-100 tw-text-green-800 tw-rounded-full tw-text-xs tw-font-semibold">
                            <i className="fas fa-circle tw-text-[6px]"></i> Busy
                          </span>
                        )}
                        {item.status === "offline" && (
                          <span className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-bg-red-100 tw-text-red-800 tw-rounded-full tw-text-xs tw-font-semibold">
                            <i className="fas fa-triangle-exclamation tw-text-xs"></i> Offline
                          </span>
                        )}
                      </div>

                      {/* Pump Name */}
                      <h4 className="tw-text-lg tw-font-bold tw-mb-2 tw-text-gray-800">
                        {item.name}
                      </h4>

                      {/* Status Badge */}
                      <div className="tw-mb-3">
                        <span
                          className={`tw-inline-flex tw-items-center tw-px-3 tw-py-1 tw-rounded-md tw-text-sm tw-font-medium ${
                            item.status === "idle"
                              ? "tw-bg-green-100 tw-text-green-800"
                              : item.status === "nozzleUp"
                              ? "tw-bg-orange-100 tw-text-orange-800"
                              : item.status === "fueling"
                              ? "tw-bg-blue-100 tw-text-blue-800"
                              : item.status === "endOfTransaction"
                              ? "tw-bg-purple-100 tw-text-purple-800"
                              : "tw-bg-red-100 tw-text-red-800"
                          }`}
                        >
                          <i
                            className={`fas ${
                              item.status === "idle"
                                ? "fa-check-circle"
                                : item.status === "nozzleUp"
                                ? "fa-arrow-up"
                                : item.status === "fueling"
                                ? "fa-fire-flame-curved"
                                : item.status === "endOfTransaction"
                                ? "fa-flag-checkered"
                                : "fa-times-circle"
                            } tw-mr-1 tw-text-xs`}
                          ></i>
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
                      </div>

                      {/* Last Transaction Info */}
                      {item.lastTransaction > 0 && (
                        <div className="tw-bg-gray-50 tw-rounded-lg tw-p-2 tw-mb-3">
                          <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-600">
                            <i className="fas fa-receipt tw-text-gray-500"></i>
                            <span className="tw-font-medium">Last Transaction:</span>
                          </div>
                          <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
                            {item.lastAmount > 0 && (
                              <span className="tw-text-sm tw-font-semibold tw-text-gray-800">
                                ${item.lastAmount.toFixed(2)}
                              </span>
                            )}
                            {item.lastVolume > 0 && (
                              <span className="tw-text-xs tw-text-gray-600">
                                ({item.lastVolume.toFixed(2)}L)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Active Pump View Button */}
                      {isActive && (
                        <div
                          className="tw-mt-auto"
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
