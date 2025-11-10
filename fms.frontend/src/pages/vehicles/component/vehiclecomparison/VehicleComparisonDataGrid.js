/**
 * File: VehicleComparisonDataGrid.js
 * Purpose: Display comparison data grid for multiple vehicles
 * Dependencies: react, devextreme-react/data-grid
 * Last Modified: 2025-11-08
 */

import React, { useMemo } from 'react';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Export,
  Selection,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';

const VehicleComparisonDataGrid = ({ data, groupBy }) => {
  // Prepare grid data based on groupBy
  const gridData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => ({
      ...item,
      rowKey: `${item.vehicleId}-${item.siteId}-${item.date}-${index}`,
      avgEfficiency: item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0
        ? (item.totalDistance / item.totalFuel).toFixed(2)
        : !item.isAverageKm && item.engHours > 0 && item.totalFuel > 0
        ? (item.totalFuel / item.engHours).toFixed(2)
        : 'N/A',
      efficiencyUnit: item.isAverageKm ? 'km/L' : 'L/hr'
    }));
  }, [data]);

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mb-6">
      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
        <i className="fa-light fa-table tw-text-blue-600"></i>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          Comparison Data
        </h3>
      </div>

      <DataGrid
        dataSource={gridData}
        keyExpr="rowKey"
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        wordWrapEnabled={false}
      >
        <SearchPanel visible={true} width={240} placeholder="Search..." />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} allowExportSelectedData={true} />
        <Selection mode="multiple" showCheckBoxesMode="always" />

        <Paging defaultPageSize={20} />
        <Pager
          visible={true}
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
          showInfo={true}
          showNavigationButtons={true}
        />

        {/* Columns based on groupBy */}
        {groupBy !== 'vehicle' && (
          <Column
            dataField="vehicleNo"
            caption="Vehicle"
            width={120}
            fixed={true}
          />
        )}

        {groupBy !== 'site' && (
          <Column
            dataField="site"
            caption="Site"
            width={150}
          />
        )}

        {groupBy !== 'date' && (
          <Column
            dataField="date"
            caption="Date"
            dataType="date"
            format="dd/MM/yyyy"
            width={110}
            sortOrder="desc"
          />
        )}

        <Column
          dataField="fuelType"
          caption="Fuel Type"
          width={120}
        />

        <Column
          dataField="totalDistance"
          caption="Distance (km)"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
        />

        <Column
          dataField="totalFuel"
          caption="Fuel Used (L)"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
        />

        <Column
          dataField="engHours"
          caption="Engine Hours"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
        />

        <Column
          dataField="avgEfficiency"
          caption="Efficiency"
          width={120}
          cellRender={(cellData) => {
            const value = cellData.data.avgEfficiency;
            const unit = cellData.data.efficiencyUnit;
            return (
              <span className="tw-font-medium">
                {value !== 'N/A' ? `${value} ${unit}` : 'N/A'}
              </span>
            );
          }}
        />

        <Column
          dataField="fuelLost"
          caption="Fuel Lost (L)"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
          cellRender={(cellData) => {
            const value = cellData.value || 0;
            const className = value > 0 ? 'tw-text-red-600 tw-font-semibold' : '';
            return <span className={className}>{value.toFixed(2)}</span>;
          }}
        />

        <Column
          dataField="excessFuel"
          caption="Excess Fuel (L)"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={140}
          cellRender={(cellData) => {
            const value = cellData.value || 0;
            const className = value > 0 ? 'tw-text-green-600 tw-font-semibold' : '';
            return <span className={className}>{value.toFixed(2)}</span>;
          }}
        />

        <Column
          dataField="stockReceived"
          caption="Stock Received (L)"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={150}
        />

        <Column
          dataField="openingMeter"
          caption="Opening Meter"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
        />

        <Column
          dataField="closingMeter"
          caption="Closing Meter"
          dataType="number"
          format={{ type: 'fixedPoint', precision: 2 }}
          width={130}
        />

        {/* Summary */}
        <Summary>
          <TotalItem
            column="totalDistance"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} km"
          />
          <TotalItem
            column="totalFuel"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} L"
          />
          <TotalItem
            column="engHours"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} hr"
          />
          <TotalItem
            column="fuelLost"
            summaryType="sum"
            valueFormat={{ type: 'fixedPoint', precision: 2 }}
            displayFormat="{0} L"
          />
        </Summary>
      </DataGrid>
    </div>
  );
};

export default React.memo(VehicleComparisonDataGrid);
