/**
 * File:          TankCalibrationLearnedTab.js
 * Purpose:       Renders the FMS learned calibration workflow including extraction, coverage, seeding, generation, and chart comparison.
 * Dependencies:  React, devextreme-react/chart, devextreme-react/data-grid, ptsConfigService, notify
 * Last Modified: 2026-03-24
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import { DataGrid, Column, Paging, Pager, SearchPanel } from "devextreme-react/data-grid";
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings } from "devextreme-react/chart";

import ptsConfigService from "../../../services/ptsConfigService";
import SlidePanel from "../../../components/ui/SlidePanel";
import CalibrationLearningSettingsPanel from "./CalibrationLearningSettingsPanel";
import TankCalibrationLearnedTour from "./TankCalibrationLearnedTour";
import "./TankCalibrationLearnedTab.scss";

const LEARNED_CHART_TYPE = "fms-learned";
const SEED_CHART_TYPES = ["manual", "automatic"];
const COMPARE_CHART_OPTIONS = [
    { value: "manual", label: "PTS Manual Chart" },
    { value: "interval-volume", label: "PTS Interval Volume" },
    { value: "automatic", label: "PTS Automatic Chart" },
];
const DEFAULT_DEVIATION_THRESHOLD = 5;

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const toUtcIso = (dateValue, isEndOfDay = false) => {
    if (!dateValue) {
        return null;
    }

    return new Date(`${dateValue}T${isEndOfDay ? "23:59:59" : "00:00:00"}Z`).toISOString();
};

const formatSnapshotOptionLabel = (item) => {
    if (!item) {
        return "";
    }

    const recordedAt = item.recordedAtUtc ? new Date(item.recordedAtUtc).toLocaleString() : "Unknown time";
    const chartLabel = item.chartType === "manual" ? "PTS Manual" : "PTS Automatic";
    return `${chartLabel} • ${recordedAt} • ${item.totalRecords || 0} rows`;
};

const formatCoverageValue = (value, digits = 1) => Number(value || 0).toFixed(digits);

const buildRecommendation = ({
    loading,
    coverage,
    hasAnyUsableInterval,
    hasLearnedChart,
    seedOptions,
    comparisonRows,
    flaggedComparisonCount,
}) => {
    if (loading && !coverage) {
        return {
            tone: "info",
            badgeClassName: "m365-badge--info",
            icon: "fa-loader",
            title: "Refreshing learned calibration state",
            description: "The tab is loading coverage, snapshots, and comparison context before recommending the next step.",
            action: null,
            actionLabel: null,
        };
    }

    const observedPoints = coverage?.totalObservedPointCount ?? 0;
    const seededIntervals = coverage?.seededIntervalCount ?? 0;
    const sparseIntervals = coverage?.sparseIntervalCount ?? 0;
    const coveragePercentage = Number(coverage?.coveragePercentage ?? 0);

    if (observedPoints === 0 && seededIntervals === 0) {
        return {
            tone: "info",
            badgeClassName: "m365-badge--info",
            icon: "fa-arrow-down-to-line",
            title: "Extract first",
            description: "This tank does not have learned evidence yet. Pull dispensing and delivery history first so the learning engine has usable points to work with.",
            action: "extract",
            actionLabel: "Extract Data",
        };
    }

    if (!hasLearnedChart && sparseIntervals > 0 && seedOptions.length > 0 && seededIntervals === 0) {
        return {
            tone: "warning",
            badgeClassName: "m365-badge--warning",
            icon: "fa-seedling",
            title: "Seed recommended",
            description: "Coverage is partially built but still sparse. A trusted PTS snapshot is available and can stabilize uncovered intervals before you generate the learned chart.",
            action: "seed",
            actionLabel: "Review Seed Baseline",
        };
    }

    if (hasAnyUsableInterval && !hasLearnedChart) {
        return {
            tone: "success",
            badgeClassName: "m365-badge--success",
            icon: "fa-wand-magic-sparkles",
            title: "Generate the learned chart",
            description: `Coverage is ${coveragePercentage.toFixed(1)}% and enough intervals are usable. Generate the current FMS learned snapshot before comparing it to PTS.`,
            action: "generate",
            actionLabel: "Generate Now",
        };
    }

    if (hasLearnedChart && comparisonRows.length === 0) {
        return {
            tone: "info",
            badgeClassName: "m365-badge--info",
            icon: "fa-code-compare",
            title: "Run a comparison",
            description: "You already have a learned chart. Compare it to a PTS chart now so you can validate interval deviation before relying on it operationally.",
            action: "compare",
            actionLabel: "Compare Now",
        };
    }

    if (flaggedComparisonCount > 0) {
        return {
            tone: "warning",
            badgeClassName: "m365-badge--warning",
            icon: "fa-triangle-exclamation",
            title: `${flaggedComparisonCount} intervals exceed the threshold`,
            description: "The comparison already found deviations above the highlight threshold. Review the comparison grid before accepting the learned chart as trustworthy.",
            action: "review-compare",
            actionLabel: "Review Comparison",
        };
    }

    return {
        tone: "success",
        badgeClassName: "m365-badge--success",
        icon: "fa-circle-check",
        title: "Learned chart is in a good state",
        description: "Coverage, chart generation, and comparison are already in place. Use the guided tour if you want a quick walkthrough for other users.",
        action: "help",
        actionLabel: "Open Help",
    };
};

const EmptyState = ({ icon, title, description }) => (
    <div className="m365-tank-calibration-learned__empty-state">
        <div className="m365-tank-calibration-learned__empty-icon">
            <i className={`fa-light ${icon}`}></i>
        </div>
        <div>
            <h5>{title}</h5>
            <p>{description}</p>
        </div>
    </div>
);

const TankCalibrationLearnedTab = ({ tank }) => {
    const [coverage, setCoverage] = useState(null);
    const [currentSnapshot, setCurrentSnapshot] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [seedOptions, setSeedOptions] = useState([]);
    const [comparisonRows, setComparisonRows] = useState([]);
    const [extractionResult, setExtractionResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [includeDispensing, setIncludeDispensing] = useState(true);
    const [includeDeliveries, setIncludeDeliveries] = useState(true);
    const [selectedSeedSnapshotId, setSelectedSeedSnapshotId] = useState("");
    const [selectedCompareChartType, setSelectedCompareChartType] = useState("manual");
    const [deviationThreshold, setDeviationThreshold] = useState(DEFAULT_DEVIATION_THRESHOLD);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [tourRun, setTourRun] = useState(false);
    const [tourKey, setTourKey] = useState(0);

    const comparisonChartData = useMemo(
        () => comparisonRows.map((item) => ({
            height: item.intervalEndMm,
            referenceVolume: Number(item.referenceVolume),
            comparedVolume: Number(item.comparedVolume),
        })),
        [comparisonRows]
    );

    const hasCoverageData = Array.isArray(coverage?.intervals) && coverage.intervals.length > 0;
    const hasAnyUsableInterval = Boolean(
        coverage?.intervals?.some((item) => item.observationCount > 0 || Number(item.meanVolumePerMm) > 0)
    );
    const hasLearnedChart = Array.isArray(currentSnapshot?.records) && currentSnapshot.records.length > 1;
    const flaggedComparisonCount = comparisonRows.filter(
        (item) => Math.abs(Number(item.percentageDeviation || 0)) >= Number(deviationThreshold || 0)
    ).length;
    const recommendation = useMemo(() => buildRecommendation({
        loading,
        coverage,
        hasAnyUsableInterval,
        hasLearnedChart,
        seedOptions,
        comparisonRows,
        flaggedComparisonCount,
    }), [comparisonRows, coverage, flaggedComparisonCount, hasAnyUsableInterval, hasLearnedChart, loading, seedOptions]);

    const runComparison = useCallback(async (chartType, options = {}) => {
        const { silent = false } = options;

        try {
            const result = await ptsConfigService.compareCalibrationLearningCharts(tank.id, {
                comparedChartType: chartType,
            });

            if (!result?.isSuccess) {
                throw new Error(result?.message || "Calibration comparison failed.");
            }

            const rows = Array.isArray(result?.data) ? result.data : [];
            setComparisonRows(rows);
            return rows;
        } catch (error) {
            setComparisonRows([]);
            if (!silent) {
                notify(getErrorMessage(error, "Failed to compare calibration charts."), "error", 4000);
            }

            throw error;
        }
    }, [tank.id]);

    const loadSeedOptions = useCallback(async () => {
        const results = await Promise.all(
            SEED_CHART_TYPES.map((chartType) =>
                ptsConfigService.getTankCalibrationHistory(tank.id, chartType, 1, 10)
            )
        );

        const combined = results.flatMap((result) => Array.isArray(result?.data) ? result.data : []);
        combined.sort((left, right) => new Date(right.recordedAtUtc || 0).getTime() - new Date(left.recordedAtUtc || 0).getTime());
        setSeedOptions(combined);
    }, [tank.id]);

    const loadLearnedData = useCallback(async () => {
        setLoading(true);
        try {
            const [coverageResult, currentResult, historyResult] = await Promise.all([
                ptsConfigService.getCalibrationLearningCoverage(tank.id),
                ptsConfigService.getTankCalibrationCurrentSnapshot(tank.id, LEARNED_CHART_TYPE).catch((error) => {
                    const message = getErrorMessage(error, "");
                    if (message.toLowerCase().includes("no local calibration snapshot")) {
                        return { data: null };
                    }

                    throw error;
                }),
                ptsConfigService.getTankCalibrationHistory(tank.id, LEARNED_CHART_TYPE, 1, 10),
                loadSeedOptions(),
            ]);

            setCoverage(coverageResult?.data || null);
            setCurrentSnapshot(currentResult?.data || null);
            setHistoryRows(Array.isArray(historyResult?.data) ? historyResult.data : []);
        } catch (error) {
            notify(getErrorMessage(error, "Failed to load FMS learned calibration data."), "error", 4000);
            setCoverage(null);
            setCurrentSnapshot(null);
            setHistoryRows([]);
            setSeedOptions([]);
        } finally {
            setLoading(false);
        }
    }, [loadSeedOptions, tank.id]);

    useEffect(() => {
        if (!tank?.id) {
            return;
        }

        loadLearnedData();
    }, [loadLearnedData, tank?.id]);

    useEffect(() => {
        if (!currentSnapshot || comparisonRows.length === 0) {
            return;
        }

        runComparison(selectedCompareChartType, { silent: true }).catch(() => { });
    }, [currentSnapshot, comparisonRows.length, runComparison, selectedCompareChartType]);

    const handleExtract = async () => {
        if (!includeDispensing && !includeDeliveries) {
            notify("Enable at least one learning source before extracting.", "warning", 3000);
            return;
        }

        setSubmitting(true);
        try {
            const result = await ptsConfigService.extractCalibrationLearningData(tank.id, {
                startDateUtc: toUtcIso(startDate, false),
                endDateUtc: toUtcIso(endDate, true),
                includeDispensing,
                includeDeliveries,
            });

            if (!result?.isSuccess) {
                throw new Error(result?.message || "Calibration learning extraction failed.");
            }

            setExtractionResult(result.data || null);
            notify("Calibration learning data extracted successfully.", "success", 2500);
            await loadLearnedData();
        } catch (error) {
            notify(getErrorMessage(error, "Failed to extract calibration learning data."), "error", 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSeed = async () => {
        if (!selectedSeedSnapshotId) {
            notify("Select a PTS snapshot to use as the seed baseline.", "warning", 3000);
            return;
        }

        setSubmitting(true);
        try {
            const result = await ptsConfigService.seedCalibrationLearning(tank.id, selectedSeedSnapshotId);
            if (!result?.isSuccess) {
                throw new Error(result?.message || "Calibration learning seed failed.");
            }

            setCoverage(result.data || null);
            notify("Calibration learning baseline seeded successfully.", "success", 2500);
            await loadLearnedData();
        } catch (error) {
            notify(getErrorMessage(error, "Failed to seed calibration learning."), "error", 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerate = async () => {
        setSubmitting(true);
        try {
            const result = await ptsConfigService.generateLearnedCalibrationChart(tank.id);
            if (!result?.isSuccess) {
                throw new Error(result?.message || "Learned chart generation failed.");
            }

            notify("FMS learned calibration chart generated successfully.", "success", 2500);
            await loadLearnedData();
            await runComparison(selectedCompareChartType, { silent: true }).catch(() => null);
        } catch (error) {
            notify(getErrorMessage(error, "Failed to generate FMS learned calibration chart."), "error", 4000);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompare = async () => {
        setSubmitting(true);
        try {
            await runComparison(selectedCompareChartType);
        } catch (error) {
        } finally {
            setSubmitting(false);
        }
    };

    const handleComparisonRowPrepared = useCallback((event) => {
        if (event.rowType !== "data") {
            return;
        }

        const deviation = Math.abs(Number(event.data?.percentageDeviation || 0));
        if (deviation >= Number(deviationThreshold || 0)) {
            event.rowElement.classList.add("m365-tank-calibration-learned__comparison-row--highlight");
        }
    }, [deviationThreshold]);

    const startTour = useCallback(() => {
        setTourKey((current) => current + 1);
        setTourRun(true);
    }, []);

    const scrollToSelector = useCallback((selector) => {
        const element = document.querySelector(selector);
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const handleRecommendationAction = () => {
        switch (recommendation?.action) {
            case "extract":
                handleExtract();
                break;
            case "seed":
                scrollToSelector(".tour-target-learned-seed");
                break;
            case "generate":
                handleGenerate();
                break;
            case "compare":
                handleCompare();
                break;
            case "review-compare":
                scrollToSelector(".tour-target-learned-compare");
                break;
            case "help":
                setHelpOpen(true);
                break;
            default:
                break;
        }
    };

    return (
        <div className="m365-tank-calibration-learned">
            <TankCalibrationLearnedTour key={tourKey} run={tourRun} onFinish={() => setTourRun(false)} />

            <div className="m365-tank-calibration-learned__hero tour-target-learned-hero">
                <div className="m365-tank-calibration-learned__hero-main">
                    <h3 className="m365-tank-calibration-learned__title">
                        <i className="fa-light fa-brain-circuit"></i>
                        FMS Learned Calibration
                    </h3>
                    <p className="m365-tank-calibration-learned__subtitle">
                        Build an FMS-side height-to-volume chart from dispensing, deliveries, and seeded PTS baselines for {tank.name}.
                    </p>
                </div>
                <div className="m365-tank-calibration-learned__hero-actions">
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={startTour}
                    >
                        <i className="fa-light fa-person-chalkboard"></i>
                        Start Tour
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={() => setHelpOpen(true)}
                    >
                        <i className="fa-light fa-circle-question"></i>
                        Help
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={() => setSettingsOpen(true)}
                    >
                        <i className="fa-light fa-sliders"></i>
                        Learning Settings
                    </button>
                    <div className="m365-tank-calibration-learned__hero-badges">
                        <span className="m365-badge m365-badge--info">Coverage {formatCoverageValue(coverage?.coveragePercentage)}%</span>
                        <span className="m365-badge m365-badge--neutral">Ready {coverage?.readyIntervalCount ?? 0}</span>
                        <span className="m365-badge m365-badge--warning">Sparse {coverage?.sparseIntervalCount ?? 0}</span>
                    </div>
                </div>
            </div>

            <div className={`m365-tank-calibration-learned__recommendation m365-tank-calibration-learned__recommendation--${recommendation.tone} tour-target-learned-banner`}>
                <div className="m365-tank-calibration-learned__recommendation-icon">
                    <i className={`fa-light ${recommendation.icon}`}></i>
                </div>
                <div className="m365-tank-calibration-learned__recommendation-copy">
                    <span className={`m365-badge ${recommendation.badgeClassName}`}>Recommended Next Action</span>
                    <h4>{recommendation.title}</h4>
                    <p>{recommendation.description}</p>
                </div>
                <div className="m365-tank-calibration-learned__recommendation-actions">
                    {recommendation.actionLabel && (
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleRecommendationAction} disabled={submitting}>
                            {recommendation.actionLabel}
                        </button>
                    )}
                    <button type="button" className="m365-btn m365-btn--text" onClick={startTour}>
                        Walkthrough tour
                    </button>
                </div>
            </div>

            <div className="m365-tank-calibration-learned__kpi-row">
                <div className="m365-tank-calibration-learned__kpi-card">
                    <span className="m365-tank-calibration-learned__kpi-label">Observed Points</span>
                    <strong>{coverage?.totalObservedPointCount ?? 0}</strong>
                </div>
                <div className="m365-tank-calibration-learned__kpi-card">
                    <span className="m365-tank-calibration-learned__kpi-label">Seeded Intervals</span>
                    <strong>{coverage?.seededIntervalCount ?? 0}</strong>
                </div>
                <div className="m365-tank-calibration-learned__kpi-card">
                    <span className="m365-tank-calibration-learned__kpi-label">Mean Fill Rate</span>
                    <strong>{formatCoverageValue(coverage?.averageMeanVolumePerMm, 3)} L/mm</strong>
                </div>
            </div>

            <div className="m365-tank-calibration-learned__grid">
                <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--extract tour-target-learned-extract">
                    <div className="m365-tank-calibration-learned__section-heading">
                        <h4><i className="fa-light fa-arrow-down-to-line"></i> Extract Learning Data</h4>
                        <span>{extractionResult?.totalPointCount ?? 0} new points</span>
                    </div>

                    <div className="m365-tank-calibration-learned__form-grid">
                        <div>
                            <label className="m365-field__label">Start Date</label>
                            <input className="m365-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </div>
                        <div>
                            <label className="m365-field__label">End Date</label>
                            <input className="m365-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                        </div>
                    </div>

                    <div className="m365-tank-calibration-learned__checkbox-row">
                        <label className="m365-checkbox">
                            <input type="checkbox" checked={includeDispensing} onChange={() => setIncludeDispensing((current) => !current)} />
                            <span className="m365-checkbox__label">Include dispensing events</span>
                        </label>
                        <label className="m365-checkbox">
                            <input type="checkbox" checked={includeDeliveries} onChange={() => setIncludeDeliveries((current) => !current)} />
                            <span className="m365-checkbox__label">Include delivery events</span>
                        </label>
                    </div>

                    <div className="m365-tank-calibration-learned__action-group">
                        <span className="m365-tank-calibration-learned__action-label">Learning Sources</span>
                        <div className="m365-tank-calibration-learned__actions">
                            <button type="button" className="m365-btn m365-btn--primary" onClick={handleExtract} disabled={submitting}>
                                <i className="fa-light fa-arrow-down-to-line"></i>
                                Extract Data
                            </button>
                        </div>
                    </div>

                    <p className="m365-field__hint">Extraction appends unprocessed learned points and refreshes the interval coverage map.</p>

                    {extractionResult && (
                        <div className="m365-tank-calibration-learned__summary-row">
                            <span>Dispensing: {extractionResult.dispensingPointCount}</span>
                            <span>Deliveries: {extractionResult.deliveryPointCount}</span>
                            <span>Total: {extractionResult.totalPointCount}</span>
                        </div>
                    )}
                </div>

                <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--seed tour-target-learned-seed">
                    <div className="m365-tank-calibration-learned__section-heading">
                        <h4><i className="fa-light fa-seedling"></i> Seed Baseline</h4>
                        <span>{seedOptions.length} snapshots available</span>
                    </div>
                    <label className="m365-field__label">PTS Snapshot</label>
                    <select className="m365-select" value={selectedSeedSnapshotId} onChange={(event) => setSelectedSeedSnapshotId(event.target.value)}>
                        <option value="">Select a manual or automatic snapshot</option>
                        {seedOptions.map((item) => (
                            <option key={item.id} value={item.id}>{formatSnapshotOptionLabel(item)}</option>
                        ))}
                    </select>
                    <p className="m365-field__hint">Seeded intervals act as a baseline until observed data replaces them.</p>
                    <div className="m365-tank-calibration-learned__action-group">
                        <span className="m365-tank-calibration-learned__action-label">Chart Preparation</span>
                        <div className="m365-tank-calibration-learned__actions">
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={handleSeed} disabled={submitting || !selectedSeedSnapshotId}>
                                <i className="fa-light fa-seedling"></i>
                                Seed From Snapshot
                            </button>
                            <button type="button" className="m365-btn m365-btn--primary" onClick={handleGenerate} disabled={submitting || !hasAnyUsableInterval}>
                                <i className="fa-light fa-wand-magic-sparkles"></i>
                                Generate FMS Learned
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--coverage tour-target-learned-coverage">
                <div className="m365-tank-calibration-learned__section-heading">
                    <h4><i className="fa-light fa-grid-2"></i> Coverage Map</h4>
                    <span>{loading ? "Loading..." : `${coverage?.totalIntervalCount ?? 0} intervals`}</span>
                </div>

                {hasCoverageData ? (
                    <div className="m365-tank-calibration-learned__coverage-grid">
                        {coverage.intervals.map((item) => (
                            <div
                                key={`${item.intervalStartMm}-${item.intervalEndMm}`}
                                className={`m365-tank-calibration-learned__coverage-cell m365-tank-calibration-learned__coverage-cell--${item.coverageState}`}
                                title={`${item.intervalStartMm}-${item.intervalEndMm} mm • ${item.observationCount} observations`}
                            >
                                <strong>{item.intervalStartMm}-{item.intervalEndMm} mm</strong>
                                <span>{item.observationCount} obs</span>
                                <span>{Number(item.meanVolumePerMm || 0).toFixed(3)} L/mm</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="fa-chart-column"
                        title="No learned coverage yet"
                        description="Extract operational data or seed a baseline snapshot to start building interval coverage."
                    />
                )}
            </div>

            <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--chart tour-target-learned-chart">
                <div className="m365-tank-calibration-learned__section-heading">
                    <h4><i className="fa-light fa-waveform-lines"></i> Latest FMS Learned Chart</h4>
                    <span>{currentSnapshot?.totalRecords ?? 0} rows</span>
                </div>

                {hasLearnedChart ? (
                    <>
                        <Chart dataSource={currentSnapshot.records} height={300}>
                            <CommonSeriesSettings type="spline" />
                            <Series argumentField="height" valueField="volume" name="FMS Learned" color="#107c10" />
                            <ArgumentAxis title="Height (mm)" />
                            <ValueAxis title="Volume" />
                            <Tooltip enabled shared format="#,##0.00" />
                            <Legend visible={false} />
                        </Chart>
                        <DataGrid dataSource={currentSnapshot.records} keyExpr="height" showBorders={false} showRowLines hoverStateEnabled>
                            <Paging defaultPageSize={10} />
                            <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo />
                            <Column dataField="height" caption="Height (mm)" dataType="number" width={140} />
                            <Column dataField="volume" caption="Volume" dataType="number" width={140} />
                        </DataGrid>
                    </>
                ) : (
                    <EmptyState
                        icon="fa-waveform-lines"
                        title="No learned chart available"
                        description="Generate an FMS learned chart after enough coverage exists or after seeding a PTS baseline."
                    />
                )}
            </div>

            <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--compare tour-target-learned-compare">
                <div className="m365-tank-calibration-learned__section-heading">
                    <h4><i className="fa-light fa-code-compare"></i> Compare With PTS Chart</h4>
                    <span>{comparisonRows.length} intervals • {flaggedComparisonCount} above threshold</span>
                </div>
                <div className="m365-tank-calibration-learned__compare-toolbar">
                    <div>
                        <label className="m365-field__label">Compared Chart</label>
                        <select className="m365-select" value={selectedCompareChartType} onChange={(event) => setSelectedCompareChartType(event.target.value)}>
                            {COMPARE_CHART_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </select>

                        <p className="m365-field__hint">Comparison refreshes automatically after generation and when the chart target changes.</p>
                    </div>
                    <div className="m365-tank-calibration-learned__compare-actions">
                        <div className="m365-tank-calibration-learned__threshold-field">
                            <label className="m365-field__label">Highlight Threshold (%)</label>
                            <input
                                className="m365-input"
                                type="number"
                                min="0"
                                step="0.1"
                                value={deviationThreshold}
                                onChange={(event) => setDeviationThreshold(event.target.value)}
                            />
                        </div>
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleCompare} disabled={submitting || !currentSnapshot}>
                            <i className="fa-light fa-code-compare"></i>
                            Compare
                        </button>
                    </div>
                </div>

                {comparisonRows.length > 0 ? (
                    <>
                        <Chart dataSource={comparisonChartData} height={300}>
                            <CommonSeriesSettings type="spline" />
                            <Series argumentField="height" valueField="referenceVolume" name="FMS Learned" color="#107c10" />
                            <Series argumentField="height" valueField="comparedVolume" name="PTS Chart" color="#0078d4" />
                            <ArgumentAxis title="Height (mm)" />
                            <ValueAxis title="Volume" />
                            <Tooltip enabled shared format="#,##0.00" />
                            <Legend visible />
                        </Chart>
                        <DataGrid
                            className="m365-tank-calibration-learned__data-grid"
                            dataSource={comparisonRows}
                            keyExpr={(row) => `${row.intervalStartMm}-${row.intervalEndMm}`}
                            showBorders={false}
                            showRowLines
                            hoverStateEnabled
                            onRowPrepared={handleComparisonRowPrepared}
                        >
                            <SearchPanel visible placeholder="Search comparison..." />
                            <Paging defaultPageSize={10} />
                            <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo />
                            <Column dataField="intervalStartMm" caption="Start (mm)" dataType="number" width={110} />
                            <Column dataField="intervalEndMm" caption="End (mm)" dataType="number" width={110} />
                            <Column dataField="referenceVolume" caption="Learned" dataType="number" format="#,##0.000" width={120} />
                            <Column dataField="comparedVolume" caption="Compared" dataType="number" format="#,##0.000" width={120} />
                            <Column dataField="absoluteVolumeDeviation" caption="Abs Deviation" dataType="number" format="#,##0.000" width={130} />
                            <Column dataField="percentageDeviation" caption="Deviation %" dataType="number" format="#,##0.00'%'" width={120} />
                            <Column dataField="confidenceIndicator" caption="Confidence" width={120} />
                        </DataGrid>
                    </>
                ) : (
                    <EmptyState
                        icon="fa-code-compare"
                        title="No comparison loaded"
                        description="Generate the learned chart or run Compare to inspect interval deviation against a selected PTS chart."
                    />
                )}
            </div>

            <div className="m365-tank-calibration-learned__card m365-tank-calibration-learned__card--history tour-target-learned-history">
                <div className="m365-tank-calibration-learned__section-heading">
                    <h4><i className="fa-light fa-clock-rotate-left"></i> Learned Snapshot History</h4>
                    <span>{historyRows.length} recent snapshots</span>
                </div>
                <DataGrid className="m365-tank-calibration-learned__data-grid" dataSource={historyRows} keyExpr="id" showBorders={false} showRowLines hoverStateEnabled noDataText="No learned snapshots stored yet">
                    <Paging defaultPageSize={10} />
                    <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo />
                    <Column dataField="recordedAtUtc" caption="Recorded" dataType="datetime" width={170} />
                    <Column dataField="source" caption="Source" width={150} />
                    <Column dataField="totalRecords" caption="Rows" dataType="number" width={90} />
                    <Column dataField="recordedBy" caption="Recorded By" width={140} />
                    <Column dataField="notes" caption="Notes" minWidth={220} />
                </DataGrid>
            </div>

            <CalibrationLearningSettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSaved={loadLearnedData}
            />

            <SlidePanel
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
                title="FMS Learned Calibration Help"
                width={580}
            >
                <div className="m365-tank-calibration-learned__help">
                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-route"></i> Workflow</h4>
                        <ol>
                            <li>Open the FMS Learned tab for a tank that already has PTS calibration history or operational tank data.</li>
                            <li>Optionally open <strong>Learning Settings</strong> to confirm bucket size, stability window, and minimum thresholds.</li>
                            <li>Run <strong>Extract Data</strong> to pull usable dispensing and delivery events into the learning engine.</li>
                            <li>Review the <strong>Coverage Map</strong> to see which height intervals are ready, sparse, or still empty.</li>
                            <li>If coverage is weak, use <strong>Seed From Snapshot</strong> to bootstrap from a trusted PTS manual or automatic chart.</li>
                            <li>Run <strong>Generate FMS Learned</strong> once enough intervals are covered or seeded.</li>
                            <li>Use <strong>Compare</strong> to inspect deviation between the learned chart and an existing PTS chart.</li>
                        </ol>
                    </section>

                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-arrow-down-to-line"></i> Extract Learning Data</h4>
                        <dl>
                            <dt>What it does</dt>
                            <dd>Scans historical tank activity and converts valid dispensing and delivery events into calibration learning points.</dd>
                            <dt>When to use it</dt>
                            <dd>Run this first whenever you want fresh operational evidence before generating or re-generating the learned chart.</dd>
                            <dt>Why nothing may be added</dt>
                            <dd>Events are rejected when the readings are unstable, the volume change is too small, or there is not enough clean before-and-after measurement data.</dd>
                        </dl>
                    </section>

                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-seedling"></i> Seed Baseline</h4>
                        <dl>
                            <dt>What seeding means</dt>
                            <dd>A trusted PTS chart is converted into interval baselines so the learned chart can start from a known shape before sufficient observed data exists.</dd>
                            <dt>What happens later</dt>
                            <dd>Observed learned data gradually replaces seeded intervals where real evidence exists. Seeded-only intervals remain as fallback values until replaced.</dd>
                        </dl>
                    </section>

                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-grid-2"></i> Coverage Map</h4>
                        <dl>
                            <dt>Ready</dt>
                            <dd>The interval has enough observations to contribute confidently to the learned chart.</dd>
                            <dt>Sparse</dt>
                            <dd>The interval has some evidence, but not enough to meet the configured threshold.</dd>
                            <dt>Empty</dt>
                            <dd>No usable learned data exists for that interval yet.</dd>
                        </dl>
                    </section>

                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-wand-magic-sparkles"></i> Generate And Compare</h4>
                        <dl>
                            <dt>Generate FMS Learned</dt>
                            <dd>Builds a cumulative height-to-volume chart from the interval accumulations and stores it as an FMS learned snapshot.</dd>
                            <dt>Compare With PTS Chart</dt>
                            <dd>Normalizes the learned and selected PTS chart across common intervals so you can review deviation and confidence interval by interval.</dd>
                            <dt>Highlight Threshold</dt>
                            <dd>Controls which rows are visually emphasized in the comparison table based on deviation percentage.</dd>
                        </dl>
                    </section>

                    <section className="m365-tank-calibration-learned__help-section">
                        <h4><i className="fa-light fa-circle-question"></i> Practical Guidance</h4>
                        <ul>
                            <li>Start with extraction before seeding if the tank already has a good amount of operational history.</li>
                            <li>Use seeding when you need a usable baseline quickly or when upper/lower intervals have little live data.</li>
                            <li>Re-run extraction after new deliveries or dispensing history has accumulated.</li>
                            <li>Review comparison results before treating the learned chart as better than the current PTS chart.</li>
                        </ul>
                    </section>
                </div>
            </SlidePanel>
        </div>
    );
};

export default TankCalibrationLearnedTab;