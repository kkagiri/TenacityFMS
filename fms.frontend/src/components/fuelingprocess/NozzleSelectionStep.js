import React, { memo } from "react";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

//Cursor: Memoized NozzleSelectionStep component
const NozzleSelectionStep = memo(({ nozzles, setSelectedNozzle, setStep }) => {
  const hasNozzles = nozzles && nozzles.length > 0;

  return (
    <div className="dx-card responsive-paddings">
      <h3>
        <i className="fas fa-filter tw-mr-2"></i>Select Nozzle
      </h3>
      <div className="nozzle-selection-container">
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
                    className={`tw-border tw-rounded-lg tw-transition-all tw-duration-100 tw-transform tw-min-h-[180px] ${
                      isClickable
                        ? "tw-bg-white tw-shadow-sm hover:tw-shadow tw-cursor-pointer"
                        : "tw-bg-gray-100 tw-opacity-60 tw-cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (isClickable) {
                        console.log(`Clicking nozzle ${item.id}`);
                        setSelectedNozzle(item);
                        setStep("scan");
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
                    <div className="tw-p-4 tw-flex tw-flex-col tw-h-full">
                      <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                        <div
                          className="tw-h-12 tw-w-12 tw-flex tw-items-center tw-justify-center tw-rounded-full"
                          style={{
                            backgroundColor: `${
                              isClickable ? fuelColor : "#6c757d"
                            }15`,
                          }}
                        >
                          {item.fuelType &&
                          item.fuelType.toLowerCase().includes("diesel") ? (
                            <i
                              className="fas fa-truck-monster tw-text-2xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          ) : item.fuelType &&
                            item.fuelType.toLowerCase().includes("premium") ? (
                            <i
                              className="fas fa-tachometer-alt tw-text-2xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          ) : (
                            <i
                              className="fas fa-gas-pump tw-text-2xl"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                          )}
                        </div>
                        <span
                          className={`tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-full tw-font-bold ${
                            isClickable
                              ? "tw-bg-blue-100 tw-text-blue-800"
                              : "tw-bg-gray-200 tw-text-gray-600"
                          }`}
                        >
                          {item.id}
                        </span>
                      </div>

                      <div className="tw-mb-2">
                        <h5 className="tw-text-lg tw-font-semibold tw-mb-1">
                          {item.name || `Nozzle ${item.id}`}
                        </h5>
                        <div
                          className={`tw-inline-block tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-rounded ${
                            isClickable
                              ? "tw-bg-blue-100 tw-text-blue-800"
                              : "tw-bg-gray-200 tw-text-gray-600"
                          }`}
                        >
                          {item.status === "idle"
                            ? "Ready"
                            : item.status === "lifted"
                            ? "Lifted"
                            : item.status}
                        </div>
                      </div>

                      <div className="tw-mt-auto">
                        <div className="tw-flex tw-items-center tw-text-sm tw-text-gray-600">
                          <i
                            className="fas fa-fill tw-mr-2"
                            style={{
                              color: isClickable ? fuelColor : "#6c757d",
                            }}
                          ></i>
                          <span className="tw-font-medium">
                            {item.fuelType || "Unknown Fuel"}
                          </span>
                        </div>
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
              <i className="fas fa-slash"></i>
            </div>
            <p>No nozzles found for the selected pump.</p>
            <p className="no-data-subtext">
              Please check the device configuration or pump status.
            </p>
          </div>
        )}
      </div>
      <Button
        text="Back to Pumps"
        type="normal"
        icon="fas fa-chevron-left"
        stylingMode="outlined"
        onClick={() => setStep("pump")}
        className="tw-mt-4"
      />
    </div>
  );
});

export default NozzleSelectionStep;
