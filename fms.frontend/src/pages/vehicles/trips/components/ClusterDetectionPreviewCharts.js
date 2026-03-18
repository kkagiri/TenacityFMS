/**
 * File: ClusterDetectionPreviewCharts.js
 * Purpose: Renders speed profile bar chart and point timeline strip from cluster detection preview data.
 * Dependencies: React.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - ClusterDetectionPreviewCharts(): SVG-based speed profile and classification timeline with hover inspect and playback.
 */
import React, { useMemo, useState } from "react";

const MAX_BARS = 400;
const CHART_HEIGHT = 100;
const TIMELINE_HEIGHT = 44;

const CAT_COLORS = {
    moving: "#0078D4",
    slow: "#7C3AED",
    keptStop: "#107C10",
    discarded: "#CA5010",
    insideSite: "#10b981",
    transit: "#6366f1",
};

const CAT_LABELS = {
    moving: "Moving",
    slow: "Slow",
    keptStop: "Kept stop",
    discarded: "Discarded",
    insideSite: "Inside site",
    transit: "Transit",
};

const classifyPoints = (trackPoints, stops, stopSpeedThreshold) => {
    const stopRanges = (stops || []).map((s) => ({
        start: s.startTrackIndex,
        end: s.endTrackIndex,
        seq: s.sequenceNo,
    }));

    return trackPoints.map((pt, i) => {
        const speed = Number(pt.speed) || 0;
        const isSlow = speed <= stopSpeedThreshold;
        const match = stopRanges.find((r) => i >= r.start && i <= r.end);

        let cat;
        if (match) {
            cat = "keptStop";
        } else if (isSlow) {
            cat = "discarded";
        } else {
            cat = "moving";
        }

        return { index: i, speed, cat, stopSeq: match?.seq ?? null };
    });
};

const classifyGeofencePoints = (annotatedPoints, siteVisits) => {
    const visitRanges = (siteVisits || []).map((v, idx) => ({
        start: v.entryIndex,
        end: v.exitIndex,
        seq: idx + 1,
        label: v.label,
    }));

    return annotatedPoints.map((pt, i) => {
        const speed = Number(pt.speed) || 0;
        const match = visitRanges.find((r) => i >= r.start && i <= r.end);
        const cat = match ? "insideSite" : "transit";
        return { index: i, speed, cat, stopSeq: match ? match.seq : null, stopLabel: match ? `S${match.seq}` : null };
    });
};

const downsample = (classifications, maxBars) => {
    if (classifications.length <= maxBars) return classifications;

    const chunkSize = Math.ceil(classifications.length / maxBars);
    const result = [];

    for (let i = 0; i < classifications.length; i += chunkSize) {
        const chunk = classifications.slice(i, i + chunkSize);
        const catCounts = {};
        let totalSpeed = 0;
        let stopLabel = null;

        chunk.forEach((c) => {
            catCounts[c.cat] = (catCounts[c.cat] || 0) + 1;
            totalSpeed += c.speed;
            if (c.stopSeq != null && !stopLabel) stopLabel = `S${c.stopSeq}`;
        });

        const dominantCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0][0];

        result.push({
            index: i,
            speed: totalSpeed / chunk.length,
            cat: dominantCat,
            stopLabel,
        });
    }

    return result;
};

const SpeedProfileChart = ({ bars, maxSpeed, stopSpeedThreshold, hoveredIndex, onHover, playPosition }) => {
    const width = Math.max(bars.length * 3, 500);
    const thrY = CHART_HEIGHT - 5 - ((stopSpeedThreshold / maxSpeed) * (CHART_HEIGHT - 10));

    return (
        <svg width={width} height={CHART_HEIGHT} style={{ display: "block" }}>
            <line x1={0} y1={thrY} x2={width} y2={thrY} stroke="#7C3AED" strokeWidth={1} strokeDasharray="4 2" opacity={0.5} />
            <text x={width - 4} y={thrY - 3} textAnchor="end" fill="#7C3AED" fontSize={8} fontFamily="'Cascadia Code', monospace">
                {stopSpeedThreshold.toFixed(1)}
            </text>
            {bars.map((bar, i) => {
                const barWidth = width / bars.length;
                const barHeight = Math.max((bar.speed / maxSpeed) * (CHART_HEIGHT - 10), 1);
                const isActive = hoveredIndex === i;
                return (
                    <rect
                        key={i}
                        x={i * barWidth}
                        y={CHART_HEIGHT - 5 - barHeight}
                        width={Math.max(barWidth - 0.4, 0.8)}
                        height={barHeight}
                        fill={CAT_COLORS[bar.cat] || CAT_COLORS.moving}
                        opacity={isActive ? 1 : 0.55}
                        rx={1}
                        onMouseEnter={() => onHover(i)}
                        onMouseLeave={() => onHover(null)}
                        style={{ cursor: "pointer" }}
                    />
                );
            })}
            {hoveredIndex != null && (
                <line
                    x1={hoveredIndex * (width / bars.length)}
                    y1={0}
                    x2={hoveredIndex * (width / bars.length)}
                    y2={CHART_HEIGHT}
                    stroke="#0078D4"
                    strokeWidth={1}
                    opacity={0.5}
                />
            )}
            {playPosition != null && (
                <line
                    x1={playPosition * (width / bars.length) + (width / bars.length) / 2}
                    y1={0}
                    x2={playPosition * (width / bars.length) + (width / bars.length) / 2}
                    y2={CHART_HEIGHT}
                    stroke="#dc2626"
                    strokeWidth={2}
                    opacity={0.7}
                />
            )}
        </svg>
    );
};

