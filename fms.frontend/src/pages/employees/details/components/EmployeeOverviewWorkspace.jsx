/**
 * File: EmployeeOverviewWorkspace.jsx
 * Purpose: Overview tab for the employee details page — Personal Information,
 *          Employment, Assigned Vehicles, mini stats, and Recent Activity cards.
 * Dependencies: M365 design tokens, parent EmployeeDetailsPage props.
 * Last Modified: 2026-04-25
 *
 * Key Functions:
 * - EmployeeOverviewWorkspace(): Renders the M365-style two-column overview cards.
 */

import React, { useMemo } from "react";
import "./EmployeeOverviewWorkspace.scss";

const formatJoinedDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
};

const formatActivityTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`;
  const diffDays = Math.round(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
};

const formatNumber = (value, fractionDigits = 0) => {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return "0";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};

const InfoRow = ({ label, value }) => (
  <div className="employee-overview-card__row">
    <span className="employee-overview-card__row-label">{label}</span>
    <span className="employee-overview-card__row-value">{value || "—"}</span>
  </div>
);

const EmployeeOverviewWorkspace = ({
  employee,
  siteName,
  assignedVehicles,
  totalStats,
  recentTransactions,
  onChangeTab,
}) => {
  const recent = useMemo(
    () => (Array.isArray(recentTransactions) ? recentTransactions.slice(0, 5) : []),
    [recentTransactions]
  );

  return (
    <div className="employee-overview">
      <div className="employee-overview__grid">
        {/* ── Left column ─────────────────────────────────────── */}
        <div className="employee-overview__col employee-overview__col--main">
          <section className="employee-overview-card">
            <header className="employee-overview-card__header">
              <h3>Personal Information</h3>
            </header>
            <div className="employee-overview-card__grid">
              <InfoRow label="Full name" value={employee?.fullName} />
              <InfoRow label="Work number" value={employee?.employeeWorkNo} />
              <InfoRow label="Phone" value={employee?.employeephoneNumber} />
              <InfoRow label="Site" value={siteName} />
              <InfoRow label="Status" value={employee?.employeestatus} />
              <InfoRow label="Joined" value={formatJoinedDate(employee?.dateCreated)} />
            </div>
          </section>

          <section className="employee-overview-stats">
            <article className="employee-overview-stats__tile">
              <span className="employee-overview-stats__icon employee-overview-stats__icon--blue">
                <i className="fa-light fa-receipt" />
              </span>
              <div>
                <span className="employee-overview-stats__label">Transactions</span>
                <span className="employee-overview-stats__value">
                  {formatNumber(totalStats?.totalTransactions)}
                </span>
              </div>
            </article>
            <article className="employee-overview-stats__tile">
              <span className="employee-overview-stats__icon employee-overview-stats__icon--green">
                <i className="fa-light fa-droplet" />
              </span>
              <div>
                <span className="employee-overview-stats__label">Volume</span>
                <span className="employee-overview-stats__value">
                  {formatNumber(totalStats?.totalVolume, 1)} <small>L</small>
                </span>
              </div>
            </article>
            <article className="employee-overview-stats__tile">
              <span className="employee-overview-stats__icon employee-overview-stats__icon--orange">
                <i className="fa-light fa-gauge-simple-max" />
              </span>
              <div>
                <span className="employee-overview-stats__label">Fuel Lost</span>
                <span className="employee-overview-stats__value">
                  {formatNumber(totalStats?.totalFuelLost, 1)} <small>L</small>
                </span>
              </div>
            </article>
          </section>

          <section className="employee-overview-card">
            <header className="employee-overview-card__header employee-overview-card__header--with-action">
              <h3>Recent Activity</h3>
              {recent.length > 0 && onChangeTab && (
                <button
                  type="button"
                  className="employee-overview-card__link"
                  onClick={() => onChangeTab("refill")}
                >
                  View all
                </button>
              )}
            </header>
            {recent.length === 0 ? (
              <div className="employee-overview-card__empty">
                <i className="fa-light fa-clock-rotate-left" />
                <span>No recent activity in the selected date range.</span>
              </div>
            ) : (
              <ul className="employee-overview-activity">
                {recent.map((transaction) => (
                  <li key={transaction.transaction || `${transaction.dateTime}-${transaction.vehicleId}`}>
                    <span className="employee-overview-activity__icon">
                      <i className="fa-light fa-gas-pump" />
                    </span>
                    <span className="employee-overview-activity__text">
                      Refueled <strong>{transaction.vehicleLabel || transaction.vehicleName || "vehicle"}</strong>
                      {" — "}
                      <strong>{formatNumber(transaction.volume, 1)} L</strong>
                      {transaction.siteLabel ? ` at ${transaction.siteLabel}` : ""}
                    </span>
                    <span className="employee-overview-activity__time">
                      {formatActivityTime(transaction.dateTime)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right column ────────────────────────────────────── */}
        <div className="employee-overview__col employee-overview__col--side">
          <section className="employee-overview-card">
            <header className="employee-overview-card__header">
              <h3>Employment</h3>
            </header>
            <div className="employee-overview-card__list">
              <InfoRow label="Employee ID" value={employee?.id ? `EMP-${employee.id}` : null} />
              <InfoRow label="Work number" value={employee?.employeeWorkNo} />
              <InfoRow label="Position" value={employee?.position} />
              <InfoRow label="Site" value={siteName} />
              <InfoRow label="Status" value={employee?.employeestatus} />
              <InfoRow label="Joined" value={formatJoinedDate(employee?.dateCreated)} />
            </div>
          </section>

          <section className="employee-overview-card">
            <header className="employee-overview-card__header">
              <h3>Assigned Vehicles</h3>
            </header>
            {(!assignedVehicles || assignedVehicles.length === 0) ? (
              <div className="employee-overview-card__empty">
                <i className="fa-light fa-truck" />
                <span>No vehicles assigned.</span>
              </div>
            ) : (
              <ul className="employee-overview-vehicles">
                {assignedVehicles.map((vehicle) => (
                  <li key={vehicle.vehicleId}>
                    <span className="employee-overview-vehicles__icon">
                      <i className="fa-light fa-truck" />
                    </span>
                    <span className="employee-overview-vehicles__name">{vehicle.vehicleName}</span>
                    <span className="employee-overview-vehicles__role">Default driver</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOverviewWorkspace;
