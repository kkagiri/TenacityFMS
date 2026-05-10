/**
 * File:          TankHistoryPanel.js
 * Purpose:       Tank history panel with date filter, DataGrid, chart toggle, and
 *                Excel export.  Rendered inside a SlidePanel.
 * Dependencies:  devextreme-react (DataGrid, DateBox), exceljs, TankHistoryChart
 * Last Modified: 2026-02-26
 *
 * Props:
 * - tankId   (number): Active tank id
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataGrid,
  Column,
  Paging,
  Pager,
  SearchPanel,
  Export,
  FilterRow,
  HeaderFilter,
  FilterPanel,
} from "devextreme-react/data-grid";
import { DateBox } from "devextreme-react/date-box";
import notify from "devextreme/ui/notify";
import { Workbook } from "exceljs";
import saveAs from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import { fetchTankVolumeHistoryFiltered } from "../../../redux/actions/tankVolumeHistoryActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import TankHistoryChart from "./TankHistoryChart";

/* ── reason enum ── */
const REASONS = [
  { id: 0, name: "Opening Stock" },
  { id: 1, name: "Closing Stock" },
  { id: 2, name: "Delivery" },
  { id: 3, name: "Transfer In" },
  { id: 4, name: "Transfer Out" },
  { id: 5, name: "Adjustment" },
  { id: 6, name: "Dispensing" },
];

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const TankHistoryPanel = ({ tankId }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.user);
  const gridRef = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(todayStart);
  const [endDate, setEndDate] = useState(() => new Date());
  const [view, setView] = useState("table"); // "table" | "chart"

  useEffect(() => {
    dispatch(fetchUsers()).catch((err) => {
      const status = err?.status;
      const msg = (err?.message || '').toLowerCase();
      const isPermissionError =
        status === 401 || status === 403 ||
        msg.includes('access') || msg.includes('permission') || msg.includes('forbidden') || msg.includes('unauthorized');
      if (isPermissionError) {
        notify('Access denied. Insufficient permissions.', 'error', 4000);
      }
      // other errors: silently ignore — Recorded By column will show "-"
    });
  }, [dispatch]);

  /* ── fetch ── */
  const fetchHistory = useCallback(async () => {
    if (!tankId) return;
    setLoading(true);
    try {
      const result = await dispatch(
        fetchTankVolumeHistoryFiltered({
          tankId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeVehicleNames: true,
          take: 500,
        })
      );

      let rows = [];
      if (Array.isArray(result)) rows = result;
      else if (result?.data && Array.isArray(result.data)) rows = result.data;
      else if (result?.success && result.data) rows = result.data;
      else notify(result?.message || "Error fetching history", "error");

      setData(rows || []);
    } catch (err) {
      notify("Error fetching tank history", "error");
    } finally {
      setLoading(false);
    }
  }, [dispatch, tankId, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ── quick ranges ── */
  const setRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
  };

  const applyFilter = () => {
    if (startDate > endDate) {
      notify("Start date must be before end date", "warning");
      return;
    }
    fetchHistory();
  };

  /* ── cell renderers ── */
  const fmtDate = (c) => {
    if (!c.value) return "-";
    const d = new Date(c.value);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
    ).toLocaleString();
  };

  const reasonRender = (c) => {
    const r = REASONS.find((x) => x.id === c.value);
    if (r) {
      if (r.name === "Dispensing" && c.data.vehicleName) return `${r.name} - ${c.data.vehicleName}`;
      return r.name;
    }
    return c.value || "-";
  };

  const changeRender = (c) => {
    const v = c.value || 0;
    const color = v > 0 ? "#10b981" : v < 0 ? "#ef4444" : "#6b7280";
    return (
      <span style={{ color, fontWeight: 600 }}>
        {v > 0 && <i className="fa-light fa-arrow-up" style={{ marginRight: 4, fontSize: 12 }} />}
        {v < 0 && <i className="fa-light fa-arrow-down" style={{ marginRight: 4, fontSize: 12 }} />}
        {v > 0 ? "+" : ""}
        {v.toFixed(2)} L
      </span>
    );
  };

  const userRender = (c) => {
    if (c.value?.trim()) return <span>{c.value}</span>;
    if (c.data?.recordedBy) {
      const u = users?.find((x) => x.id === c.data.recordedBy);
      return <span>{u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "-"}</span>;
    }
    return <span>-</span>;
  };

  /* ── export ── */
  const onExporting = (e) => {
    const wb = new Workbook();
    const ws = wb.addWorksheet("Tank History");
    exportDataGrid({
      component: gridRef.current.instance,
      worksheet: ws,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.column.dataField === "changeReason") {
          const r = REASONS.find((x) => x.id === gridCell.value);
          if (r) excelCell.value = r.name;
        }
        if (gridCell.column.dataField === "timestamp" && gridCell.value) {
          excelCell.value = new Date(gridCell.value).toLocaleString();
        }
      },
    }).then(() => {
      wb.xlsx.writeBuffer().then((buf) => {
        saveAs(new Blob([buf], { type: "application/octet-stream" }), `tank_history_${tankId}.xlsx`);
      });
    });
    e.cancel = true;
  };

  return (
    <div className="m365-tank-history">
      {/* ── Filter Bar ── */}
      <div className="m365-tank-history__filter">
        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="m365-field__label tw-mb-0 tw-whitespace-nowrap">From:</label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              type="datetime"
              width={180}
              displayFormat="MMM dd, yyyy HH:mm"
              height={34}
              stylingMode="outlined"
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="m365-field__label tw-mb-0 tw-whitespace-nowrap">To:</label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              type="datetime"
              width={180}
              displayFormat="MMM dd, yyyy HH:mm"
              height={34}
              stylingMode="outlined"
            />
          </div>
          <button className="m365-btn m365-btn--primary" onClick={applyFilter}>
            <i className="fa-light fa-check" /> Apply
          </button>
          <span className="m365-cmd-divider" />
          <button className="m365-btn m365-btn--ghost" onClick={() => { setStartDate(todayStart()); setEndDate(new Date()); }}>Today</button>
          <button className="m365-btn m365-btn--ghost" onClick={() => setRange(7)}>7 Days</button>
          <button className="m365-btn m365-btn--ghost" onClick={() => setRange(30)}>30 Days</button>
        </div>

        <div className="tw-flex tw-gap-1 tw-mt-2">
          <button
            className={`m365-btn ${view === "table" ? "m365-btn--primary" : "m365-btn--ghost"}`}
            onClick={() => setView("table")}
          >
            <i className="fa-light fa-table" /> Table
          </button>
          <button
            className={`m365-btn ${view === "chart" ? "m365-btn--primary" : "m365-btn--ghost"}`}
            onClick={() => setView("chart")}
          >
            <i className="fa-light fa-chart-line" /> Chart
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <i className="fa-light fa-spinner fa-spin tw-text-3xl" style={{ color: "var(--m365-primary)" }} />
        </div>
      )}

      {/* ── Content ── */}
      {!loading && view === "table" && (
        <DataGrid
          ref={gridRef}
          dataSource={data}
          showBorders={false}
          columnAutoWidth
          showRowLines
          hoverStateEnabled
          noDataText="No tank history available"
          onExporting={onExporting}
          allowColumnResizing
        >
          <FilterPanel visible />
          <HeaderFilter visible />
          <FilterRow visible />
          <SearchPanel visible placeholder="Search history..." />
          <Export enabled />
          <Paging defaultPageSize={20} />
          <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50, 100]} showInfo />
          <Column dataField="timestamp" caption="Date/Time" dataType="datetime" sortOrder="desc" width={180} cellRender={fmtDate} />
          <Column dataField="newVolume" caption="Volume (L)" dataType="number" format="#,##0.00" width={120} />
          <Column dataField="volumeChange" caption="Change (L)" dataType="number" width={140} cellRender={changeRender} />
          <Column dataField="changeReason" caption="Type" width={150} cellRender={reasonRender} />
          <Column dataField="vehicleName" caption="Vehicle" width={150} cellRender={(c) => <span>{c.value || "-"}</span>} />
          <Column dataField="recordedByUserName" caption="Recorded By" width={150} cellRender={userRender} />
        </DataGrid>
      )}

      {!loading && view === "chart" && <TankHistoryChart dataSource={data} />}
    </div>
  );
};

export default TankHistoryPanel;
