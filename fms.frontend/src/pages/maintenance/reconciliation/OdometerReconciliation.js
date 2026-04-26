import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DataGrid } from 'devextreme-react';
import {
  Column,
  Paging,
  SearchPanel,
  HeaderFilter,
  FilterRow,
  Scrolling,
  Selection,
  Toolbar,
  Item,
  Grouping,
  GroupPanel,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { CheckBox } from 'devextreme-react/check-box';
import { Popup } from 'devextreme-react/popup';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { Tooltip } from 'devextreme-react/tooltip';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import {
  getAllVehicleOdometerStatus,
  syncOdometerFromGPS,
  syncOdometerToGPS,
  batchSyncFromGPS,
  getOdometerSourceLabel,
  getOdometerSourceIcon,
  OdometerSource,
} from '../../../api/odometerSyncApi';

/**
 * Odometer Reconciliation Component
 * Compare GPS odometer readings with database values
 * Allow bulk updates from GPS to Database
 */
const OdometerReconciliation = () => {
  const dataGridRef = useRef(null);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(true);

  // Grouping state
  const [groupBy, setGroupBy] = useState('none');
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true);

  // Diagnostic popup state
  const [diagnosticPopupVisible, setDiagnosticPopupVisible] = useState(false);
  const [diagnosticVehicle, setDiagnosticVehicle] = useState(null);

  // Bulk update state
  const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [bulkSyncDirection, setBulkSyncDirection] = useState('from-gps');
  const [updateProgress, setUpdateProgress] = useState({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
  });

  // Show diagnostic popup for a vehicle
  const handleShowDiagnostic = (vehicle) => {
    setDiagnosticVehicle(vehicle);
    setDiagnosticPopupVisible(true);
  };

  const fetchComparisons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllVehicleOdometerStatus(onlyDiscrepancies);

      if (response.isSuccess) {
        // Transform data to match the grid's expected format
        const transformedData = (response.data || []).map((item) => {
          // GPS reading conversion:
          // - For odometer (averageKmL=true): value is in meters, convert to km (÷1000)
          // - For engine hours (averageKmL=false): value is in seconds, convert to hours (÷3600)
          let gpsOdometer = null;
          if (item.gpsReading != null) {
            gpsOdometer = item.averageKmL
              ? item.gpsReading / 1000  // meters to km
              : item.gpsReading / 3600; // seconds to hours
          }

          return {
            vehicleId: item.vehicleId,
            vehicleCode: item.vehicleCode,
            numberPlate: item.numberPlate,
            averageKmL: item.averageKmL,
            unit: item.averageKmL ? 'km' : 'hr',
            siteId: item.siteId,
            siteName: item.siteName || 'Unassigned',
            vehicleTypeId: item.vehicleTypeId,
            vehicleTypeName: item.vehicleTypeName || 'Unknown',
            hasGpsMapping: item.hasGPSMapping,
            gpsUserId: item.gpsUserId,
            gpsAccumulatorId: item.gpsAccumulatorId,
            gpsOdometer,
            gpsTimestamp: item.gpsReadingTimestamp,
            databaseOdometer: item.storedPhysicalReading ? parseFloat(item.storedPhysicalReading) : null,
            fuelingOdometer: item.fuelingReading,
            fuelingSource: item.fuelingSource,
            fuelingTimestamp: item.fuelingTimestamp,
            recommendedReading: item.recommendedReading,
            recommendedSource: item.recommendedSource,
            recommendedSourceLabel: getOdometerSourceLabel(item.recommendedSource),
            recommendedTimestamp: item.recommendedTimestamp,
            syncNeeded: item.syncNeeded,
            discrepancy: item.readingDifference,
            hasSignificantDiscrepancy: item.syncNeeded,
            discrepancyPercentage: item.fuelingReading && item.readingDifference
              ? (item.readingDifference / item.fuelingReading) * 100
              : null,
          };
        });

        setComparisons(transformedData);
        notify(
          `Loaded ${transformedData.length} vehicles`,
          'success',
          2000
        );
      } else {
        notify(response.message || 'Failed to load comparisons', 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching odometer comparisons:', error);
      notify('Error loading odometer comparisons', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, [onlyDiscrepancies]);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  // Handle bulk sync for selected vehicles
  const handleBulkSync = async (direction) => {
    if (selectedVehicles.length === 0) {
      notify('Please select vehicles to update', 'warning', 2000);
      return;
    }

    // Filter vehicles that have GPS mapping
    const validVehicles = selectedVehicles.filter(v => v.hasGpsMapping);

    if (validVehicles.length === 0) {
      notify('Selected vehicles have no GPS mapping', 'warning', 3000);
      return;
    }

    // Show confirmation dialog
    const action = direction === 'from-gps'
      ? 'Pull GPS readings to update database'
      : 'Push database readings to GPS';
    const confirmed = await confirm(
      `<div class="tw-text-center">
        <p class="tw-mb-2"><strong>${action}</strong></p>
        <p>This will sync <strong>${validVehicles.length}</strong> vehicle(s)</p>
        <p class="tw-text-sm tw-text-gray-600 tw-mt-2">Vehicles: ${validVehicles.slice(0, 5).map(v => v.vehicleCode).join(', ')}${validVehicles.length > 5 ? ` and ${validVehicles.length - 5} more...` : ''}</p>
      </div>`,
      'Confirm Bulk Sync'
    );
    if (!confirmed) return;

    setBulkSyncDirection(direction);
    setUpdateProgress({
      total: validVehicles.length,
      processed: 0,
      success: 0,
      failed: 0,
    });
    setUpdatePopupVisible(true);
    setUpdating(true);

    let successCount = 0;
    let failCount = 0;

    try {
      // Process each vehicle individually
      for (const vehicle of validVehicles) {
        try {
          let response;
          if (direction === 'from-gps') {
            response = await syncOdometerFromGPS(vehicle.vehicleId);
          } else {
            response = await syncOdometerToGPS(vehicle.vehicleId);
          }

          if (response.isSuccess && response.data?.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }

        setUpdateProgress(prev => ({
          ...prev,
          processed: successCount + failCount,
          success: successCount,
          failed: failCount,
        }));
      }

      const action = direction === 'from-gps' ? 'pulled from GPS' : 'pushed to GPS';
      notify(
        `${successCount} vehicles ${action} successfully`,
        successCount > 0 ? 'success' : 'warning',
        3000
      );

      // Refresh data
      await fetchComparisons();
      setSelectedVehicles([]);
    } catch (error) {
      console.error('Error during bulk sync:', error);
      notify('Error syncing vehicle odometers', 'error', 3000);
    } finally {
      setUpdating(false);
    }
  };

  // Grouping handlers
  const handleGroupByChange = useCallback((e) => {
    const value = e.value;
    setGroupBy(value);

    const gridInstance = dataGridRef.current?.instance;
    if (!gridInstance) return;

    // Clear existing grouping
    gridInstance.clearGrouping();

    if (value === 'site') {
      gridInstance.columnOption('siteName', 'groupIndex', 0);
    } else if (value === 'type') {
      gridInstance.columnOption('vehicleTypeName', 'groupIndex', 0);
    } else if (value === 'site-type') {
      gridInstance.columnOption('siteName', 'groupIndex', 0);
      gridInstance.columnOption('vehicleTypeName', 'groupIndex', 1);
    }
  }, []);

  const handleClearGrouping = useCallback(() => {
    setGroupBy('none');
    const gridInstance = dataGridRef.current?.instance;
    if (gridInstance) {
      gridInstance.clearGrouping();
    }
  }, []);

  const handleToggleExpandGroups = useCallback(() => {
    setIsGroupsExpanded(prev => !prev);
  }, []);

  // Handle single vehicle sync with confirmation
  const handleSingleSync = async (vehicleId, direction = 'from-gps', skipConfirm = false) => {
    // Find vehicle info for confirmation message
    const vehicle = comparisons.find(v => v.vehicleId === vehicleId);
    const vehicleName = vehicle?.vehicleCode || `ID: ${vehicleId}`;
    const action = direction === 'from-gps'
      ? 'Pull GPS reading to update database'
      : 'Push database reading to GPS';

    // Format readings for display
    const formatReading = (value, unit) => {
      if (value == null) return 'N/A';
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
    };

    const gpsDisplay = formatReading(vehicle?.gpsOdometer, vehicle?.unit);
    const dbDisplay = formatReading(vehicle?.databaseOdometer, vehicle?.unit);
    const fuelDisplay = formatReading(vehicle?.fuelingOdometer, vehicle?.unit);

    // Show confirmation unless skipConfirm is true
    if (!skipConfirm) {
      const confirmed = await confirm(
        `<div style="text-align: center;">
          <p style="margin-bottom: 8px;"><strong>${action}</strong></p>
          <p>Vehicle: <strong>${vehicleName}</strong></p>
          <table style="margin: 12px auto; text-align: left; border-collapse: collapse;">
            <tr><td style="padding: 4px 8px; color: #2563eb;"><strong>GPS:</strong></td><td style="padding: 4px 8px;">${gpsDisplay}</td></tr>
            <tr><td style="padding: 4px 8px; color: #16a34a;"><strong>Database:</strong></td><td style="padding: 4px 8px;">${dbDisplay}</td></tr>
            <tr><td style="padding: 4px 8px; color: #d97706;"><strong>Fueling:</strong></td><td style="padding: 4px 8px;">${fuelDisplay}</td></tr>
          </table>
          <p style="font-size: 12px; color: #6b7280;">
            ${direction === 'from-gps'
              ? 'GPS reading will replace the database value'
              : 'Fueling reading will be sent to GPS'}
          </p>
        </div>`,
        'Confirm Sync'
      );
      if (!confirmed) return;
    }

    try {
      let response;
      if (direction === 'from-gps') {
        response = await syncOdometerFromGPS(vehicleId);
      } else {
        response = await syncOdometerToGPS(vehicleId);
      }

      if (response.isSuccess && response.data?.success) {
        notify(response.data.message || 'Sync completed', 'success', 2000);
      } else {
        notify(response.message || response.data?.message || 'Sync failed', 'error', 3000);
      }

      // Always refresh data after sync attempt to show current state
      await fetchComparisons();
    } catch (error) {
      console.error('Error syncing vehicle:', error);
      notify('Error syncing vehicle odometer', 'error', 3000);
      // Refresh even on error to ensure data is current
      await fetchComparisons();
    }
  };

  const renderDiscrepancyCell = (data) => {
    const discrepancy = data.value;
    const unit = data.data.unit || 'km';
    if (discrepancy == null) {
      return <span className="tw-text-gray-400">-</span>;
    }

    const isSignificant = data.data.hasSignificantDiscrepancy;
    const colorClass = isSignificant
      ? 'tw-text-red-600 tw-font-semibold'
      : 'tw-text-gray-700';

    return (
      <div className={`tw-flex tw-items-center tw-gap-2 ${colorClass}`}>
        {isSignificant && <i className="fa-light fa-exclamation-triangle"></i>}
        <span>{discrepancy.toFixed(1)} {unit}</span>
      </div>
    );
  };

  const renderGpsOdometerCell = (data) => {
    const value = data.value;
    const unit = data.data.unit || 'km';
    if (value == null) {
      return <span className="tw-text-gray-400">No GPS data</span>;
    }

    return (
      <div className="tw-flex tw-items-center tw-gap-1">
        <i className="fa-light fa-satellite-dish tw-text-blue-600"></i>
        <span className="tw-font-mono">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit}</span>
      </div>
    );
  };

  const renderDatabaseOdometerCell = (data) => {
    const value = data.value;
    const unit = data.data.unit || 'km';
    if (value == null) {
      return <span className="tw-text-gray-400">Not set</span>;
    }

    return (
      <span className="tw-font-mono">{value.toLocaleString()} {unit}</span>
    );
  };

  const renderMappingStatusCell = (data) => {
    const hasMapping = data.data.hasGpsMapping;

    if (!hasMapping) {
      return (
        <span className="tw-text-gray-400 tw-text-sm">
          <i className="fa-light fa-circle-xmark tw-mr-1"></i>
          No GPS
        </span>
      );
    }

    return (
      <div className="tw-text-sm tw-text-green-600">
        <i className="fa-light fa-check-circle tw-mr-1"></i>
        Mapped
      </div>
    );
  };

  const renderTimestampCell = (data) => {
    const timestamp = data.value;
    if (!timestamp) {
      return <span className="tw-text-gray-400">-</span>;
    }

    const date = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - date) / (1000 * 60 * 60);

    const isStale = hoursDiff > 24;
    const colorClass = isStale ? 'tw-text-orange-600' : 'tw-text-gray-700';

    return (
      <div className={`tw-text-sm ${colorClass}`}>
        <div>{date.toLocaleDateString()}</div>
        <div className="tw-text-xs">{date.toLocaleTimeString()}</div>
        {isStale && (
          <div className="tw-text-xs">
            <i className="fa-light fa-clock tw-mr-1"></i>
            {Math.round(hoursDiff)}h ago
          </div>
        )}
      </div>
    );
  };

  const statistics = {
    total: comparisons.length,
    withGps: comparisons.filter(c => c.hasGpsMapping).length,
    withDiscrepancies: comparisons.filter(c => c.hasSignificantDiscrepancy).length,
    avgDiscrepancy: comparisons.length > 0
      ? comparisons.reduce((sum, c) => sum + (c.discrepancy || 0), 0) / comparisons.length
      : 0,
  };

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        {/* Header */}
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-start">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                Odometer Reconciliation
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Compare GPS odometer readings with database values and bulk update
              </p>
              {/* Help Section */}
              <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-max-w-2xl">
                <div className="tw-flex tw-items-start tw-gap-2">
                  <i className="fa-light fa-circle-info tw-text-blue-600 tw-mt-0.5"></i>
                  <div className="tw-text-sm tw-text-blue-800">
                    <p className="tw-font-medium tw-mb-1">How it works:</p>
                    <ul className="tw-list-disc tw-list-inside tw-space-y-1 tw-text-blue-700">
                      <li><strong>GPS Odometer:</strong> Real-time reading from the vehicle's GPS tracker</li>
                      <li><strong>DB Odometer:</strong> Physical odometer stored in the database</li>
                      <li><strong>Fueling Reading:</strong> Last odometer recorded during fuel refill</li>
                      <li><strong>Discrepancy:</strong> Difference that may require syncing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-2">
              <div className="tw-flex tw-gap-2">
                <Button
                  icon="fa-light fa-refresh"
                  text="Refresh"
                  onClick={fetchComparisons}
                  disabled={loading}
                />
              </div>
              {/* Bulk Sync Buttons */}
              <div className="tw-flex tw-gap-2">
                <Button
                  icon="fa-light fa-cloud-arrow-down"
                  text={`Pull from GPS (${selectedVehicles.length})`}
                  type="default"
                  stylingMode="outlined"
                  onClick={() => handleBulkSync('from-gps')}
                  disabled={selectedVehicles.length === 0 || loading}
                  hint="Pull GPS readings to update database for selected vehicles"
                />
                <Button
                  icon="fa-light fa-cloud-arrow-up"
                  text={`Push to GPS (${selectedVehicles.length})`}
                  type="success"
                  stylingMode="outlined"
                  onClick={() => handleBulkSync('to-gps')}
                  disabled={selectedVehicles.length === 0 || loading}
                  hint="Push database readings to GPS for selected vehicles"
                />
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mt-4">
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-blue-600 tw-mb-1">Total Vehicles</div>
              <div className="tw-text-2xl tw-font-bold tw-text-blue-700">
                {statistics.total}
              </div>
            </div>
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-green-600 tw-mb-1">With GPS Mapping</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-700">
                {statistics.withGps}
              </div>
            </div>
            <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-orange-600 tw-mb-1">With Discrepancies</div>
              <div className="tw-text-2xl tw-font-bold tw-text-orange-700">
                {statistics.withDiscrepancies}
              </div>
            </div>
            <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-purple-600 tw-mb-1">Avg Discrepancy</div>
              <div className="tw-text-2xl tw-font-bold tw-text-purple-700">
                {statistics.avgDiscrepancy.toFixed(0)} km
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="tw-flex tw-gap-4 tw-mt-4 tw-items-center">
            <CheckBox
              text="Only show vehicles needing sync"
              value={onlyDiscrepancies}
              onValueChanged={(e) => setOnlyDiscrepancies(e.value)}
            />
            <span className="tw-text-sm tw-text-gray-500">
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              Data synced from GPS and fueling records
            </span>
          </div>

          {/* Actions Legend */}
          <div className="tw-flex tw-gap-6 tw-mt-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Actions:</span>
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-cloud-arrow-down tw-text-blue-600"></i>
              <span>Pull from GPS (update database with GPS reading)</span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-cloud-arrow-up tw-text-green-600"></i>
              <span>Push to GPS (update GPS with database reading)</span>
            </div>
          </div>

          {/* Grouping Controls */}
          <div className="tw-flex tw-items-center tw-gap-4 tw-mt-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">Group By:</span>
              <SelectBox
                items={[
                  { value: 'none', text: 'No Grouping' },
                  { value: 'site', text: 'Site' },
                  { value: 'type', text: 'Vehicle Type' },
                  { value: 'site-type', text: 'Site → Type' },
                ]}
                valueExpr="value"
                displayExpr="text"
                value={groupBy}
                onValueChanged={handleGroupByChange}
                width={150}
              />
            </div>
            {groupBy !== 'none' && (
              <>
                <Button
                  icon={isGroupsExpanded ? 'fa-light fa-compress-alt' : 'fa-light fa-expand-alt'}
                  text={isGroupsExpanded ? 'Collapse All' : 'Expand All'}
                  stylingMode="text"
                  onClick={handleToggleExpandGroups}
                />
                <Button
                  icon="fa-light fa-times"
                  text="Clear Grouping"
                  stylingMode="text"
                  onClick={handleClearGrouping}
                />
              </>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="tw-p-6" style={{ maxHeight: 'calc(100vh - 450px)', overflow: 'auto' }}>
          <DataGrid
            ref={dataGridRef}
            dataSource={comparisons}
            keyExpr="vehicleId"
            showBorders={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            columnAutoWidth={false}
            width="100%"
            selectedRowKeys={selectedVehicles.map(v => v.vehicleId)}
            onSelectionChanged={(e) => setSelectedVehicles(e.selectedRowsData)}
          >
            <Scrolling mode="standard" columnRenderingMode="standard" />
            <Grouping autoExpandAll={isGroupsExpanded} allowCollapsing={true} />
            <GroupPanel visible={false} />
            <Selection mode="multiple" showCheckBoxesMode="always" />
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <FilterRow visible={true} />
            <Paging enabled={true} defaultPageSize={50} />

            <Column dataField="vehicleId" caption="ID" width={60} />
            <Column dataField="vehicleCode" caption="Vehicle" width={100} />
            <Column dataField="numberPlate" caption="Plate" width={90} />

            <Column dataField="siteName" caption="Site" width={100} allowGrouping={true} />

            <Column
              dataField="vehicleTypeName"
              caption="Type"
              width={100}
              allowGrouping={true}
              cellRender={(data) => {
                const isKm = data.data.averageKmL;
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <span>{data.value}</span>
                    <span className={`tw-text-xs tw-px-1 tw-rounded ${isKm ? 'tw-bg-blue-100 tw-text-blue-700' : 'tw-bg-purple-100 tw-text-purple-700'}`}>
                      {isKm ? 'km' : 'hr'}
                    </span>
                  </div>
                );
              }}
            />

            <Column
              caption="GPS Mapping"
              cellRender={renderMappingStatusCell}
              width={120}
            />

            <Column
              dataField="gpsOdometer"
              caption="GPS Reading"
              cellRender={renderGpsOdometerCell}
              width={140}
            />

            <Column
              dataField="gpsTimestamp"
              caption="GPS Updated"
              cellRender={renderTimestampCell}
              width={120}
            />

            <Column
              dataField="databaseOdometer"
              caption="DB Reading"
              cellRender={renderDatabaseOdometerCell}
              width={120}
            />

            <Column
              dataField="fuelingOdometer"
              caption="Fueling"
              width={130}
              cellRender={(data) => {
                const value = data.value;
                const source = data.data.fuelingSource;
                const unit = data.data.unit || 'km';
                if (value == null) {
                  return <span className="tw-text-gray-400">No data</span>;
                }
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <i className="fa-light fa-gas-pump tw-text-amber-600"></i>
                    <span className="tw-font-mono">{value.toLocaleString()} {unit}</span>
                  </div>
                );
              }}
            />

            <Column
              dataField="fuelingTimestamp"
              caption="Fuel Date"
              width={100}
              cellRender={(data) => {
                const timestamp = data.value;
                if (!timestamp) {
                  return <span className="tw-text-gray-400">-</span>;
                }
                const date = new Date(timestamp);
                return (
                  <div className="tw-text-sm tw-text-gray-700">
                    <div>{date.toLocaleDateString()}</div>
                  </div>
                );
              }}
            />

            <Column
              dataField="discrepancy"
              caption="Discrepancy"
              cellRender={renderDiscrepancyCell}
              width={140}
              sortOrder="desc"
            />

            <Column
              dataField="recommendedReading"
              caption="Recommended"
              width={150}
              cellRender={(data) => {
                const reading = data.value;
                const sourceLabel = data.data.recommendedSourceLabel;
                const sourceValue = data.data.recommendedSource;
                const unit = data.data.unit || 'km';
                if (reading == null || sourceValue == null) {
                  return <span className="tw-text-gray-400">-</span>;
                }

                const sourceColors = {
                  [OdometerSource.GPS]: 'tw-text-blue-600',
                  [OdometerSource.FuelRefill]: 'tw-text-amber-600',
                  [OdometerSource.PumpTransaction]: 'tw-text-orange-600',
                  [OdometerSource.ManualEntry]: 'tw-text-green-600'
                };
                const colorClass = sourceColors[sourceValue] || 'tw-text-gray-600';

                return (
                  <div className="tw-flex tw-flex-col">
                    <span className={`tw-font-mono tw-font-medium ${colorClass}`}>
                      {reading.toLocaleString(undefined, { maximumFractionDigits: 1 })} {unit}
                    </span>
                    <span className="tw-text-xs tw-text-gray-500">{sourceLabel}</span>
                  </div>
                );
              }}
            />

            <Column
              caption="Actions"
              width={120}
              fixed={true}
              fixedPosition="right"
              cellRender={(data) => {
                const row = data.data;
                return (
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <Button
                      icon="fa-light fa-magnifying-glass-chart"
                      stylingMode="text"
                      hint="View diagnostic details"
                      onClick={() => handleShowDiagnostic(row)}
                      elementAttr={{ class: 'tw-text-purple-600' }}
                    />
                    {row.hasGpsMapping ? (
                      <>
                        <Button
                          icon="fa-light fa-cloud-arrow-down"
                          stylingMode="text"
                          hint="Pull from GPS: Updates database with GPS reading"
                          onClick={() => handleSingleSync(row.vehicleId, 'from-gps')}
                          elementAttr={{ class: 'tw-text-blue-600' }}
                        />
                        <Button
                          icon="fa-light fa-cloud-arrow-up"
                          stylingMode="text"
                          hint="Push to GPS: Updates GPS with database reading"
                          onClick={() => handleSingleSync(row.vehicleId, 'to-gps')}
                          elementAttr={{ class: 'tw-text-green-600' }}
                        />
                      </>
                    ) : (
                      <span className="tw-text-gray-400 tw-text-xs">No GPS</span>
                    )}
                  </div>
                );
              }}
            />
          </DataGrid>
        </div>
      </div>

      {/* Bulk Update Progress Popup */}
      <Popup
        visible={updatePopupVisible}
        onHiding={() => setUpdatePopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showCloseButton={!updating}
        showTitle={true}
        title={bulkSyncDirection === 'from-gps' ? 'Pulling from GPS to Database' : 'Pushing from Database to GPS'}
        width={500}
        height="auto"
      >
        <div className="tw-p-6">
          {/* Direction Indicator */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4 tw-p-3 tw-rounded-lg tw-bg-gray-50">
            <i className={`fa-light ${bulkSyncDirection === 'from-gps' ? 'fa-cloud-arrow-down tw-text-blue-600' : 'fa-cloud-arrow-up tw-text-green-600'} tw-text-2xl`}></i>
            <div>
              <div className="tw-font-medium tw-text-gray-800">
                {bulkSyncDirection === 'from-gps' ? 'Pull from GPS' : 'Push to GPS'}
              </div>
              <div className="tw-text-sm tw-text-gray-600">
                {bulkSyncDirection === 'from-gps'
                  ? 'Updating database with GPS readings'
                  : 'Updating GPS with database readings'}
              </div>
            </div>
          </div>
          <div className="tw-mb-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                Progress: {updateProgress.processed} / {updateProgress.total}
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-blue-600">
                {updateProgress.total > 0
                  ? Math.round((updateProgress.processed / updateProgress.total) * 100)
                  : 0}
                %
              </span>
            </div>

            <ProgressBar
              min={0}
              max={updateProgress.total}
              value={updateProgress.processed}
              showStatus={false}
            />
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-green-600 tw-mb-1">Successful</div>
              <div className="tw-text-2xl tw-font-bold tw-text-green-700">
                {updateProgress.success}
              </div>
            </div>

            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-3">
              <div className="tw-text-xs tw-text-red-600 tw-mb-1">Failed</div>
              <div className="tw-text-2xl tw-font-bold tw-text-red-700">
                {updateProgress.failed}
              </div>
            </div>
          </div>

          {!updating && updateProgress.processed === updateProgress.total && (
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3 tw-mb-4">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-check-circle tw-text-green-600"></i>
                <span className="tw-text-sm tw-text-green-800 tw-font-medium">
                  Update completed successfully!
                </span>
              </div>
            </div>
          )}

          {!updating && (
            <div className="tw-flex tw-justify-end tw-mt-4">
              <Button
                stylingMode="contained"
                text="Close"
                onClick={() => setUpdatePopupVisible(false)}
              />
            </div>
          )}
        </div>
      </Popup>

      {/* Diagnostic Popup */}
      <Popup
        visible={diagnosticPopupVisible}
        onHiding={() => setDiagnosticPopupVisible(false)}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showCloseButton={true}
        showTitle={true}
        title={`Diagnostic: ${diagnosticVehicle?.vehicleCode || 'Vehicle'}`}
        width={600}
        height={650}
        contentRender={() => diagnosticVehicle ? (
          <div className="tw-p-4">
            {/* Vehicle Info */}
            <div className="tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                <i className="fa-light fa-truck tw-mr-2"></i>
                Vehicle Information
              </h4>
              <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
                <div><span className="tw-text-gray-500">ID:</span> {diagnosticVehicle.vehicleId}</div>
                <div><span className="tw-text-gray-500">Tenacy No:</span> {diagnosticVehicle.vehicleCode}</div>
                <div><span className="tw-text-gray-500">Plate:</span> {diagnosticVehicle.numberPlate}</div>
                <div><span className="tw-text-gray-500">Type:</span> {diagnosticVehicle.vehicleTypeName}</div>
                <div><span className="tw-text-gray-500">Site:</span> {diagnosticVehicle.siteName}</div>
                <div>
                  <span className="tw-text-gray-500">Unit:</span>{' '}
                  <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${diagnosticVehicle.averageKmL ? 'tw-bg-blue-100 tw-text-blue-700' : 'tw-bg-purple-100 tw-text-purple-700'}`}>
                    {diagnosticVehicle.unit === 'km' ? 'Kilometers' : 'Engine Hours'}
                  </span>
                </div>
              </div>
            </div>

            {/* GPS Mapping */}
            <div className="tw-mb-4 tw-p-3 tw-rounded-lg tw-border" style={{ backgroundColor: diagnosticVehicle.hasGpsMapping ? '#f0fdf4' : '#fef2f2', borderColor: diagnosticVehicle.hasGpsMapping ? '#bbf7d0' : '#fecaca' }}>
              <h4 className={`tw-font-semibold tw-mb-2 ${diagnosticVehicle.hasGpsMapping ? 'tw-text-green-800' : 'tw-text-red-800'}`}>
                <i className={`fa-light ${diagnosticVehicle.hasGpsMapping ? 'fa-check-circle' : 'fa-times-circle'} tw-mr-2`}></i>
                GPS Mapping
              </h4>
              {diagnosticVehicle.hasGpsMapping ? (
                <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
                  <div><span className="tw-text-gray-600">GPS User ID:</span> {diagnosticVehicle.gpsUserId}</div>
                  <div><span className="tw-text-gray-600">Accumulator ID:</span> {diagnosticVehicle.gpsAccumulatorId || 'N/A'}</div>
                </div>
              ) : (
                <p className="tw-text-sm tw-text-red-700">This vehicle has no GPS provider mapping configured.</p>
              )}
            </div>

            {/* Readings Comparison */}
            <div className="tw-mb-4">
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                <i className="fa-light fa-gauge tw-mr-2"></i>
                Readings Comparison
              </h4>
              <div className="tw-grid tw-grid-cols-3 tw-gap-3">
                {/* GPS Reading */}
                <div className="tw-p-3 tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50">
                  <div className="tw-text-xs tw-text-blue-600 tw-mb-1">
                    <i className="fa-light fa-satellite-dish tw-mr-1"></i>
                    GPS Reading
                  </div>
                  <div className="tw-text-lg tw-font-bold tw-text-blue-700">
                    {diagnosticVehicle.gpsOdometer != null
                      ? `${diagnosticVehicle.gpsOdometer.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${diagnosticVehicle.unit}`
                      : 'N/A'}
                  </div>
                  <div className="tw-text-xs tw-text-blue-600 tw-mt-1">
                    {diagnosticVehicle.gpsTimestamp
                      ? new Date(diagnosticVehicle.gpsTimestamp).toLocaleString()
                      : 'No timestamp'}
                  </div>
                </div>

                {/* Database Reading */}
                <div className="tw-p-3 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50">
                  <div className="tw-text-xs tw-text-green-600 tw-mb-1">
                    <i className="fa-light fa-database tw-mr-1"></i>
                    Database Reading
                  </div>
                  <div className="tw-text-lg tw-font-bold tw-text-green-700">
                    {diagnosticVehicle.databaseOdometer != null
                      ? `${diagnosticVehicle.databaseOdometer.toLocaleString()} ${diagnosticVehicle.unit}`
                      : 'N/A'}
                  </div>
                </div>

                {/* Fueling Reading */}
                <div className="tw-p-3 tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50">
                  <div className="tw-text-xs tw-text-amber-600 tw-mb-1">
                    <i className="fa-light fa-gas-pump tw-mr-1"></i>
                    Fueling Reading
                  </div>
                  <div className="tw-text-lg tw-font-bold tw-text-amber-700">
                    {diagnosticVehicle.fuelingOdometer != null
                      ? `${diagnosticVehicle.fuelingOdometer.toLocaleString()} ${diagnosticVehicle.unit}`
                      : 'N/A'}
                  </div>
                  <div className="tw-text-xs tw-text-amber-600 tw-mt-1">
                    {diagnosticVehicle.fuelingTimestamp
                      ? new Date(diagnosticVehicle.fuelingTimestamp).toLocaleString()
                      : 'No timestamp'}
                  </div>
                </div>
              </div>
            </div>

            {/* Discrepancy Analysis */}
            <div className="tw-mb-4 tw-p-3 tw-rounded-lg tw-border" style={{ backgroundColor: diagnosticVehicle.hasSignificantDiscrepancy ? '#fef2f2' : '#f0fdf4', borderColor: diagnosticVehicle.hasSignificantDiscrepancy ? '#fecaca' : '#bbf7d0' }}>
              <h4 className={`tw-font-semibold tw-mb-2 ${diagnosticVehicle.hasSignificantDiscrepancy ? 'tw-text-red-800' : 'tw-text-green-800'}`}>
                <i className={`fa-light ${diagnosticVehicle.hasSignificantDiscrepancy ? 'fa-exclamation-triangle' : 'fa-check-circle'} tw-mr-2`}></i>
                Discrepancy Analysis
              </h4>
              <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
                <div>
                  <span className="tw-text-gray-600">Difference:</span>{' '}
                  <span className={`tw-font-semibold ${diagnosticVehicle.hasSignificantDiscrepancy ? 'tw-text-red-700' : 'tw-text-green-700'}`}>
                    {diagnosticVehicle.discrepancy != null ? `${diagnosticVehicle.discrepancy.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${diagnosticVehicle.unit}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="tw-text-gray-600">Sync Needed:</span>{' '}
                  <span className={`tw-font-semibold ${diagnosticVehicle.syncNeeded ? 'tw-text-red-700' : 'tw-text-green-700'}`}>
                    {diagnosticVehicle.syncNeeded ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="tw-p-3 tw-rounded-lg tw-border tw-border-purple-200 tw-bg-purple-50">
              <h4 className="tw-font-semibold tw-text-purple-800 tw-mb-2">
                <i className="fa-light fa-lightbulb tw-mr-2"></i>
                Recommended Action
              </h4>
              {diagnosticVehicle.recommendedReading != null ? (
                <div className="tw-text-sm">
                  <p className="tw-mb-2">
                    Use <strong>{diagnosticVehicle.recommendedSourceLabel}</strong> reading:{' '}
                    <span className="tw-font-bold tw-text-purple-700">
                      {diagnosticVehicle.recommendedReading.toLocaleString(undefined, { maximumFractionDigits: 1 })} {diagnosticVehicle.unit}
                    </span>
                  </p>
                  <p className="tw-text-gray-600">
                    {diagnosticVehicle.recommendedTimestamp && (
                      <>Last updated: {new Date(diagnosticVehicle.recommendedTimestamp).toLocaleString()}</>
                    )}
                  </p>
                </div>
              ) : (
                <p className="tw-text-sm tw-text-gray-600">No recommendation available.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
              {diagnosticVehicle.hasGpsMapping && (
                <>
                  <Button
                    icon="fa-light fa-cloud-arrow-down"
                    text="Pull from GPS"
                    type="default"
                    stylingMode="outlined"
                    onClick={async () => {
                      setDiagnosticPopupVisible(false);
                      await handleSingleSync(diagnosticVehicle.vehicleId, 'from-gps', true);
                    }}
                  />
                  <Button
                    icon="fa-light fa-cloud-arrow-up"
                    text="Push to GPS"
                    type="success"
                    stylingMode="outlined"
                    onClick={async () => {
                      setDiagnosticPopupVisible(false);
                      await handleSingleSync(diagnosticVehicle.vehicleId, 'to-gps', true);
                    }}
                  />
                </>
              )}
              <Button
                text="Close"
                stylingMode="contained"
                onClick={() => setDiagnosticPopupVisible(false)}
              />
            </div>
          </div>
        ) : null}
      />
    </div>
  );
};

export default OdometerReconciliation;
