/**
 * File: IssueActivityHeatmap.js
 * Purpose: GitHub-style activity heatmap showing issue/activity intensity over time.
 *          Reusable in CombinedIssueDashboard (all-issues mode) and IssueTrackerDetailPage (single-issue mode).
 * Dependencies: React
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - IssueActivityHeatmap(): Renders a calendar heatmap grid with color-coded day cells
 * - buildHeatmapData(): Aggregates dates into day-level counts for the heatmap
 *
 * Props:
 * - dates: Array of date strings/Date objects representing individual activity events
 * - weeks: Number of weeks to display (default 52)
 * - title: Optional title string
 * - highlightDate: Optional date string to highlight a specific day (e.g. current issue open date)
 * - colorScheme: 'green' (default) | 'blue' | 'purple' | 'orange'
 * - showMonthLabels: Boolean (default true)
 * - showDayLabels: Boolean (default true)
 * - showSummary: Boolean (default true) - shows total count and streak info
 */
import React, { useMemo, useState, useCallback, useRef } from 'react';
import './IssueActivityHeatmap.scss';

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_TOTAL = CELL_SIZE + CELL_GAP;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLOR_SCHEMES = {
    green: {
        empty: '#ebedf0',
        levels: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
        highlight: '#f97316'
    },
    blue: {
        empty: '#ebedf0',
        levels: ['#9ecae1', '#6baed6', '#3182bd', '#08519c'],
        highlight: '#f97316'
    },
    purple: {
        empty: '#ebedf0',
        levels: ['#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6'],
        highlight: '#f97316'
    },
    orange: {
        empty: '#ebedf0',
        levels: ['#fed7aa', '#fdba74', '#f97316', '#c2410c'],
        highlight: '#3b82f6'
    }
};

/**
 * Convert a Date to a YYYY-MM-DD local date key
 */
const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Parse a date value safely
 */
const parseDateSafe = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Build the heatmap grid data from a collection of dates
 */
