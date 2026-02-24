/**
 * File: DashboardStatCards.js
 * Purpose: Fluent-style stat card sections for the Issue Dashboard
 * Dependencies: React
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - FluentStat: single Fluent stat card (bar accent, value, label, ghost icon)
 * - DashboardStatCards: renders Overview / Priority / User / Performance sections
 */
import React from 'react';

/* ─────────────────────────────────────────
   Single stat card
───────────────────────────────────────── */
export const FluentStat = ({ label, value, sub, color = 'blue', icon, onClick, delay = 0 }) => {
    const barColors = {
        blue: '#0078D4',
        orange: '#CA5010',
        yellow: '#FFB900',
        green: '#107C10',
        red: '#D13438',
        gray: '#C8C6C4',
        purple: '#5C2D91',
        teal: '#008272',
        indigo: '#4052B5',
    };

    const textColors = {
        blue: '#0078D4',
        orange: '#CA5010',
        yellow: '#7A5200',
        green: '#107C10',
        red: '#D13438',
        gray: '#605E5C',
        purple: '#5C2D91',
        teal: '#008272',
        indigo: '#4052B5',
    };

    return (
        <div
            className="fms-stat"
            style={{ animationDelay: `${delay}s` }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="fms-stat__bar" style={{ background: barColors[color] }}></div>
            <div className="fms-stat__label">{label}</div>
            <div className="fms-stat__value" style={{ color: textColors[color] }}>
                {value}
            </div>
            {sub && <div className="fms-stat__sub">{sub}</div>}
            {icon && (
                <div className="fms-stat__ghost">
                    <i className={icon}></i>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────
   Section label
───────────────────────────────────────── */
const SecLabel = ({ icon, children }) => (
    <div className="fms-sec-label">
        <i className={icon}></i>
        {children}
    </div>
);

/* ─────────────────────────────────────────
   All stat sections combined
───────────────────────────────────────── */
const DashboardStatCards = ({
    stats,
    formatTime,
    onPriorityFilter,
    onStatusFilter,
    onOverdueFilter,
    onUnassignedFilter,
    onResolvedTodayFilter,
    onClearQuickFilters,
    onTabSwitch,
}) => {
    return (
        <>
            {/* ── Overview ── */}
            <SecLabel icon="fa-light fa-chart-simple">Overview</SecLabel>
            <div className="fms-stat-grid fms-g4 tw-mb-3">
                <FluentStat
                    label="Total Issues"
                    value={stats.totalIssues}
                    sub="Click to show all"
                    color="blue"
                    icon="fa-light fa-clipboard-list"
                    delay={0.04}
                    onClick={onClearQuickFilters}
                />
                <FluentStat
                    label="Open Issues"
                    value={stats.openCount}
                    sub="Requires attention"
                    color="orange"
                    icon="fa-light fa-folder-open"
                    delay={0.07}
                    onClick={() => onStatusFilter('Open')}
                />
                <FluentStat
                    label="In Progress"
                    value={stats.inProgressCount}
                    sub="Being worked on"
                    color="yellow"
                    icon="fa-light fa-arrows-rotate"
                    delay={0.10}
                    onClick={() => onStatusFilter('In Progress')}
                />
                <FluentStat
                    label="Resolved Today"
                    value={stats.resolvedToday}
                    sub="Completed today"
                    color="green"
                    icon="fa-light fa-circle-check"
                    delay={0.13}
                    onClick={onResolvedTodayFilter}
                />
            </div>

            {/* ── Priority & Alerts ── */}
            <SecLabel icon="fa-light fa-bell">Priority &amp; Alerts</SecLabel>
            <div className="fms-stat-grid fms-g4 tw-mb-3">
                <FluentStat
                    label="Critical"
                    value={stats.criticalCount}
                    sub="Immediate attention"
                    color="red"
                    delay={0.05}
                    onClick={() => onPriorityFilter('Critical')}
                />
                <FluentStat
                    label="High Priority"
                    value={stats.highCount}
                    sub="High importance"
                    color="orange"
                    delay={0.08}
                    onClick={() => onPriorityFilter('High')}
                />
                <FluentStat
                    label="Overdue"
                    value={stats.overdueIssues}
                    sub="Past due date"
                    color="red"
                    delay={0.11}
                    onClick={onOverdueFilter}
                />
                <FluentStat
                    label="Unassigned"
                    value={stats.unassignedIssues}
                    sub="Needs assignment"
                    color="gray"
                    delay={0.14}
                    onClick={onUnassignedFilter}
                />
            </div>

            {/* ── User Stats — 2-col ── */}
            <div className="fms-g2h tw-mb-2">
                <div>
                    <SecLabel icon="fa-light fa-user-check">Assigned to Me</SecLabel>
                    <div className="fms-stat-grid fms-g3">
                        <FluentStat
                            label="Total"
                            value={stats.totalAssigned}
                            color="blue"
                            onClick={() => onTabSwitch('assigned')}
                        />
                        <FluentStat
                            label="My Closed"
                            value={stats.closedByMe}
                            color="green"
                            onClick={() => onTabSwitch('closed')}
                        />
                        <FluentStat
                            label="Awaiting"
                            value={stats.awaitingResponse}
                            color="purple"
                            onClick={() => onTabSwitch('assigned')}
                        />
                    </div>
                </div>
                <div>
                    <SecLabel icon="fa-light fa-user-pen">Opened by Me</SecLabel>
                    <div className="fms-stat-grid fms-g3">
                        <FluentStat
                            label="Total"
                            value={stats.totalOpenedByMe}
                            color="blue"
                            onClick={() => onTabSwitch('opened')}
                        />
                        <FluentStat
                            label="Still Open"
                            value={stats.openedByMeOpen}
                            color="yellow"
                            onClick={() => onTabSwitch('opened')}
                        />
                        <FluentStat
                            label="Resolved"
                            value={stats.openedByMeResolved}
                            color="teal"
                            onClick={() => onTabSwitch('closed')}
                        />
                    </div>
                </div>
            </div>

            {/* ── Performance (no click-to-filter) ── */}
            <SecLabel icon="fa-light fa-gauge-high">Performance Metrics</SecLabel>
            <div className="fms-stat-grid fms-g4 tw-mb-4">
                <FluentStat
                    label="Avg Resolution"
                    value={formatTime(stats.averageResolutionTime)}
                    sub="Time to resolve"
                    color="purple"
                />
                <FluentStat
                    label="GPS Auto-Created"
                    value={stats.gpsGeneratedIssues}
                    sub="From GPS monitoring"
                    color="blue"
                />
                <FluentStat
                    label="Created Today"
                    value={stats.createdToday}
                    sub="New issues today"
                    color="indigo"
                />
                <FluentStat
                    label="My Issues Closed"
                    value={stats.openedByMeClosed}
                    sub="Opened by me, closed"
                    color="green"
                />
            </div>
        </>
    );
};

export default DashboardStatCards;
