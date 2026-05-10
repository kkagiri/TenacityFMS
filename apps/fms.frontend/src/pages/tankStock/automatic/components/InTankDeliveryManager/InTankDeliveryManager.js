/**
 * File: InTankDeliveryManager.js
 * Purpose: Displays PTS-detected in-tank deliveries in a DataGrid with filter integration.
 * Dependencies: React, DevExtreme DataGrid, StockFilterContext, axiosInstance
 * Last Modified: 2026-02-12
 *
 * Key Components:
 * - InTankDeliveryManager(): Fetches and displays in-tank deliveries for the selected site/date range.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    Paging,
    Pager,
    LoadPanel,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../../api/axiosInstance";
import { useStockFilters } from "../../../shared/context/StockFilterContext";

const allowedPageSizes = [50, 100, 200, 500];

const formatIsoDateForApi = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
};

const InTankDeliveryManager = () => {
    const { startDate, endDate, selectedSiteIds } = useStockFilters();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const siteId = useMemo(() => {
        if (!Array.isArray(selectedSiteIds) || selectedSiteIds.length === 0) return null;
        const first = selectedSiteIds[0];
        const numeric = typeof first === "string" ? Number(first) : first;
        return Number.isFinite(numeric) ? numeric : null;
    }, [selectedSiteIds]);

    const fetchData = useCallback(async () => {
        if (!siteId || siteId <= 0) {
            setRows([]);
            return;
        }

        setLoading(true);
        try {
            const params = {
                siteId,
                startDate: formatIsoDateForApi(startDate),
                endDate: formatIsoDateForApi(endDate),
            };

            const response = await axiosInstance.get("/tankstock/in-tank-deliveries", {
                params,
            });

            const data = response?.data;
            const payload = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setRows(payload);
        } catch (error) {
            console.error("Failed to load in-tank deliveries", error);
            notify(
                {
                    message: "Failed to load in-tank deliveries",
                    type: "error",
                    displayTime: 3000,
                    position: "top center",
                },
                { direction: "up-push" }
            );
        } finally {
            setLoading(false);
        }
    }, [siteId, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="tw-w-full">
            {!siteId && (
                <div className="tw-p-4 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-text-amber-800 tw-mb-4">
                    Select a site to view in-tank deliveries.
                </div>
            )}

            <DataGrid
                dataSource={rows}
                keyExpr="deliveryId"
                showBorders={true}
                columnAutoWidth={true}
                wordWrapEnabled={true}
                height={"70vh"}
            >
                <LoadPanel enabled={true} showIndicator={true} showPane={true} />
                <Paging defaultPageSize={100} />
                <Pager
                    visible={true}
                    allowedPageSizes={allowedPageSizes}
                    showPageSizeSelector={true}
                    showInfo={true}
                />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />

                <Column dataField="detectedAt" caption="Detected At" dataType="datetime" />
                <Column dataField="status" caption="Status" />
                <Column dataField="tankName" caption="Tank" />
                <Column dataField="tankProbeNumber" caption="Probe" width={80} />
                <Column dataField="fuelGradeName" caption="Fuel Grade" />
                <Column
                    dataField="absoluteProductVolume"
                    caption="Volume (L)"
                    dataType="number"
                    format={{ type: "fixedPoint", precision: 2 }}
                />
                <Column dataField="pumpsDispensedVolume" caption="Pumps Dispensed" dataType="number" />
                <Column dataField="startDateTime" caption="Start" dataType="datetime" />
                <Column dataField="endDateTime" caption="End" dataType="datetime" />
                <Column dataField="matchedDeliveryId" caption="Matched Delivery" />
                <Column dataField="ptsId" caption="PTS" />
                <Column dataField="packetId" caption="Packet" width={90} />
            </DataGrid>

            {loading && (
                <div className="tw-mt-2 tw-text-sm tw-text-gray-500">Loading...</div>
            )}
        </div>
    );
};

export default InTankDeliveryManager;