const buildHeatmapData = (dates, weeks) => {
    // Count occurrences per day
    const countMap = {};
    (dates || []).forEach((dateVal) => {
        const parsed = parseDateSafe(dateVal);
        if (!parsed) return;
        const key = toDateKey(parsed);
        countMap[key] = (countMap[key] || 0) + 1;
    });

    // Build the grid: weeks × 7 days, ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the start: go back (weeks) weeks from end-of-this-week
    const dayOfWeek = today.getDay(); // 0=Sun
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek)); // Saturday

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (weeks * 7) + 1);

    const grid = [];
    let maxCount = 0;
    const cursor = new Date(startDate);

    for (let w = 0; w < weeks; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const key = toDateKey(cursor);
            const count = countMap[key] || 0;
            const isFuture = cursor > today;
            if (count > maxCount) maxCount = count;
            week.push({
                date: new Date(cursor),
                dateKey: key,
                count,
                isFuture,
                dayOfWeek: cursor.getDay(),
                month: cursor.getMonth()
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        grid.push(week);
    }

    return { grid, maxCount, countMap };
};

/**
 * Determine color level for a given count
 */
const getColorLevel = (count, maxCount, scheme, isHighlighted, isFuture) => {
    if (isFuture) return 'transparent';
    if (isHighlighted) return scheme.highlight;
    if (count === 0) return scheme.empty;
    if (maxCount === 0) return scheme.empty;

    // 4 levels based on quartiles
    const ratio = count / maxCount;
    if (ratio <= 0.25) return scheme.levels[0];
    if (ratio <= 0.5) return scheme.levels[1];
    if (ratio <= 0.75) return scheme.levels[2];
    return scheme.levels[3];
};

/**
 * Compute summary statistics
 */
const computeSummary = (countMap) => {
    const keys = Object.keys(countMap);
    const totalActivities = keys.reduce((sum, k) => sum + countMap[k], 0);
    const activeDays = keys.filter((k) => countMap[k] > 0).length;

    // Current streak: consecutive days with activity ending today
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(today);
    while (true) {
        const key = toDateKey(checkDate);
        if (countMap[key] && countMap[key] > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedKeys = keys.sort();
    for (let i = 0; i < sortedKeys.length; i++) {
        if (countMap[sortedKeys[i]] > 0) {
            tempStreak++;
            // Check if next day is consecutive
            const currentDate = new Date(sortedKeys[i] + 'T00:00:00');
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextKey = toDateKey(nextDay);
            if (!countMap[nextKey] || countMap[nextKey] === 0) {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 0;
            }
        }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    return { totalActivities, activeDays, currentStreak, longestStreak };
};

const IssueActivityHeatmap = ({
    dates = [],
    weeks = 52,
    title,
    highlightDate,
    colorScheme = 'green',
    showMonthLabels = true,
    showDayLabels = true,
    showSummary = true
}) => {
    const [tooltip, setTooltip] = useState(null);
    const containerRef = useRef(null);

    const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.green;
    const highlightKey = highlightDate ? toDateKey(parseDateSafe(highlightDate) || new Date()) : null;

    const { grid, maxCount, countMap } = useMemo(
        () => buildHeatmapData(dates, weeks),
        [dates, weeks]
    );

    const summary = useMemo(
        () => (showSummary ? computeSummary(countMap) : null),
        [countMap, showSummary]
    );

    // Month labels: detect when month changes across weeks
    const monthLabels = useMemo(() => {
        if (!showMonthLabels || grid.length === 0) return [];
        const labels = [];
        let lastMonth = -1;

        grid.forEach((week, weekIndex) => {
            // Use the first day of each week to determine month
            const firstDay = week[0];
            if (firstDay && firstDay.month !== lastMonth && !firstDay.isFuture) {
                lastMonth = firstDay.month;
                labels.push({
                    text: MONTH_NAMES[firstDay.month],
                    x: weekIndex * CELL_TOTAL
                });
            }
        });

        return labels;
    }, [grid, showMonthLabels]);

    const handleCellMouseEnter = useCallback((event, day) => {
        if (day.isFuture) return;
        const rect = event.currentTarget.getBoundingClientRect();

        const dateStr = day.date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const countText = day.count === 0
            ? 'No activity'
            : `${day.count} activit${day.count === 1 ? 'y' : 'ies'}`;

        setTooltip({
            text: `${countText} on ${dateStr}`,
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });
    }, []);

    const handleCellMouseLeave = useCallback(() => {
        setTooltip(null);
    }, []);

    const leftPadding = showDayLabels ? 36 : 0;
    const topPadding = showMonthLabels ? 20 : 0;
    const svgWidth = leftPadding + (weeks * CELL_TOTAL);
    const svgHeight = topPadding + (7 * CELL_TOTAL);

    return (
        <div className="activity-heatmap" ref={containerRef}>
            {/* Header */}
            {(title || showSummary) && (
                <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
                    {title && (
                        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700">
                            <i className="fa-light fa-fire tw-mr-2 tw-text-green-600"></i>
                            {title}
                        </h3>
                    )}
                    {showSummary && summary && (
                        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-text-xs tw-text-gray-500">
                            <span>
                                <strong className="tw-text-gray-800">{summary.totalActivities}</strong> total
                            </span>
                            <span>
                                <strong className="tw-text-gray-800">{summary.activeDays}</strong> active days
                            </span>
                            {summary.currentStreak > 0 && (
                                <span>
                                    <i className="fa-light fa-fire tw-text-orange-500 tw-mr-1"></i>
                                    <strong className="tw-text-gray-800">{summary.currentStreak}</strong> day streak
                                </span>
                            )}
                            {summary.longestStreak > 1 && (
                                <span>
                                    Longest: <strong className="tw-text-gray-800">{summary.longestStreak}</strong> days
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Heatmap Grid */}
            <div className="activity-heatmap__grid">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    width="100%"
                    height="auto"
                    style={{ display: 'block', maxHeight: svgHeight * 1.5 }}
                    preserveAspectRatio="xMinYMin meet"
                >
                    {/* Month Labels */}
                    {showMonthLabels && monthLabels.map((label, i) => (
                        <text
                            key={`month-${i}`}
                            x={leftPadding + label.x}
                            y={12}
                            fontSize={10}
                            fill="#959da5"
                            fontFamily="system-ui, -apple-system, sans-serif"
                        >
                            {label.text}
                        </text>
                    ))}

                    {/* Day Labels */}
                    {showDayLabels && DAY_LABELS.map((label, i) => (
                        label ? (
                            <text
                                key={`day-${i}`}
                                x={0}
                                y={topPadding + (i * CELL_TOTAL) + CELL_SIZE - 1}
                                fontSize={10}
                                fill="#959da5"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                {label}
                            </text>
                        ) : null
                    ))}

                    {/* Day Cells */}
                    {grid.map((week, weekIndex) =>
                        week.map((day, dayIndex) => {
                            if (day.isFuture) return null;
                            const isHighlighted = highlightKey && day.dateKey === highlightKey;
                            const fill = getColorLevel(day.count, maxCount, scheme, isHighlighted, day.isFuture);

                            return (
                                <rect
                                    key={`${weekIndex}-${dayIndex}`}
                                    x={leftPadding + (weekIndex * CELL_TOTAL)}
                                    y={topPadding + (dayIndex * CELL_TOTAL)}
                                    width={CELL_SIZE}
                                    height={CELL_SIZE}
                                    rx={2}
                                    ry={2}
                                    fill={fill}
                                    stroke={isHighlighted ? scheme.highlight : 'transparent'}
                                    strokeWidth={isHighlighted ? 2 : 0}
                                    style={{ cursor: 'pointer', outline: 'none' }}
                                    onMouseEnter={(e) => handleCellMouseEnter(e, day)}
                                    onMouseLeave={handleCellMouseLeave}
                                />
                            );
                        })
                    )}
                </svg>

            </div>

            {/* Tooltip - fixed to viewport so it always appears near the hovered cell */}
            {tooltip && (
                <div
                    className="activity-heatmap__tooltip"
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999
                    }}
                >
                    {tooltip.text}
                </div>
            )}

            {/* Legend */}
            <div className="tw-flex tw-items-center tw-justify-end tw-mt-2 tw-gap-1">
                <span className="activity-heatmap__legend-label">Less</span>
                <svg width={CELL_SIZE} height={CELL_SIZE}>
                    <rect width={CELL_SIZE} height={CELL_SIZE} rx={2} ry={2} fill={scheme.empty} />
                </svg>
                {scheme.levels.map((color, i) => (
                    <svg key={i} width={CELL_SIZE} height={CELL_SIZE}>
                        <rect width={CELL_SIZE} height={CELL_SIZE} rx={2} ry={2} fill={color} />
                    </svg>
                ))}
                <span className="activity-heatmap__legend-label">More</span>
            </div>
        </div>
    );
};

export default IssueActivityHeatmap;
