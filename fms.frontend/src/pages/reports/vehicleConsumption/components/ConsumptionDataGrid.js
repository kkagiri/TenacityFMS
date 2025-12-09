import React, { useCallback, useMemo } from 'react';
import DataGrid, {
    Column,
    Paging,
    HeaderFilter,
    FilterRow,
    SearchPanel,
    Toolbar,
    Item as ToolbarItem,
    Export,
    Grouping,
    GroupPanel,
    Summary,
    GroupItem,
    TotalItem,
    StateStoring,
    Selection,
    Scrolling
} from 'devextreme-react/data-grid';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

const ConsumptionDataGrid = ({ summaryData, loading, onVehicleClick }) => {
    const dataGridRef = React.useRef(null);

    // Flatten all vehicles from all sites into a single array
    const gridData = useMemo(() => {
        if (!summaryData || !summaryData.siteSummaries) return [];

        return summaryData.siteSummaries.flatMap(site =>
            (site.vehicles || []).map(vehicle => ({
                ...vehicle,
                siteName: site.siteName,
                siteId: site.siteId
            }))
        );
    }, [summaryData]);

    // Handle row click for navigation
    const handleRowClick = useCallback((e) => {
        if (e.rowType === 'data' && onVehicleClick) {
            onVehicleClick(e.data.vehicleId);
        }
    }, [onVehicleClick]);

    // Custom cell rendering for vehicle number (clickable)
    const renderVehicleCell = useCallback((cellData) => {
        return (
            <span
                className="tw-text-purple-600 tw-cursor-pointer hover:tw-underline tw-font-medium"
                onClick={() => onVehicleClick && onVehicleClick(cellData.data.vehicleId)}
            >
                {cellData.value}
            </span>
        );
    }, [onVehicleClick]);

    // Format consumption value with unit
    const renderConsumptionCell = useCallback((cellData) => {
        const unit = cellData.data.isKmPerLiter ? 'km/L' : 'L/hr';
        return (
            <span>
                {Number(cellData.value).toFixed(2)} <span className="tw-text-gray-400 tw-text-xs">{unit}</span>
            </span>
        );
    }, []);

    // Excel export handler
    const onExporting = useCallback((e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Vehicle Consumption');

        exportDataGrid({
            component: e.component,
            worksheet,
            autoFilterEnabled: true,
            customizeCell: ({ gridCell, excelCell }) => {
                if (gridCell.rowType === 'header') {
                    excelCell.font = { bold: true };
                    excelCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE9D5FF' }
                    };
                }
            }
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'VehicleConsumption.xlsx');
            });
        });

        e.cancel = true;
    }, []);

    if (loading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-py-16">
                <LoadIndicator width={48} height={48} />
            </div>
        );
    }

    if (!gridData || gridData.length === 0) {
        return (
            <div className="empty-state">
                <i className="fa-light fa-table"></i>
                <h3>No Data Available</h3>
                <p>Apply filters and search to view consumption data grid</p>
            </div>
        );
    }

    return (
        <div className="consumption-data-grid">
            <DataGrid
                ref={dataGridRef}
                dataSource={gridData}
                keyExpr="vehicleId"
                showBorders={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                focusedRowEnabled={true}
                height={600}
                onRowClick={handleRowClick}
                onExporting={onExporting}
                hoverStateEnabled={true}
            >
                <Paging defaultPageSize={20} />
                <Scrolling mode="standard" />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <SearchPanel visible={true} placeholder="Search vehicles..." />
                <Selection mode="multiple" selectAllMode="page" />
                <Grouping autoExpandAll={true} />
                <GroupPanel visible={true} />

                <StateStoring
                    enabled={true}
                    type="sessionStorage"
                    storageKey="vehicleConsumptionGridState"
                />

                <Export enabled={true} formats={['xlsx']} allowExportSelectedData={true} />

                <Toolbar>
                    <ToolbarItem name="groupPanel" />
                    <ToolbarItem location="before">
                        <Button
                            icon="refresh"
                            hint="Refresh"
                            stylingMode="text"
                            onClick={() => dataGridRef.current?.instance.refresh()}
                        />
                    </ToolbarItem>
                    <ToolbarItem name="searchPanel" />
                    <ToolbarItem name="exportButton" />
                </Toolbar>

                {/* Site Column (for grouping) */}
                <Column
                    dataField="siteName"
                    caption="Site"
                    groupIndex={0}
                    width={180}
                />

                {/* Vehicle Number */}
                <Column
                    dataField="hyoungNo"
                    caption="Vehicle No."
                    width={140}
                    cellRender={renderVehicleCell}
                />

                {/* Vehicle Type */}
                <Column
                    dataField="vehicleType"
                    caption="Type"
                    width={120}
                />

                {/* Vehicle Model */}
                <Column
                    dataField="vehicleModel"
                    caption="Model"
                    width={130}
                />

                {/* Manufacturer */}
                <Column
                    dataField="manufacturer"
                    caption="Manufacturer"
                    width={130}
                />

                {/* Total Fuel Consumed */}
                <Column
                    dataField="totalFuelConsumed"
                    caption="Fuel (L)"
                    dataType="number"
                    format="#,##0.0"
                    width={110}
                    alignment="right"
                />

                {/* Distance */}
                <Column
                    dataField="totalDistance"
                    caption="Distance (km)"
                    dataType="number"
                    format="#,##0.0"
                    width={120}
                    alignment="right"
                />

                {/* Engine Hours */}
                <Column
                    dataField="totalEngineHours"
                    caption="Eng. Hours"
                    dataType="number"
                    format="#,##0.1"
                    width={110}
                    alignment="right"
                />

                {/* Average Consumption */}
                <Column
                    dataField="averageConsumption"
                    caption="Consumption"
                    dataType="number"
                    width={130}
                    alignment="right"
                    cellRender={renderConsumptionCell}
                />

                {/* Refill Count */}
                <Column
                    dataField="refillCount"
                    caption="Refills"
                    dataType="number"
                    width={80}
                    alignment="center"
                />

                {/* Last Refill Date */}
                <Column
                    dataField="lastRefillDate"
                    caption="Last Refill"
                    dataType="date"
                    format="dd/MM/yyyy"
                    width={110}
                />

                {/* Summary */}
                <Summary>
                    <GroupItem
                        column="totalFuelConsumed"
                        summaryType="sum"
                        displayFormat="{0} L"
                        valueFormat="#,##0.0"
                    />
                    <GroupItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="{0} vehicles"
                    />
                    <GroupItem
                        column="refillCount"
                        summaryType="sum"
                        displayFormat="{0} refills"
                    />

                    <TotalItem
                        column="totalFuelConsumed"
                        summaryType="sum"
                        displayFormat="Total: {0} L"
                        valueFormat="#,##0.0"
                    />
                    <TotalItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="Total: {0} vehicles"
                    />
                    <TotalItem
                        column="refillCount"
                        summaryType="sum"
                        displayFormat="Total: {0} refills"
                    />
                </Summary>
            </DataGrid>

            {/* Info text */}
            <div className="tw-mt-3 tw-text-sm tw-text-gray-500 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-info-circle"></i>
                Click on a vehicle number to view detailed consumption history
            </div>
        </div>
    );
};

export default ConsumptionDataGrid;
