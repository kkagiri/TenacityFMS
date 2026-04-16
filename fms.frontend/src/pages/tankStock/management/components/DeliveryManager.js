/**
 * File: DeliveryManager.js
 * Purpose: Comprehensive delivery management with DataGrid, filtering, CRUD operations
 * Dependencies: react, react-redux, DevExtreme components, delivery API
 * Last Modified: 2025-11-18
 *
 * Key Features:
 * - Uses shared filters from TankStockLayout (site, tank, date range)
 * - Create, edit, soft delete deliveries
 * - TankVolumeHistory integration awareness
 * - Future records policy enforcement
 * - Excel export capability
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import DataGrid, {
  Paging,
  Pager,
  HeaderFilter,
  Toolbar,
  Item as TBItem,
  FilterRow,
  Column,
  Lookup,
  Selection,
  FilterPanel,
  GroupPanel,
  Grouping,
  Summary,
  TotalItem,
  Editing,
  Format,
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import M365SidePanel from '../../../../components/common/M365SidePanel';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { saveAs } from 'file-saver';
import {
  fetchDeliveriesbyDateRange,
  fetchDeliveriesbyDateRangebySiteId,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from '../../../../redux/actions/DeliveryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchSuppliers } from '../../../../redux/actions/SupplierActions';
import { usePermissions } from '../../../../hooks/usePermissions';
import DeliveryForm from './forms/DeliveryForm';
import './DeliveryManager.scss';

const DeliveryManager = () => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Get shared filters from header (site, tank, dates)
  const { startDate, endDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Delivery edit/delete is restricted by permission
  const { hasPermission } = usePermissions();
  const canReadDelivery = true;
  const canCreateDelivery = true;
  const canUpdateDelivery = hasPermission('_Update_Delivery');
  const canDeleteDelivery = hasPermission('_Delete_Delivery');

  // Redux state
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const suppliers = useSelector((state) => state.supplier?.suppliers || []);
  const deliveries = useSelector((state) => state.delivery?.deliveries || []);
  const deliveryLoading = useSelector((state) => state.delivery?.loading || false);
  const deliveryError = useSelector((state) => state.delivery?.error);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load reference data on mount
  useEffect(() => {
    if (tanks.length === 0) dispatch(fetchTanks());
    if (sites.length === 0) dispatch(fetchSiteList());
    if (suppliers.length === 0) dispatch(fetchSuppliers());
  }, [dispatch, tanks.length, sites.length, suppliers.length]);

  // Fetch deliveries based on filters
  const fetchDeliveriesData = useCallback(async () => {
    if (!canReadDelivery) {
      notify('You do not have permission to view deliveries', 'error', 3000);
      return;
    }

    if (!startDate || !endDate) {
      notify('Please select a date range', 'warning', 3000);
      return;
    }

    try {
      if (selectedSiteIds && selectedSiteIds.length === 1) {
        // Single site selected
        await dispatch(
          fetchDeliveriesbyDateRangebySiteId(startDate, endDate, selectedSiteIds[0])
        );
      } else {
        // All sites or multiple sites
        await dispatch(fetchDeliveriesbyDateRange(startDate, endDate));
      }
    } catch (error) {
      notify(`Error loading deliveries: ${error.message}`, 'error', 3000);
    }
  }, [dispatch, canReadDelivery, startDate, endDate, selectedSiteIds]);

  // Fetch deliveries when filters change
  useEffect(() => {
    fetchDeliveriesData();
  }, [fetchDeliveriesData]);

  // Show error notifications from Redux
  useEffect(() => {
    if (deliveryError) {
      notify(deliveryError, 'error', 3000);
    }
  }, [deliveryError]);

  // Handle create new delivery
  const handleCreateDelivery = useCallback(() => {
    if (!canCreateDelivery) {
      notify('You do not have permission to create deliveries', 'error', 3000);
      return;
    }
    setSelectedDelivery(null);
    setIsEditMode(false);
    setShowDeliveryForm(true);
  }, [canCreateDelivery]);

  // Handle edit delivery
  const handleEditDelivery = useCallback(
    (delivery) => {
      if (!canUpdateDelivery) {
        notify('You do not have permission to update deliveries', 'error', 3000);
        return;
      }
      setSelectedDelivery(delivery);
      setIsEditMode(true);
      setShowDeliveryForm(true);
    },
    [canUpdateDelivery]
  );

  // Handle soft delete delivery
  const handleDeleteDelivery = useCallback(
    async (deliveryId) => {
      if (!canDeleteDelivery) {
        notify('You do not have permission to delete deliveries', 'error', 3000);
        return;
      }

      const result = await confirm(
        'Are you sure you want to delete this delivery? This will also update the tank volume history.',
        'Confirm Delete'
      );
      if (!result) return;

      setIsLoading(true);
      try {
        const response = await dispatch(deleteDelivery(deliveryId));
        if (response.success) {
          notify('Delivery deleted successfully', 'success', 3000);
          await fetchDeliveriesData();
        } else {
          notify(response.message || 'Failed to delete delivery', 'error', 3000);
        }
      } catch (error) {
        notify(`Error deleting delivery: ${error.message}`, 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, canDeleteDelivery, fetchDeliveriesData]
  );

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (deliveryData) => {
      setIsLoading(true);
      try {
        let response;
        if (isEditMode && selectedDelivery) {
          // Update delivery (creates correction entry)
          const correctionData = {
            ...deliveryData,
            correctionReason: deliveryData.correctionReason || 'Manual correction',
          };
          response = await dispatch(updateDelivery(selectedDelivery.id, correctionData));
        } else {
          // Create new delivery
          response = await dispatch(createDelivery(deliveryData));
        }

        if (response.success) {
          notify(
            `Delivery ${isEditMode ? 'updated' : 'created'} successfully`,
            'success',
            3000
          );
          setShowDeliveryForm(false);
          await fetchDeliveriesData();
        } else {
          notify(response.message || 'Operation failed', 'error', 3000);
        }
      } catch (error) {
        notify(`Error: ${error.message}`, 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, isEditMode, selectedDelivery, fetchDeliveriesData]
  );

  // Export to Excel
  const handleExportToExcel = useCallback(() => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Deliveries');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          if (gridCell.column.dataField === 'deliveryDate') {
            excelCell.value = new Date(gridCell.value);
            excelCell.numFmt = 'yyyy-mm-dd hh:mm';
          }
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`
        );
      });
    });
  }, []);

  // Enrich deliveries with tank and site information + apply filters
  const enrichedDeliveries = useMemo(() => {
    let filtered = [...deliveries];

    // Filter by selected tanks if any
    if (selectedTankIds && selectedTankIds.length > 0) {
      filtered = filtered.filter((d) => selectedTankIds.includes(d.tankId));
    }

    // Filter by selected sites if multiple (when not using single site API call)
    if (selectedSiteIds && selectedSiteIds.length > 1) {
      const tankIdsForSites = tanks
        .filter((t) => selectedSiteIds.includes(t.siteId))
        .map((t) => t.id ?? t.tankId)
        .filter((tankId) => tankId != null);
      filtered = filtered.filter((d) => tankIdsForSites.includes(d.tankId));
    }

    // Enrich with lookup data
    return filtered.map((delivery) => {
      const tank = tanks.find((t) => (t.id ?? t.tankId) === delivery.tankId);
      const site = tank ? sites.find((s) => s.id === tank.siteId) : null;
      const supplier = suppliers.find((s) => s.id === delivery.supplierId);

      return {
        ...delivery,
        tankName: tank?.name || tank?.tankNumber || `Tank ${delivery.tankId}`,
        siteName: site?.name || site?.siteName || 'Unknown',
        siteId: tank?.siteId,
        supplierName: supplier?.name || 'Unknown',
        product: tank?.fuelGradeName || tank?.product || delivery.product,
      };
    });
  }, [deliveries, tanks, sites, suppliers, selectedTankIds, selectedSiteIds]);

  // Render action buttons for each row
  const renderActionButtons = (data) => {
    return (
      <div className="tw-flex tw-gap-2">
        {canUpdateDelivery && (
          <Button
            icon="fa-light fa-edit"
            onClick={() => handleEditDelivery(data.data)}
            hint="Edit delivery"
            stylingMode="text"
          />
        )}
        {canDeleteDelivery && (
          <Button
            icon="fa-light fa-trash"
            onClick={() => handleDeleteDelivery(data.data.id)}
            hint="Delete delivery"
            stylingMode="text"
          />
        )}
      </div>
    );
  };

  if (!canReadDelivery) {
    return (
      <div className="tw-p-4 tw-text-center tw-text-gray-600">
        <i className="fa-light fa-lock tw-text-4xl tw-mb-4"></i>
        <p>You do not have permission to view deliveries</p>
      </div>
    );
  }

  return (
    <div className="delivery-manager tw-relative">
      <LoadPanel visible={isLoading || deliveryLoading} position={{ of: '.delivery-manager' }} />

      {/* Header */}
      <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-truck-container tw-mr-2"></i>
            Delivery Management
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Manage fuel deliveries with automatic tank volume history integration
          </p>
        </div>
        <div className="tw-flex tw-gap-2">
          <Button
            text="Refresh"
            icon="fa-light fa-sync"
            onClick={fetchDeliveriesData}
            stylingMode="outlined"
          />
          {/* {canCreateDelivery && (
            <Button
              text="New Delivery"
              icon="fa-light fa-plus"
              onClick={handleCreateDelivery}
              type="default"
            />
          )} */}
        </div>
      </div>

      {/* DataGrid */}
      <DataGrid
        ref={dataGridRef}
        dataSource={enrichedDeliveries}
        keyExpr="id"
        showBorders={true}
        columnAutoWidth={true}
        wordWrapEnabled={false}
        rowAlternationEnabled={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnResizingMode="widget"
        showRowLines={true}
        showColumnLines={true}
        hoverStateEnabled={true}
      >
        <FilterRow visible={true} />
        <FilterPanel visible={true} />
        <HeaderFilter visible={true} />
        <GroupPanel visible={true} />
        <Grouping autoExpandAll={false} />
        <Paging defaultPageSize={20} />
        <Pager
          visible={true}
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
          showInfo={true}
          showNavigationButtons={true}
        />

        <Toolbar>
          <TBItem location="before">
            <div className="tw-font-semibold tw-text-gray-700">
              {enrichedDeliveries.length} Deliveries
            </div>
          </TBItem>
          <TBItem name="groupPanel" />
          <TBItem location="after">
            <Button
              icon="fa-light fa-file-excel"
              text="Export"
              onClick={handleExportToExcel}
              stylingMode="text"
            />
          </TBItem>
        </Toolbar>

        {/* Columns */}
        <Column
          dataField="id"
          caption="ID"
          width={80}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="deliveryDate"
          caption="Delivery Date"
          dataType="datetime"
          format="dd/MM/yyyy HH:mm"
          width={150}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="siteName"
          caption="Site"
          width={150}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="tankName"
          caption="Tank"
          width={120}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="product"
          caption="Product"
          width={120}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="manualDeliveryAmount"
          caption="Manual Amount (L)"
          dataType="number"
          format="#,##0.00"
          width={140}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="sensorDeliveryAmount"
          caption="Sensor Amount (L)"
          dataType="number"
          format="#,##0.00"
          width={140}
          allowFiltering={false}
          allowSorting={true}
        />
        <Column
          dataField="stockBeforeDelivery"
          caption="Stock Before (L)"
          dataType="number"
          format="#,##0.00"
          width={130}
        />
        <Column
          dataField="stockAfterDelivery"
          caption="Stock After (L)"
          dataType="number"
          format="#,##0.00"
          width={130}
        />
        <Column
          dataField="supplierName"
          caption="Supplier"
          width={150}
          allowFiltering={true}
          allowSorting={true}
        />
        <Column
          dataField="lponumber"
          caption="LPO Number"
          width={120}
          allowFiltering={true}
        />
        <Column
          dataField="pricePerLiter"
          caption="Price/L"
          dataType="number"
          format="currency"
          width={100}
        />
        <Column
          dataField="deliveryTemperature"
          caption="Temp (°C)"
          dataType="number"
          format="#,##0.0"
          width={90}
        />
        <Column
          dataField="deliveryDensity"
          caption="Density"
          dataType="number"
          format="#,##0.000"
          width={90}
        />
        <Column
          dataField="createdOn"
          caption="Created On"
          dataType="datetime"
          format="dd/MM/yyyy HH:mm"
          width={150}
        />
        <Column
          dataField="isCorrection"
          caption="Correction"
          dataType="boolean"
          width={90}
        />
        <Column
          type="buttons"
          caption="Actions"
          width={100}
          cellRender={renderActionButtons}
          fixed={true}
          fixedPosition="right"
          visible={canUpdateDelivery || canDeleteDelivery}
        />

        <Summary>
          <TotalItem column="manualDeliveryAmount" summaryType="sum" valueFormat="#,##0.00" />
          <TotalItem column="sensorDeliveryAmount" summaryType="sum" valueFormat="#,##0.00" />
        </Summary>
      </DataGrid>

      {/* Delivery Form Side Panel */}
      <M365SidePanel
        visible={showDeliveryForm}
        onClose={() => setShowDeliveryForm(false)}
        title={isEditMode ? 'Edit Delivery' : 'New Delivery'}
        width={1000}
      >
        <DeliveryForm
          delivery={selectedDelivery}
          isEditMode={isEditMode}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowDeliveryForm(false)}
        />
      </M365SidePanel>
    </div>
  );
};

export default DeliveryManager;
