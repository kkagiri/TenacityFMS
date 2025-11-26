import React from "react";

/**
 * AuthorizationSuccessStep.js
 *
 * Displays authorization success confirmation and guides the user through
 * the physical steps required to start fueling. This is a separate step
 * shown after successful pump authorization.
 *
 * Features:
 * - Shows transaction ID from authorization
 * - Displays which pump and nozzle to use
 * - Provides step-by-step physical fueling instructions
 * - Detects EOT (End of Transaction) when nozzle is replaced
 * - Shows completion message when fueling ends
 */
const AuthorizationSuccessStep = ({
  currentTransactionId,
  selectedPump,
  selectedNozzle,
  eotDetected,
  displayDetails,
}) => {
  return (
    <div className="authorization-success-step tw-px-4 tw-py-6">
      {/* Authorization Success Banner */}
      {!eotDetected ? (
        <div className="tw-bg-green-50 tw-border-2 tw-border-green-500 tw-rounded-lg tw-p-6 tw-mb-6 tw-animate-pulse">
          <div className="tw-flex tw-items-center tw-mb-4">
            <i className="fa-light fa-circle-check tw-text-green-600 tw-text-4xl tw-mr-4"></i>
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-green-800 tw-mb-1">
                Authorization Successful!
              </h2>
              <p className="tw-text-green-700 tw-text-lg">
                Transaction ID: <span className="tw-font-mono tw-font-bold">{currentTransactionId || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Vehicle/Tag Info */}
          {displayDetails && (
            <div className="tw-bg-white tw-rounded-lg tw-p-4 tw-mb-4 tw-border tw-border-green-200">
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                {displayDetails.numberPlate && (
                  <div>
                    <span className="tw-text-gray-600 tw-text-sm">Vehicle:</span>
                    <p className="tw-font-semibold tw-text-gray-900">{displayDetails.numberPlate}</p>
                  </div>
                )}
                {displayDetails.hyoungNo && (
                  <div>
                    <span className="tw-text-gray-600 tw-text-sm">Hyoung No:</span>
                    <p className="tw-font-semibold tw-text-gray-900">{displayDetails.hyoungNo}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pump and Nozzle Info */}
          <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-mb-4 tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-8">
              <div className="tw-text-center">
                <i className="fa-light fa-gas-pump tw-text-blue-600 tw-text-3xl tw-mb-2"></i>
                <p className="tw-text-sm tw-text-gray-600">Pump</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                  {selectedPump?.id || "N/A"}
                </p>
              </div>
              <div className="tw-text-4xl tw-text-gray-400">→</div>
              <div className="tw-text-center">
                <i className="fa-light fa-spray-can tw-text-blue-600 tw-text-3xl tw-mb-2"></i>
                <p className="tw-text-sm tw-text-gray-600">Nozzle</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                  {selectedNozzle?.id || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Physical Fueling Instructions */}
          <div className="tw-bg-white tw-rounded-lg tw-p-5 tw-border tw-border-green-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center">
              <i className="fa-light fa-list-check tw-text-green-600 tw-mr-2"></i>
              Ready to Start Fueling - Follow These Steps:
            </h3>
            <ol className="tw-space-y-3">
              <li className="tw-flex tw-items-start">
                <span className="tw-flex-shrink-0 tw-w-8 tw-h-8 tw-bg-green-500 tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-mr-3">
                  1
                </span>
                <div className="tw-flex-1">
                  <p className="tw-font-semibold tw-text-gray-800">
                    Lift Nozzle {selectedNozzle?.id || ""} from Pump {selectedPump?.id || ""}
                  </p>
                  <p className="tw-text-sm tw-text-gray-600">
                    Remove the authorized nozzle from its holder
                  </p>
                </div>
              </li>
              <li className="tw-flex tw-items-start">
                <span className="tw-flex-shrink-0 tw-w-8 tw-h-8 tw-bg-green-500 tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-mr-3">
                  2
                </span>
                <div className="tw-flex-1">
                  <p className="tw-font-semibold tw-text-gray-800">
                    Insert nozzle into vehicle fuel tank
                  </p>
                  <p className="tw-text-sm tw-text-gray-600">
                    Ensure proper seal for safe fueling
                  </p>
                </div>
              </li>
              <li className="tw-flex tw-items-start">
                <span className="tw-flex-shrink-0 tw-w-8 tw-h-8 tw-bg-green-500 tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-mr-3">
                  3
                </span>
                <div className="tw-flex-1">
                  <p className="tw-font-semibold tw-text-gray-800">
                    Pull trigger to start fuel flow
                  </p>
                  <p className="tw-text-sm tw-text-gray-600">
                    Counter will begin automatically when fuel starts flowing
                  </p>
                </div>
              </li>
              <li className="tw-flex tw-items-start">
                <span className="tw-flex-shrink-0 tw-w-8 tw-h-8 tw-bg-green-500 tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-mr-3">
                  4
                </span>
                <div className="tw-flex-1">
                  <p className="tw-font-semibold tw-text-gray-800">
                    Monitor progress on screen
                  </p>
                  <p className="tw-text-sm tw-text-gray-600">
                    Transaction will complete when nozzle clicks off or you release trigger
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Waiting Indicator */}
          <div className="tw-mt-6 tw-text-center">
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-3">
              <i className="fa-light fa-hourglass-half tw-text-green-600 tw-text-xl tw-animate-spin"></i>
              <p className="tw-text-green-700 tw-font-medium">
                Waiting for physical fueling to begin...
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* EOT Detected - Transaction Complete */
        <div className="tw-bg-blue-50 tw-border-2 tw-border-blue-500 tw-rounded-lg tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-mb-4">
            <i className="fa-light fa-circle-check tw-text-blue-600 tw-text-4xl tw-mr-4"></i>
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-blue-800 tw-mb-1">
                Fueling Complete!
              </h2>
              <p className="tw-text-blue-700 tw-text-lg">
                Transaction ID: <span className="tw-font-mono tw-font-bold">{currentTransactionId || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* EOT Detection Info */}
          <div className="tw-bg-white tw-rounded-lg tw-p-5 tw-border tw-border-blue-200 tw-mb-4">
            <div className="tw-flex tw-items-center tw-justify-center tw-mb-4">
              <i className="fa-light fa-check-double tw-text-blue-600 tw-text-3xl tw-mr-3"></i>
              <p className="tw-text-lg tw-font-semibold tw-text-gray-800">
                End of Transaction Detected
              </p>
            </div>
            <div className="tw-space-y-2 tw-text-center">
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                <i className="fa-light fa-spray-can-sparkles tw-text-green-600"></i>
                <p className="tw-text-gray-700">
                  Nozzle {selectedNozzle?.id || ""} has been replaced on Pump {selectedPump?.id || ""}
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                <i className="fa-light fa-database tw-text-green-600"></i>
                <p className="tw-text-gray-700">
                  Transaction data has been recorded
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                <i className="fa-light fa-hourglass-half tw-text-orange-600 tw-animate-pulse"></i>
                <p className="tw-text-gray-700 tw-font-semibold">
                  Waiting for nozzle to be properly seated...
                </p>
              </div>
            </div>
          </div>

          {/* Auto-return notice */}
          <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-mb-4 tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-3">
              <i className="fa-light fa-info-circle tw-text-blue-600 tw-text-xl"></i>
              <p className="tw-text-center tw-text-blue-700 tw-text-sm">
                System will automatically return to pump selection once nozzle is properly replaced
              </p>
            </div>
          </div>

          {/* Transaction Summary Placeholder */}
          <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
            <p className="tw-text-center tw-text-gray-600 tw-text-sm tw-mb-2">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Transaction details will be available in the pump transaction history
            </p>
          </div>
        </div>
      )}

      {/* Help/Tips Section */}
      <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
        <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2 tw-flex tw-items-center">
          <i className="fa-light fa-lightbulb tw-text-yellow-500 tw-mr-2"></i>
          Tips:
        </h4>
        <ul className="tw-space-y-1 tw-text-sm tw-text-gray-700">
          <li className="tw-flex tw-items-start">
            <i className="fa-light fa-check tw-text-green-600 tw-mr-2 tw-mt-1"></i>
            <span>The pump will automatically start when you pull the trigger</span>
          </li>
          <li className="tw-flex tw-items-start">
            <i className="fa-light fa-check tw-text-green-600 tw-mr-2 tw-mt-1"></i>
            <span>The nozzle will click off automatically when tank is full</span>
          </li>
          <li className="tw-flex tw-items-start">
            <i className="fa-light fa-check tw-text-green-600 tw-mr-2 tw-mt-1"></i>
            <span>Always replace the nozzle properly after fueling completes</span>
          </li>
          {!eotDetected && (
            <li className="tw-flex tw-items-start">
              <i className="fa-light fa-check tw-text-green-600 tw-mr-2 tw-mt-1"></i>
              <span>Transaction will complete automatically when you replace the nozzle</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AuthorizationSuccessStep;
