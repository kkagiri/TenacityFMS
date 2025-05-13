import React from "react";
//claude - created pump status component to display fuel pump states

export const PumpStatus = ({ pumpStatus }) => {
  // Function to determine status style
  const getStatusStyle = (status) => {
    switch (status) {
      case "Filling":
        return {
          textColor: "#4caf50",
          iconColor: "#4caf50",
          icon: "fa-solid fa-spinner fa-spin",
        };
      case "Offline":
        return {
          textColor: "#f44336",
          iconColor: "#f44336",
          icon: "fa-solid fa-circle-xmark",
        };
      case "Idle":
      default:
        return {
          textColor: "#2196f3",
          iconColor: "#2196f3",
          icon: "fa-solid fa-circle-pause",
        };
    }
  };

  return (
    <div className="card-grid-4">
      {pumpStatus.map((pump) => {
        const style = getStatusStyle(pump.status);
        return (
          <div key={pump.id} className="dashboard-card">
            <div className="card-controls">
              <button title="Move card">
                <i className="fa-solid fa-arrows-up-down-left-right"></i>
              </button>
              <button title="Settings">
                <i className="fa-solid fa-gear"></i>
              </button>
            </div>
            <div className="card-content p-4 flex-between">
              <div>
                <p className="stat-label">Pump {pump.id}</p>
                <p style={{ color: style.textColor, fontWeight: 500 }}>
                  {pump.status}
                </p>
              </div>
              <div
                className="icon-container"
                style={{ backgroundColor: "transparent" }}
              >
                <i
                  className={style.icon}
                  style={{ color: style.iconColor, fontSize: "24px" }}
                ></i>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
