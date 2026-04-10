/**
 * File:          EquipmentInspectionTab.js
 * Purpose:       Equipment Inspection tab content for Vehicle Transfer Details panel.
 *                Renders GPS Equipment Checkup, Checkup Items, Tyre Details,
 *                Battery Details, and Service Filter Parts tables.
 * Dependencies:  m365-shared.scss design tokens, VehicleTransferDetails.scss table styles
 * Last Modified: 2026-02-02
 *
 * Key Components:
 * - GPS Equipment Checkup (GPS Device + Fuel Sensor cards)
 * - Checkup Items table with condition indicators
 * - Tyre Details table with condition badges
 * - Battery Details table
 * - Service Filter Parts table
 */

import React from "react";

const EquipmentInspectionTab = ({ transfer }) => {
    if (!transfer) return null;

    const extractRemarkValue = (remarks, label) => {
        if (!remarks) {
            return "";
        }

        const matchedLine = String(remarks)
            .split(/\r?\n/)
            .find((line) => line.trim().toLowerCase().startsWith(`${label.toLowerCase()}:`));

        if (!matchedLine) {
            return "";
        }

        return matchedLine.split(":").slice(1).join(":").trim();
    };

    const gpsDeviceId = transfer.gpsDeviceId ?? transfer.GpsDeviceId ?? "";
    const fuelSensorId = transfer.fuelSensorId ?? transfer.FuelSensorId ?? "";
    const gpsDeviceCondition = transfer.gpsDeviceCondition ?? transfer.GpsDeviceCondition ?? "";
    const fuelSensorCondition = transfer.fuelSensorCondition ?? transfer.FuelSensorCondition ?? "";
    const gpsDeviceWorking = transfer.gpsDeviceWorking ?? transfer.GpsDeviceWorking ?? false;
    const fuelSensorWorking = transfer.fuelSensorWorking ?? transfer.FuelSensorWorking ?? false;
    const gpsDeviceRemarks = transfer.gpsDeviceRemarks ?? transfer.GpsDeviceRemarks ?? "";
    const fuelSensorRemarks = transfer.fuelSensorRemarks ?? transfer.FuelSensorRemarks ?? "";
    const gpsDisplayIdentifier = extractRemarkValue(gpsDeviceRemarks, "IMEI") || gpsDeviceId;
    const checkupItems = transfer.checkupItems ?? transfer.CheckupItems ?? [];
    const tyreDetails = transfer.tyreDetails ?? transfer.TyreDetails ?? [];
    const batteryDetails = transfer.batteryDetails ?? transfer.BatteryDetails ?? [];
    const serviceFilterPartsList = transfer.serviceFilterPartsList ?? transfer.ServiceFilterPartsList ?? [];

    const hasGpsData =
        gpsDeviceId ||
        fuelSensorId ||
        gpsDeviceCondition ||
        fuelSensorCondition ||
        gpsDeviceRemarks ||
        fuelSensorRemarks;

    const hasAnyData =
        hasGpsData ||
        checkupItems.length > 0 ||
        tyreDetails.length > 0 ||
        batteryDetails.length > 0 ||
        serviceFilterPartsList.length > 0;

    if (!hasAnyData) {
        return (
            <div className="transfer-details__empty-section">
                <i className="fa-light fa-clipboard-question" />
                <span>No equipment inspection data recorded for this transfer</span>
            </div>
        );
    }

    return (
        <>
            {/* ── GPS Equipment Checkup ── */}
            {hasGpsData && (
                <div className="m365-section-group">
                    <div className="m365-section-group__header">
                        <i className="fa-light fa-satellite-dish m365-section-group__icon" />
                        <span className="m365-section-group__title">GPS Equipment Checkup</span>
                    </div>
                    <div className="m365-section-group__body">
                        <div className="transfer-details__two-col">
                            {/* GPS Device */}
                            <div className="transfer-details__device-card">
                                <h4 className="transfer-details__device-title">
                                    <i className="fa-light fa-location-dot" /> GPS Device
                                </h4>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">IMEI / Serial</span>
                                    <span className="m365-info-row__value">{gpsDisplayIdentifier || "—"}</span>
                                </div>
                                {gpsDeviceId && gpsDisplayIdentifier && gpsDeviceId !== gpsDisplayIdentifier && (
                                    <div className="m365-info-row">
                                        <span className="m365-info-row__label">Provider Device ID</span>
                                        <span className="m365-info-row__value">{gpsDeviceId}</span>
                                    </div>
                                )}
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Condition</span>
                                    <span className="m365-info-row__value">{gpsDeviceCondition || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Working</span>
                                    <span
                                        className={`m365-info-row__value ${gpsDeviceWorking ? "transfer-details__yes" : "transfer-details__no"
                                            }`}
                                    >
                                        {gpsDeviceWorking ? "Yes" : "No"}
                                    </span>
                                </div>
                                {gpsDeviceRemarks && (
                                    <div className="m365-info-row">
                                        <span className="m365-info-row__label">Remarks</span>
                                        <span className="m365-info-row__value" style={{ whiteSpace: "pre-wrap" }}>{gpsDeviceRemarks}</span>
                                    </div>
                                )}
                            </div>

                            {/* Fuel Sensor */}
                            <div className="transfer-details__device-card">
                                <h4 className="transfer-details__device-title">
                                    <i className="fa-light fa-gas-pump" /> Fuel Sensor
                                </h4>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Sensor ID / Serial</span>
                                    <span className="m365-info-row__value">{fuelSensorId || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Condition</span>
                                    <span className="m365-info-row__value">{fuelSensorCondition || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Working</span>
                                    <span
                                        className={`m365-info-row__value ${fuelSensorWorking ? "transfer-details__yes" : "transfer-details__no"
                                            }`}
                                    >
                                        {fuelSensorWorking ? "Yes" : "No"}
                                    </span>
                                </div>
                                {fuelSensorRemarks && (
                                    <div className="m365-info-row">
                                        <span className="m365-info-row__label">Remarks</span>
                                        <span className="m365-info-row__value" style={{ whiteSpace: "pre-wrap" }}>{fuelSensorRemarks}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Checkup Items ── */}
            {checkupItems.length > 0 ? (
                <div className="m365-section-group">
                    <div className="m365-section-group__header">
                        <i className="fa-light fa-clipboard-check m365-section-group__icon" />
                        <span className="m365-section-group__title">Checkup Items</span>
                    </div>
                    <div className="m365-section-group__body" style={{ padding: 0 }}>
                        <table className="transfer-details__table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Description</th>
                                    <th className="transfer-details__table-center">Good</th>
                                    <th className="transfer-details__table-center">Fair</th>
                                    <th className="transfer-details__table-center">Damaged</th>
                                    <th className="transfer-details__table-center">Worn</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checkupItems.map((item, index) => (
                                    <tr key={item.id ?? item.Id ?? `${item.serialNo ?? item.SerialNo ?? index}`}>
                                        <td>{item.serialNo ?? item.SerialNo}</td>
                                        <td>{item.description ?? item.Description}</td>
                                        <td className="transfer-details__table-center">
                                            {(item.isGood ?? item.IsGood) && (
                                                <i className="fa-solid fa-check" style={{ color: "#107c10" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {(item.isFair ?? item.IsFair) && (
                                                <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {(item.isDamaged ?? item.IsDamaged) && (
                                                <i className="fa-solid fa-check" style={{ color: "#d13438" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {(item.isWorn ?? item.IsWorn) && (
                                                <span>
                                                    <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />
                                                    {(item.wornPercentage ?? item.WornPercentage) && ` ${item.wornPercentage ?? item.WornPercentage}%`}
                                                </span>
                                            )}
                                        </td>
                                        <td>{item.remarks ?? item.Remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="transfer-details__empty-section">
                    <i className="fa-light fa-clipboard" />
                    <span>No checkup items recorded</span>
                </div>
            )}

            {/* ── Tyre Details ── */}
            {tyreDetails.length > 0 && (
                <div className="m365-section-group">
                    <div className="m365-section-group__header">
                        <i className="fa-light fa-tire m365-section-group__icon" />
                        <span className="m365-section-group__title">Tyre Details</span>
                    </div>
                    <div className="m365-section-group__body" style={{ padding: 0 }}>
                        <table className="transfer-details__table">
                            <thead>
                                <tr>
                                    <th>Position</th>
                                    <th>Brand</th>
                                    <th>Size</th>
                                    <th>Condition (%)</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tyreDetails.map((tyre, index) => (
                                    <tr key={tyre.id ?? tyre.Id ?? index}>
                                        <td>{tyre.position ?? tyre.Position ?? "—"}</td>
                                        <td>{tyre.brand ?? tyre.Brand ?? "—"}</td>
                                        <td>{tyre.size ?? tyre.Size ?? "—"}</td>
                                        <td>
                                            {(tyre.condition ?? tyre.Condition) != null ? (
                                                <span
                                                    className={`m365-badge ${(tyre.condition ?? tyre.Condition) >= 70
                                                        ? "m365-badge--success"
                                                        : (tyre.condition ?? tyre.Condition) >= 40
                                                            ? "m365-badge--warning"
                                                            : "m365-badge--error"
                                                        }`}
                                                >
                                                    {tyre.condition ?? tyre.Condition}%
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>{tyre.remarks ?? tyre.Remarks ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Battery Details ── */}
            {batteryDetails.length > 0 && (
                <div className="m365-section-group">
                    <div className="m365-section-group__header">
                        <i className="fa-light fa-car-battery m365-section-group__icon" />
                        <span className="m365-section-group__title">Battery Details</span>
                    </div>
                    <div className="m365-section-group__body" style={{ padding: 0 }}>
                        <table className="transfer-details__table">
                            <thead>
                                <tr>
                                    <th>Battery No.</th>
                                    <th>Condition</th>
                                    <th>Voltage (V)</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batteryDetails.map((bat, index) => (
                                    <tr key={bat.id ?? bat.Id ?? index}>
                                        <td>{bat.batteryNumber ?? bat.BatteryNumber ?? "—"}</td>
                                        <td>{bat.condition ?? bat.Condition ?? "—"}</td>
                                        <td>{(bat.voltage ?? bat.Voltage) != null ? `${bat.voltage ?? bat.Voltage}V` : "—"}</td>
                                        <td>{bat.remarks ?? bat.Remarks ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Service Filter Parts ── */}
            {serviceFilterPartsList.length > 0 && (
                <div className="m365-section-group">
                    <div className="m365-section-group__header">
                        <i className="fa-light fa-filter m365-section-group__icon" />
                        <span className="m365-section-group__title">Service Filter Parts</span>
                    </div>
                    <div className="m365-section-group__body" style={{ padding: 0 }}>
                        <table className="transfer-details__table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Description</th>
                                    <th>Part Number</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceFilterPartsList.map((part, idx) => (
                                    <tr key={idx}>
                                        <td>{part.number ?? part.Number ?? idx + 1}</td>
                                        <td>{part.description ?? part.Description ?? "—"}</td>
                                        <td>{part.partNumber ?? part.PartNumber ?? "—"}</td>
                                        <td>{part.quantity ?? part.Quantity ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
};

export default EquipmentInspectionTab;
