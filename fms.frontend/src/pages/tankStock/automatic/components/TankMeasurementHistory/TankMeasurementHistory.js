/**
 * File: TankMeasurementHistory.js
 * Purpose: Displays tank measurement history as line charts and appends real-time updates via SignalR.
 * Dependencies: React, DevExtreme Chart, StockFilterContext, axiosInstance, ptsSignalRService
 * Last Modified: 2026-02-12
 *
 * Key Components:
 * - TankMeasurementHistory(): Loads measurement history for selected tank and renders charts.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import { Chart, Series, ArgumentAxis, Legend, Tooltip, CommonSeriesSettings } from "devextreme-react/chart";
import axiosInstance from "../../../../../api/axiosInstance";
import { useStockFilters } from "../../../shared/context/StockFilterContext";
import ptsSignalRService from "../../../../../signalR/ptsSignalRService";

const MAX_POINTS = 500;

const parseUtcToLocal = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
        const hasTime = trimmed.includes("T");
        if (hasTimezone) return new Date(trimmed);
        if (hasTime) return new Date(`${trimmed}Z`);
        return new Date(trimmed);
    }
    return new Date(value);
};

const TankMeasurementHistory = () => {
    const { startDate, endDate, selectedTankIds } = useStockFilters();
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    const tankId = useMemo(() => {
        if (!Array.isArray(selectedTankIds) || selectedTankIds.length === 0) return null;
        const first = selectedTankIds[0];
        const numeric = typeof first === "string" ? Number(first) : first;
        return Number.isFinite(numeric) ? numeric : null;
    }, [selectedTankIds]);

    const fetchHistory = useCallback(async () => {
        if (!tankId || tankId <= 0) {
            setPoints([]);
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get("/tankstock/tank-measurements/history", {
                params: {
                    tankId,
                    startDate: startDate ? new Date(startDate).toISOString() : null,
                    endDate: endDate ? new Date(endDate).toISOString() : null,
                },
            });

            const data = response?.data;
            const payload = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

            const normalized = payload
                .map((p) => ({
                    ...p,
                    localDateTime: parseUtcToLocal(p.dateTime),
                }))
                .filter((p) => p.localDateTime instanceof Date && !Number.isNaN(p.localDateTime.getTime()))
                .sort((a, b) => a.localDateTime - b.localDateTime);

            setPoints(normalized.slice(-MAX_POINTS));
        } catch (error) {
            console.error("Failed to load tank measurement history", error);
            notify(
                {
                    message: "Failed to load tank measurement history",
                    type: "error",
                    displayTime: 3000,
                    position: "top center",
                },
                { direction: "up-push" }
            );
            setPoints([]);
        } finally {
            setLoading(false);
        }
    }, [tankId, startDate, endDate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        if (!tankId || tankId <= 0) return;

        // Ensure PTS SignalR connection (tankstock route uses business hub by default)
        ptsSignalRService.start().catch((error) => {
            console.warn("Failed to start PTS SignalR for tank measurement updates", error);
        });

        const unsubscribe = ptsSignalRService.on("tankMeasurementUpdate", (update) => {
            // Expect PascalCase keys from backend broadcast
            const updateTankId = update?.TankId ?? update?.tankId;
            if (!updateTankId || Number(updateTankId) !== Number(tankId)) return;

            const dtRaw = update?.DateTime ?? update?.dateTime;
            const localDateTime = parseUtcToLocal(dtRaw);
            if (!(localDateTime instanceof Date) || Number.isNaN(localDateTime.getTime())) return;

            const nextPoint = {
                tankId: updateTankId,
                dateTime: dtRaw,
                localDateTime,
                productVolume: update?.ProductVolume ?? update?.productVolume,
                temperature: update?.Temperature ?? update?.temperature,
                waterHeight: update?.WaterHeight ?? update?.waterHeight,
                productHeight: update?.ProductHeight ?? update?.productHeight,
                waterVolume: update?.WaterVolume ?? update?.waterVolume,
            };

            setPoints((prev) => {
                const merged = [...prev, nextPoint]
                    .sort((a, b) => a.localDateTime - b.localDateTime)
                    .slice(-MAX_POINTS);
                return merged;
            });
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [tankId]);

    if (!tankId) {
        return (
            <div className="tw-p-4 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-text-amber-800">
                Select a tank to view measurement history.
            </div>
        );
    }

    return (
        <div className="tw-w-full tw-space-y-6">
            {loading && (
                <div className="tw-text-sm tw-text-gray-500">Loading measurement history...</div>
            )}

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <div className="tw-font-semibold tw-mb-2">Product Volume (L)</div>
                <Chart dataSource={points}>
                    <CommonSeriesSettings argumentField="localDateTime" type="line" />
                    <ArgumentAxis argumentType="datetime" />
                    <Series valueField="productVolume" name="Volume" />
                    <Legend visible={false} />
                    <Tooltip enabled={true} />
                </Chart>
            </div>

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <div className="tw-font-semibold tw-mb-2">Temperature</div>
                <Chart dataSource={points}>
                    <CommonSeriesSettings argumentField="localDateTime" type="line" />
                    <ArgumentAxis argumentType="datetime" />
                    <Series valueField="temperature" name="Temperature" />
                    <Legend visible={false} />
                    <Tooltip enabled={true} />
                </Chart>
            </div>

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <div className="tw-font-semibold tw-mb-2">Water Height</div>
                <Chart dataSource={points}>
                    <CommonSeriesSettings argumentField="localDateTime" type="line" />
                    <ArgumentAxis argumentType="datetime" />
                    <Series valueField="waterHeight" name="Water Height" />
                    <Legend visible={false} />
                    <Tooltip enabled={true} />
                </Chart>
            </div>
        </div>
    );
};

export default TankMeasurementHistory;
