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

    const hasGpsData =
        transfer.gpsDeviceId ||
        transfer.fuelSensorId ||
        transfer.gpsDeviceCondition ||
        transfer.fuelSensorCondition;

    const hasAnyData =
        hasGpsData ||
        transfer.checkupItems?.length > 0 ||
        transfer.tyreDetails?.length > 0 ||
        transfer.batteryDetails?.length > 0 ||
        transfer.serviceFilterPartsList?.length > 0;

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
                                    <span className="m365-info-row__label">Device ID / Serial</span>
                                    <span className="m365-info-row__value">{transfer.gpsDeviceId || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Condition</span>
                                    <span className="m365-info-row__value">{transfer.gpsDeviceCondition || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Working</span>
                                    <span
                                        className={`m365-info-row__value ${transfer.gpsDeviceWorking ? "transfer-details__yes" : "transfer-details__no"
                                            }`}
                                    >
                                        {transfer.gpsDeviceWorking ? "Yes" : "No"}
                                    </span>
                                </div>
                                {transfer.gpsDeviceRemarks && (
                                    <div className="m365-info-row">
                                        <span className="m365-info-row__label">Remarks</span>
                                        <span className="m365-info-row__value">{transfer.gpsDeviceRemarks}</span>
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
                                    <span className="m365-info-row__value">{transfer.fuelSensorId || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Condition</span>
                                    <span className="m365-info-row__value">{transfer.fuelSensorCondition || "—"}</span>
                                </div>
                                <div className="m365-info-row">
                                    <span className="m365-info-row__label">Working</span>
                                    <span
                                        className={`m365-info-row__value ${transfer.fuelSensorWorking ? "transfer-details__yes" : "transfer-details__no"
                                            }`}
                                    >
                                        {transfer.fuelSensorWorking ? "Yes" : "No"}
                                    </span>
                                </div>
                                {transfer.fuelSensorRemarks && (
                                    <div className="m365-info-row">
                                        <span className="m365-info-row__label">Remarks</span>
                                        <span className="m365-info-row__value">{transfer.fuelSensorRemarks}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Checkup Items ── */}
            {transfer.checkupItems?.length > 0 ? (
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
                                {transfer.checkupItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.serialNo}</td>
                                        <td>{item.description}</td>
                                        <td className="transfer-details__table-center">
                                            {item.isGood && (
                                                <i className="fa-solid fa-check" style={{ color: "#107c10" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {item.isFair && (
                                                <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {item.isDamaged && (
                                                <i className="fa-solid fa-check" style={{ color: "#d13438" }} />
                                            )}
                                        </td>
                                        <td className="transfer-details__table-center">
                                            {item.isWorn && (
                                                <span>
                                                    <i className="fa-solid fa-check" style={{ color: "#ca5010" }} />
                                                    {item.wornPercentage && ` ${item.wornPercentage}%`}
                                                </span>
                                            )}
                                        </td>
                                        <td>{item.remarks}</td>
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
            {transfer.tyreDetails?.length > 0 && (
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
                                {transfer.tyreDetails.map((tyre) => (
                                    <tr key={tyre.id}>
                                        <td>{tyre.position || "—"}</td>
                                        <td>{tyre.brand || "—"}</td>
                                        <td>{tyre.size || "—"}</td>
                                        <td>
                                            {tyre.condition != null ? (
                                                <span
                                                    className={`m365-badge ${tyre.condition >= 70
                                                            ? "m365-badge--success"
                                                            : tyre.condition >= 40
                                                                ? "m365-badge--warning"
                                                                : "m365-badge--error"
                                                        }`}
                                                >
                                                    {tyre.condition}%
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td>{tyre.remarks || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Battery Details ── */}
            {transfer.batteryDetails?.length > 0 && (
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
                                {transfer.batteryDetails.map((bat) => (
                                    <tr key={bat.id}>
                                        <td>{bat.batteryNumber || "—"}</td>
                                        <td>{bat.condition || "—"}</td>
                                        <td>{bat.voltage != null ? `${bat.voltage}V` : "—"}</td>
                                        <td>{bat.remarks || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Service Filter Parts ── */}
            {transfer.serviceFilterPartsList?.length > 0 && (
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
                                {transfer.serviceFilterPartsList.map((part, idx) => (
                                    <tr key={idx}>
                                        <td>{part.number || idx + 1}</td>
                                        <td>{part.description || "—"}</td>
                                        <td>{part.partNumber || "—"}</td>
                                        <td>{part.quantity}</td>
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
