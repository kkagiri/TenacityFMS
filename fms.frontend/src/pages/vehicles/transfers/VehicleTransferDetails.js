/**
 * VehicleTransferDetails.js
 * Component to display detailed transfer information
 */

import React from "react";
import Button from "devextreme-react/button";

const VehicleTransferDetails = ({ transfer, onClose }) => {
  if (!transfer) {
    return (
      <div className="tw-p-4 tw-text-center tw-text-gray-500">
        No transfer data available
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "tw-bg-green-100 tw-text-green-800";
      case "intransit":
        return "tw-bg-blue-100 tw-text-blue-800";
      case "cancelled":
        return "tw-bg-red-100 tw-text-red-800";
      case "pending":
      default:
        return "tw-bg-yellow-100 tw-text-yellow-800";
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="tw-p-4">
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-start tw-mb-6">
        <div>
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">
            Transfer #{transfer.deliveryNoteNumber || transfer.transferId}
          </h2>
          <p className="tw-text-gray-500">
            Created on {formatDateTime(transfer.dateCreated)}
          </p>
        </div>
        <span
          className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium ${getStatusBadgeClass(
            transfer.status
          )}`}
        >
          {transfer.status}
        </span>
      </div>

      {/* Vehicle Info */}
      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-6">
        <h3 className="tw-font-semibold tw-text-blue-800 tw-mb-3">
          <i className="fa-light fa-truck tw-mr-2"></i>
          Vehicle Information
        </h3>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
          <div>
            <span className="tw-text-sm tw-text-gray-500">Vehicle No</span>
            <p className="tw-font-semibold">{transfer.vehicleHyoungNo}</p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Reg. No</span>
            <p className="tw-font-semibold">{transfer.vehicleNumberPlate}</p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Make & Model</span>
            <p className="tw-font-semibold">{transfer.makeModel || "-"}</p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Job Number</span>
            <p className="tw-font-semibold">{transfer.jobNumber || "-"}</p>
          </div>
        </div>
      </div>

      {/* Transfer Details */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-6">
        {/* From/To Sites */}
        <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
          <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-route tw-mr-2"></i>
            Transfer Route
          </h3>
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-flex-1 tw-text-center tw-p-3 tw-bg-red-50 tw-rounded-lg">
              <span className="tw-text-sm tw-text-gray-500">From</span>
              <p className="tw-font-semibold tw-text-red-700">
                {transfer.fromSiteName}
              </p>
            </div>
            <i className="fa-light fa-arrow-right tw-text-2xl tw-text-gray-400"></i>
            <div className="tw-flex-1 tw-text-center tw-p-3 tw-bg-green-50 tw-rounded-lg">
              <span className="tw-text-sm tw-text-gray-500">To</span>
              <p className="tw-font-semibold tw-text-green-700">
                {transfer.toSiteName}
              </p>
            </div>
          </div>
          <div className="tw-mt-4 tw-text-center">
            <span className="tw-text-sm tw-text-gray-500">Transfer Date</span>
            <p className="tw-font-semibold">{formatDate(transfer.transferDate)}</p>
          </div>
        </div>

        {/* Driver & Times */}
        <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
          <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-user tw-mr-2"></i>
            Driver & Timing
          </h3>
          <div className="tw-space-y-3">
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-500">Driver</span>
              <span className="tw-font-medium">{transfer.driverName || "-"}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-500">Phone</span>
              <span className="tw-font-medium">{transfer.driverPhone || "-"}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-500">Departure</span>
              <span className="tw-font-medium">
                {formatDateTime(transfer.departureTime)}
              </span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-500">Arrival</span>
              <span className="tw-font-medium">
                {formatDateTime(transfer.arrivalTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Reading */}
      <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-mb-6">
        <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
          <i className="fa-light fa-gauge tw-mr-2"></i>
          Equipment Reading
        </h3>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
          <div>
            <span className="tw-text-sm tw-text-gray-500">Current Reading</span>
            <p className="tw-font-semibold tw-text-lg">
              {transfer.currentReading || "-"}{" "}
              <span className="tw-text-sm tw-text-gray-500">
                {transfer.readingUnit || "hrs"}
              </span>
            </p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Next Service</span>
            <p className="tw-font-semibold tw-text-lg">
              {transfer.nextServiceReading || "-"}{" "}
              <span className="tw-text-sm tw-text-gray-500">
                {transfer.readingUnit || "hrs"}
              </span>
            </p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Fuel in Tank</span>
            <p className="tw-font-semibold tw-text-lg">
              {transfer.fuelInTank || "-"} L
            </p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Seal Number</span>
            <p className="tw-font-semibold">{transfer.sealNumber || "-"}</p>
          </div>
        </div>
      </div>

      {/* GPS Equipment Checkup */}
      {(transfer.gpsDeviceId || transfer.fuelSensorId ||
        transfer.gpsDeviceCondition || transfer.fuelSensorCondition) && (
        <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-mb-6">
          <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
            <i className="fa-light fa-satellite-dish tw-mr-2"></i>
            GPS Equipment Checkup
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {/* GPS Device */}
            <div className="tw-border tw-rounded-lg tw-p-3">
              <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                <i className="fa-light fa-location-dot tw-mr-1"></i>
                GPS Device
              </h4>
              <div className="tw-space-y-2">
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Device ID / Serial</span>
                  <span className="tw-text-sm tw-font-medium">{transfer.gpsDeviceId || "-"}</span>
                </div>
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Condition</span>
                  <span className="tw-text-sm tw-font-medium">{transfer.gpsDeviceCondition || "-"}</span>
                </div>
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Working</span>
                  <span className={`tw-text-sm tw-font-medium ${transfer.gpsDeviceWorking ? "tw-text-green-600" : "tw-text-red-600"}`}>
                    {transfer.gpsDeviceWorking ? "Yes" : "No"}
                  </span>
                </div>
                {transfer.gpsDeviceRemarks && (
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-sm tw-text-gray-500">Remarks</span>
                    <span className="tw-text-sm tw-font-medium">{transfer.gpsDeviceRemarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fuel Sensor */}
            <div className="tw-border tw-rounded-lg tw-p-3">
              <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                <i className="fa-light fa-gas-pump tw-mr-1"></i>
                Fuel Sensor
              </h4>
              <div className="tw-space-y-2">
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Sensor ID / Serial</span>
                  <span className="tw-text-sm tw-font-medium">{transfer.fuelSensorId || "-"}</span>
                </div>
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Condition</span>
                  <span className="tw-text-sm tw-font-medium">{transfer.fuelSensorCondition || "-"}</span>
                </div>
                <div className="tw-flex tw-justify-between">
                  <span className="tw-text-sm tw-text-gray-500">Working</span>
                  <span className={`tw-text-sm tw-font-medium ${transfer.fuelSensorWorking ? "tw-text-green-600" : "tw-text-red-600"}`}>
                    {transfer.fuelSensorWorking ? "Yes" : "No"}
                  </span>
                </div>
                {transfer.fuelSensorRemarks && (
                  <div className="tw-flex tw-justify-between">
                    <span className="tw-text-sm tw-text-gray-500">Remarks</span>
                    <span className="tw-text-sm tw-font-medium">{transfer.fuelSensorRemarks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkup Items */}
      {transfer.checkupItems?.length > 0 && (
        <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-mb-6">
          <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-clipboard-check tw-mr-2"></i>
            Checkup Items
          </h3>
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-text-sm">
              <thead className="tw-bg-gray-50">
                <tr>
                  <th className="tw-p-2 tw-text-left">#</th>
                  <th className="tw-p-2 tw-text-left">Description</th>
                  <th className="tw-p-2 tw-text-center">Good</th>
                  <th className="tw-p-2 tw-text-center">Fair</th>
                  <th className="tw-p-2 tw-text-center">Damaged</th>
                  <th className="tw-p-2 tw-text-center">Worn</th>
                  <th className="tw-p-2 tw-text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transfer.checkupItems.map((item) => (
                  <tr key={item.id} className="tw-border-b">
                    <td className="tw-p-2">{item.serialNo}</td>
                    <td className="tw-p-2">{item.description}</td>
                    <td className="tw-p-2 tw-text-center">
                      {item.isGood && (
                        <i className="fa-solid fa-check tw-text-green-500"></i>
                      )}
                    </td>
                    <td className="tw-p-2 tw-text-center">
                      {item.isFair && (
                        <i className="fa-solid fa-check tw-text-yellow-500"></i>
                      )}
                    </td>
                    <td className="tw-p-2 tw-text-center">
                      {item.isDamaged && (
                        <i className="fa-solid fa-check tw-text-red-500"></i>
                      )}
                    </td>
                    <td className="tw-p-2 tw-text-center">
                      {item.isWorn && (
                        <span>
                          <i className="fa-solid fa-check tw-text-orange-500"></i>
                          {item.wornPercentage && ` ${item.wornPercentage}%`}
                        </span>
                      )}
                    </td>
                    <td className="tw-p-2">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remarks */}
      {transfer.remarks && (
        <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4 tw-mb-6">
          <h3 className="tw-font-semibold tw-text-yellow-800 tw-mb-2">
            <i className="fa-light fa-comment tw-mr-2"></i>
            Remarks
          </h3>
          <p className="tw-text-gray-700">{transfer.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="tw-bg-gray-50 tw-border tw-rounded-lg tw-p-4 tw-mb-6">
        <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
          <i className="fa-light fa-signature tw-mr-2"></i>
          Approvals
        </h3>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
          <div>
            <span className="tw-text-sm tw-text-gray-500">Workshop Manager</span>
            <p className="tw-font-medium">
              {transfer.workshopManagerSign || "-"}
            </p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Sender</span>
            <p className="tw-font-medium">{transfer.senderName || "-"}</p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Receiver</span>
            <p className="tw-font-medium">{transfer.receiverName || "-"}</p>
          </div>
          <div>
            <span className="tw-text-sm tw-text-gray-500">Approved By</span>
            <p className="tw-font-medium">{transfer.approvedBy || "-"}</p>
          </div>
        </div>
      </div>

      {/* Document */}
      {transfer.documentUrl && (
        <div className="tw-flex tw-justify-center tw-mb-6">
          <Button
            text="View Transfer Document"
            icon="fa-light fa-file-pdf"
            type="default"
            stylingMode="contained"
            onClick={() => window.open(transfer.documentUrl, "_blank")}
          />
        </div>
      )}

      {/* Close Button */}
      <div className="tw-flex tw-justify-end tw-pt-4 tw-border-t">
        <Button
          text="Close"
          type="normal"
          stylingMode="outlined"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default VehicleTransferDetails;