const PointTimelineChart = ({ bars, hoveredIndex, onHover, playPosition }) => {
    const width = Math.max(bars.length * 3, 500);

    return (
        <svg width={width} height={TIMELINE_HEIGHT} style={{ display: "block" }}>
            {bars.map((bar, i) => {
                const barWidth = width / bars.length;
                const isBeforeCursor = playPosition != null && i > playPosition;
                const isActive = hoveredIndex === i;

                return (
                    <g key={i}>
                        <rect
                            x={i * barWidth}
                            y={2}
                            width={Math.max(barWidth - 0.4, 0.8)}
                            height={22}
                            fill={CAT_COLORS[bar.cat] || CAT_COLORS.moving}
                            opacity={isBeforeCursor ? 0.1 : isActive ? 1 : 0.6}
                            rx={1}
                            onMouseEnter={() => onHover(i)}
                            onMouseLeave={() => onHover(null)}
                            style={{ cursor: "pointer" }}
                        />
                        {bar.stopLabel && (
                            <>
                                <rect x={i * barWidth - 1} y={27} width={20} height={12} rx={3} fill="#107C10" opacity={0.85} />
                                <text x={i * barWidth + 9} y={36} textAnchor="middle" fill="#fff" fontSize={7} fontWeight={700} fontFamily="'Cascadia Code', monospace">
                                    {bar.stopLabel}
                                </text>
                            </>
                        )}
                    </g>
                );
            })}
            {hoveredIndex != null && (
                <line
                    x1={hoveredIndex * (width / bars.length)}
                    y1={0}
                    x2={hoveredIndex * (width / bars.length)}
                    y2={TIMELINE_HEIGHT}
                    stroke="#0078D4"
                    strokeWidth={1}
                    opacity={0.4}
                />
            )}
        </svg>
    );
};

const ClusterDetectionPreviewCharts = ({ preview, stopSpeedThreshold, playbackIndex = null, detectionMode = "cluster" }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const isGeofence = detectionMode === "geofence";

    const trackPoints = isGeofence ? preview?.annotatedPoints : preview?.trackPoints;

    const classifications = useMemo(() => {
        if (!trackPoints?.length) return [];
        if (isGeofence) {
            return classifyGeofencePoints(trackPoints, preview?.siteVisits);
        }
        return classifyPoints(trackPoints, preview.stops, stopSpeedThreshold);
    }, [trackPoints, preview, stopSpeedThreshold, isGeofence]);

    const bars = useMemo(() => downsample(classifications, MAX_BARS), [classifications]);

    const maxSpeed = useMemo(() => {
        if (!bars.length) return 60;
        return Math.max(...bars.map((b) => b.speed), stopSpeedThreshold, 10);
    }, [bars, stopSpeedThreshold]);

    const playbackBarIndex = useMemo(() => {
        if (playbackIndex == null || !classifications.length || !bars.length) return null;
        if (classifications.length <= bars.length) return playbackIndex;
        const chunkSize = Math.ceil(classifications.length / bars.length);
        return Math.min(Math.floor(playbackIndex / chunkSize), bars.length - 1);
    }, [playbackIndex, classifications.length, bars.length]);

    const hoveredBar = hoveredIndex != null ? bars[hoveredIndex] : null;

    if (!trackPoints?.length) return null;

    const activeLegendKeys = isGeofence
        ? ["insideSite", "transit"]
        : ["moving", "slow", "keptStop", "discarded"];

    return (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 xl:tw-grid-cols-2">
            {/* Speed profile */}
            <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-slate-200 tw-px-4 tw-py-3">
                    <h4 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                        <i className="fa-light fa-wave-pulse tw-mr-2 tw-text-violet-600" />
                        Speed profile
                    </h4>
                    <span className="tw-font-mono tw-text-xs tw-text-violet-600">
                        {isGeofence ? "geofence containment" : `${stopSpeedThreshold.toFixed(1)} km/h threshold`}
                    </span>
                </div>
                <div className="tw-overflow-x-auto tw-px-4 tw-py-3">
                    <SpeedProfileChart
                        bars={bars}
                        maxSpeed={maxSpeed}
                        stopSpeedThreshold={stopSpeedThreshold}
                        hoveredIndex={hoveredIndex}
                        onHover={setHoveredIndex}
                        playPosition={playbackBarIndex}
                    />
                </div>
                {hoveredBar ? (
                    <div className="tw-border-t tw-border-slate-100 tw-px-4 tw-py-2 tw-font-mono tw-text-xs tw-text-slate-500">
                        Pt #{hoveredBar.index} · {hoveredBar.speed.toFixed(1)} km/h · {CAT_LABELS[hoveredBar.cat]}
                    </div>
                ) : null}
            </section>

            {/* Point timeline */}
            <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-slate-200 tw-px-4 tw-py-3">
                    <h4 className="tw-text-sm tw-font-semibold tw-text-slate-900">
                        <i className="fa-light fa-timeline-arrow tw-mr-2 tw-text-sky-600" />
                        Point timeline
                    </h4>
                </div>
                <div className="tw-overflow-x-auto tw-px-4 tw-py-3">
                    <PointTimelineChart
                        bars={bars}
                        hoveredIndex={hoveredIndex}
                        onHover={setHoveredIndex}
                        playPosition={playbackBarIndex}
                    />
                </div>
                <div className="tw-flex tw-flex-wrap tw-gap-3 tw-border-t tw-border-slate-100 tw-px-4 tw-py-2">
                    {activeLegendKeys.map((key) => (
                        <div key={key} className="tw-flex tw-items-center tw-gap-1.5">
                            <div className="tw-h-2 tw-w-2 tw-rounded-sm" style={{ backgroundColor: CAT_COLORS[key] }} />
                            <span className="tw-text-[10px] tw-text-slate-500">{CAT_LABELS[key]}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ClusterDetectionPreviewCharts;
