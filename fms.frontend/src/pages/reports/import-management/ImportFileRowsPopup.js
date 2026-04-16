/**
 * File: ImportFileRowsPopup.js
 * Purpose: Popup DataGrid for row-level import data from Import Management.
 * Dependencies: react, devextreme-react/popup, devextreme-react/data-grid
 * Last Modified: 2026-04-15
 *
 * Key Components:
 * - ImportFileRowsPopup: Shows imported rows, replacement-run rows, or whole-date rows for a file
 */
import React from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    Paging,
    Scrolling,
    SearchPanel,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";

const VIEW_OPTIONS = [
    { value: "imported", label: "Imported Rows" },
    { value: "replaced", label: "Replacement Run" },
    { value: "whole-date", label: "Whole Date Scope" },
];

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return value;
    }

    return numericValue.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const ImportFileRowsPopup = ({
    file,
    viewMode,
    onViewModeChange,
    rows,
    loading,
    error,
    note,
    totalCount,
    onHiding,
}) => {
    return (
        <Popup
            visible={!!file}
            onHiding={onHiding}
            title="Imported Data Rows"
            width={1180}
            height={720}
            showCloseButton={true}
        >
            <div className="import-mgmt-rows-popup">
                <div className="import-mgmt-rows-popup__toolbar">
                    <div className="import-mgmt-rows-popup__meta">
                        <div className="import-mgmt-rows-popup__title" title={file?.fileName || ""}>
                            {file?.fileName || "Import file"}
                        </div>
                        <div className="import-mgmt-rows-popup__subtitle">
                            <span>{totalCount || 0} row(s)</span>
                            {file?.detectedSiteName && <span>{file.detectedSiteName}</span>}
                            {file?.reportType && <span>{file.reportType}</span>}
                        </div>
                    </div>

                    <div className="import-mgmt-rows-popup__controls">
                        <label className="import-mgmt-rows-popup__label" htmlFor="import-mgmt-row-view-mode">
                            View
                        </label>
                        <select
                            id="import-mgmt-row-view-mode"
                            className="m365-select"
                            value={viewMode}
                            onChange={(event) => onViewModeChange(event.target.value)}
                        >
                            {VIEW_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {note && (
                    <div className="m365-info-banner import-mgmt-rows-popup__banner">
                        <i className="fa-light fa-circle-info m365-info-banner__icon" />
                        <span className="m365-info-banner__text">{note}</span>
                    </div>
                )}

                {error && (
                    <div className="m365-info-banner m365-info-banner--error import-mgmt-rows-popup__banner">
                        <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                        <span className="m365-info-banner__text">{error}</span>
                    </div>
                )}

                <div className="import-mgmt-rows-popup__grid-wrap">
                    <DataGrid
                        dataSource={rows}
                        keyExpr="id"
                        showBorders={true}
                        showRowLines={true}
                        hoverStateEnabled={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={false}
                        height="100%"
                        noDataText={loading ? "Loading rows..." : "No rows found"}
                    >
                        <SearchPanel visible={true} width={240} placeholder="Search rows..." />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Paging enabled={false} />
                        <Scrolling mode="virtual" />

                        <Column
                            dataField="recordDate"
                            caption="Record Date"
                            dataType="datetime"
                            width={170}
                            customizeText={(cell) => formatDateTime(cell.value)}
                        />
                        <Column dataField="shiftLabel" caption="Shift" width={120} />
                        <Column dataField="vehicleLabel" caption="Vehicle" minWidth={160} />
                        <Column dataField="siteLabel" caption="Site" minWidth={140} />
                        <Column dataField="employeeName" caption="Employee" minWidth={150} />
                        <Column
                            dataField="totalFuel"
                            caption="Fuel"
                            alignment="right"
                            width={110}
                            customizeText={(cell) => formatNumber(cell.value)}
                        />
                        <Column
                            dataField="totalDistance"
                            caption="Distance"
                            alignment="right"
                            width={120}
                            customizeText={(cell) => formatNumber(cell.value)}
                        />
                        <Column
                            dataField="engineHours"
                            caption="Engine Hours"
                            alignment="right"
                            width={130}
                            customizeText={(cell) => formatNumber(cell.value)}
                        />
                        <Column
                            dataField="fuelEfficiency"
                            caption="Efficiency"
                            alignment="right"
                            width={120}
                            customizeText={(cell) => formatNumber(cell.value)}
                        />
                        <Column dataField="rowSource" caption="Source" width={140} />
                        <Column dataField="reportId" caption="Report ID" minWidth={180} />
                    </DataGrid>
                </div>
            </div>
        </Popup>
    );
};

export default ImportFileRowsPopup;