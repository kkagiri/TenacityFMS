import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TreeList, { Column, Selection, SearchPanel, HeaderFilter } from 'devextreme-react/tree-list';
import { Button } from 'devextreme-react/button';
import { Toolbar, Item } from 'devextreme-react/toolbar';
import { Popup } from 'devextreme-react/popup';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { fetchTanks } from '../../redux/actions/tankActions';
import {
  fetchSiteList
} from '../../redux/actions/siteActions';
import TankDetails from './components/TankDetails';
import TankForm from './components/TankForm';
import TankHistory from './components/TankHistory';
import PTSDeviceLinkPopup from './components/PTSDeviceLinkPopup';
import './tankPage.scss';

const TankPage = () => {
  const dispatch = useDispatch();
  const { tanks, loading: tanksLoading } = useSelector(state => state.tank);
  const { sites } = useSelector(state => state.site);
  const { user } = useSelector(state => state.auth);

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

  useEffect(() => {
    // Only fetch data on initial mount
    const fetchData = async () => {
      dispatch(fetchTanks());
      dispatch(fetchSiteList());
    };
    fetchData();
  }, []); // Remove dispatch dependency to prevent re-fetching

  // Memoize tree data transformation
  const transformedTreeData = useMemo(() => {
    if (!sites || !tanks) return [];

    const sitesWithTanks = sites.filter(site =>
      tanks.some(tank => tank.siteId === site.id)
    );

    const transformedData = sitesWithTanks.map(site => ({
      id: `site_${site.id}`,
      name: site.name,
      type: 'site',
      siteId: site.id,
      siteData: site
    }));

    tanks.forEach(tank => {
      // Add tank only if its parent site is in the filtered list
      if (sitesWithTanks.some(site => site.id === tank.siteId)) {
        transformedData.push({
          id: `tank_${tank.id}`,
          parentId: `site_${tank.siteId}`,
          name: tank.name,
          type: 'tank',
          tankData: tank,
          volume: tank.tankVolume,
          currentStock: tank.currentStock
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
      if (selectedItem.type === 'tank') {
        setSelectedTank(selectedItem.tankData);
        setSelectedSite(null);
      } else if (selectedItem.type === 'site') {
        setSelectedTank(null);
        setSelectedSite(selectedItem);
      }
    } else {
      setSelectedTank(null);
      setSelectedSite(null);
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

  const handleFormSubmit = () => {
    handleFormClose();
    dispatch(fetchTanks());
    notify('Tank saved successfully', 'success', 3000);
  };

  // Custom cell render to hide IDs
  const nameRender = (cellData) => {
    const { data } = cellData;
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`${data.icon} ${data.type === 'site' ? 'tw-text-blue-600' : 'tw-text-green-600'}`}></i>
        <span>{data.name}</span>
      </div>
    );
  };

  // Calculate site tank summaries - memoized to prevent recalculation
  const getSiteTanksSummary = useCallback((siteId) => {
    if (!tanks) return {
      tanks: [],
      totalCapacity: 0,
      totalCurrentStock: 0,
      totalAvailable: 0,
      avgFillPercentage: 0,
      tankCount: 0
    };

    const siteTanks = tanks.filter(tank => tank.siteId === siteId);
    const totalCapacity = siteTanks.reduce((sum, tank) => sum + (tank.tankVolume || 0), 0);
    const totalCurrentStock = siteTanks.reduce((sum, tank) => sum + (tank.currentStock || 0), 0);
    const totalAvailable = totalCapacity - totalCurrentStock;
    const avgFillPercentage = totalCapacity > 0 ? (totalCurrentStock / totalCapacity * 100) : 0;

    return {
      tanks: siteTanks,
      totalCapacity,
      totalCurrentStock,
      totalAvailable,
      avgFillPercentage,
      tankCount: siteTanks.length
    };
  }, [tanks]);

  const getStatusClass = (percentage) => {
    if (percentage >= 70) return 'full';
    if (percentage >= 30) return 'medium';
    return 'low';
  };

  const treeColumns = (
    <>
      <Column
        dataField="name"
        caption="Name"
        cellRender={nameRender}
      />
      <Column
        dataField="volume"
        caption="Capacity (L)"
        visible={false}
        cellRender={(data) => {
          if (data.data.type === 'tank') {
            return <span>{data.value?.toFixed(2) || '0.00'}</span>;
          }
          return null;
        }}
      />
      {/* <Column
        dataField="currentStock"
        caption="Current Stock (L)"
        visible={false}
        cellRender={(data) => {
          if (data.data.type === 'tank') {
            const percentage = data.data.volume > 0 ? (data.value / data.data.volume * 100).toFixed(1) : 0;
            return <span>{data.value?.toFixed(2) || '0.00'} ({percentage}%)</span>;
          }
          return null;
        }}
      /> */}
    </>
  );

  return (
    <div className=" content-block  tank-page tw-h-full tw-flex tw-flex-col">

      <Toolbar className="tw-mb-4 tw-bg-white tw-rounded-lg tw-shadow-md">
        <Item location="before">
          <div className= "tw-gap-2 tw-text-2xl tw-font-bold tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-800 tw-bg-clip-text tw-text-transparent">
            <i className="fa-light fa-gas-pump tw-mr-2"></i>
            Tank Management
          </div>
        </Item>
        <Item location="after">
          <Button
            text="Add Tank"
            icon="fa-light fa-plus-circle"
            onClick={handleAddTank}
            type="default"
            stylingMode="contained"
            className="tw-mr-2"
          />
        </Item>
        <Item location="after">
          <Button
            text="Edit Tank"
            icon="fa-light fa-edit"
            onClick={handleEditTank}
            disabled={!selectedTank}
            type="normal"
            className="tw-mr-2"
          />
        </Item>
        <Item location="after">
          <Button
            text="View History"
            icon="fa-light fa-history"
            onClick={handleViewHistory}
            disabled={!selectedTank}
            type="normal"
            className="tw-mr-2"
          />
        </Item>
        <Item location="after">
          <Button
            text="Link PTS Device"
            icon="fa-light fa-link"
            onClick={handleLinkPTSDevice}
            disabled={!selectedTank}
            type="normal"
          />
        </Item>
      </Toolbar>

      <div className="tw-flex tw-flex-1 tw-gap-4 tw-overflow-hidden">
        <div className="tw-w-1/3 tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
          <TreeList
            dataSource={treeData}
            keyExpr="id"
            parentIdExpr="parentId"
            showBorders={true}
            showRowLines={true}
            columnAutoWidth={true}
            wordWrapEnabled={true}
            onSelectionChanged={handleTreeSelection}
            height="100%"
          >
            <SearchPanel visible={true} placeholder="Search sites and tanks..." />
            <HeaderFilter visible={false} />
            <Selection mode="single" />
            {treeColumns}
          </TreeList>
        </div>

        <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
          {selectedTank ? (
            <div className="tank-details-container">
              <TankDetails tank={selectedTank} />
            </div>
          ) : selectedSite ? (
            <div className="site-summary tw-animate-fadeIn">
              <h2 className="tw-text-2xl tw-font-bold tw-mb-6 tw-flex tw-items-center">
                <i className="fa-light fa-building tw-mr-3 tw-text-blue-600"></i>
                {selectedSite.name} - Tank Summary
              </h2>

              {(() => {
                const summary = getSiteTanksSummary(selectedSite.siteId);
                const statusClass = getStatusClass(summary.avgFillPercentage);

                return (
                  <>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-6">
                      <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-sm tw-text-gray-600 tw-font-medium">Total Capacity</p>
                            <p className="tw-text-2xl tw-font-bold tw-text-blue-800">{summary.totalCapacity.toLocaleString()} L</p>
                          </div>
                          <i className="fa-light fa-database tw-text-3xl tw-text-blue-600"></i>
                        </div>
                      </div>

                      <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-green-100 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-sm tw-text-gray-600 tw-font-medium">Current Stock</p>
                            <p className="tw-text-2xl tw-font-bold tw-text-green-800">{summary.totalCurrentStock.toLocaleString()} L</p>
                          </div>
                          <i className="fa-light fa-oil-can tw-text-3xl tw-text-green-600"></i>
                        </div>
                      </div>

                      <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-to-purple-100 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <div>
                            <p className="tw-text-sm tw-text-gray-600 tw-font-medium">Available Space</p>
                            <p className="tw-text-2xl tw-font-bold tw-text-purple-800">{summary.totalAvailable.toLocaleString()} L</p>
                          </div>
                          <i className="fa-light fa-chart-pie tw-text-3xl tw-text-purple-600"></i>
                        </div>
                      </div>
                    </div>

                    <div className="tw-mb-6">
                      <p className="tw-text-sm tw-text-gray-600 tw-mb-2">Overall Fill Level</p>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${statusClass}`}
                          style={{ width: `${summary.avgFillPercentage}%` }}
                        />
                      </div>
                      <p className="tw-text-right tw-text-sm tw-font-semibold tw-mt-1">{summary.avgFillPercentage.toFixed(1)}%</p>
                    </div>

                    <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Individual Tanks ({summary.tankCount})</h3>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                      {summary.tanks.map(tank => {
                        const fillPercentage = tank.tankVolume > 0 ? (tank.currentStock / tank.tankVolume * 100) : 0;
                        const tankStatusClass = getStatusClass(fillPercentage);

                        return (
                          <div key={tank.id} className="tank-card">
                            <div className="tw-flex tw-items-center tw-mb-3">
                              <div className={`tank-icon ${tankStatusClass}`}>
                                <i className="fa-light fa-gas-pump"></i>
                              </div>
                              <div className="tw-ml-3 tw-flex-1">
                                <h4 className="tw-font-semibold tw-text-gray-800">{tank.name}</h4>
                                <p className="tw-text-sm tw-text-gray-600">Capacity: {tank.tankVolume.toLocaleString()} L</p>
                              </div>
                            </div>

                            <div className="tw-space-y-2">
                              <div className="tw-flex tw-justify-between tw-text-sm">
                                <span className="tw-text-gray-600">Current Stock:</span>
                                <span className="tw-font-medium">{(tank.currentStock || 0).toLocaleString()} L</span>
                              </div>
                              <div className="tw-flex tw-justify-between tw-text-sm">
                                <span className="tw-text-gray-600">Available:</span>
                                <span className="tw-font-medium">{(tank.tankVolume - (tank.currentStock || 0)).toLocaleString()} L</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className={`progress-fill ${tankStatusClass}`}
                                  style={{ width: `${fillPercentage}%` }}
                                />
                              </div>
                              <p className="tw-text-right tw-text-xs tw-font-semibold">{fillPercentage.toFixed(1)}%</p>
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
            <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
              <div className="tw-text-center">
                <i className="fa-light fa-gas-pump tw-text-6xl tw-mb-4 tw-text-gray-300"></i>
                <p className="tw-text-xl tw-font-medium">Select a site or tank to view details</p>
                <p className="tw-text-sm tw-mt-2 tw-text-gray-400">Choose a site to see all tanks summary or a specific tank for detailed information</p>
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
        title={editMode ? 'Edit Tank' : 'Add New Tank'}
        width={600}
        height="auto"
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
        closeOnOutsideClick={false}
        contentRender={() => (
          <div style={{ height: '100%', overflow: 'auto', padding: '10px' }}>
            {showTankHistory && selectedTank && <TankHistory tankId={selectedTank.id} />}
          </div>
        )}
      />

      <PTSDeviceLinkPopup
        visible={showPTSLink}
        tank={selectedTank}
        onClose={() => setShowPTSLink(false)}
      />

      <LoadPanel visible={loading || tanksLoading} />
    </div>
  );
};

export default TankPage;
