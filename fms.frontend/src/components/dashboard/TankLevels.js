import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTanks } from "../../redux/actions/tankActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchTankVolumeHistoryByTankId } from "../../redux/actions/tankVolumeHistoryActions";
import TankHistoryVolumeDatagrid from "../tankStock/tankHistoryVolumeDatagrid";
//claude - created tank levels component to display fuel tank status

export const TankLevels = ({ tankLevels }) => {
  const dispatch = useDispatch();
  // Use the correct reducer name from your rootReducer
  const { tanks, loading, error } = useSelector((state) => state.tank);
  const sites = useSelector((state) => state.site.sites || []);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const tankVolumeHistory = useSelector(
    (state) => state.tankVolumeHistory.tankVolumeHistory
  );
  const historyLoading = useSelector(
    (state) => state.tankVolumeHistory.loading
  );

  useEffect(() => {
    // Fetch tanks and sites from API
    dispatch(fetchTanks());
    dispatch(fetchSiteList());

    // Refresh tank data every 2 minutes
    const interval = setInterval(() => {
      dispatch(fetchTanks());
    }, 120000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    // Fetch tank volume history when a tank is selected
    if (selectedTankId) {
      dispatch(fetchTankVolumeHistoryByTankId(selectedTankId));
    }
  }, [selectedTankId, dispatch]);

  // Function to determine color based on tank level
  const getTankLevelColor = (level) => {
    if (level <= 20) return "#f44336"; // Red for low levels
    if (level <= 40) return "#ff9800"; // Orange for medium-low levels
    return "#2196f3"; // Blue for good levels
  };

  // Function to get appropriate icon based on level
  const getTankLevelIcon = (level) => {
    if (level <= 20) return "fa-solid fa-battery-quarter text-danger";
    if (level <= 40) return "fa-solid fa-battery-half text-warning";
    if (level <= 70) return "fa-solid fa-battery-three-quarters text-info";
    return "fa-solid fa-battery-full text-success";
  };

  // Calculate level percentage from real data
  const calculateLevelPercentage = (currentStock, tankVolume) => {
    return Math.round((currentStock / tankVolume) * 100);
  };

  const handleViewTransactions = (tankId) => {
    setSelectedTankId(tankId);
    setShowTransactionHistory(true);
  };

  const closeTransactionHistory = () => {
    setShowTransactionHistory(false);
    setSelectedTankId(null);
  };

  // Use either Redux data or prop data depending on what's available
  const tanksToDisplay = tanks && tanks.length > 0 ? tanks : tankLevels;

  // Group tanks by site
  const groupTanksBySite = () => {
    const groupedTanks = {};

    // Initialize with sites that have no tanks
    sites.forEach((site) => {
      groupedTanks[site.id] = {
        siteName: site.name,
        tanks: [],
      };
    });

    // Add tanks to their respective sites
    tanksToDisplay.forEach((tank) => {
      const siteId = tank.siteId || 0;
      if (!groupedTanks[siteId]) {
        groupedTanks[siteId] = {
          siteName: tank.siteName || "Unassigned",
          tanks: [],
        };
      }
      groupedTanks[siteId].tanks.push(tank);
    });

    return groupedTanks;
  };

  // Calculate site totals for each site
  const calculateSiteTotals = (tanks) => {
    if (!tanks || tanks.length === 0)
      return { totalVolume: 0, totalCapacity: 0, percentage: 0 };

    const totalVolume = tanks.reduce(
      (sum, tank) => sum + (tank.currentStock || 0),
      0
    );
    const totalCapacity = tanks.reduce(
      (sum, tank) => sum + (tank.tankVolume || 0),
      0
    );
    const percentage =
      totalCapacity > 0 ? Math.round((totalVolume / totalCapacity) * 100) : 0;

    return { totalVolume, totalCapacity, percentage };
  };
  //claude - added function to calculate site totals

  const groupedTanks = groupTanksBySite();

  // Filter tank volume history based on selected tank (should be handled by API now)
  const filteredTankHistory = tankVolumeHistory || [];

  if (loading) {
    return (
      <div className="loading-indicator">
        Loading tank data<span className="loading-dots"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">Error loading tank data: {error}</div>
    );
  }

  // Render all tanks in a grid layout grouped by site
  return (
    <>
      <div className="tanks-by-site-container">
        {Object.entries(groupedTanks).map(
          ([siteId, siteData]) =>
            siteData.tanks.length > 0 && (
              <div key={siteId} className="site-tanks-section">
                <h4
                  className="site-name"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i className="fa-solid fa-location-dot"></i>
                    {siteData.siteName}
                  </div>
                  {siteData.tanks.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.65em",
                        fontWeight: "normal",
                        color: "#718096",
                      }}
                    >
                      {calculateSiteTotals(siteData.tanks).totalVolume.toFixed(
                        0
                      )}{" "}
                      L /
                      {calculateSiteTotals(
                        siteData.tanks
                      ).totalCapacity.toFixed(0)}{" "}
                      L ({calculateSiteTotals(siteData.tanks).percentage}%)
                    </span>
                  )}
                </h4>
                <div className="card-grid-3">
                  {siteData.tanks.map((tank) => {
                    // Check if we're using real data from API or mock data from props
                    const isRealData = tank.hasOwnProperty("currentStock");

                    // Get level value based on data type
                    const level = isRealData
                      ? calculateLevelPercentage(
                          tank.currentStock,
                          tank.tankVolume
                        )
                      : tank.level;

                    // Get volume value based on data type
                    const volume = isRealData ? tank.currentStock : tank.volume;

                    return (
                      <div key={tank.id} className="tank-card">
                        <div className="card-controls">
                          <button
                            title="View transactions"
                            onClick={() => handleViewTransactions(tank.id)}
                          >
                            <i className="fa-solid fa-clock-rotate-left"></i>
                          </button>
                          <button title="Settings">
                            <i className="fa-solid fa-gear"></i>
                          </button>
                        </div>
                        <div className="card-header">
                          <h3 className="card-title">{tank.name}</h3>
                          <i className={getTankLevelIcon(level)}></i>
                        </div>
                        <div className="card-content">
                          <div
                            className="progress-container"
                            style={{ height: "16px" }}
                          >
                            <div
                              className="progress-bar"
                              style={{
                                width: `${level}%`,
                                backgroundColor: getTankLevelColor(level),
                              }}
                            ></div>
                          </div>
                          <div className="flex-between stats-row">
                            <span>{level}%</span>
                            <span>{volume.toFixed(2)} L</span>
                          </div>
                          {isRealData && (
                            <>
                              <div className="tank-summary">
                                <div className="summary-item">
                                  <span className="label">Capacity:</span>
                                  <span className="value">
                                    {tank.tankVolume.toFixed(2)} L
                                  </span>
                                </div>
                              </div>
                              <div
                                className="text-sm"
                                style={{ color: "#718096" }}
                              >
                                Last update:{" "}
                                <span>
                                  {" "}
                                  {new Date(
                                    tank.lastStockUpdate
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                Tank Transaction History
                {selectedTankId && tanks && (
                  <span>
                    {" "}
                    - {tanks.find((t) => t.id === selectedTankId)?.name}
                  </span>
                )}
              </h3>
              <button onClick={closeTransactionHistory} className="close-btn">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {historyLoading ? (
                <div className="loading-indicator">
                  Loading transaction data<span className="loading-dots"></span>
                </div>
              ) : (
                <TankHistoryVolumeDatagrid
                  tankVolumeHistory={filteredTankHistory}
                  selectedSite="all"
                  selectedPeriod="30"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
