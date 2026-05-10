/**
 * File: EmployeeDashboard.js
 * Purpose: Employee module KPIs and operational overview — M365 Admin Fluent theme.
 * Last Modified: 2026-03-03
 */

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchEmployees } from "../../../redux/actions/employeeActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import ModuleDashboard from '../../../components/dashboard/ModuleDashboard';

/* ══════════════════════════════════════════════
   PAGINATED TABLE
   ══════════════════════════════════════════════ */
const FluentTable = ({ columns, data, pageSize = 5, keyField = "id" }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const sliced = data.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => { setPage(0); }, [data]);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #edebe9" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  textAlign: col.align || "left", padding: "10px 12px",
                  fontWeight: 600, fontSize: 12, color: "#605e5c",
                  textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap",
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sliced.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: "32px 12px", color: "#a19f9d", fontSize: 13 }}>
                  No data available.
                </td>
              </tr>
            ) : sliced.map((row, idx) => (
              <tr key={row[keyField] ?? idx}
                style={{ borderBottom: "1px solid #edebe9", transition: "background-color .15s" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f3f2f1")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{
                    padding: "10px 12px", textAlign: col.align || "left",
                    color: "#201f1e", whiteSpace: col.nowrap ? "nowrap" : "normal",
                  }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 4, padding: "12px 0 4px", fontSize: 12, color: "#605e5c",
        }}>
          <span style={{ marginRight: 8 }}>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length}
          </span>
          <PagerBtn label="‹" disabled={page === 0} onClick={() => setPage(page - 1)} />
          <PagerBtn label="›" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} />
        </div>
      )}
    </div>
  );
};

const PagerBtn = ({ label, disabled, onClick }) => (
  <button disabled={disabled} onClick={onClick} style={{
    width: 28, height: 28, border: "1px solid #c8c6c4", borderRadius: 4,
    backgroundColor: disabled ? "#f3f2f1" : "#fff",
    color: disabled ? "#a19f9d" : "#201f1e",
    cursor: disabled ? "default" : "pointer",
    fontWeight: 600, fontSize: 14,
    fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "background-color .15s",
  }}
    onMouseOver={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#f3f2f1"; }}
    onMouseOut={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#fff"; }}
  >
    {label}
  </button>
);

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const map = {
    active:     { bg: "#dff6dd", color: "#107c10", label: "Active" },
    terminated: { bg: "#fde7e9", color: "#d13438", label: "Terminated" },
  };
  const cfg = map[s] || { bg: "#f3f2f1", color: "#605e5c", label: status || "—" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 10,
      backgroundColor: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 500,
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
    }}>
      {cfg.label}
    </span>
  );
};

const MetricCard = ({ title, value, icon, iconBg, iconColor, borderColor }) => (
  <div style={{
    backgroundColor: "#fff", borderRadius: 8,
    border: "1px solid #edebe9", borderTop: `3px solid ${borderColor}`,
    padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
    transition: "box-shadow .15s, border-color .15s", cursor: "default",
  }}
    onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#c8c6c4"; }}
    onMouseOut={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#edebe9"; e.currentTarget.style.borderTopColor = borderColor; }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: "50%", backgroundColor: iconBg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontSize: 16, color: iconColor,
    }}>
      <i className={icon} />
    </div>
    <div>
      <div style={{
        fontSize: 12, fontWeight: 500, color: "#605e5c",
        textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 2,
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      }}>{title}</div>
      <div style={{
        fontSize: 26, fontWeight: 700, color: "#201f1e", lineHeight: 1.1,
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      }}>{value}</div>
    </div>
  </div>
);

