/**
 * File: tankPage.js
 * Purpose: Tank management page with tree view, tank details, and PTS binding actions.
 * Dependencies: react, react-redux, devextreme-react, tankActions, siteActions
 * Last Modified: 2026-02-04
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeList, {
  Column,
  Selection,
  SearchPanel,
  HeaderFilter,
} from "devextreme-react/tree-list";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import { fetchTanks } from "../../redux/actions/tankActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import TankDetails from "./components/TankDetails";
import TankForm from "./components/TankForm";
import TankHistory from "./components/TankHistory";
import PTSDeviceLinkPopup from "./components/PTSDeviceLinkPopup";
import "./tankPage.scss";

const TankPage = () => {
  const dispatch = useDispatch();
  const { tanks, loading: tanksLoading } = useSelector((state) => state.tank);
  const { sites } = useSelector((state) => state.site);
  const { user } = useSelector((state) => state.auth);
  const connectionStatuses = useSelector(
    (state) => state.deviceConnections?.connectionStatuses || {}
  );
  const uploadStatusByDevice = useSelector(
    (state) => state.realtimeStatus?.uploadStatusByDevice || {}
  );
  const mobileMenuRef = useRef(null);

  // Get user roles from auth state
  const userRoles = user ? user.roles : [];

  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [showTankForm, setShowTankForm] = useState(false);
  const [showTankHistory, setShowTankHistory] = useState(false);
  const [showPTSLink, setShowPTSLink] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetailsOnMobile, setShowDetailsOnMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Only fetch data on initial mount
    const fetchData = async () => {
      dispatch(fetchTanks());
      dispatch(fetchSiteList());
    };
    fetchData();
  }, []); // Remove dispatch dependency to prevent re-fetching

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMobileMenu]);

  // Memoize tree data transformation
  const transformedTreeData = useMemo(() => {
    if (!sites || !tanks) return [];

    const sitesWithTanks = sites.filter((site) =>
      tanks.some((tank) => tank.siteId === site.id)
    );

    const transformedData = sitesWithTanks.map((site) => ({
      id: `site_${site.id}`,
      name: site.name,
      type: "site",
      siteId: site.id,
      siteData: site,
    }));

    tanks.forEach((tank) => {
      // Add tank only if its parent site is in the filtered list
      if (sitesWithTanks.some((site) => site.id === tank.siteId)) {
        transformedData.push({
          id: `tank_${tank.id}`,
          parentId: `site_${tank.siteId}`,
          name: tank.name,
          type: "tank",
          tankData: tank,
          volume: tank.tankVolume,
          currentStock: tank.currentStock,
        });
      }
    });

    return transformedData;
  }, [sites, tanks]);

  useEffect(() => {
    setTreeData(transformedTreeData);
  }, [transformedTreeData]);

  const handleTreeSelection = useCallback((e) => {
    const selectedItem = e.selectedRowsData[0];
    if (selectedItem) {
      if (selectedItem.type === "tank") {
        setSelectedTank(selectedItem.tankData);
        setSelectedSite(null);
        setShowDetailsOnMobile(true); // Show details on mobile
      } else if (selectedItem.type === "site") {
        setSelectedTank(null);
        setSelectedSite(selectedItem);
        setShowDetailsOnMobile(true); // Show details on mobile
      }
    } else {
      setSelectedTank(null);
      setSelectedSite(null);
      setShowDetailsOnMobile(false);
    }
  }, []);

  const handleAddTank = () => {
    setEditMode(false);
    setShowTankForm(true);
  };

  const handleEditTank = () => {
    if (selectedTank) {
      setEditMode(true);
      setShowTankForm(true);
    }
  };

  const handleViewHistory = () => {
    if (selectedTank) {
      setShowTankHistory(true);
    }
  };

  const handleLinkPTSDevice = () => {
    if (selectedTank) {
      setShowPTSLink(true);
    }
  };

  const handleFormClose = () => {
    setShowTankForm(false);
    setEditMode(false);
  };

  const handleFormSubmit = async () => {
    const previousSelectedTankId = selectedTank?.id;
    handleFormClose();

    // Refresh tank data
    const result = await dispatch(fetchTanks());

    // If we were editing a tank, update selectedTank with fresh data
    if (previousSelectedTankId && result?.success && result?.data) {
      const updatedTank = result.data.find(
        (t) => t.id === previousSelectedTankId
      );
      if (updatedTank) {
        setSelectedTank(updatedTank);
      }
    }

    notify("Tank saved successfully", "success", 3000);
  };

  const handlePTSLinkSubmit = async () => {
    const previousSelectedTankId = selectedTank?.id;

    // Fetch updated tank data in the background
    const result = await dispatch(fetchTanks());

    if (previousSelectedTankId && result?.success && result?.data) {
      const updatedTank = result.data.find(
        (tankItem) => tankItem.id === previousSelectedTankId
      );
      if (updatedTank) {
        setSelectedTank(updatedTank);
      }
    }
    // Note: Notification is handled in PTSDeviceLinkPopup
  };

  const selectedTankLiveStatus = selectedTank?.ptsId
    ? uploadStatusByDevice[selectedTank.ptsId]
    : null;

  const selectedTankConnection = selectedTank?.ptsId
    ? connectionStatuses[selectedTank.ptsId]
    : null;

  // Custom cell render to show only name with proper icons
  //Cursor - Fixed tree display to hide internal data fields and show user-friendly information with icons
  const nameRender = (cellData) => {
    const { data } = cellData;
    let icon, iconColor;

    if (data.type === "site") {
      icon = "fa-light fa-building";
      iconColor = "tw-text-blue-600";
    } else if (data.type === "tank") {
      // Check tank type for appropriate icon
      const tankType = data.tankData?.tankType;
      if (tankType === "MobileTanker") {
        icon = "fa-light fa-truck-moving";
        iconColor = "tw-text-orange-600";
      } else {
        icon = "fa-light fa-gas-pump";
        iconColor = "tw-text-green-600";
      }
    }

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`${icon} ${iconColor}`}></i>
        <span className="tw-font-medium">{data.name}</span>
        {data.type === "tank" && data.tankData?.tankType === "MobileTanker" && (
          <span className="tw-text-xs tw-bg-orange-100 tw-text-orange-700 tw-px-2 tw-py-0.5 tw-rounded-full">
            Mobile
          </span>
        )}
      </div>
    );
  };

  // Custom cell render for tank volume
  const volumeRender = (cellData) => {
    const { data } = cellData;
    if (data.type === "tank" && data.volume) {
      return (
        <span className="tw-text-sm tw-text-gray-600">
          {data.volume.toLocaleString()} L
        </span>
      );
    }
    return null;
  };

  // Custom cell render for current stock
  const stockRender = (cellData) => {
    const { data } = cellData;
    if (data.type === "tank" && data.currentStock !== undefined) {
      const percentage =
        data.volume > 0
          ? ((data.currentStock / data.volume) * 100).toFixed(1)
          : 0;
      return (
        <div className="tw-text-sm">
          <span className="tw-text-gray-600">
            {data.currentStock.toLocaleString()} L
          </span>
          <span className="tw-text-xs tw-text-gray-500 tw-ml-1">
            ({percentage}%)
          </span>
        </div>
      );
    }
    return null;
  };

  // Calculate site tank summaries - memoized to prevent recalculation
  const getSiteTanksSummary = useCallback(
    (siteId) => {
      if (!tanks)
        return {
          tanks: [],
          totalCapacity: 0,
          totalCurrentStock: 0,
          totalAvailable: 0,
          avgFillPercentage: 0,
          tankCount: 0,
        };

      const siteTanks = tanks.filter((tank) => tank.siteId === siteId);
      const totalCapacity = siteTanks.reduce(
        (sum, tank) => sum + (tank.tankVolume || 0),
        0
      );
      const totalCurrentStock = siteTanks.reduce(
        (sum, tank) => sum + (tank.currentStock || 0),
        0
      );
      const totalAvailable = totalCapacity - totalCurrentStock;
      const avgFillPercentage =
        totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;

      return {
        tanks: siteTanks,
        totalCapacity,
        totalCurrentStock,
        totalAvailable,
        avgFillPercentage,
        tankCount: siteTanks.length,
      };
    },
    [tanks]
  );

  const getStatusClass = (percentage) => {
    if (percentage >= 70) return "full";
    if (percentage >= 30) return "medium";
    return "low";
  };

  const treeColumns = (
    <>
      <Column
        dataField="name"
        caption="Name"
        cellRender={nameRender}
        width="60%"
      />
      <Column
        dataField="volume"
        caption="Capacity"
        cellRender={volumeRender}
        width="20%"
        alignment="right"
      />
      <Column
        dataField="currentStock"
        caption="Current Stock"
        cellRender={stockRender}
        width="20%"
        alignment="right"
      />
    </>
  );

  return (
    <div className="content-block tank-page tw-h-full tw-flex tw-flex-col">
      {/* Header Section - TransactionHub Style */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200 tw-rounded-t-lg tw-shadow-sm tw-mb-4">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          {/* Title */}
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-gas-pump tw-mr-2 tw-text-blue-600"></i>
              Tank Management
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Manage fuel tanks, view details, and track stock levels
            </p>
          </div>

          {/* Actions section - responsive */}
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full sm:tw-w-auto">
              {/* Segmented Button Group */}
              <div className="tank-page__action-buttons">
                <Button
                  text="Refresh"
                  icon="fa-light fa-refresh"
                  type="default"
                  stylingMode="outlined"
                  onClick={() => dispatch(fetchTanks())}
                  hint="Refresh tank data"
                  className="tank-page__action-btn tank-page__action-btn--first"
                />

                <Button
                  text="Add Tank"
                  icon="fa-light fa-plus-circle"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleAddTank}
                  hint="Add a new tank"
                  className="tank-page__action-btn tank-page__action-btn--add"
                />

                <Button
                  text="Edit"
                  icon="fa-light fa-edit"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleEditTank}
                  disabled={!selectedTank}
                  hint="Edit selected tank"
                  className="tank-page__action-btn"
                />

                <Button
                  text="History"
                  icon="fa-light fa-history"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleViewHistory}
                  disabled={!selectedTank}
                  hint="View tank history"
                  className="tank-page__action-btn"
                />

                <Button
                  text="Link PTS"
                  icon="fa-light fa-link"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleLinkPTSDevice}
                  disabled={!selectedTank}
                  hint="Link PTS Device"
                  className="tank-page__action-btn tank-page__action-btn--last"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-flex-1 tw-gap-4 tw-overflow-hidden">
        <div
          className={`tw-w-full lg:tw-w-1/3 tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-max-h-[400px] lg:tw-max-h-full tw-overflow-auto ${
            showDetailsOnMobile ? "tw-hidden lg:tw-block" : ""
          }`}
        >
          <TreeList
            dataSource={treeData}
            keyExpr="id"
            parentIdExpr="parentId"
            showBorders={true}
            showRowLines={true}
            columnAutoWidth={false}
            wordWrapEnabled={true}
            onSelectionChanged={handleTreeSelection}
            height="100%"
            columns={["name", "volume", "currentStock"]}
          >
            <SearchPanel visible={true} placeholder="Search" />
            <HeaderFilter visible={false} />
            <Selection mode="single" />
            {treeColumns}
          </TreeList>
        </div>

        <div
          className={`tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 md:tw-p-6 tw-overflow-auto tw-relative ${
            !showDetailsOnMobile ? "tw-hidden lg:tw-block" : ""
          }`}
        >
          {/* Back button for mobile */}
          {(selectedTank || selectedSite) && (
            <button
              onClick={() => setShowDetailsOnMobile(false)}
              className="tw-mb-4 tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-flex tw-items-center tw-gap-2 tw-shadow-md hover:tw-bg-blue-600 tw-transition lg:tw-hidden"
            >
              <i className="fa-light fa-arrow-left"></i>
              <span>Back to List</span>
            </button>
          )}

          {selectedTank ? (
            <div className="tank-details-container">
              <TankDetails
                tank={selectedTank}
                liveStatus={selectedTankLiveStatus}
                connectionStatus={selectedTankConnection}
              />
            </div>
          ) : selectedSite ? (
            <div className="site-summary tw-animate-fadeIn">
              <h2 className="tw-text-lg md:tw-text-2xl tw-font-bold tw-mb-4 md:tw-mb-6 tw-flex tw-items-center">
                <i className="fa-light fa-building tw-mr-2 md:tw-mr-3 tw-text-blue-600"></i>
                <span className="tw-truncate">{selectedSite.name}</span>
                <span className="tw-hidden sm:tw-inline tw-ml-2">
                  - Tank Summary
                </span>
              </h2>

              {(() => {
                const summary = getSiteTanksSummary(selectedSite.siteId);
                const statusClass = getStatusClass(summary.avgFillPercentage);

                return (
                  <>
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-3 md:tw-gap-4 tw-mb-4 md:tw-mb-6">
                      <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-rounded-lg tw-p-3 md:tw-p-4 tw-border tw-border-blue-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-xs md:tw-text-sm tw-text-gray-600 tw-font-medium">
                              Total Capacity
                            </p>
                            <p className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-blue-800">
                              {summary.totalCapacity.toLocaleString()} L
                            </p>
                          </div>
                          <i className="fa-light fa-database tw-text-2xl md:tw-text-3xl tw-text-blue-600"></i>
                        </div>
                      </div>

                      <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-green-100 tw-rounded-lg tw-p-3 md:tw-p-4 tw-border tw-border-green-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-xs md:tw-text-sm tw-text-gray-600 tw-font-medium">
                              Current Stock
                            </p>
                            <p className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-green-800">
                              {summary.totalCurrentStock.toLocaleString()} L
                            </p>
                          </div>
                          <i className="fa-light fa-oil-can tw-text-2xl md:tw-text-3xl tw-text-green-600"></i>
                        </div>
                      </div>

                      <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-rounded-lg tw-p-3 md:tw-p-4 tw-border tw-border-purple-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-xs md:tw-text-sm tw-text-gray-600 tw-font-medium">
                              Available Space
                            </p>
                            <p className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-purple-800">
                              {summary.totalAvailable.toLocaleString()} L
                            </p>
                          </div>
                          <i className="fa-light fa-chart-pie tw-text-2xl md:tw-text-3xl tw-text-purple-600"></i>
                        </div>
                      </div>
                    </div>

                    <div className="tw-mb-4 md:tw-mb-6">
                      <p className="tw-text-xs md:tw-text-sm tw-text-gray-600 tw-mb-2">
                        Overall Fill Level
                      </p>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${statusClass}`}
                          style={{ width: `${summary.avgFillPercentage}%` }}
                        />
                      </div>
                      <p className="tw-text-right tw-text-xs md:tw-text-sm tw-font-semibold tw-mt-1">
                        {summary.avgFillPercentage.toFixed(1)}%
                      </p>
                    </div>

                    <h3 className="tw-text-base md:tw-text-lg tw-font-semibold tw-mb-3 md:tw-mb-4">
                      Individual Tanks ({summary.tankCount})
                    </h3>
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-3 md:tw-gap-4">
                      {summary.tanks.map((tank) => {
                        const fillPercentage =
                          tank.tankVolume > 0
                            ? (tank.currentStock / tank.tankVolume) * 100
                            : 0;
                        const tankStatusClass = getStatusClass(fillPercentage);

                        return (
                          <div key={tank.id} className="tank-card">
                            <div className="tw-flex tw-items-center tw-mb-3">
                              <div className={`tank-icon ${tankStatusClass}`}>
                                <i className="fa-light fa-gas-pump"></i>
                              </div>
                              <div className="tw-ml-3 tw-flex-1">
                                <h4 className="tw-font-semibold tw-text-gray-800">
                                  {tank.name}
                                </h4>
                                <p className="tw-text-sm tw-text-gray-600">
                                  Capacity: {tank.tankVolume.toLocaleString()} L
                                </p>
                              </div>
                            </div>

                            <div className="tw-space-y-2">
                              <div className="tw-flex tw-justify-between tw-text-sm">
                                <span className="tw-text-gray-600">
                                  Current Stock:
                                </span>
                                <span className="tw-font-medium">
                                  {(tank.currentStock || 0).toLocaleString()} L
                                </span>
                              </div>
                              <div className="tw-flex tw-justify-between tw-text-sm">
                                <span className="tw-text-gray-600">
                                  Available:
                                </span>
                                <span className="tw-font-medium">
                                  {(
                                    tank.tankVolume - (tank.currentStock || 0)
                                  ).toLocaleString()}{" "}
                                  L
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className={`progress-fill ${tankStatusClass}`}
                                  style={{ width: `${fillPercentage}%` }}
                                />
                              </div>
                              <p className="tw-text-right tw-text-xs tw-font-semibold">
                                {fillPercentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-text-gray-500 tw-p-4">
              <div className="tw-text-center">
                <i className="fa-light fa-gas-pump tw-text-4xl md:tw-text-6xl tw-mb-3 md:tw-mb-4 tw-text-gray-300"></i>
                <p className="tw-text-base md:tw-text-xl tw-font-medium">
                  Select a site or tank to view details
                </p>
                <p className="tw-text-xs md:tw-text-sm tw-mt-2 tw-text-gray-400 tw-hidden sm:tw-block">
                  Choose a site to see all tanks summary or a specific tank for
                  detailed information
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Popup
        visible={showTankForm}
        onHiding={handleFormClose}
        dragEnabled={true}
        showTitle={true}
        title={editMode ? "Edit Tank" : "Add New Tank"}
        width="90%"
        maxWidth={600}
        height="auto"
        showCloseButton={true}
      >
        <TankForm
          tank={editMode ? selectedTank : null}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      </Popup>

      <Popup
        visible={showTankHistory}
        onHiding={() => setShowTankHistory(false)}
        dragEnabled={true}
        showTitle={true}
        title={`Tank History - ${selectedTank?.name}`}
        width="90%"
        height="90%"
        maxHeight="90vh"
        showCloseButton={true}
        contentRender={() => (
          <div style={{ height: "100%", overflow: "auto", padding: "10px" }}>
            {showTankHistory && selectedTank && (
              <TankHistory tankId={selectedTank.id} />
            )}
          </div>
        )}
      />

      <PTSDeviceLinkPopup
        visible={showPTSLink}
        tank={selectedTank}
        onLinked={handlePTSLinkSubmit}
        onClose={() => setShowPTSLink(false)}
      />

      <LoadPanel visible={loading || tanksLoading} />
    </div>
  );
};

export default TankPage;
