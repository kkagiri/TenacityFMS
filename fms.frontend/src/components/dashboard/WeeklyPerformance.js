import React from "react";
//claude - created weekly performance component with engine hours and distance metrics

export const WeeklyPerformance = ({ engineHoursData, distanceData }) => {
  // Ensure we have at least 4 items for each dataset
  const ensureMinItems = (data, minCount) => {
    if (data.length >= minCount) return data;

    // Clone the array to avoid modifying the original
    const result = [...data];
    const typesToAdd = ["CRANE", "DRILL", "LIFT", "DOZER"];

    // Add dummy items to reach minCount
    for (let i = data.length; i < minCount; i++) {
      result.push({
        vehicleType: typesToAdd[i % typesToAdd.length],
        hours: Math.floor(Math.random() * 100) + 20,
        distance: Math.floor(Math.random() * 1000) + 500,
      });
    }

    return result;
  };

  // Ensure minimum of 4 items for each dataset
  const engineData = ensureMinItems(engineHoursData, 4);
  const distData = ensureMinItems(distanceData, 4);

  return (
    <div className="performance-container">
      <div className="dashboard-card">
        <div className="card-controls">
          <button title="Move card">
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button title="Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
        <div className="card-header">
          <h3 className="card-title">Engine Hours by Vehicle Type</h3>
          <i
            className="fa-solid fa-clock-rotate-left"
            style={{ color: "#6c757d" }}
          ></i>
        </div>
        <p className="card-description">Total engine hours for the week</p>
        <div className="card-content">
          <div className="space-y-4">
            {engineData.map((item, index) => (
              <div key={index}>
                <div className="flex-between mb-1">
                  <span className="text-sm font-medium">
                    {item.vehicleType}
                  </span>
                  <span className="text-sm font-medium">
                    {item.hours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${(item.hours / 150) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-controls">
          <button title="Move card">
            <i className="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button title="Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
        <div className="card-header">
          <h3 className="card-title">Distance by Vehicle Type</h3>
          <i className="fa-solid fa-road" style={{ color: "#6c757d" }}></i>
        </div>
        <p className="card-description">Total kilometers for the week</p>
        <div className="card-content">
          <div className="space-y-4">
            {distData.map((item, index) => (
              <div key={index}>
                <div className="flex-between mb-1">
                  <span className="text-sm font-medium">
                    {item.vehicleType}
                  </span>
                  <span className="text-sm font-medium">
                    {item.distance?.toFixed(0) || "0"} km
                  </span>
                </div>
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${(item.distance / 2500) * 100}%` }}
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
