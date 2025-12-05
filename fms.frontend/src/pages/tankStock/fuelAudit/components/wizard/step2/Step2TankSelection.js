/**
 * Step2TankSelection.js
 * Step 2: Tank Selection with multi-site support
 *
 * Tank data uses fields from TankDTO.cs:
 * - id, name, tankVolume, currentStock, fuelGradeName, ptsId, siteId
 *
 * Multi-site: Loads tanks from all selected sites and groups them by site
 */

import React, { useEffect, useState, memo, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Column, Selection, Paging, Scrolling, FilterRow } from 'devextreme-react/data-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';

import { setSelectedTanks, setTanksBySite, clearTanksData, selectWizard } from '../../../../../../redux/slices/fuelAuditSlice';
import { fetctTankbySiteId } from '../../../../../../redux/actions/tankActions';

const Step2TankSelection = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const sites = useSelector((state) => state.site?.sites || []);

  // Local state
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState(null);
  // Local state for selection to avoid Redux immutability issues with DevExtreme
  const [selectedKeys, setSelectedKeys] = useState([]);

  // Refs for DataGrid instances to ensure proper cleanup
  const gridRefs = useRef({});

  // Get site IDs from wizard (ensure array)
  const siteIds = useMemo(() => {
    return Array.isArray(wizard.siteIds) ? wizard.siteIds : [];
  }, [wizard.siteIds]);

  // Get tanks by site from wizard state
  const tanksBySite = useMemo(() => {
    return wizard.tanksBySite || {};
  }, [wizard.tanksBySite]);

  // Get all tanks flattened with site info
  const allTanks = useMemo(() => {
    const tanks = [];
    Object.entries(tanksBySite).forEach(([siteId, siteTanks]) => {
      const site = sites.find(s => (s.id || s.siteId) === parseInt(siteId));
      const siteName = site?.name || site?.siteName || `Site ${siteId}`;
      siteTanks.forEach(tank => {
        tanks.push({
          ...tank,
          siteName,
          siteId: parseInt(siteId)
        });
      });
    });
    return tanks;
  }, [tanksBySite, sites]);

  // Sync local selection with Redux state on mount
  useEffect(() => {
    setSelectedKeys(wizard.selectedTankIds ? [...wizard.selectedTankIds] : []);
  }, [wizard.selectedTankIds]);

  // Cleanup DataGrid instances on unmount to prevent DOM errors
  useEffect(() => {
    // Store current refs for cleanup
    const currentRefs = gridRefs.current;

    return () => {
      // Dispose all grid instances before unmounting
      Object.values(currentRefs).forEach(ref => {
        if (ref?.instance) {
          try {
            ref.instance.dispose();
          } catch (e) {
            // Ignore disposal errors
          }
        }
      });
    };
  }, []);

  // Load tanks when site selection changes
  useEffect(() => {
    if (siteIds.length > 0) {
      loadAllTanks(siteIds);
    } else {
      dispatch(clearTanksData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(siteIds)]);

  // Fetch tanks for all selected sites
  const loadAllTanks = async (selectedSiteIds) => {
    setLoading(true);
    setError(null);
    setLoadingProgress({ loaded: 0, total: selectedSiteIds.length });

    // Clear previous tanks
    dispatch(clearTanksData());

    let hasError = false;
    let loadedCount = 0;

    // Load tanks for each site
    for (const siteId of selectedSiteIds) {
      try {
        const result = await dispatch(fetctTankbySiteId(siteId));
        if (result.success && result.data) {
          dispatch(setTanksBySite({ siteId, tanks: result.data }));
        } else {
          dispatch(setTanksBySite({ siteId, tanks: [] }));
        }
      } catch (err) {
        console.error(`Error loading tanks for site ${siteId}:`, err);
        dispatch(setTanksBySite({ siteId, tanks: [] }));
        hasError = true;
      }
      loadedCount++;
      setLoadingProgress({ loaded: loadedCount, total: selectedSiteIds.length });
    }

    setLoading(false);

    if (hasError) {
      notify('Some tanks could not be loaded', 'warning', 3000);
    }

    if (allTanks.length === 0 && !hasError) {
      setError('No tanks found for the selected sites');
    }
  };

  // Handle tank selection change
  const handleSelectionChanged = useCallback((e) => {
    const newSelection = [...e.selectedRowKeys];
    setSelectedKeys(newSelection);
    dispatch(setSelectedTanks(newSelection));
  }, [dispatch]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedKeys([]);
    dispatch(setSelectedTanks([]));
  }, [dispatch]);

  // Handle select all for a specific site
  const handleSelectAllForSite = useCallback((siteId) => {
    const siteTanks = tanksBySite[siteId] || [];
    const siteTankIds = siteTanks.map(t => t.id);
    const newSelection = [...new Set([...selectedKeys, ...siteTankIds])];
    setSelectedKeys(newSelection);
    dispatch(setSelectedTanks(newSelection));
  }, [tanksBySite, selectedKeys, dispatch]);

  // Handle deselect all for a specific site
  const handleDeselectAllForSite = useCallback((siteId) => {
    const siteTanks = tanksBySite[siteId] || [];
    const siteTankIds = new Set(siteTanks.map(t => t.id));
    const newSelection = selectedKeys.filter(id => !siteTankIds.has(id));
    setSelectedKeys(newSelection);
    dispatch(setSelectedTanks(newSelection));
  }, [tanksBySite, selectedKeys, dispatch]);

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

  // Get count of selected tanks per site
  const getSelectedCountForSite = useCallback((siteId) => {
    const siteTanks = tanksBySite[siteId] || [];
    const siteTankIds = new Set(siteTanks.map(t => t.id));
    return selectedKeys.filter(id => siteTankIds.has(id)).length;
  }, [tanksBySite, selectedKeys]);

  // Single site view (simpler UI)
  const renderSingleSiteView = () => {
    const tanks = allTanks;
    return (
      <DataGrid
        ref={(ref) => { gridRefs.current['single'] = ref; }}
        dataSource={tanks}
        keyExpr="id"
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        height={300}
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
    );
  };

  // Multi-site view (grouped by site with accordion)
  const renderMultiSiteView = () => {
    return (
      <div className="tw-space-y-3">
        {siteIds.map(siteId => {
          const site = sites.find(s => (s.id || s.siteId) === siteId);
          const siteName = site?.name || site?.siteName || `Site ${siteId}`;
          const siteTanks = tanksBySite[siteId] || [];
          const selectedCount = getSelectedCountForSite(siteId);

          return (
            <div key={siteId} className="tw-border tw-rounded tw-overflow-hidden">
              {/* Site Header */}
              <div className="tw-bg-gray-100 tw-px-3 tw-py-2 tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-building tw-mr-2 tw-text-blue-600 tw-text-sm"></i>
                  <span className="tw-font-medium tw-text-sm tw-text-gray-800">{siteName}</span>
                  <span className="tw-ml-2 tw-text-xs tw-text-gray-500">
                    ({siteTanks.length} tank{siteTanks.length !== 1 ? 's' : ''})
                  </span>
                  {selectedCount > 0 && (
                    <span className="tw-ml-2 tw-bg-blue-100 tw-text-blue-800 tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
                <div className="tw-flex tw-items-center tw-space-x-2">
                  <button
                    className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 tw-px-1"
                    onClick={() => handleSelectAllForSite(siteId)}
                    disabled={siteTanks.length === 0}
                  >
                    Select All
                  </button>
                  <span className="tw-text-gray-300">|</span>
                  <button
                    className="tw-text-xs tw-text-gray-600 hover:tw-text-gray-800 tw-px-1"
                    onClick={() => handleDeselectAllForSite(siteId)}
                    disabled={selectedCount === 0}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Site Tanks Grid */}
              {siteTanks.length > 0 ? (
                <DataGrid
                  ref={(ref) => { gridRefs.current[`site-${siteId}`] = ref; }}
                  dataSource={siteTanks}
                  keyExpr="id"
                  showBorders={false}
                  columnAutoWidth={true}
                  rowAlternationEnabled={true}
                  height={Math.min(150, 40 + siteTanks.length * 35)}
                  selectedRowKeys={selectedKeys.filter(id => siteTanks.some(t => t.id === id))}
                  onSelectionChanged={handleSelectionChanged}
                >
                  <Selection mode="multiple" showCheckBoxesMode="always" />
                  <Scrolling mode="standard" />
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
              ) : (
                <div className="tw-p-3 tw-text-center tw-text-gray-500 tw-text-xs">
                  <i className="fa-light fa-database tw-mr-1"></i>
                  No tanks found for this site
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="wizard-step tw-p-4 tw-max-w-4xl tw-mx-auto">
      <h3 className="tw-text-base tw-font-semibold tw-mb-2">
        <i className="fa-light fa-database tw-mr-2"></i>
        Select Tanks for Audit
      </h3>
      <p className="tw-text-xs tw-text-gray-600 tw-mb-3">
        {siteIds.length > 1
          ? `Select tanks from ${siteIds.length} sites to include in this audit.`
          : 'Select the tanks to include in this fuel audit.'
        }
      </p>

      {/* Loading state */}
      {loading && (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8">
          <LoadIndicator />
          <span className="tw-mt-2 tw-text-xs tw-text-gray-600">
            Loading tanks... ({loadingProgress.loaded}/{loadingProgress.total} sites)
          </span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && allTanks.length === 0 && (
        <div className="tw-text-center tw-py-6 tw-bg-yellow-50 tw-rounded tw-border tw-border-yellow-200">
          <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-yellow-500 tw-mb-2"></i>
          <p className="tw-text-sm tw-text-gray-700 tw-font-medium">{error}</p>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Please go back and select different sites.
          </p>
        </div>
      )}

      {/* Tanks display */}
      {!loading && allTanks.length > 0 && (
        <>
          {siteIds.length === 1 ? renderSingleSiteView() : renderMultiSiteView()}

          {/* Selection summary */}
          <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-p-2 tw-bg-gray-50 tw-rounded tw-border">
            <div className="tw-text-xs tw-text-gray-600">
              <i className="fa-light fa-check-double tw-mr-1"></i>
              <span className="tw-font-semibold">{selectedKeys.length}</span> of {allTanks.length} tanks selected
              {siteIds.length > 1 && (
                <span className="tw-ml-1 tw-text-gray-400">
                  (across {siteIds.length} sites)
                </span>
              )}
            </div>
            {selectedKeys.length > 0 && (
              <button
                className="tw-text-xs tw-text-red-600 hover:tw-text-red-800 tw-flex tw-items-center"
                onClick={handleClearSelection}
              >
                <i className="fa-light fa-times tw-mr-1"></i>
                Clear all
              </button>
            )}
          </div>
        </>
      )}

      {/* No sites selected */}
      {siteIds.length === 0 && !loading && (
        <div className="tw-text-center tw-py-6 tw-bg-gray-50 tw-rounded">
          <i className="fa-light fa-building tw-text-2xl tw-text-gray-400 tw-mb-2"></i>
          <p className="tw-text-sm tw-text-gray-600">Please select at least one site in Step 1.</p>
        </div>
      )}
    </div>
  );
}
);

Step2TankSelection.displayName = 'Step2TankSelection';

export default Step2TankSelection;
