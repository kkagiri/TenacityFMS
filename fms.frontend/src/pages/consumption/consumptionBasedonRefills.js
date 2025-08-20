import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Paging,
          HeaderFilter, SearchPanel, Toolbar, Item as TItems,
           FilterRow, Column,StateStoring,TotalItem,
           Export,Selection,Grouping,GroupPanel,Summary,GroupItem,
           Scrolling ,MasterDetail
         } from 'devextreme-react/data-grid';

import { fetchConsumptionByDateRange, fetchConsumptionByDateRangeFiltered, fetchConsumptionByDateRangeByVehicleID } from './../../redux/actions/consumptionActions';
import { quickSearchVehicles } from './../../redux/actions/vehicleSearchActions';
import { fetchVehicleTypes } from './../../redux/actions/vehicleTypeActions';
import { quickSearchEmployees } from './../../redux/actions/employeeActions';
import Button from 'devextreme-react/button';
import  DateBox  from 'devextreme-react/date-box';
import  Popup  from 'devextreme-react/popup';
import  Form, { SimpleItem, Label }  from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

const ConsumptionBasedonRefills = () => {
    const dispatch = useDispatch();
    const consumption = useSelector((state) => state.consumption.consumption);
    const loading = useSelector((state) => state.consumption.loading);
    const error = useSelector((state) => state.consumption.error);
    const sites = useSelector((state) => state.site.sites);
    const vehicleTypes = useSelector((state) => state.vehicleType.vehicleTypes);
    const [dataCounter] = useState(0);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [hasSearched, setHasSearched] = useState(false); // Track if user has searched
    const [filterPopupVisible, setFilterPopupVisible] = useState(false);
    const [vehicleSearchResults, setVehicleSearchResults] = useState([]);
    const [employeeSearchResults, setEmployeeSearchResults] = useState([]);
    const [filters, setFilters] = useState({
        vehicleType: null,
        siteId: null,
        driverId: null,
        hyoungNo: null
    });
    const dataGridRef = React.useRef(null);

    // Add CSS for spinner animation
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Fetch vehicle types on component mount
    useEffect(() => {
        dispatch(fetchVehicleTypes());
    }, [dispatch]);

    const fetchData = useCallback(() => {
        if (startDate && endDate) {
            // NEW: Added date validation
            if (startDate > endDate) {
                notify('Start date cannot be after end date', 'error', 3000);
                return;
            }
            setHasSearched(true); // Mark that user has initiated a search

            // Check if any filters are applied
            const hasActiveFilters = Object.values(filters).some(value => value !== null && value !== '');

            if (hasActiveFilters) {
                dispatch(fetchConsumptionByDateRangeFiltered(startDate, endDate, filters));
            } else {
                dispatch(fetchConsumptionByDateRange(startDate, endDate));
            }
        }
    }, [dispatch, startDate, endDate, filters]);

    // Vehicle search functionality
    const searchVehicles = useCallback(async (searchTerm) => {
        // Allow empty search term to get initial results
        if (searchTerm !== null && searchTerm !== undefined && searchTerm.length < 2 && searchTerm.length > 0) {
            setVehicleSearchResults([]);
            return;
        }

        try {
            // Use a default search term if empty to get some initial results
            const term = searchTerm || 'a'; // Search for 'a' to get vehicles starting with 'a'
            const result = await quickSearchVehicles(term, 50);
            if (result && result.success) {
                setVehicleSearchResults(result.data || []);
            } else {
                setVehicleSearchResults([]);
                if (searchTerm && searchTerm.length >= 2) {
                    notify(`Vehicle search failed: ${result?.message || 'Unknown error'}`, 'error', 3000);
                }
            }
        } catch (error) {
            console.error('Vehicle search error:', error);
            setVehicleSearchResults([]);
            if (searchTerm && searchTerm.length >= 2) {
                notify('Error searching vehicles', 'error', 3000);
            }
        }
    }, []);

    // Employee search functionality
    const searchEmployees = useCallback(async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setEmployeeSearchResults([]);
            return;
        }

        try {
            const result = await quickSearchEmployees(searchTerm, 50);
            if (result.success) {
                setEmployeeSearchResults(result.data || []);
            } else {
                console.error('Employee search failed:', result.message);
                setEmployeeSearchResults([]);
            }
        } catch (error) {
            setEmployeeSearchResults([]);
            notify('Error searching employees', 'error', 3000);
        }
    }, []);

    const getActiveFilterCount = useCallback(() => {
        return Object.values(filters).filter(value => value !== null && value !== '').length;
    }, [filters]);

    // Filter functions
    const openFilterPopup = useCallback(() => {
        setFilterPopupVisible(true);
    }, []);

    const closeFilterPopup = useCallback(() => {
        setFilterPopupVisible(false);
    }, []);

    const applyFilters = useCallback(() => {
        setFilterPopupVisible(false);
        fetchData(); // Apply filters and fetch data
    }, [fetchData]);

    const clearFilters = useCallback(() => {
        setFilters({
            vehicleType: null,
            siteId: null,
            driverId: null,
            hyoungNo: null
        });
        notify('Filters cleared', 'info', 2000);
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Removed automatic fetch on component mount - user must click Apply

    // Handle error notifications
    useEffect(() => {
        if (error) {
            const isTimeoutError = error.includes('timeout') || error.includes('ECONNABORTED');
            const errorMessage = isTimeoutError
                ? 'Request timed out. The dataset is too large. Try a smaller date range or contact support.'
                : `Error loading consumption data: ${error}`;

            notify(errorMessage, 'error', isTimeoutError ? 8000 : 5000);
        }
    }, [error]);

    // Notify when data loads successfully
    useEffect(() => {
        if (hasSearched && consumption && consumption.length > 0 && !loading) {
            notify(`Loaded ${consumption.length} consumption records`, 'success', 2000);
        } else if (hasSearched && consumption && consumption.length === 0 && !loading) {
            notify('No consumption data found for the selected date range', 'warning', 3000);
        }
    }, [consumption, loading, hasSearched]);

    // Debug logging
    useEffect(() => {
        console.log('Consumption state:', { consumption, loading, error });
    }, [consumption, loading, error]);

    const onStartDateChanged = (e) => {
        setStartDate(e.value);
    };

    const onEndDateChanged = (e) => {
        setEndDate(e.value);
    };

    const applyFilter = () => {
        if (loading) return; // Prevent multiple simultaneous requests

        // Calculate date range to warn about large datasets
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            notify('Large date range detected. This may take up to 2 minutes to load.', 'info', 4000);
        }

        fetchData();
    };
    const refresh = () => {
        fetchData();
    };

    const renderDetail = (props) => {
        return (
            <RefillDetails
                vehicleId={props.data.data.vehicleId}
                startDate={startDate}
                endDate={endDate}
            />
        );
    };


    const onExporting = useCallback((e) => {
        console.log('Export started', { event: e });

        try {
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Consumption Based on Refills');

            console.log('Workbook and worksheet created');
            notify('Preparing export...', 'info', 2000);

            console.log('Starting exportDataGrid with component:', e.component);

            exportDataGrid({
                component: e.component,
                worksheet,
                autoFilterEnabled: true,
                customizeCell: ({ gridCell, excelCell }) => {
                    if (gridCell.rowType === 'data') {
                        excelCell.font = { size: 12 };
                    }
                    if (gridCell.rowType === 'header') {
                        excelCell.font = { bold: true };
                    }
                    console.log('Customizing cell:', { rowType: gridCell.rowType });
                }
            }).then(() => {
                console.log('exportDataGrid completed, creating buffer');
                workbook.xlsx.writeBuffer()
                    .then((buffer) => {
                        console.log('Buffer created, saving file');
                        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ConsumptionBasedonRefills.xlsx');
                        notify('Export complete', 'success', 2000);
                    })
                    .catch(err => {
                        console.error("Buffer creation error:", err);
                        notify('Export failed', 'error', 2000);
                    });
            }).catch(err => {
                console.error("exportDataGrid error:", err);
                notify('Export failed', 'error', 2000);
            });

            e.cancel = true;
        } catch (error) {
            console.error("General export error:", error);
            notify('Export failed', 'error', 2000);
        }
    }, []);



    return (
        <div className='content-block' style={{ position: 'relative' }}>
        {/* Custom Loading Overlay - doesn't disable DataGrid */}
        {loading && (
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                pointerEvents: 'none' // This allows interaction with elements behind
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    textAlign: 'center',
                    pointerEvents: 'auto' // Re-enable pointer events for the loading message
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 15px'
                    }}></div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                        Loading consumption data...
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        This may take up to 2 minutes for large datasets
                    </div>
                </div>
            </div>
        )}

        <DataGrid
            dataSource={consumption || []}
            ref={dataGridRef}
            keyExpr="id"
            showBorders={true}
            focusedRowEnabled={true}
            height={'100%'}
            onExporting={onExporting}
            noDataText={
                !hasSearched
                    ? "Select date range and click 'Apply' to load consumption data"
                    : !loading
                        ? "No consumption data available for the selected date range."
                        : "Loading..."
            }
            >
            <Paging enabled={true} defaultPageSize={30} />
            <FilterRow visible={true} />
            {/* <Pager visible={true} showPageSizeSelector={true} showInfo={true} /> */}
             <Scrolling mode="infinite" />
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Selection
                mode="multiple"
                deferred={true}  // Add this
                selectAllMode="page"  // Add this
            />
           <Grouping autoExpandAll={true} />
           <GroupPanel visible={true} />

           <StateStoring enabled={true} type="sessionStorage" storageKey="refuelingGridState" />

            <Export
                enabled={true}
                formats={['xlsx']}
                allowExportSelectedData={true}
            />
            <Toolbar >

