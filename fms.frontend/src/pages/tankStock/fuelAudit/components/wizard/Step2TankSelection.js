/**
 * Step2TankSelection.js
 * Step 2: Tank Selection with real backend data
 *
 * Tank data uses fields from TankDTO.cs:
 * - id, name, tankVolume, currentStock, fuelGradeName, ptsId, siteId
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Column, Selection, Paging, FilterRow, Scrolling } from 'devextreme-react/data-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';

import { setSelectedTanks, selectWizard } from '../../../../../redux/slices/fuelAuditSlice';
import { fetctTankbySiteId } from '../../../../../redux/actions/tankActions';

const Step2TankSelection = () => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);

  // Local state for tanks data
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Local state for selection to avoid Redux immutability issues with DevExtreme
  const [selectedKeys, setSelectedKeys] = useState([]);

  // Sync local selection with Redux state on mount
  useEffect(() => {
    setSelectedKeys(wizard.selectedTankIds ? [...wizard.selectedTankIds] : []);
  }, [wizard.selectedTankIds]);

  // Load tanks when site changes
  useEffect(() => {
    if (wizard.siteId) {
      loadTanks(wizard.siteId);
    }
  }, [wizard.siteId]);

  // Fetch tanks for the selected site
  const loadTanks = async (siteId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(fetctTankbySiteId(siteId));
      if (result.success && result.data) {
        setTanks(result.data);
      } else {
        setTanks([]);
        setError('No tanks found for this site');
      }
    } catch (err) {
      console.error('Error loading tanks:', err);
      setTanks([]);
      setError('Failed to load tanks');
      notify('Error loading tanks', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  // Handle tank selection change
  const handleSelectionChanged = (e) => {
    const newSelection = [...e.selectedRowKeys];
    setSelectedKeys(newSelection);
    dispatch(setSelectedTanks(newSelection));
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedKeys([]);
    dispatch(setSelectedTanks([]));
  };

  // Render tank status badge
  const renderStatus = (cellData) => {
    const isActive = cellData.data.isActive !== false;
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
        isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-gray-100 tw-text-gray-600'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Render fuel type with color coding
  const renderFuelType = (cellData) => {
    const fuelType = cellData.data.fuelGradeName || 'Unknown';
    const colorMap = {
      'Diesel': 'tw-bg-yellow-100 tw-text-yellow-800',
      'Petrol': 'tw-bg-blue-100 tw-text-blue-800',
      'AGO': 'tw-bg-orange-100 tw-text-orange-800',
      'PMS': 'tw-bg-purple-100 tw-text-purple-800'
    };
    const colorClass = colorMap[fuelType] || 'tw-bg-gray-100 tw-text-gray-800';

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${colorClass}`}>
        {fuelType}
      </span>
    );
  };

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
        <i className="fa-light fa-database tw-mr-2"></i>
        Select Tanks for Audit
      </h3>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Select the tanks to include in this fuel audit. Volume history will be analyzed for the selected period.
      </p>

      {/* Loading state */}
      {loading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <LoadIndicator />
          <span className="tw-ml-3 tw-text-gray-600">Loading tanks for selected site...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && tanks.length === 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700 tw-font-medium">{error}</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            Please go back and select a different site, or add tanks to this site first.
          </p>
        </div>
      )}

      {/* Tanks grid */}
      {!loading && tanks.length > 0 && (
        <>
          <DataGrid
            dataSource={tanks}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height={380}
            selectedRowKeys={selectedKeys}
            onSelectionChanged={handleSelectionChanged}
          >
            <Selection mode="multiple" showCheckBoxesMode="always" />
            <FilterRow visible={true} />
            <Scrolling mode="virtual" />
            <Paging enabled={false} />

            <Column dataField="name" caption="Tank Name" width={180} />

            <Column
              dataField="tankVolume"
              caption="Capacity (L)"
              width={120}
              dataType="number"
              format="#,##0"
              alignment="right"
            />
            <Column
              dataField="currentStock"
              caption="Current Vol (L)"
              width={130}
              dataType="number"
              format="#,##0"
              alignment="right"
            />
            <Column
              caption="Status"
              width={90}
              cellRender={renderStatus}
              alignment="center"
            />

          </DataGrid>

          {/* Selection summary */}
          <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between">
            <div className="tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-check-double tw-mr-2"></i>
              <span className="tw-font-semibold">{selectedKeys.length}</span> of {tanks.length} tanks selected
            </div>
            {selectedKeys.length > 0 && (
              <button
                className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
                onClick={handleClearSelection}
              >
                Clear selection
              </button>
            )}
          </div>
        </>
      )}

      {/* No site selected */}
      {!wizard.siteId && !loading && (
        <div className="tw-text-center tw-py-10 tw-bg-gray-50 tw-rounded-lg">
          <i className="fa-light fa-building tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <p className="tw-text-gray-600">Please select a site in Step 1 first.</p>
        </div>
      )}
    </div>
  );
};

export default Step2TankSelection;
