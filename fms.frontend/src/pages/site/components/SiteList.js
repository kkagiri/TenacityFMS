/**
 * File:          SiteList.js
 * Purpose:       DevExtreme DataGrid wrapped in M365 flat styling — single-select row → calls onSelect
 * Dependencies:  devextreme-react/data-grid, SitePage.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - sites          (array):   Filtered site rows
 * - selectedSite   (object):  Currently selected site (for highlighting)
 * - onSelect       (func):    Callback when a row is selected
 * - loading        (bool):    Show loading indicator
 */
import React, { useMemo, useCallback, useRef } from "react";
import DataGrid, {
    Column,
    Selection,
    Paging,
} from "devextreme-react/data-grid";

/* ── Cell Renderers (outside component to avoid reconciliation issues) ── */

const StatusCellRender = ({ value }) => (
    <span
        className={`m365-badge ${value ? "m365-badge--success" : "m365-badge--danger"}`}
    >
        {value ? "Active" : "Inactive"}
    </span>
);

const GpsGateTagCellRender = ({ data }) => {
    if (!data.gpsGateTagName) {
        return <span style={{ color: "var(--m365-text-tertiary)", fontSize: 12 }}>—</span>;
    }
    return (
        <span className="tw-flex tw-items-center tw-gap-1">
            <span
                className="tw-w-2 tw-h-2 tw-rounded-full tw-inline-block tw-flex-shrink-0"
                style={{ backgroundColor: data.gpsGateTagColor || "#0078d4" }}
            />
            <span style={{ fontSize: 13 }}>{data.gpsGateTagName}</span>
        </span>
    );
};

const SiteList = ({ sites, selectedSite, onSelect, loading }) => {
    const gridRef = useRef(null);

    const selectedRowKeys = useMemo(
        () => (selectedSite ? [selectedSite.id] : []),
        [selectedSite?.id]
    );

    const handleSelectionChanged = useCallback(
        (e) => {
            if (e.selectedRowsData.length > 0) {
                onSelect(e.selectedRowsData[0]);
            }
        },
        [onSelect]
    );

    return (
        <div className="m365-site-list">
            <DataGrid
                ref={gridRef}
                dataSource={sites}
                keyExpr="id"
                showBorders={false}
                showRowLines={true}
                columnAutoWidth={true}
                wordWrapEnabled={true}
                height="100%"
                onSelectionChanged={handleSelectionChanged}
                selectedRowKeys={selectedRowKeys}
                hoverStateEnabled={true}
                loadPanel={{ enabled: loading, text: "Loading sites…" }}
            >
                <Selection mode="single" />
                <Paging enabled={false} />

                <Column dataField="name" caption="Name" />
                <Column
                    dataField="gpsGateTagName"
                    caption="GPSGate Tag"
                    width={140}
                    cellRender={GpsGateTagCellRender}
                />
                <Column
                    dataField="isActive"
                    caption="Status"
                    width={90}
                    cellRender={StatusCellRender}
                />
            </DataGrid>
        </div>
    );
};

export default SiteList;
