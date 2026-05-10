/**
 * File: VehicleConsumptionGrid.js
 * Purpose: Displays the raw vehicle consumption records grid with search and drill-down navigation.
 * Dependencies: React, DevExtreme DataGrid, vehicleConsumptionService helpers
 * Last Modified: 2026-04-20
 */
import React from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    LoadPanel,
    Pager,
    Paging,
    SearchPanel,
    Sorting,
} from "devextreme-react/data-grid";
import { formatDisplayDate, formatNumber } from "../vehicleConsumptionService";

const VehicleConsumptionGrid = ({ records, loading, onRowClick }) => {
    return (
        <section className="vehicle-consumption-module__panel">
            <div className="vehicle-consumption-module__grid-title">
                <div>
                    <h3>Consumption Records</h3>
                    <p>Raw `vehicleconsumption` rows filtered for the selected operating scope.</p>
                </div>
                <div className="vehicle-consumption-module__grid-chip-row">
                    <span className="vehicle-consumption-module__chip">
                        <i className="fa-light fa-arrow-pointer" />
                        Select a row for record detail
                    </span>
                </div>
            </div>

            <DataGrid
                dataSource={records}
                keyExpr="id"
                showBorders={true}
                hoverStateEnabled={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                allowColumnResizing={true}
                onRowClick={({ data }) => onRowClick?.(data)}
            >
                <LoadPanel enabled={loading} />
                <Sorting mode="multiple" />
                <SearchPanel visible={true} width={260} placeholder="Search vehicle, site, driver, or report reference" />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={20} />
                <Pager visible={true} showNavigationButtons={true} showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} showInfo={true} />

                <Column
                    dataField="date"
                    caption="Date"
                    width={118}
                    sortOrder="desc"
                    calculateDisplayValue={(row) => formatDisplayDate(row.date)}
                />
                <Column dataField="siteName" caption="Site" minWidth={130} />
                <Column dataField="vehicleCode" caption="Vehicle" minWidth={110} />
                <Column dataField="numberPlate" caption="Plate" minWidth={110} />
                <Column dataField="vehicleTypeName" caption="Vehicle Type" minWidth={130} />
                <Column dataField="employeeName" caption="Source Driver" minWidth={140} />
                <Column
                    dataField="actualEfficiency"
                    caption="Actual"
                    minWidth={110}
                    cellRender={({ data }) => `${formatNumber(data.actualEfficiency)} ${data.unitLabel}`}
                />
                <Column
                    dataField="expectedAverage"
                    caption="Expected"
                    minWidth={110}
                    cellRender={({ data }) => `${formatNumber(data.expectedAverage)} ${data.unitLabel}`}
                />
                <Column
                    dataField="totalFuel"
                    caption="Fuel"
                    minWidth={100}
                    alignment="right"
                    cellRender={({ value }) => `${formatNumber(value)} L`}
                />
                <Column
                    dataField="fuelLost"
                    caption="Fuel Lost"
                    minWidth={100}
                    alignment="right"
                    cellRender={({ value }) => <span className={value > 0 ? "vehicle-consumption-module__accent-danger" : ""}>{formatNumber(value)} L</span>}
                />
                <Column
                    dataField="totalDistance"
                    caption="Distance"
                    minWidth={100}
                    alignment="right"
                    cellRender={({ value }) => `${formatNumber(value)} km`}
                />
                <Column
                    dataField="engineHours"
                    caption="Engine Hrs"
                    minWidth={100}
                    alignment="right"
                    cellRender={({ value }) => `${formatNumber(value)} hr`}
                />
                <Column
                    dataField="avgSpeed"
                    caption="Avg Speed"
                    minWidth={98}
                    alignment="right"
                    cellRender={({ value }) => `${formatNumber(value)} km/h`}
                />
                <Column
                    dataField="maxSpeed"
                    caption="Max Speed"
                    minWidth={98}
                    alignment="right"
                    cellRender={({ value }) => `${formatNumber(value)} km/h`}
                />
                <Column dataField="reportReference" caption="Report Ref" minWidth={120} />
            </DataGrid>
        </section>
    );
};

export default VehicleConsumptionGrid;