<TItems location="before" widget={'dxDateBox'}>
        <DateBox
            value={startDate}
            onValueChanged={onStartDateChanged}
            placeholder="Start Date"
            type="date"
            width={200}
        />
    </TItems>
    <TItems location="before" widget={'dxDateBox'}>
        <DateBox
            value={endDate}
            onValueChanged={onEndDateChanged}
            placeholder="End Date"
            type="date"
            width={200}
        />
    </TItems>
    <TItems location="after" locateInMenu={'auto'} showText='inMenu'>
        <Button
            text={loading ? "Loading..." : "Apply"}
            onClick={applyFilter}
            type='default'
            stylingMode='contained'
            disabled={loading}
            icon={loading ? 'loading' : 'search'}
        />
    </TItems>

    <TItems location="after" locateInMenu={'auto'} showText='inMenu'>
        <Button
            text={`Filters${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}`}
            onClick={openFilterPopup}
            type='normal'
            stylingMode={Object.values(filters).some(value => value !== null && value !== '') ? 'contained' : 'outlined'}
            icon='filter'
            disabled={loading}
        />
    </TItems>

         <TItems
            location='after'
            locateInMenu='auto'
            showText='inMenu'
            widget='dxButton'
        >
            <Button
                icon='refresh'
                text='Refresh'
                stylingMode='text'
                onClick={refresh}
                disabled={loading}
            />
        </TItems>
           <TItems name="exportButton"
           locateInMenu={'auto'}

