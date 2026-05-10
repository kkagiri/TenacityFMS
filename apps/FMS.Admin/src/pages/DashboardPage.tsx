/**
 * File:          DashboardPage.tsx
 * Purpose:       Operator portal dashboard placeholder for Phase 2 modules.
 * Dependencies:  React
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - DashboardPage(): Renders operator overview tiles and module entry points.
 */

const summaryItems = [
  { label: "Client tenants", value: "-", icon: "fa-light fa-building" },
  {
    label: "Active subscriptions",
    value: "-",
    icon: "fa-light fa-file-invoice-dollar",
  },
  { label: "Open audit events", value: "-", icon: "fa-light fa-shield-check" },
];

export default function DashboardPage() {
  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-gauge-high m365-page-header__icon" />
          <h2 className="m365-page-header__title">Dashboard</h2>
        </div>
      </div>

      <div className="operator-summary-grid">
        {summaryItems.map((item) => (
          <div key={item.label} className="operator-summary-tile">
            <i className={item.icon} />
            <div>
              <div className="operator-summary-tile__value">{item.value}</div>
              <div className="operator-summary-tile__label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
