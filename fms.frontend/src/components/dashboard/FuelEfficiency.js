import React from "react";
//claude - created fuel efficiency component to display consumption metrics

export const FuelEfficiency = ({ efficiencyAvgs, filteredEfficiencyData }) => {
  return (
    <div className="efficiency-container">
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
          <h3 className="card-title">KM per Liter</h3>
          <i
            className="fa-solid fa-gauge-high"
            style={{ color: "#6c757d" }}
          ></i>
        </div>
        <p className="card-description">
          Average for vehicles measured by distance
        </p>
        <div className="card-content">
          <div className="flex-between">
            <div className="stat-value">
              {efficiencyAvgs.avgKmPerLiter.toFixed(2)} km/L
            </div>
            <div
              className={`badge ${
                efficiencyAvgs.avgKmPerLiter > 10 ? "success" : "warning"
              }`}
            >
              <i className="fa-solid fa-arrow-up"></i> Efficiency
            </div>
          </div>
          <div className="mt-4">
            {filteredEfficiencyData
              .filter((item) => item.kmPerLiter > 0)
              .sort((a, b) => b.kmPerLiter - a.kmPerLiter)
              .slice(0, 4)
              .map((item, index) => (
                <div key={index} className="mt-2">
                  <div className="flex-between">
                    <div>{item.vehicleType}</div>
                    <div className="flex-between">
                      <div
                        className="progress-container"
                        style={{ width: "100px", marginRight: "8px" }}
                      >
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(item.kmPerLiter / 15) * 100}%`,
                            backgroundColor: "#4caf50",
                          }}
                        ></div>
                      </div>
                      <div>{item.kmPerLiter.toFixed(1)}</div>
                    </div>
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
          <h3 className="card-title">Liters per Hour</h3>
          <i className="fa-solid fa-gas-pump" style={{ color: "#6c757d" }}></i>
        </div>
        <p className="card-description">
          Average for equipment measured by hours
        </p>
        <div className="card-content">
          <div className="flex-between">
            <div className="stat-value">
              {efficiencyAvgs.avgLiterPerHour.toFixed(2)} L/hr
            </div>
            <div
              className={`badge ${
                efficiencyAvgs.avgLiterPerHour < 14 ? "success" : "warning"
              }`}
            >
              <i className="fa-solid fa-arrow-down"></i> Consumption
            </div>
          </div>
          <div className="mt-4">
            {filteredEfficiencyData
              .filter((item) => item.literPerHour > 0)
              .sort((a, b) => a.literPerHour - b.literPerHour)
              .slice(0, 4)
              .map((item, index) => (
                <div key={index} className="mt-2">
                  <div className="flex-between">
                    <div>{item.vehicleType}</div>
                    <div className="flex-between">
                      <div
                        className="progress-container"
                        style={{ width: "100px", marginRight: "8px" }}
                      >
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(item.literPerHour / 20) * 100}%`,
                            backgroundColor: "#ffc107",
                          }}
                        ></div>
                      </div>
                      <div>{item.literPerHour.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
