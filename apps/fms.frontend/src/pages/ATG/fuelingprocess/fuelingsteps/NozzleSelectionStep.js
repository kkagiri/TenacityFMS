import React, { memo } from "react";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

//Cursor: Memoized NozzleSelectionStep component
const NozzleSelectionStep = memo(({ nozzles, setSelectedNozzle, setStep }) => {
  const hasNozzles = nozzles && nozzles.length > 0;

  return (
    <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
      <h3 className="tw-flex-shrink-0 tw-mb-4">
        <i className="fa-light fa-filter tw-mr-2"></i>Select Nozzle
      </h3>
      <div className="nozzle-selection-container tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
        {hasNozzles ? (
          <div className="dx-fieldset">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
              {nozzles.map((item) => {
                const isClickable =
                  item.status === "idle" || item.status === "lifted";

                let fuelColor = "#007bff";
                if (item.fuelType) {
                  if (item.fuelType.toLowerCase().includes("diesel")) {
                    fuelColor = "#4e810a";
                  } else if (
                    item.fuelType.toLowerCase().includes("petrol") ||
                    item.fuelType.toLowerCase().includes("gasoline")
                  ) {
                    fuelColor = "#e63946";
                  } else if (item.fuelType.toLowerCase().includes("premium")) {
                    fuelColor = "#7209b7";
                  }
                }

                return (
                  <div
                    key={item.id}
                    className={`tw-border-2 tw-rounded-xl tw-transition-all tw-duration-200 tw-min-h-[200px] ${
                      isClickable
                        ? "tw-bg-white tw-border-gray-200 tw-shadow-md hover:tw-shadow-lg hover:tw--translate-y-1 tw-cursor-pointer"
                        : "tw-bg-gray-50 tw-border-gray-300 tw-opacity-70 tw-cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (isClickable) {
                        console.log(`Clicking nozzle ${item.id}`);
                        setSelectedNozzle(item);
                      } else {
                        notify(
                          `Nozzle ${item.id} is currently ${
                            item.status || "unavailable"
                          }. Cannot select.`,
                          "warning",
                          2000
                        );
                      }
                    }}
                  >
                    <div className="tw-p-5 tw-flex tw-flex-col tw-h-full">
                      {/* Header: Icon and Nozzle ID */}
                      <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
                        <div
                          className="tw-h-14 tw-w-14 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-shadow-sm"
                          style={{
                            backgroundColor: `${
                              isClickable ? fuelColor : "#6c757d"
                            }20`,
                          }}
                        >
                          {item.fuelType &&
                          item.fuelType.toLowerCase().includes("diesel") ? (
                            <i
                              className="fa-light fa-truck-monster tw-text-3xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          ) : item.fuelType &&
                            item.fuelType.toLowerCase().includes("premium") ? (
                            <i
                              className="fa-light fa-tachometer-alt tw-text-3xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          ) : (
                            <i
                              className="fa-light fa-gas-pump tw-text-3xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          )}
                        </div>
                        <span
                          className={`tw-inline-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-full tw-font-bold tw-text-sm tw-shadow-sm ${
                            isClickable
                              ? "tw-bg-blue-600 tw-text-white"
                              : "tw-bg-gray-400 tw-text-gray-100"
                          }`}
                        >
                          {item.id}
                        </span>
                      </div>

                      {/* Nozzle Name and Status */}
                      <div className="tw-mb-4">
                        <h5 className="tw-text-xl tw-font-bold tw-mb-2 tw-text-gray-800">
                          {item.name || `Nozzle ${item.id}`}
                        </h5>
                        <div
                          className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${
                            item.status === "idle"
                              ? "tw-bg-green-100 tw-text-green-800"
                              : item.status === "lifted"
                              ? "tw-bg-orange-100 tw-text-orange-800"
                              : "tw-bg-gray-200 tw-text-gray-700"
                          }`}
                        >
                          <i
                            className={`fas ${
                              item.status === "idle"
                                ? "fa-check-circle"
                                : item.status === "lifted"
                                ? "fa-arrow-up"
                                : "fa-question-circle"
                            } tw-text-xs`}
                          ></i>
                          {item.status === "idle"
                            ? "Ready"
                            : item.status === "lifted"
                            ? "Lifted"
                            : item.status}
                        </div>
                      </div>

                      {/* Fuel Type Display */}
                      <div className="tw-mt-auto tw-pt-3 tw-border-t tw-border-gray-200">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div
                            className="tw-h-2 tw-w-2 tw-rounded-full"
                            style={{
                              backgroundColor: isClickable ? fuelColor : "#6c757d",
                            }}
                          ></div>
                          <span className="tw-text-sm tw-font-semibold tw-text-gray-700">
                            {item.fuelType || "Unknown Fuel"}
                          </span>
                        </div>
                        {isClickable && (
                          <div className="tw-mt-2 tw-text-xs tw-text-gray-500 tw-flex tw-items-center tw-gap-1">
                            <i className="fa-light fa-hand-pointer tw-text-blue-500"></i>
                            <span>Click to select</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-nozzles-message">
            <div className="no-data-icon">
              <i className="fa-light fa-filter"></i>
              <i className="fa-light fa-slash"></i>
            </div>
            <p>No nozzles found for the selected pump.</p>
            <p className="no-data-subtext">
              Please check the device configuration or pump status.
            </p>
          </div>
        )}
      </div>
      <div className="tw-flex-shrink-0 tw-mt-4">
        <Button
          text="Back to Pumps"
          type="normal"
          icon="fa-light fa-chevron-left"
          stylingMode="outlined"
          onClick={() => setStep("pump")}
        />
      </div>
    </div>
  );
});

export default NozzleSelectionStep;