/>

</Toolbar>
<Column
        caption="#"
        cellRender={(cellData) => {
          return cellData.rowType === 'data' ? dataCounter[cellData.key] : '';
        }}
        width={70}
      />
           <Column dataField={'vehicleId'} caption={'ID'} width={100}  visible={false}/>
            <Column dataField="hyoungNo" caption="Vehicle Number"  />

            <Column dataField="vehicleType" caption="Vehicle Type" />
            <Column dataField="workingSiteName" caption="Working Site" groupIndex={0} />
            <Column dataField="totalFuelAmount" caption="Fuel Amount"format="fixedPoint" precision={0} />
            <Column
                dataField="consumption"
                caption="Consumption"
                dataType="number"
                format="#,##0.0"
                calculateCellValue={(rowData) => {
                    if (rowData.consumption === 0 && rowData.distanceOrEngineHours > 0 && rowData.totalFuelAmount > 0) {
                        return rowData.isKmL
                            ? (rowData.distanceOrEngineHours / rowData.totalFuelAmount).toFixed(2)
                            : (rowData.totalFuelAmount / rowData.distanceOrEngineHours).toFixed(2);
                    }
                    return rowData.consumption;
                }}
            />
            <Column dataField="distanceOrEngineHours" caption="Distance/Engine Hours" dataType="number" format="fixedPoint" precision={1} />
            <Column dataField="passenger" caption="Passenger" />
            <Column dataField="vehicleInfo" caption="Vehicle Info" />

            <Column dataField="refillCount" caption="Refill Count" width={150} />

                        <Summary>
                <GroupItem
                    column="totalFuelAmount"
                    summaryType="sum"
                    displayFormat="{0} Total Fuel"
                    valueFormat="#,##0"
                />
              <GroupItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="{0} vehicles"
                    />
                       <TotalItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="Total: {0} vehicles"
                    />
            </Summary>

            <MasterDetail
                    enabled={true}
                    component={renderDetail}
                />

        </DataGrid>

        {/* Filter Popup */}
        <Popup
            visible={filterPopupVisible}
            onHiding={closeFilterPopup}
            dragEnabled={false}
            closeOnOutsideClick={true}
            showCloseButton={true}
            showTitle={true}
            title="Advanced Filters"
            width={600}
            height={500}
            position={{
                my: 'center',
                at: 'center',
                of: window
            }}
        >
            <div style={{ padding: '20px' }}>
                <Form
                    formData={filters}
                    labelLocation="top"
                    colCount={2}
                >
                    <SimpleItem
                        dataField="vehicleType"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: [
                                { value: null, text: 'All Vehicle Types' },
                                ...(vehicleTypes || []).map(type => ({
                                    value: type.name,
                                    text: type.name
                                }))
                            ],
                            displayExpr: 'text',
                            valueExpr: 'value',
                            value: filters.vehicleType,
                            onValueChanged: (e) => handleFilterChange('vehicleType', e.value),
                            placeholder: 'Select vehicle type'
                        }}
                    >
                        <Label text="Vehicle Type" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="siteId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: [
                                { value: null, text: 'All Sites' },
                                ...(sites || []).map(site => ({
                                    value: site.id,
                                    text: site.name
                                }))
                            ],
                            displayExpr: 'text',
                            valueExpr: 'value',
                            value: filters.siteId,
                            onValueChanged: (e) => handleFilterChange('siteId', e.value),
                            placeholder: 'Select site'
                        }}
                    >
                        <Label text="Site" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="hyoungNo"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: [
                                { value: null, text: 'All Vehicles' },
                                ...vehicleSearchResults.map(vehicle => ({
                                    value: vehicle.hyoungNo,
                                    text: `${vehicle.hyoungNo} - ${vehicle.vehicleName || vehicle.numberPlate || 'Unknown'}`
                                }))
                            ],
                            displayExpr: 'text',
                            valueExpr: 'value',
                            value: filters.hyoungNo,
                            searchEnabled: true,
                            searchMode: 'contains',
                            searchTimeout: 300,
                            minSearchLength: 2,
                            onValueChanged: (e) => {
                                handleFilterChange('hyoungNo', e.value);
                            },
                            onOpened: () => {
                                // Load some initial vehicles when dropdown opens
                                if (vehicleSearchResults.length === 0) {
                                    searchVehicles('');
                                }
                            },
                            onCustomItemCreating: (e) => {
                                // Allow searching when user types
                                if (e.text && e.text.length >= 2) {
                                    searchVehicles(e.text);
                                }
                            },
                            placeholder: 'Search vehicle by Hyoung No or Name'
                        }}
                    >
                        <Label text="Vehicle (Hyoung No / Number Plate)" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="driverId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: [
                                { value: null, text: 'All Drivers' },
                                ...employeeSearchResults.map(employee => ({
                                    value: employee.id,
                                    text: `${employee.fullName} - ${employee.employeeCode || ''}`
                                }))
                            ],
                            displayExpr: 'text',
                            valueExpr: 'value',
                            value: filters.driverId,
                            searchEnabled: true,
                            searchMode: 'contains',
                            searchTimeout: 300,
                            minSearchLength: 2,
                            onValueChanged: (e) => {
                                handleFilterChange('driverId', e.value);
                                if (e.value && typeof e.value === 'string' && e.value.length >= 2) {
                                    searchEmployees(e.value);
                                }
                            },
                            placeholder: 'Search driver by name'
                        }}
                    >
                        <Label text="Driver" />
                    </SimpleItem>
                </Form>

                {/* Filter Action Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e0e0e0'
                }}>
                    <Button
                        text="Clear All"
                        onClick={clearFilters}
                        type='normal'
                        stylingMode='outlined'
                        icon='clear'
                    />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                            text="Cancel"
                            onClick={closeFilterPopup}
                            type='normal'
                            stylingMode='outlined'
                        />
                        <Button
                            text="Apply Filters"
                            onClick={applyFilters}
                            type='default'
                            stylingMode='contained'
                            icon='check'
                        />
                    </div>
                </div>
            </div>
        </Popup>

        </div>

    );

};
const RefillDetails = ({ vehicleId, startDate, endDate }) => {
    const dispatch = useDispatch();
    const refills = useSelector((state) => state.consumption.vehicleRefills);
    const refillsLoading = useSelector((state) => state.consumption.vehicleRefillsLoading);

    useEffect(() => {
        dispatch(fetchConsumptionByDateRangeByVehicleID(startDate, endDate, vehicleId));
    }, [dispatch, startDate, endDate, vehicleId]);

    return (
        <div style={{ position: 'relative', minHeight: '200px' }}>
            {refillsLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #3498db',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '12px'
                        }}></div>
                        <span style={{ fontSize: '14px', color: '#555' }}>Loading refill details...</span>
                    </div>
                </div>
            )}
            <DataGrid
                dataSource={refills || []}
                showBorders={true}
                columnAutoWidth={true}
                height={200}
            >
            <Paging defaultPageSize={5} />
            <Column dataField="date" dataType="date" />
            <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" />
            <Column dataField="previousMeterReading" caption="Previous Reading" />
            <Column dataField="currentMeterReading" caption="Current Reading" />
            <Column dataField="distanceOrEngineHours" caption="Distance/Engine Hours" dataType="number" format="fixedPoint" precision={0} />
            <Column dataField="consumption" caption="Consumption" dataType="number"  format={{ type: "fixedPoint", precision: 1 }} />
            <Column dataField="siteName" caption="Site" />
            <Column dataField="fuelBy" caption="Fuel By" />
            <Column dataField="driverName" caption="Driver" />
            <Column dataField="comment" caption="Comment" />
        </DataGrid>
        </div>
    );
};


export default ConsumptionBasedonRefills;