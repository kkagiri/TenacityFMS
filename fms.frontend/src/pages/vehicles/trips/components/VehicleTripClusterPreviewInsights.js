/**
 * File: VehicleTripClusterPreviewInsights.js
 * Purpose: Renders light-themed preview analytics including adjustment summaries, speed profile, and point timeline.
 * Dependencies: React.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - VehicleTripClusterPreviewInsights(): Summarises preview output as visual explorer strips.
 */
import React, { useMemo } from "react";

const MAX_VISUAL_POINTS = 220;

const CATEGORY_STYLE = {
    moving: { color: "#3b82f6", label: "Moving" },
    slowAccumulating: { color: "#8b5cf6", label: "Slow (accumulating)" },
    keptStop: { color: "#10b981", label: "Kept stop" },
    discarded: { color: "#f59e0b", label: "Discarded (too brief)" },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const downsample = (items, maxItems, reducer) => {
    if (!Array.isArray(items) || items.length <= maxItems) {
        return items;
    }

    const chunkSize = Math.ceil(items.length / maxItems);
    const result = [];

    for (let start = 0; start < items.length; start += chunkSize) {
        const chunk = items.slice(start, start + chunkSize);
        result.push(reducer(chunk, start));
    }

    return result;
};

const buildPointCategories = (preview) => {
    const points = preview?.trackPoints || [];
    const threshold = Number(preview?.settingsStopSpeedThresholdKph ?? 0);
    const categories = Array.from({ length: points.length }, (_, index) => ({
        index,
        speed: Number(points[index]?.speed ?? 0),
        category: Number(points[index]?.speed ?? 0) <= threshold ? "slowAccumulating" : "moving",
        stopLabel: null,
    }));

    (preview?.stops || []).forEach((stop) => {
        const start = Number(stop.startTrackIndex ?? -1);
        const end = Number(stop.endTrackIndex ?? -1);
        if (start < 0 || end < start) {
            return;
        }

        for (let idx = start; idx <= end && idx < categories.length; idx += 1) {
            categories[idx].category = "keptStop";
        }

        const midpoint = Math.floor((start + end) / 2);
        if (categories[midpoint]) {
            categories[midpoint].stopLabel = `S${stop.sequenceNo}`;
        }
    });

    let segmentStart = -1;
    for (let idx = 0; idx <= categories.length; idx += 1) {
        const item = categories[idx];
        const isTransientSlow = item?.category === "slowAccumulating";

        if (isTransientSlow && segmentStart === -1) {
            segmentStart = idx;
            continue;
        }

        if (!isTransientSlow && segmentStart !== -1) {
            const segmentLength = idx - segmentStart;
            if (segmentLength === 1) {
                categories[segmentStart].category = "discarded";
            }
            segmentStart = -1;
        }
    }

    return categories;
};

const buildMetrics = (preview, pointCategories) => {
    const totalPoints = preview?.trackPoints?.length || 0;
    const slowPoints = pointCategories.filter((point) => point.category !== "moving").length;
    const movingPoints = pointCategories.filter((point) => point.category === "moving").length;
    const keptStopPoints = pointCategories.filter((point) => point.category === "keptStop").length;
    const discardedPoints = pointCategories.filter((point) => point.category === "discarded" || point.category === "slowAccumulating").length;

    return [
        { label: "Points", value: totalPoints, tone: "tw-text-slate-700" },
        { label: "Slow", value: slowPoints, tone: "tw-text-violet-700" },
        { label: "Moving", value: movingPoints, tone: "tw-text-blue-700" },
        { label: "Stops kept", value: preview?.stopsDetected || 0, tone: "tw-text-emerald-700" },
        { label: "Pts in kept stops", value: keptStopPoints, tone: "tw-text-emerald-700" },
        { label: "Pts discarded", value: discardedPoints, tone: "tw-text-amber-700" },
    ];
};

const AdjustmentCard = ({ label, value, min, max }) => {
    const percent = clamp(((Number(value) - min) / (max - min || 1)) * 100, 0, 100);

    return (
        <div className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-shadow-sm">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">{label}</span>
                <span className="tw-text-sm tw-font-semibold tw-text-violet-700">{value}</span>
            </div>
            <div className="tw-mt-4 tw-relative tw-h-2 tw-rounded-full tw-bg-slate-200">
                <div className="tw-absolute tw-left-0 tw-top-0 tw-h-2 tw-rounded-full tw-bg-violet-500" style={{ width: `${percent}%` }} />
                <div className="tw-absolute tw-top-1/2 tw-h-5 tw-w-5 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-border-2 tw-border-white tw-bg-violet-600 tw-shadow" style={{ left: `${percent}%` }} />
            </div>
            <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-text-[11px] tw-text-slate-400">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

const VehicleTripClusterPreviewInsights = ({ preview }) => {
    const pointCategories = useMemo(() => buildPointCategories(preview), [preview]);

    const visualSpeedProfile = useMemo(() => {
        return downsample(preview?.trackPoints || [], MAX_VISUAL_POINTS, (chunk, start) => ({
            index: start,
            speed: chunk.reduce((sum, point) => sum + Number(point?.speed ?? 0), 0) / Math.max(chunk.length, 1),
        }));
    }, [preview]);

    const visualPointTimeline = useMemo(() => {
        return downsample(pointCategories, MAX_VISUAL_POINTS, (chunk, start) => {
            const counts = chunk.reduce((accumulator, point) => {
                accumulator[point.category] = (accumulator[point.category] || 0) + 1;
                return accumulator;
            }, {});

            const category = Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || "moving";
            const labelPoint = chunk.find((point) => point.stopLabel);

            return {
                index: start,
                category,
                stopLabel: labelPoint?.stopLabel || null,
            };
        });
    }, [pointCategories]);

    const metrics = useMemo(() => buildMetrics(preview, pointCategories), [preview, pointCategories]);

    const threshold = Number(preview?.settingsStopSpeedThresholdKph ?? 0);
    const minStop = Number(preview?.settingsMinimumStopDurationMinutes ?? 0);
    const maxSpeed = Math.max(...(visualSpeedProfile.map((point) => Number(point.speed || 0))), threshold, 1);
    const thresholdPercent = clamp((threshold / maxSpeed) * 100, 0, 100);

    if (!preview?.trackPoints?.length) {
        return (
            <section className="tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-slate-50 tw-p-6">
                <div className="tw-text-sm tw-font-semibold tw-text-slate-700">Preview explorer</div>
                <p className="tw-mt-2 tw-text-sm tw-text-slate-500">
                    Run the preview above to populate the speed profile, point timeline, and adjustment summaries.
                </p>
            </section>
        );
    }

    return (
        <section className="tw-space-y-5">
            <div>
                <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Preview explorer</h2>
                <p className="tw-text-sm tw-text-slate-600">
                    Light-weight visual explorer for the cluster preview run. Use it to inspect threshold impact, slow-point buildup, and kept-stop spans.
                </p>
            </div>

            <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-[minmax(0,1fr)_280px] tw-gap-5">
                <div className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.25em] tw-text-slate-500">Speed profile</div>
                            <div className="tw-mt-1 tw-text-sm tw-text-slate-600">Each bar is a sampled point bucket from the loaded frontend track-data session.</div>
                        </div>
                        <div className="tw-text-xs tw-font-medium tw-text-violet-700">Threshold {threshold.toFixed(1)} km/h</div>
                    </div>

                    <div className="tw-relative tw-mt-4 tw-h-36 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-px-4 tw-pb-4 tw-pt-3">
                        <div className="tw-absolute tw-left-4 tw-right-4 tw-border-t tw-border-dashed tw-border-violet-400" style={{ top: `${100 - thresholdPercent}%` }} />
                        <div className="tw-absolute tw-right-3 tw-text-[11px] tw-font-medium tw-text-violet-600" style={{ top: `calc(${100 - thresholdPercent}% - 16px)` }}>
                            {threshold.toFixed(1)} km/h
                        </div>
                        <div className="tw-flex tw-h-full tw-items-end tw-gap-[2px]">
                            {visualSpeedProfile.map((point) => {
                                const speed = Number(point.speed || 0);
                                const height = clamp((speed / maxSpeed) * 100, 2, 100);
                                const isBelowThreshold = speed <= threshold;
                                return (
                                    <div
                                        key={`speed-${point.index}`}
                                        className="tw-flex-1 tw-rounded-t-[2px]"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: isBelowThreshold ? "#10b981" : "#3b82f6",
                                            opacity: isBelowThreshold ? 0.8 : 0.9,
                                        }}
                                        title={`${speed.toFixed(1)} km/h`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="tw-space-y-4">
                    <AdjustmentCard label="StopSpeedThresholdKph" value={`${threshold.toFixed(1)} km/h`} min={0.5} max={10} />
                    <AdjustmentCard label="MinimumStopDurationMinutes" value={`${minStop.toFixed(1)} min`} min={0.5} max={10} />
                </div>
            </div>

            <div className="tw-flex tw-flex-wrap tw-gap-3">
                {metrics.map((metric) => (
                    <div key={metric.label} className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-shadow-sm">
                        <div className="tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-slate-500">{metric.label}</div>
                        <div className={`tw-mt-1 tw-text-lg tw-font-semibold ${metric.tone}`}>{metric.value}</div>
                    </div>
                ))}
            </div>

            <div className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                    <div>
                        <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.25em] tw-text-slate-500">Point timeline</div>
                        <div className="tw-mt-1 tw-text-sm tw-text-slate-600">Sampled sequence of point states across the preview window.</div>
                    </div>
                </div>

                <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
                    <div className="tw-relative tw-flex tw-h-16 tw-items-stretch tw-gap-[1px]">
                        {visualPointTimeline.map((point) => (
                            <div
                                key={`timeline-${point.index}`}
                                className="tw-relative tw-flex-1 tw-rounded-[2px]"
                                style={{ backgroundColor: CATEGORY_STYLE[point.category].color, opacity: point.category === "keptStop" ? 0.9 : 0.75 }}
                                title={CATEGORY_STYLE[point.category].label}
                            >
                                {point.stopLabel ? (
                                    <span className="tw-absolute tw-bottom-[-18px] tw-left-1/2 -tw-translate-x-1/2 tw-rounded tw-bg-emerald-700 tw-px-1.5 tw-py-[1px] tw-text-[10px] tw-font-medium tw-text-white">
                                        {point.stopLabel}
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-4">
                    {Object.entries(CATEGORY_STYLE).map(([key, style]) => (
                        <div key={key} className="tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-text-slate-600">
                            <span className="tw-h-2.5 tw-w-2.5 tw-rounded-sm" style={{ backgroundColor: style.color }} />
                            {style.label}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VehicleTripClusterPreviewInsights;