const SectionCard = ({ title, icon, iconColor = "#0078d4", children }) => (
  <div style={{
    backgroundColor: "#fff", borderRadius: 8,
    border: "1px solid #edebe9", overflow: "hidden",
  }}>
    <div style={{
      padding: "12px 16px", borderBottom: "1px solid #edebe9",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <i className={icon} style={{ fontSize: 15, color: iconColor }} />
      <h3 style={{
        margin: 0, fontSize: 14, fontWeight: 600, color: "#201f1e",
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      }}>{title}</h3>
    </div>
    <div style={{ padding: "16px" }}>{children}</div>
  </div>
);

const SiteBar = ({ name, count, max }) => {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", marginBottom: 4,
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#201f1e" }}>{name}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0078d4" }}>{count}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, backgroundColor: "#edebe9", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: "linear-gradient(90deg, #0078d4, #b4d6fa)",
          transition: "width .6s ease",
        }} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector((state) => state.employee?.employees || []);
  const employeeLoading = useSelector((state) => state.employee?.loading);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const sites = useSelector((state) => state.site?.sites || []);

  useEffect(() => {
    dispatch(fetchEmployees(false));
    dispatch(fetchVehicleList());
    dispatch(fetchSiteList());
  }, [dispatch]);

  const dd = useMemo(() => {
    const total      = employees.length;
    const active     = employees.filter((e) => (e.employeestatus || "").toLowerCase() === "active").length;
    const terminated = employees.filter((e) => (e.employeestatus || "").toLowerCase() === "terminated").length;
    const assigned   = employees.filter((e) => Array.isArray(e.vehicles) && e.vehicles.length > 0).length;
    const unassigned = total - assigned;
    const assignedVehicles = new Set(
      employees.filter((e) => Array.isArray(e.vehicles)).flatMap((e) => e.vehicles)
    ).size;
    const uniqueSites = new Set(employees.filter((e) => e.siteId).map((e) => e.siteId)).size;

    const siteMap = new Map(sites.map((s) => [s.id, s.name]));
    const siteDist = Object.values(
      employees.reduce((acc, e) => {
        const name = siteMap.get(e.siteId) || "Unassigned";
        if (!acc[name]) acc[name] = { siteName: name, count: 0 };
        acc[name].count += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.count - a.count);

    const topAssignments = [...employees]
      .map((e) => ({ ...e, vCount: Array.isArray(e.vehicles) ? e.vehicles.length : 0 }))
      .sort((a, b) => b.vCount - a.vCount).slice(0, 10);

    const recentUpdates = [...employees]
      .map((e) => ({ ...e, sortDate: e.dateModified || e.dateCreated }))
      .filter((e) => !!e.sortDate)
      .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate)).slice(0, 10);

    return { total, active, terminated, assigned, unassigned, assignedVehicles, uniqueSites, siteDist, topAssignments, recentUpdates };
  }, [employees, sites]);

  const maxSiteCount = useMemo(() => Math.max(1, ...dd.siteDist.map((s) => s.count)), [dd.siteDist]);

  /* ── Loading state ── */
  if (employeeLoading) {
    return (
      <div style={{
        height: 420, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
        color: "#605e5c", fontSize: 13,
      }}>
        <i className="fa-light fa-spinner fa-spin" style={{ fontSize: 28, color: "#0078d4" }} />
        Loading employee data…
      </div>
    );
  }

  const metrics = [
    { title: "Total Employees",   value: dd.total,            icon: "fa-light fa-users",       iconColor: "#0078d4", iconBg: "#deecf9", borderColor: "#0078d4" },
    { title: "Active",            value: dd.active,           icon: "fa-light fa-user-check",  iconColor: "#107c10", iconBg: "#dff6dd", borderColor: "#107c10" },
    { title: "Terminated",        value: dd.terminated,       icon: "fa-light fa-user-minus",  iconColor: "#d13438", iconBg: "#fde7e9", borderColor: "#d13438" },
    { title: "Assigned Vehicles", value: dd.assignedVehicles, icon: "fa-light fa-car",         iconColor: "#ca5010", iconBg: "#fff4ce", borderColor: "#ca5010" },
    { title: "Assigned",          value: dd.assigned,         icon: "fa-light fa-id-card",     iconColor: "#0078d4", iconBg: "#deecf9", borderColor: "#0078d4" },
    { title: "Unassigned",        value: dd.unassigned,       icon: "fa-light fa-user-clock",  iconColor: "#605e5c", iconBg: "#f3f2f1", borderColor: "#a19f9d" },
    { title: "Total Vehicles",    value: vehicles.length,     icon: "fa-light fa-truck",       iconColor: "#3949ab", iconBg: "#e8eaf6", borderColor: "#3949ab" },
    { title: "Sites With Staff",  value: dd.uniqueSites,      icon: "fa-light fa-location-dot",iconColor: "#00796b", iconBg: "#e0f2f1", borderColor: "#00796b" },
  ];

  const assignmentCols = [
    { key: "fullName",       header: "Employee", nowrap: true },
    { key: "employeeWorkNo", header: "Work No",  nowrap: true },
    { key: "vCount", header: "Vehicles", align: "center",
      render: (row) => (
        <span style={{
          display: "inline-block", minWidth: 24, textAlign: "center",
          padding: "2px 8px", borderRadius: 10,
          backgroundColor: row.vCount > 0 ? "#deecf9" : "#f3f2f1",
          color: row.vCount > 0 ? "#0078d4" : "#a19f9d",
          fontWeight: 600, fontSize: 11,
        }}>{row.vCount}</span>
      ),
    },
    { key: "employeestatus", header: "Status",
      render: (row) => <StatusBadge status={row.employeestatus} />,
    },
  ];

  const recentCols = [
    { key: "fullName",            header: "Employee", nowrap: true },
    { key: "employeephoneNumber", header: "Phone",    nowrap: true },
    { key: "employeestatus", header: "Status",
      render: (row) => <StatusBadge status={row.employeestatus} />,
    },
    { key: "sortDate", header: "Last Updated", nowrap: true,
      render: (row) => {
        if (!row.sortDate) return "—";
        return new Date(row.sortDate).toLocaleString("en-GB", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: false,
        });
      },
    },
    { key: "_action", header: "", align: "right",
      render: (row) => (
        <button onClick={() => navigate(`/employees/${row.id}/details`)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", border: "none", borderRadius: 4,
            backgroundColor: "transparent", color: "#0078d4",
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            cursor: "pointer", transition: "background-color .15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#deecf9")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          View <i className="fa-light fa-arrow-right" style={{ fontSize: 12 }} />
        </button>
      ),
    },
  ];

  return (
    <div style={{
      fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
      color: "#201f1e", backgroundColor: "#faf9f8", minHeight: "100vh",
    }}>
      {/* ── Page Header ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
        padding: "8px 24px", backgroundColor: "#fff",
        borderBottom: "1px solid #edebe9",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="fa-light fa-users" style={{ fontSize: 16, color: "#0078d4" }} />
          <h2 style={{
            margin: 0, fontSize: 16, fontWeight: 600, color: "#201f1e",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            Employee Operations
            <span style={{
              minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10,
              fontSize: 11, fontWeight: 600, background: "#edebe9", color: "#605e5c",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>{dd.total}</span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate("/employees/list")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 34, padding: "0 16px", fontSize: 13, fontWeight: 500,
              borderRadius: 4, border: "none", cursor: "pointer",
              background: "#0078d4", color: "#fff", transition: "background .15s",
              fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#106ebe")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#0078d4")}
          >
            <i className="fa-light fa-list" style={{ fontSize: 14 }} /> Employee List
          </button>
          <button
            onClick={() => navigate("/employees/consumption-history")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 34, padding: "0 16px", fontSize: 13, fontWeight: 500,
              borderRadius: 4, border: "1px solid #c8c6c4", cursor: "pointer",
              background: "#fff", color: "#323130", transition: "background .15s",
              fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f3f2f1")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <i className="fa-light fa-chart-column" style={{ fontSize: 14 }} /> Consumption History
          </button>
        </div>
      </div>

      {/* Standardized Widget Dashboard */}
      <div style={{ marginBottom: 24 }}>
        <ModuleDashboard
          moduleId="employee"
          title="Employee Operations"
          icon="fa-solid fa-users"
          subtitle="Widget-based employee analytics — add, resize, and rearrange widgets"
        />
      </div>

      {/* ── Content Area ── */}
      <div style={{ padding: "20px 24px" }}>
        {/* KPI Cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16, marginBottom: 20,
        }}>
          {metrics.map((m) => <MetricCard key={m.title} {...m} />)}
        </div>

        {/* Middle Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <SectionCard title="Top Vehicle Assignments" icon="fa-light fa-car-side" iconColor="#ca5010">
            <FluentTable columns={assignmentCols} data={dd.topAssignments} pageSize={5} />
          </SectionCard>

          <SectionCard title="Employee Distribution by Site" icon="fa-light fa-map-location-dot" iconColor="#00796b">
            {dd.siteDist.length > 0 ? (
              <div style={{ maxHeight: 310, overflowY: "auto" }}>
                {dd.siteDist.map((s) => (
                  <SiteBar key={s.siteName} name={s.siteName} count={s.count} max={maxSiteCount} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#a19f9d", fontSize: 13, padding: "40px 0" }}>
                No site assignments found.
              </div>
            )}
          </SectionCard>
        </div>

        {/* Recent Updates */}
        <SectionCard title="Recently Updated Employees" icon="fa-light fa-clock-rotate-left" iconColor="#0078d4">
          <FluentTable columns={recentCols} data={dd.recentUpdates} pageSize={6} />
        </SectionCard>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
