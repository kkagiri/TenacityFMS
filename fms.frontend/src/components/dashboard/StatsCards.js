import React from "react";
//claude - created stats cards component with key metrics

export const StatsCards = ({ pdTotals, stats }) => {
  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  return (
    <div className="card-grid-4">
      <div className="dashboard-card">
        <div className="flex-between">
          <div>
            <p className="stat-label">Previous Day Consumption</p>
            <h3 className="stat-value">
              {formatNumber(pdTotals.consumption)} L
            </h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#ebf5ff" }}
          >
            <i className="fa-solid fa-droplet" style={{ color: "#2196f3" }}></i>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex-between">
          <div>
            <p className="stat-label">Engine Hours (Previous Day)</p>
            <h3 className="stat-value">{formatNumber(pdTotals.hours)} hrs</h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#f3e5f5" }}
          >
            <i className="fa-solid fa-clock" style={{ color: "#9c27b0" }}></i>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex-between">
          <div>
            <p className="stat-label">Distance (Previous Day)</p>
            <h3 className="stat-value">{formatNumber(pdTotals.distance)} km</h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#e8f5e9" }}
          >
            <i
              className="fa-solid fa-arrow-trend-up"
              style={{ color: "#4caf50" }}
            ></i>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex-between">
          <div>
            <p className="stat-label">Fuel Issued (Previous Day)</p>
            <h3 className="stat-value">{formatNumber(1564.32)} L</h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#fff8e1" }}
          >
            <i
              className="fa-solid fa-gas-pump"
              style={{ color: "#ff9800" }}
            ></i>
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="flex-between">
          <div>
            <p className="stat-label">Pending Issues</p>
            <h3 className="stat-value">27</h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#fce4ec" }}
          >
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ color: "#e91e63" }}
            ></i>
          </div>
        </div>
      </div>

      <div
        className={`dashboard-card ${
          stats.activeAlerts > 0 ? "highlight" : ""
        }`}
      >
        <div className="flex-between">
          <div>
            <p className="stat-label">Active Alerts</p>
            <h3 className="stat-value">{stats.activeAlerts}</h3>
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: "#ffebee" }}
          >
            <i className="fa-solid fa-bell" style={{ color: "#f44336" }}></i>
          </div>
        </div>
      </div>
    </div>
  );
};
