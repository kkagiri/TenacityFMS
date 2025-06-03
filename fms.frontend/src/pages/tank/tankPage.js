import React, { useState, useEffect, useCallback } from 'react';
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
import './tankPage.css';

const TankPage = () => {
  const dispatch = useDispatch();
  const { tanks, loading: tanksLoading } = useSelector(state => state.tank);
  const { sites } = useSelector(state => state.site);
  const { user } = useSelector(state => state.auth);

  // Get user roles from auth state
  const userRoles = user ? user.roles : [];

  const [selectedTank, setSelectedTank] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [showTankForm, setShowTankForm] = useState(false);
  const [showTankHistory, setShowTankHistory] = useState(false);
  const [showPTSLink, setShowPTSLink] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchTanks());
    dispatch(fetchSiteList());
  }, [dispatch]);

  useEffect(() => {
    // Transform data for tree structure
    if (sites && tanks) {
      const transformedData = sites.map(site => ({
        id: `site_${site.id}`,
        name: site.name,
        type: 'site',
      }));

      tanks.forEach(tank => {
        transformedData.push({
          id: `tank_${tank.id}`,
          parentId: `site_${tank.siteId}`,
          name: tank.name,
          type: 'tank',
          tankData: tank,
          icon: 'fas fa-gas-pump',
          volume: tank.tankVolume,
          currentStock: tank.currentStock
        });
      });

      setTreeData(transformedData);
    }
  }, [sites, tanks]);

  const handleTreeSelection = useCallback((e) => {
    const selectedItem = e.selectedRowsData[0];
    if (selectedItem && selectedItem.type === 'tank') {
      setSelectedTank(selectedItem.tankData);
    } else {
      setSelectedTank(null);
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

  const treeColumns = (
    <>
      <Column dataField="name" caption="Name" />
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
      <Column
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
      />
    </>
  );

  return (
    <div className="tank-page tw-h-full tw-flex tw-flex-col">
      <Toolbar className="tw-mb-4">
        <Item location="before">
          <div className="tw-text-xl tw-font-semibold">Tank Management</div>
        </Item>
        <Item location="after">
          <Button
            text="Add Tank"
            icon="plus"
            onClick={handleAddTank}
            type="default"
            stylingMode="contained"
          />
        </Item>
        <Item location="after">
          <Button
            text="Edit Tank"
            icon="edit"
            onClick={handleEditTank}
            disabled={!selectedTank}
            type="normal"
          />
        </Item>
        <Item location="after">
          <Button
            text="View History"
            icon="fas fa-history"
            onClick={handleViewHistory}
            disabled={!selectedTank}
            type="normal"
          />
        </Item>
        <Item location="after">
          <Button
            text="Link PTS Device"
            icon="fas fa-link"
            onClick={handleLinkPTSDevice}
            disabled={!selectedTank}
            type="normal"
          />
        </Item>
      </Toolbar>

      <div className="tw-flex tw-flex-1 tw-gap-4 tw-overflow-hidden">
        <div className="tw-w-1/3 tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4">
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
            <SearchPanel visible={true} placeholder="Search tanks..." />
            <HeaderFilter visible={true} />
            <Selection mode="single" />
            {treeColumns}
          </TreeList>
        </div>

        <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          {selectedTank ? (
            <TankDetails tank={selectedTank} />
          ) : (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
              <div className="tw-text-center">
                <i className="fas fa-gas-pump tw-text-6xl tw-mb-4"></i>
                <p className="tw-text-xl">Select a tank to view details</p>
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
        width={800}
        height={600}
      >
        {selectedTank && <TankHistory tankId={selectedTank.id} />}
      </Popup>

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
