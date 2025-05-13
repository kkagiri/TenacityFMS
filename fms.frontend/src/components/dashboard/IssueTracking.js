import React from "react";
//claude - created issue tracking component to display maintenance issues

export const IssueTracking = ({ issueData }) => {
  // Function to determine badge and icon styling based on priority
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return {
          badgeClass: "danger",
          iconColor: "#f44336",
          iconBg: "#ffebee",
          icon: "fa-solid fa-triangle-exclamation",
        };
      case "Medium":
        return {
          badgeClass: "warning",
          iconColor: "#ff9800",
          iconBg: "#fff3e0",
          icon: "fa-solid fa-exclamation",
        };
      case "Low":
        return {
          badgeClass: "info",
          iconColor: "#2196f3",
          iconBg: "#e3f2fd",
          icon: "fa-solid fa-circle-info",
        };
      default:
        return {
          badgeClass: "info",
          iconColor: "#2196f3",
          iconBg: "#e3f2fd",
          icon: "fa-solid fa-circle-info",
        };
    }
  };

  // Mapping of issue categories to appropriate icons
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      Mechanical: "fa-solid fa-wrench",
      Electrical: "fa-solid fa-bolt",
      "Fuel System": "fa-solid fa-gas-pump",
      "GPS Device": "fa-solid fa-satellite-dish",
    };

    return categoryIcons[category] || "fa-solid fa-screwdriver-wrench";
  };

  return (
    <div className="card-grid-4">
      {issueData.map((issue, index) => {
        const style = getPriorityStyle(issue.priority);
        return (
          <div
            key={index}
            className={`dashboard-card ${
              issue.priority === "High" ? "highlight" : ""
            }`}
          >
            <div className="card-controls">
              <button title="Move card">
                <i className="fa-solid fa-arrows-up-down-left-right"></i>
              </button>
              <button title="Settings">
                <i className="fa-solid fa-gear"></i>
              </button>
            </div>
            <div className="card-content">
              <div className="flex-between mb-2">
                <div className="card-title">
                  <i
                    className={getCategoryIcon(issue.category)}
                    style={{ marginRight: "5px" }}
                  ></i>
                  {issue.category}
                </div>
                <div className={`badge ${style.badgeClass}`}>
                  <i className={style.icon} style={{ marginRight: "3px" }}></i>
                  {issue.priority}
                </div>
              </div>
              <div className="flex-between">
                <div className="stat-value">{issue.count}</div>
                <div className="stat-label">Open Issues</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
