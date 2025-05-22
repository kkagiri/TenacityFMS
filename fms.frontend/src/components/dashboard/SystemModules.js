import React from "react";
import { Link } from "react-router-dom";
//claude - created system modules component to display navigation cards

export const SystemModules = ({ modules }) => {
  // Map legacy icon names to Font Awesome equivalents
  const getIcon = (iconName) => {
    const iconMap = {
      tag: "fa-solid fa-tag",
      warning: "fa-solid fa-triangle-exclamation",
      chart: "fa-solid fa-chart-line",
      file: "fa-solid fa-file-lines",
      database: "fa-solid fa-database",
      gauge: "fa-solid fa-gauge-high",
      drop: "fa-solid fa-droplet",
      car: "fa-solid fa-truck",
    };

    return iconMap[iconName] || "fa-solid fa-circle-info";
  };

  return (
    <div className="card-grid-4">
      {modules.map((module, index) => (
        <Link to={module.path} key={index} style={{ textDecoration: "none" }}>
          <div
            className={`dashboard-card ${module.highlight ? "highlight" : ""}`}
            style={{ cursor: "pointer" }}
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
        </Link>
      ))}
    </div>
  );
};
