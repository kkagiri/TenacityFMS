import React, { useState } from "react";
import { Link } from "react-router-dom";
import { StockManagementActions } from "./StockManagementActions";
//claude - created system modules component to display navigation cards

export const SystemModules = ({ modules }) => {
  const [stockActionsVisible, setStockActionsVisible] = useState(false);

  // Map legacy icon names to Font Awesome equivalents
  const getIcon = (iconName) => {
    const iconMap = {
      tag: "fa-solid fa-tag",
      warning: "fa-solid fa-triangle-exclamation",
      chart: "fa-solid fa-chart-line",
      "chart-line": "fa-solid fa-chart-line",
      file: "fa-solid fa-file-lines",
      "file-text": "fa-solid fa-file-text",
      database: "fa-solid fa-database",
      gauge: "fa-solid fa-gauge-high",
      drop: "fa-solid fa-droplet",
      car: "fa-solid fa-truck",
      "gas-pump": "fa-solid fa-gas-pump",
      warehouse: "fa-solid fa-warehouse",
      users: "fa-solid fa-users",
      cogs: "fa-solid fa-cogs",
      history: "fa-solid fa-history",
      "chart-bar": "fa-solid fa-chart-bar",
      "chart-pie": "fa-solid fa-chart-pie",
      "clipboard-check": "fa-solid fa-clipboard-check",
      "chart-simple": "fa-solid fa-chart-simple",
      truck: "fa-solid fa-truck",
      "triangle-exclamation": "fa-solid fa-triangle-exclamation"
    };

    return iconMap[iconName] || "fa-solid fa-circle-info";
  };

  const handleModuleClick = (module, e) => {
    if (module.isQuickActions) {
      e.preventDefault();
      setStockActionsVisible(true);
    }
  };

  return (
    <>
      <div className="card-grid-4">
        {modules.map((module, index) => {
          const ModuleContent = (
            <div
              className={`dashboard-card ${module.highlight ? "highlight" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleModuleClick(module, e)}
            >
              <div className="card-controls">
                <button title="Move card">
                  <i className="fa-solid fa-arrows-up-down-left-right"></i>
                </button>
                <button title="Settings">
                  <i className="fa-solid fa-gear"></i>
                </button>
              </div>
              <div className="card-header">
                <div className="flex-between">
                  <h3 className="card-title">{module.name}</h3>
                  <i
                    className={getIcon(module.icon)}
                    style={{ color: "#2196f3" }}
                  ></i>
                </div>
              </div>
              <p className="card-description">{module.description}</p>
              <div className="card-footer">
                <span className="text-sm font-medium">{module.stat}</span>
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          );

          // If it's the special stock management actions module, don't wrap in Link
          if (module.isQuickActions) {
            return <div key={index} style={{ textDecoration: "none" }}>{ModuleContent}</div>;
          }

          // Regular modules get wrapped in Link
          return (
            <Link to={module.path} key={index} style={{ textDecoration: "none" }}>
              {ModuleContent}
            </Link>
          );
        })}
      </div>

      {/* Stock Management Actions Modal */}
      <StockManagementActions
        visible={stockActionsVisible}
        onHiding={() => setStockActionsVisible(false)}
      />
    </>
  );
};
