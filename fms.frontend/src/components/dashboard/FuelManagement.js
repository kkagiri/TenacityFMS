import React from "react";
//claude - created fuel management component to display fuel usage and costs

export const FuelManagement = ({
  fuelIssueData,
  fuelSiteData,
  formatNumber,
  formatCurrency,
}) => {
  return (
    <div className="fuel-management-container">
      <div className="dashboard-card fuel-issue-card">
        <div className="card-controls">
          <button title="Move card">
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button title="Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
        <div className="card-header">
          <h3 className="card-title">Fuel Issue by Vehicle Type</h3>
          <i className="fa-solid fa-truck" style={{ color: "#6c757d" }}></i>
        </div>
        <p className="card-description">Ranked by consumption volume</p>
        <div className="card-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Type</th>
                  <th className="text-right">Volume (L)</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {fuelIssueData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.vehicleType}</td>
                    <td className="text-right">{formatNumber(item.amount)}</td>
                    <td className="text-right">{formatCurrency(item.cost)}</td>
                    <td className="text-right">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dashboard-card fuel-cost-card">
        <div className="card-controls">
          <button title="Move card">
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button title="Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
        <div className="card-header">
          <h3 className="card-title">Fuel Cost by Site</h3>
          <i
            className="fa-solid fa-sack-dollar"
            style={{ color: "#6c757d" }}
          ></i>
        </div>
        <p className="card-description">Total cost of fuel issued</p>
        <div className="card-content">
          <div className="space-y-4">
            {fuelSiteData.map((item, index) => (
              <div key={index}>
                <div className="flex-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {item.siteName}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.totalCost)}
                  </span>
                </div>
                <div className="flex-between stats-row">
                  <span>{formatNumber(item.totalAmount)} L</span>
                  <span>{item.count} transactions</span>
                </div>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(item.totalCost / 20000) * 100}%`,
                      backgroundColor: "#ffc107",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
