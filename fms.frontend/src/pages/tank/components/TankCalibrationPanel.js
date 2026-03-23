/**
 * File:          TankCalibrationPanel.js
 * Purpose:       Dedicated slide panel for tank calibration sync, local history, and manual chart edits.
 * Dependencies:  devextreme-react DataGrid/NumberBox, ptsConfigService, notify
 * Last Modified: 2026-03-24
 *
 * Props:
 * - tank (object): Selected tank with linked PTS metadata.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DataGrid,
  Column,
  FilterRow,
  Paging,
  Pager,
  SearchPanel,
} from "devextreme-react/data-grid";
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings } from "devextreme-react/chart";
import NumberBox from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";
import ptsConfigService from "../../../services/ptsConfigService";
import SlidePanel from "../../../components/ui/SlidePanel";
import "./TankCalibrationPanel.scss";

const CHART_TYPES = [
  { id: "manual", label: "Manual Chart", icon: "fa-light fa-ruler-vertical" },
  { id: "interval-volume", label: "Interval Volume", icon: "fa-light fa-wave-square" },
  { id: "automatic", label: "Automatic Chart", icon: "fa-light fa-wand-magic-sparkles" },
];

const sortRecords = (records) =>
  [...(Array.isArray(records) ? records : [])].sort((left, right) => left.height - right.height);

const emptyForm = {
  height: null,
  volume: null,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const TankCalibrationPanel = ({ tank }) => {
  const [chartType, setChartType] = useState("manual");
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyPageNumber, setHistoryPageNumber] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [selectedHistorySnapshot, setSelectedHistorySnapshot] = useState(null);
  const [draftRecords, setDraftRecords] = useState([]);
  const [editorForm, setEditorForm] = useState(emptyForm);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSnapshotDetail, setLoadingSnapshotDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [healthSummary, setHealthSummary] = useState(null);
  const [variances, setVariances] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const graphSectionRef = useRef(null);

  const hasPtsBinding = Boolean(tank?.ptsId && tank?.probeNumber);
  const isManualChart = chartType === "manual";

  const activeChartMeta = useMemo(
    () => CHART_TYPES.find((item) => item.id === chartType) || CHART_TYPES[0],
    [chartType]
  );

  const canViewGraph = (currentSnapshot?.records?.length || 0) > 1;

  const historyTotalPages = useMemo(
    () => Math.max(1, Math.ceil(historyTotalCount / historyPageSize)),
    [historyPageSize, historyTotalCount]
  );

  const getQualityBadge = (quality) => {
    switch (quality) {
      case "Good":
        return { cls: "m365-badge--success", icon: "fa-light fa-circle-check" };
      case "Acceptable":
        return { cls: "m365-badge--info", icon: "fa-light fa-circle-info" };
      case "Poor":
        return { cls: "m365-badge--danger", icon: "fa-light fa-triangle-exclamation" };
      default:
        return { cls: "m365-badge--neutral", icon: "fa-light fa-circle-question" };
    }
  };

  const loadHealth = useCallback(async () => {
    if (!tank?.id) {
      setHealthSummary(null);
      setVariances([]);
      return;
    }
    setLoadingHealth(true);
    try {
      const [healthResult, varianceResult] = await Promise.all([
        ptsConfigService.getTankCalibrationHealth(tank.id),
        ptsConfigService.getTankCalibrationVariances(tank.id, 20),
      ]);
      setHealthSummary(healthResult?.data || null);
      setVariances(Array.isArray(varianceResult?.data) ? varianceResult.data : []);
    } catch {
      setHealthSummary(null);
      setVariances([]);
    } finally {
      setLoadingHealth(false);
    }
  }, [tank?.id]);

  const applyCurrentSnapshot = useCallback(
    (snapshot) => {
      setCurrentSnapshot(snapshot);
      if (isManualChart) {
        setDraftRecords(sortRecords(snapshot?.records));
      }
    },
    [isManualChart]
  );

  const loadCurrentSnapshot = useCallback(async () => {
    if (!tank?.id || !hasPtsBinding) {
      setCurrentSnapshot(null);
      setDraftRecords([]);
      return;
    }

    setLoadingCurrent(true);
    try {
      const result = await ptsConfigService.getTankCalibrationCurrentSnapshot(tank.id, chartType);
      applyCurrentSnapshot(result?.data || null);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to load local calibration snapshot.");
      if (message.toLowerCase().includes("no local calibration snapshot")) {
        applyCurrentSnapshot(null);
        return;
      }

      console.error("[TankCalibration] loadCurrentSnapshot failed:", message, error);
      applyCurrentSnapshot(null);
      notify(message, "error", 4000);
    } finally {
      setLoadingCurrent(false);
    }
  }, [applyCurrentSnapshot, chartType, hasPtsBinding, tank?.id]);

  const loadHistory = useCallback(async () => {
    if (!tank?.id || !hasPtsBinding) {
      setHistoryRows([]);
      setHistoryTotalCount(0);
      return;
    }

    setLoadingHistory(true);
    try {
      const result = await ptsConfigService.getTankCalibrationHistory(
        tank.id,
        chartType,
        historyPageNumber,
        historyPageSize
      );

      setHistoryRows(Array.isArray(result?.data) ? result.data : []);
      setHistoryTotalCount(result?.pagination?.totalCount || 0);
    } catch (error) {
      setHistoryRows([]);
      setHistoryTotalCount(0);
      notify(getErrorMessage(error, "Failed to load calibration history."), "error", 4000);
    } finally {
      setLoadingHistory(false);
    }
  }, [chartType, hasPtsBinding, historyPageNumber, historyPageSize, tank?.id]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCurrentSnapshot(), loadHistory()]);
  }, [loadCurrentSnapshot, loadHistory]);

  useEffect(() => {
    setHistoryPageNumber(1);
    setSelectedHistorySnapshot(null);
    setEditorForm(emptyForm);
  }, [chartType, tank?.id]);

  useEffect(() => {
    loadCurrentSnapshot();
  }, [loadCurrentSnapshot]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const setFormValue = (field, value) => {
    setEditorForm((previous) => ({ ...previous, [field]: value }));
  };

  const hasValidEditorValues = Number.isFinite(Number(editorForm.height)) && Number.isFinite(Number(editorForm.volume));

  const normalizedRecord = useMemo(() => {
    if (!hasValidEditorValues) {
      return null;
    }

    return {
      height: Number(editorForm.height),
      volume: Number(editorForm.volume),
    };
  }, [editorForm.height, editorForm.volume, hasValidEditorValues]);

  const populateFormFromRecord = (record) => {
    setEditorForm({
      height: record?.height ?? null,
      volume: record?.volume ?? null,
    });
  };

  const upsertDraftRecord = () => {
    if (!normalizedRecord) {
      notify("Height and volume are required.", "warning", 3000);
      return;
    }

    setDraftRecords((previous) => {
      const filtered = previous.filter((item) => item.height !== normalizedRecord.height);
      return sortRecords([...filtered, normalizedRecord]);
    });
  };

  const removeDraftRecord = () => {
    if (!Number.isFinite(Number(editorForm.height))) {
      notify("Select or enter a height to remove from the draft.", "warning", 3000);
      return;
    }

    setDraftRecords((previous) => previous.filter((item) => item.height !== Number(editorForm.height)));
  };

  const resetDraft = () => {
    setDraftRecords(sortRecords(currentSnapshot?.records));
    setEditorForm(emptyForm);
  };

  const runMutation = async (work, successMessage) => {
    setSubmitting(true);
    try {
      const result = await work();
      if (!result?.isSuccess) {
        throw new Error(result?.message || successMessage);
      }

      notify(successMessage, "success", 2500);
      await refreshAll();
      return result;
    } catch (error) {
      notify(getErrorMessage(error, "Calibration operation failed."), "error", 4000);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    const result = await runMutation(
      () => ptsConfigService.syncTankCalibrationSnapshot(tank.id, { chartType, source: "manual-sync" }),
      `${activeChartMeta.label} synced from PTS.`
    );
    if (result?.data) {
      applyCurrentSnapshot(result.data);
    }
  };

  const handleGenerateAutomatic = async () => {
    await runMutation(
      () => ptsConfigService.generateTankCalibrationAutomaticChart(tank.id),
      "Automatic calibration chart generated and stored locally."
    );
  };

  const handleSetChart = async () => {
    if (!isManualChart) {
      return;
    }

    if (draftRecords.length === 0) {
      notify("Add at least one draft row before replacing the controller chart.", "warning", 3000);
      return;
    }

    await runMutation(
      () => ptsConfigService.setTankManualCalibrationChart(tank.id, draftRecords),
      "Manual calibration chart replaced on the controller."
    );
  };

  const handleAddDirect = async () => {
    if (!normalizedRecord) {
      notify("Height and volume are required.", "warning", 3000);
      return;
    }

    await runMutation(
      () => ptsConfigService.addTankManualCalibrationRecord(tank.id, normalizedRecord),
      `Manual calibration record added at ${normalizedRecord.height} mm.`
    );
  };

  const handleUpdateDirect = async () => {
    if (!normalizedRecord) {
      notify("Height and volume are required.", "warning", 3000);
      return;
    }

    await runMutation(
      () => ptsConfigService.editTankManualCalibrationRecord(tank.id, normalizedRecord),
      `Manual calibration record updated at ${normalizedRecord.height} mm.`
    );
  };

  const handleDeleteDirect = async () => {
    if (!Number.isFinite(Number(editorForm.height))) {
      notify("Select or enter a height to delete.", "warning", 3000);
      return;
    }

    const height = Number(editorForm.height);
    await runMutation(
      () => ptsConfigService.deleteTankManualCalibrationRecord(tank.id, height),
      `Manual calibration record deleted at ${height} mm.`
    );
  };

  const handleHistorySelection = async (event) => {
    const snapshotId = event?.data?.id;
    if (!snapshotId) {
      return;
    }

    setLoadingSnapshotDetail(true);
    try {
      const result = await ptsConfigService.getTankCalibrationSnapshotById(tank.id, snapshotId);
      setSelectedHistorySnapshot(result?.data || null);
    } catch (error) {
      setSelectedHistorySnapshot(null);
      notify(getErrorMessage(error, "Failed to load snapshot detail."), "error", 4000);
    } finally {
      setLoadingSnapshotDetail(false);
    }
  };

  const handleViewGraph = () => {
    if (!canViewGraph) {
      notify("Sync or load at least two calibration rows to view the graph.", "warning", 3000);
      return;
    }

    graphSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!tank) {
    return null;
  }

  return (
    <div className="m365-tank-calibration">
      <div className="m365-tank-calibration__header">
        <div>
          <h2 className="m365-tank-calibration__title">
            <i className="fa-light fa-flask-vial"></i>
            Calibration Workspace
          </h2>
          <p className="m365-tank-calibration__subtitle">
            Local history, PTS sync, and manual controller chart management for {tank.name}.
          </p>
        </div>
        <div className="m365-tank-calibration__binding">
          <span className="m365-badge m365-badge--info">PTS {tank.ptsId || "Unlinked"}</span>
          <span className="m365-badge m365-badge--neutral">Probe {tank.probeNumber || "-"}</span>
        </div>
      </div>

      {!hasPtsBinding && (
        <div className="m365-tank-calibration__empty">
          Link this tank to a PTS device and probe before using calibration sync or chart editing.
        </div>
      )}

      {hasPtsBinding && (
        <>
          <div className="m365-tank-calibration__tab-bar">
            <div className="m365-tabs">
              {CHART_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`m365-tab${chartType === item.id ? " m365-tab--active" : ""}`}
                  onClick={() => setChartType(item.id)}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="m365-tank-calibration__actions">
              <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setHelpOpen(true)} title="Calibration Help">
                <i className="fa-light fa-circle-question"></i>
              </button>
              <button type="button" className="m365-btn m365-btn--ghost" onClick={handleViewGraph}>
                <i className="fa-light fa-chart-line"></i>
                View Graph
              </button>
              <button type="button" className="m365-btn m365-btn--ghost" onClick={handleSync} disabled={submitting}>
                <i className="fa-light fa-arrows-rotate"></i>
                Sync From PTS
              </button>
              {chartType === "automatic" && (
                <button type="button" className="m365-btn m365-btn--primary" onClick={handleGenerateAutomatic} disabled={submitting}>
                  <i className="fa-light fa-wand-magic-sparkles"></i>
                  Generate Automatic
                </button>
              )}
              {isManualChart && (
                <button type="button" className="m365-btn m365-btn--primary" onClick={handleSetChart} disabled={submitting || draftRecords.length === 0}>
                  <i className="fa-light fa-upload"></i>
                  Set Controller Chart
                </button>
              )}
            </div>
          </div>

          <div className="m365-tank-calibration__summary-grid">
            <div className="m365-tank-calibration__summary-card">
              <span className="m365-tank-calibration__summary-label">Current Local Snapshot</span>
              <strong className="m365-tank-calibration__summary-value">{currentSnapshot?.totalRecords ?? 0} rows</strong>
              <span className="m365-tank-calibration__summary-meta">
                {currentSnapshot?.recordedAtUtc ? new Date(currentSnapshot.recordedAtUtc).toLocaleString() : "No local snapshot yet"}
              </span>
            </div>
            <div className="m365-tank-calibration__summary-card">
              <span className="m365-tank-calibration__summary-label">History</span>
              <strong className="m365-tank-calibration__summary-value">{historyTotalCount}</strong>
              <span className="m365-tank-calibration__summary-meta">Stored snapshots for {activeChartMeta.label.toLowerCase()}</span>
            </div>
            <div className="m365-tank-calibration__summary-card">
              <span className="m365-tank-calibration__summary-label">Source</span>
              <strong className="m365-tank-calibration__summary-value">{currentSnapshot?.source || "-"}</strong>
              <span className="m365-tank-calibration__summary-meta">Last operator: {currentSnapshot?.recordedBy || "System"}</span>
            </div>
          </div>

          {/* ── Calibration Health & Variance Analysis ── */}
          <div className="m365-tank-calibration__panel-card">
            <div className="m365-tank-calibration__section-heading">
              <h3>
                <i className="fa-light fa-heart-pulse"></i>{" "}
                Calibration Health
              </h3>
              <span>{loadingHealth ? "Loading..." : ""}</span>
            </div>

            {healthSummary ? (
              <>
                <div className="m365-tank-calibration__health-grid">
                  <div className="m365-tank-calibration__health-card">
                    <span className="m365-tank-calibration__health-label">Overall Quality</span>
                    <span className={`m365-badge ${getQualityBadge(healthSummary.overallQuality).cls}`}>
                      <i className={getQualityBadge(healthSummary.overallQuality).icon}></i>{" "}
                      {healthSummary.overallQuality}
                    </span>
                  </div>
                  <div className="m365-tank-calibration__health-card">
                    <span className="m365-tank-calibration__health-label">Avg Variance</span>
                    <strong className="m365-tank-calibration__health-value">
                      {healthSummary.averageVariancePercent != null
                        ? `${healthSummary.averageVariancePercent.toFixed(2)}%`
                        : "N/A"}
                    </strong>
                  </div>
                  <div className="m365-tank-calibration__health-card">
                    <span className="m365-tank-calibration__health-label">Deliveries Analysed</span>
                    <strong className="m365-tank-calibration__health-value">
                      {healthSummary.analysedDeliveryCount}
                    </strong>
                  </div>
                  <div className="m365-tank-calibration__health-card">
                    <span className="m365-tank-calibration__health-label">Last Sync</span>
                    <strong className="m365-tank-calibration__health-value">
                      {healthSummary.lastSyncUtc
                        ? new Date(healthSummary.lastSyncUtc).toLocaleString()
                        : "Never"}
                    </strong>
                    <span className="m365-tank-calibration__health-meta">
                      {healthSummary.lastSyncSource || ""}
                    </span>
                  </div>
                </div>

                {healthSummary.recommendRecalibration && (
                  <div className="m365-tank-calibration__recommendation">
                    <i className="fa-light fa-triangle-exclamation"></i>
                    <div>
                      <strong>Recalibration Recommended</strong>
                      {healthSummary.recommendationNotes && (
                        <p>{healthSummary.recommendationNotes}</p>
                      )}
                    </div>
                  </div>
                )}

                {variances.length > 0 && (
                  <div className="m365-tank-calibration__variance-section">
                    <div className="m365-tank-calibration__section-heading">
                      <h4>Recent Delivery Variances</h4>
                      <span>{variances.length} deliveries</span>
                    </div>
                    <DataGrid
                      dataSource={variances}
                      keyExpr="deliveryId"
                      showBorders={false}
                      showRowLines
                      hoverStateEnabled
                      noDataText="No variance data available"
                    >
                      <FilterRow visible />
                      <SearchPanel visible placeholder="Search variances..." />
                      <Paging defaultPageSize={10} />
                      <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo />
                      <Column dataField="windowStartUtc" caption="Start" dataType="datetime" width={160} />
                      <Column dataField="windowEndUtc" caption="End" dataType="datetime" width={160} />
                      <Column dataField="measuredDelta" caption="Measured Δ" dataType="number" format="#,##0.00" width={120} />
                      <Column dataField="dispensedDelta" caption="Dispensed Δ" dataType="number" format="#,##0.00" width={120} />
                      <Column dataField="variance" caption="Variance" dataType="number" format="#,##0.00" width={110} />
                      <Column
                        dataField="variancePercent"
                        caption="Variance %"
                        dataType="number"
                        format="#,##0.00'%'"
                        width={110}
                      />
                      <Column
                        dataField="quality"
                        caption="Quality"
                        width={110}
                        cellRender={(cellData) => {
                          const badge = getQualityBadge(cellData.value);
                          return <span className={`m365-badge ${badge.cls}`}>{cellData.value}</span>;
                        }}
                      />
                    </DataGrid>
                  </div>
                )}
              </>
            ) : (
              <div className="m365-tank-calibration__empty">
                {loadingHealth ? "Analysing calibration health..." : "No calibration health data available. Sync calibration data and record deliveries to generate analysis."}
              </div>
            )}
          </div>

          {isManualChart && (
            <div className="m365-tank-calibration__editor-card">
              <div className="m365-tank-calibration__editor-header">
                <div>
                  <h3>Manual Chart Editor</h3>
                  <p>Work on a local draft, then push the full chart to the controller, or apply direct add/edit/delete operations.</p>
                </div>
                <div className="m365-tank-calibration__editor-actions">
                  <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={() => setHelpOpen(true)} title="Calibration Help">
                    <i className="fa-light fa-circle-question"></i>
                  </button>
                  <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={resetDraft}>
                    <i className="fa-light fa-arrow-rotate-left"></i>
                    Reset Draft
                  </button>
                </div>
              </div>

              <div className="m365-tank-calibration__editor-split">
                <div className="m365-tank-calibration__editor-controls">
                  <div className="m365-tank-calibration__editor-grid">
                    <div className="m365-tank-calibration__field">
                      <label>Height (mm)</label>
                      <NumberBox value={editorForm.height} onValueChanged={(event) => setFormValue("height", event.value)} showSpinButtons min={1} />
                    </div>
                    <div className="m365-tank-calibration__field">
                      <label>Volume</label>
                      <NumberBox value={editorForm.volume} onValueChanged={(event) => setFormValue("volume", event.value)} showSpinButtons min={0} />
                    </div>
                  </div>

                  <div className="m365-tank-calibration__editor-btn-group">
                    <span className="m365-tank-calibration__btn-group-label">Draft</span>
                    <div className="m365-tank-calibration__editor-buttons">
                      <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={upsertDraftRecord}>
                        <i className="fa-light fa-layer-plus"></i>
                        Upsert
                      </button>
                      <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={removeDraftRecord}>
                        <i className="fa-light fa-layer-minus"></i>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="m365-tank-calibration__editor-btn-group">
                    <span className="m365-tank-calibration__btn-group-label">Direct to Controller</span>
                    <div className="m365-tank-calibration__editor-buttons">
                      <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={handleAddDirect} disabled={submitting}>
                        <i className="fa-light fa-circle-plus"></i>
                        Add
                      </button>
                      <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={handleUpdateDirect} disabled={submitting}>
                        <i className="fa-light fa-pen"></i>
                        Update
                      </button>
                      <button type="button" className="m365-btn m365-btn--sm m365-btn--ghost" onClick={handleDeleteDirect} disabled={submitting}>
                        <i className="fa-light fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="m365-tank-calibration__draft-grid">
                  <div className="m365-tank-calibration__section-heading">
                    <h4>Draft Rows</h4>
                    <span>{draftRecords.length} rows</span>
                  </div>
                  <DataGrid
                    dataSource={draftRecords}
                    keyExpr="height"
                    showBorders={false}
                    showRowLines
                    hoverStateEnabled
                    noDataText="No draft rows yet"
                    onRowClick={(event) => populateFormFromRecord(event.data)}
                    height={280}
                  >
                    <Paging defaultPageSize={10} />
                    <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo />
                    <Column dataField="height" caption="Height (mm)" dataType="number" width={120} />
                    <Column dataField="volume" caption="Volume" dataType="number" width={120} />
                  </DataGrid>
                </div>
              </div>
            </div>
          )}

          {canViewGraph && (
            <div ref={graphSectionRef} className="m365-tank-calibration__panel-card">
              <div className="m365-tank-calibration__section-heading">
                <h3><i className="fa-light fa-chart-line"></i> Calibration Curve</h3>
                <span>Height (mm) vs Volume</span>
              </div>
              <Chart
                dataSource={currentSnapshot.records}
                height={300}
              >
                <CommonSeriesSettings type="spline" />
                <Series
                  valueField="volume"
                  argumentField="height"
                  name="Volume"
                  color="#0078d4"
                />
                <ArgumentAxis title="Height (mm)" />
                <ValueAxis title="Volume" />
                <Tooltip enabled shared format="#,##0.00" />
                <Legend visible={false} />
              </Chart>
            </div>
          )}

          <div className="m365-tank-calibration__content-grid">
            <div className="m365-tank-calibration__panel-card">
              <div className="m365-tank-calibration__section-heading">
                <h3>Current Local Snapshot</h3>
                <span>{loadingCurrent ? "Loading..." : `${currentSnapshot?.records?.length || 0} rows`}</span>
              </div>

              <DataGrid
                dataSource={currentSnapshot?.records || []}
                keyExpr="height"
                showBorders={false}
                showRowLines
                hoverStateEnabled
                noDataText="No local snapshot available"
                onRowClick={(event) => isManualChart && populateFormFromRecord(event.data)}
              >
                <FilterRow visible />
                <SearchPanel visible placeholder="Search current snapshot..." />
                <Paging defaultPageSize={20} />
                <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50, 100]} showInfo />
                <Column dataField="height" caption="Height (mm)" dataType="number" width={140} />
                <Column dataField="volume" caption="Volume" dataType="number" width={140} />
                <Column dataField="passesNumber" caption="Passes" dataType="number" width={120} visible={chartType === "interval-volume"} />
              </DataGrid>
            </div>

            <div className="m365-tank-calibration__panel-card">
              <div className="m365-tank-calibration__section-heading">
                <h3>Local History</h3>
                <span>{loadingHistory ? "Loading..." : `${historyTotalCount} snapshots`}</span>
              </div>

              <DataGrid
                dataSource={historyRows}
                keyExpr="id"
                showBorders={false}
                showRowLines
                hoverStateEnabled
                noDataText="No calibration history stored yet"
                onRowClick={handleHistorySelection}
              >
                <SearchPanel visible placeholder="Search history..." />
                <Column dataField="recordedAtUtc" caption="Recorded" dataType="datetime" width={170} />
                <Column dataField="source" caption="Source" width={130} />
                <Column dataField="totalRecords" caption="Rows" dataType="number" width={80} />
                <Column dataField="recordedBy" caption="Recorded By" width={140} />
                <Column dataField="notes" caption="Notes" minWidth={180} />
              </DataGrid>

              <div className="m365-tank-calibration__history-pager">
                <div className="m365-tank-calibration__history-pager-info">
                  Page {historyPageNumber} of {historyTotalPages}
                </div>
                <div className="m365-tank-calibration__history-pager-actions">
                  <label>
                    Page size
                    <select value={historyPageSize} onChange={(event) => setHistoryPageSize(Number(event.target.value))}>
                      {[5, 10, 20, 50].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="m365-btn m365-btn--ghost"
                    onClick={() => setHistoryPageNumber((current) => Math.max(1, current - 1))}
                    disabled={historyPageNumber <= 1}
                  >
                    <i className="fa-light fa-chevron-left"></i>
                    Previous
                  </button>
                  <button
                    type="button"
                    className="m365-btn m365-btn--ghost"
                    onClick={() => setHistoryPageNumber((current) => Math.min(historyTotalPages, current + 1))}
                    disabled={historyPageNumber >= historyTotalPages}
                  >
                    Next
                    <i className="fa-light fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="m365-tank-calibration__panel-card">
            <div className="m365-tank-calibration__section-heading">
              <h3>Selected Snapshot Detail</h3>
              <span>
                {loadingSnapshotDetail
                  ? "Loading..."
                  : selectedHistorySnapshot?.recordedAtUtc
                    ? new Date(selectedHistorySnapshot.recordedAtUtc).toLocaleString()
                    : "Select a history row"}
              </span>
            </div>

            {selectedHistorySnapshot ? (
              <>
                <div className="m365-tank-calibration__detail-meta">
                  <span className="m365-badge m365-badge--info">{selectedHistorySnapshot.source}</span>
                  <span className="m365-badge m365-badge--neutral">{selectedHistorySnapshot.totalRecords} rows</span>
                  <span className="m365-tank-calibration__detail-notes">{selectedHistorySnapshot.notes || "No notes"}</span>
                </div>

                <DataGrid
                  dataSource={selectedHistorySnapshot.records || []}
                  keyExpr="height"
                  showBorders={false}
                  showRowLines
                  hoverStateEnabled
                  noDataText="No rows in selected snapshot"
                >
                  <Paging defaultPageSize={20} />
                  <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50, 100]} showInfo />
                  <Column dataField="height" caption="Height (mm)" dataType="number" width={140} />
                  <Column dataField="volume" caption="Volume" dataType="number" width={140} />
                  <Column dataField="passesNumber" caption="Passes" dataType="number" width={120} visible={selectedHistorySnapshot.chartType === "interval-volume"} />
                </DataGrid>
              </>
            ) : (
              <div className="m365-tank-calibration__empty">Choose a history row to inspect the stored snapshot records.</div>
            )}
          </div>
        </>
      )}

      {/* ── Help Panel ── */}
      <SlidePanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Calibration Help"
        width={560}
      >
        <div className="m365-tank-calibration__help">
          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-layer-group"></i> Chart Types</h4>
            <dl>
              <dt>Manual Chart</dt>
              <dd>A height-to-volume lookup table you build and maintain by hand. Each row maps a fuel level height (mm) to the known volume (litres) at that height. You create, edit, or delete individual rows using the Draft or Direct buttons, then push the full chart to the PTS controller using the <strong>Set Controller Chart</strong> button in the toolbar.</dd>
              <dt>Interval Volume</dt>
              <dd>Generated by the PTS probe during deliveries. The probe measures volume changes at fixed height intervals and records the number of measurement passes per point. More passes = higher accuracy. This chart is read-only — you can only sync it from the device.</dd>
              <dt>Automatic Chart</dt>
              <dd>The PTS controller builds this chart automatically over time using delivery data. Click "Generate Automatic" to instruct the controller to compute it, then the result is synced back into local history.</dd>
            </dl>
          </section>

          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-arrows-rotate"></i> Toolbar Buttons</h4>
            <dl>
              <dt>Sync From PTS</dt>
              <dd>Reads the currently active calibration chart from the physical PTS controller/probe and stores a copy in the local database. This creates a new history snapshot. Use this to keep your local records in sync with what is actually on the device.</dd>
              <dt>Set Controller Chart <span className="m365-badge m365-badge--info">Manual only</span></dt>
              <dd>Pushes your entire draft chart (all rows in the Draft Rows grid) to the PTS controller, replacing whatever chart is currently on the device. After the push, a sync is performed automatically so the local snapshot matches.</dd>
              <dt>Generate Automatic <span className="m365-badge m365-badge--info">Automatic only</span></dt>
              <dd>Instructs the PTS controller to compute a new automatic calibration chart from its collected delivery data. The generated chart is then synced into local history.</dd>
            </dl>
          </section>

          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-pen-ruler"></i> Manual Chart Editor</h4>
            <p>Two workflows are available for manual charts:</p>
            <h5>Draft Workflow (local only — no device communication)</h5>
            <dl>
              <dt>Upsert</dt>
              <dd>Adds the height/volume pair to the in-memory draft. If a row with that height already exists, it is replaced. Nothing is sent to the controller until you click "Set Controller Chart".</dd>
              <dt>Remove</dt>
              <dd>Removes the row matching the entered height from the draft. Local only.</dd>
              <dt>Reset Draft</dt>
              <dd>Discards all draft changes and reloads the draft from the current local snapshot.</dd>
            </dl>
            <h5>Direct Workflow (immediate controller operations)</h5>
            <dl>
              <dt>Add</dt>
              <dd>Sends the height/volume pair to the PTS controller immediately to add a new calibration record. The local snapshot is refreshed afterward.</dd>
              <dt>Update</dt>
              <dd>Updates an existing record on the PTS controller at the entered height with the new volume. The local snapshot is refreshed afterward.</dd>
              <dt>Delete</dt>
              <dd>Deletes the record at the entered height from the PTS controller. The local snapshot is refreshed afterward.</dd>
            </dl>
          </section>

          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-heart-pulse"></i> Calibration Health</h4>
            <dl>
              <dt>How is it calculated?</dt>
              <dd>The system compares recent fuel deliveries against the calibration chart. For each delivery, it calculates the difference between the volume change measured by the probe and the actual dispensed amount. The average of these variances determines the overall quality rating:</dd>
            </dl>
            <ul>
              <li><span className="m365-badge m365-badge--success">Good</span> — Average variance ≤ 2%</li>
              <li><span className="m365-badge m365-badge--info">Acceptable</span> — Average variance ≤ 5%</li>
              <li><span className="m365-badge m365-badge--danger">Poor</span> — Average variance &gt; 5% (recalibration recommended)</li>
              <li><span className="m365-badge m365-badge--neutral">Insufficient</span> — Not enough delivery data to calculate</li>
            </ul>
          </section>

          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-database"></i> Data Sections</h4>
            <dl>
              <dt>Current Local Snapshot</dt>
              <dd>The most recent copy of the calibration chart stored in the local database for the selected chart type. If this is empty, click "Sync From PTS" to pull the chart from the device. Click any row to load it into the editor inputs (manual chart only).</dd>
              <dt>Local History</dt>
              <dd>Every time a sync or chart push happens, a timestamped snapshot is saved. History lets you review past chart versions, compare changes, and audit who modified the chart and when. Each chart type (manual, interval volume, automatic) has its own history trail.</dd>
              <dt>Selected Snapshot Detail</dt>
              <dd>Click any row in Local History to view the full records of that past snapshot. This is a read-only inspection view.</dd>
              <dt>Source</dt>
              <dd>Indicates how the snapshot was created — "manual-sync" (user clicked Sync), "set-chart" (user pushed a manual chart), "auto-generate" (automatic chart generation), or "system" (background sync).</dd>
            </dl>
          </section>

          <section className="m365-tank-calibration__help-section">
            <h4><i className="fa-light fa-circle-question"></i> Why are grids empty?</h4>
            <dl>
              <dt>Current Local Snapshot shows "No local snapshot available"</dt>
              <dd>No sync has been performed yet for this chart type. Click "Sync From PTS" to pull the current chart from the controller.</dd>
              <dt>Selected Snapshot Detail shows "Select a history row"</dt>
              <dd>This grid populates when you click a row in the Local History list. It shows the full records of that historical snapshot.</dd>
              <dt>Draft Rows shows "No draft rows yet"</dt>
              <dd>The draft starts from the current local snapshot. If no snapshot exists, the draft is also empty. Sync first, or manually add rows using the Height/Volume inputs.</dd>
            </dl>
          </section>
        </div>
      </SlidePanel>
    </div>
  );
};

export default TankCalibrationPanel;