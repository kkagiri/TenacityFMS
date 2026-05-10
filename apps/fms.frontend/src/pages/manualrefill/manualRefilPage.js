import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
    Paging,
    HeaderFilter, SearchPanel, Toolbar, Item as TItems,
    Editing, FilterRow, Column, Lookup, Sorting, RequiredRule,
    Form, Popup, LoadPanel, Export, Selection, FilterPanel,
    FilterBuilderPopup, ColumnChooser, ColumnChooserSelection, Position, StateStoring
} from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import 'devextreme-react/text-area';
import 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import NumberBox from 'devextreme-react/number-box';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { jsPDF } from 'jspdf';
import { exportDataGrid as exportDataGridToPdf } from 'devextreme/pdf_exporter';
import { confirm } from 'devextreme/ui/dialog';

import { fetchVehicleList } from '../../redux/actions/vehicleActions';
import { fetchEmployees } from '../../redux/actions/employeeActions';
import { fetchSiteList } from '../../redux/actions/siteActions';
import { fetchTanks } from '../../redux/actions/tankActions';
import { fetchUsers } from '../../redux/actions/userActions';
import { fetchFuelRefills, createFuelRefill, updateFuelRefill, deleteFuelRefill } from '../../redux/actions/fuelRefillAction';

import { UsersApi } from '../../api/gpsgate';
import createApiClient from '../../api/gpsgateAPIClient';

import { Item as FItem } from 'devextreme-react/form';
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';
import { formatDate } from '../../utils/dateUtils';

//Cursor - Import new components for filtering and quick actions
import FilterPopup from './components/FilterPopup';
import QuickActionsMenu from './components/QuickActionsMenu';

// Future records validation imports
import { useFutureRecordsValidation } from '../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../components/tank-stock/FutureRecordsWarning';
import './manualRefilPage.scss';
import { search } from 'superagent';

export default function FuelRefill() {
    //Cursor - Updated state management for filtering
    const [currentFilters, setCurrentFilters] = useState({
        dateRange: [
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            new Date() // today
        ],
        siteId: 'all',
        recordCount: 100
    });
    const [showFilterPopup, setShowFilterPopup] = useState(false);

    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const employees = useSelector((state) => state.employee.employees);
    const sites = useSelector((state) => state.site.sites);
    const fuelBy = useSelector((state) => state.user.users);
    const user = useSelector((state) => state.auth.user);
    const tanks = useSelector((state) => state.tank.tanks);
    const [filteredTanks, setFilteredTanks] = useState([]);
    const exportFormats = ['pdf', 'xlsx'];

    const [formVisible, setFormVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fuelLevel, setFuelLevel] = useState(null);
    const gridRef = useRef(null);
    const dispatch = useDispatch();
    const fuelRefills = useSelector(state => state.fuelRefill.fuelRefills);
    const permissions = useSelector((state) => state.permission.permissions);
    const [noTanksAvailable, setNoTanksAvailable] = useState(false);

    const [formData, setFormData] = useState({
        vehicleId: null,
        manualFuelrefillAmount: null,
        previousMeterReading: null,
        currentMeterReading: null,
        date: new Date().toISOString(),
        siteId: null,
        comment: '',
        driverId: null,
        transactionId: null,
        fuelBy: user.userName,
        tankId: null
    });

    // Future records validation hook
    const {
        validationResult,
        error: validationError,
        showWarning,
        canSubmit,
        validateHistoricalEntry,
        confirmProceed,
        cancelProceed,
        resetValidation
    } = useFutureRecordsValidation();

    const validateRow = (data) => {
        console.log("data", data)
        const previousMeterReadingProvided = data.previousMeterReading !== null && data.previousMeterReading !== undefined && data.previousMeterReading !== ''; // chatgptcomment
        const currentMeterReadingProvided = data.currentMeterReading !== null && data.currentMeterReading !== undefined && data.currentMeterReading !== ''; // chatgptcomment

        // Validate meter readings if both are provided
        if (previousMeterReadingProvided && currentMeterReadingProvided) {
            if (data.previousMeterReading >= data.currentMeterReading) {
                return { isValid: false, message: "Previous meter reading cannot be greater than or equal to current meter reading." };
            }
            if ((data.currentMeterReading - data.previousMeterReading) > 5000) {
                return { isValid: false, message: "Difference between readings cannot be more than 5000. Check " };
            }
        }

        // Validate that comment is provided if both meter readings are empty
        if (!previousMeterReadingProvided && !currentMeterReadingProvided && !data.comment) {
            return { isValid: false, message: "Comment cannot be empty if meter readings are empty." };
        }

        if (!data.siteId) {
            return { isValid: false, message: "Please select a site." };
        }


        if (new Date(data.date) > new Date()) {
            return { isValid: false, message: "Date cannot be in the future." };
        }
        return { isValid: true };
    };
    //Cursor - Updated fetchData to use filters
    const fetchData = useCallback(async (filters = currentFilters) => {
        try {
            setLoading(true);

            await Promise.all([
                dispatch(fetchFuelRefills(filters.recordCount, filters.dateRange, filters.siteId)),
                dispatch(fetchVehicleList()),
                dispatch(fetchEmployees()),
                dispatch(fetchSiteList()),
                dispatch(fetchpermissionbyUserId(user.id)),
                dispatch(fetchTanks()),
                dispatch(fetchUsers())
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            notify('Error fetching data', 'error', 3000);
        } finally {
            setLoading(false);
        }
    }, [dispatch, user.id, currentFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);



    const onSaving = async (e) => {
        if (e.changes.length > 0) {
            const change = e.changes[0];
            setSaving(true);
            setLoading(true);

            try {
                if (change.type === 'remove') {
                    // Handle delete operation
                    await dispatch(deleteFuelRefill(change.key));
                    notify('Manual fuel refill deleted successfully.', 'success', 3000);
                } else {
                    // Handle insert and update operations
                    const updatedData = { ...formData, ...change.data };
                    const validation = validateRow(updatedData);

                    if (!validation.isValid) {
                        e.cancel = true;
                        notify(validation.message, 'error', 3000);
                        return;
                    }

                    // Validate future records if tankId and date are present
                    if (updatedData.tankId && updatedData.date) {
                        // Trigger validation and wait for it to complete
                        await validateHistoricalEntry(updatedData.tankId, new Date(updatedData.date), 'Dispensing');

                        // Check validation result after completion
                        if (!canSubmit) {
                            e.cancel = true;
                            notify('Unable to save due to future records policy. Please check the warnings and resolve future records first.', 'error', 5000);
                            return;
                        }
                    }

                    const formattedData = {
                        ...updatedData,
                        date: updatedData.date,
                        transactionId: updatedData.transactionId || null,
                        fuelBy: updatedData.fuelBy || user.userName,
                        siteId: updatedData.siteId,
                        tankId: updatedData.tankId
                    };

                    if (change.type === 'insert') {

                        const response = await dispatch(createFuelRefill(formattedData));
                        if (response.success) {
                            notify('Manual fuel refill created successfully.', 'success', 3000);
                            fetchData();
                            e.component.navigateToRow(e.key);
                        } else {
                            // Display the error message from the API
                            notify(response.message, "error", 6000);
                            e.component.editRow(e.key);
                            e.cancel = true;
                        }

                    } else if (change.type === 'update') {
                        await dispatch(updateFuelRefill(change.key, formattedData));
                        notify('Manual fuel refill updated successfully.', 'success', 3000);
                        e.component.navigateToRow(e.key)


                    }

                }

                e.component.refresh(true);

            } catch (error) {
                e.cancel = true;
                notify('An unexpected error occurred while processing the fuel refill operation.', 'error', 3000);
                if (change.type === 'insert' || change.type === 'update') {
                    e.component.editRow(e.key);
                }
            } finally {
                setSaving(false);
                setLoading(false);
            }
        }
    };


    const onRowRemoved = useCallback(async (e) => {
        try {
            setSaving(true);
            await dispatch(deleteFuelRefill(e.key));
            notify('Manual fuel refill deleted successfully.', 'success', 3000);
            setSaving(false);

        } catch (error) {
            console.error('Error deleting manual fuel refill:', error);
            notify('Error deleting manual fuel refill.', 'error', 3000);
            setSaving(false);
        }
    }, [dispatch]);

    const onRowRemoving = useCallback((e) => {
        const dialog = confirm(
            '<i class="fa-light fa-trash tw-text-red-600 tw-mr-2"></i>' +
            '<span class="tw-text-lg">Are you sure you want to delete this record?</span>',
            'Delete Fuel Refill'
        );
        e.cancel = dialog.then((result) => !result);
    }, []);

    //Cursor - Filter application handler
    const handleApplyFilter = useCallback(async (newFilters) => {
        setCurrentFilters(newFilters);
        await fetchData(newFilters);
        notify('Filters applied successfully', 'success', 2000);
    }, [fetchData]);

    //Cursor - Quick action handler
    const handleQuickAction = useCallback(async (actionData) => {
        console.log('Quick action executed:', actionData);
        // Refresh data after action
        await fetchData();
    }, [fetchData]);




    const addRow = () => {
        gridRef.current.instance.addRow();
    };

    const refresh = useCallback(() => {
        gridRef.current?.instance.refresh();
        fetchData()
    }, [fetchData]);

    const handleFieldChange = (e) => {
        const { dataField, value } = e;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                [dataField]: value
            };

            // Trigger future records validation when tankId or date changes
            if ((dataField === 'tankId' || dataField === 'date') && updatedData.tankId && updatedData.date) {
                validateHistoricalEntry(updatedData.tankId, new Date(updatedData.date), 'Dispensing');
            } else if (dataField === 'tankId' && !value) {
                // Reset validation when tank is cleared
                resetValidation();
            }

            return updatedData;
        });
    };

    const handleSiteChange = (e) => {
        const selectedSiteId = e.value;

        setFormData(prevData => ({
            ...prevData,
            siteId: selectedSiteId,
            tankId: null // Reset tank when site changes
        }));
        const tanksForSite = tanks.filter(tank => tank.siteId === selectedSiteId);
        setFilteredTanks(tanksForSite);
        setNoTanksAvailable(tanksForSite.length === 0);
    };


    const handleTankChange = (e) => {
        const selectedTankId = e.value;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                tankId: selectedTankId
            };

            // Trigger future records validation when tank and date are available
            if (selectedTankId && updatedData.date) {
                validateHistoricalEntry(selectedTankId, new Date(updatedData.date), 'Dispensing');
            } else if (!selectedTankId) {
                // Reset validation when tank is cleared
                resetValidation();
            }

            return updatedData;
        });
    };

    const onEditorPreparing = (e) => {
        if (e.parentType === 'dataRow' && e.dataField === 'tankId') {
            const isSiteNotSet = e.row.data.siteId === undefined;
            e.editorOptions.disabled = isSiteNotSet;
        }
    };
    const getFilteredTanks = (options) => ({
        store: tanks,
        filter: options.data ? ['siteId', '=', options.data.siteId] : null,
    });
    const setSiteValue = (rowData, value) => {
        rowData.tankId = null; // Reset the tankId when siteId changes
        rowData.siteId = value;
    };

    const formatDateTime = (cellInfo) => {
        if (!cellInfo.value) return '';

        // Parse the ISO 8601 date string
        const utcDate = new Date(cellInfo.value);

        // Check if the date is valid
        if (isNaN(utcDate.getTime())) {
            console.error('Invalid date:', cellInfo.value);
            return cellInfo.value;
        }

        // Format the date and time in local timezone
        return utcDate.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    };

    // Define the flags for edit and delete permissions
    const canEdit = permissions.includes('_Edit_FuelRefill');
    const canDelete = permissions.includes('_Delete_FuelRefill');
    const canCreate = permissions.includes('_Create_FuelRefill');

    const onExporting = useCallback((e) => {
        const format = e.format;

        if (format === 'xlsx') {
            try {
                const workbook = new Workbook();
                const worksheet = workbook.addWorksheet('Manual Fuel Refills');

                notify('Preparing export...', 'info', 2000);

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
                    }
                }).then(() => {
                    workbook.xlsx.writeBuffer()
                        .then((buffer) => {
                            saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ManualFuelRefills.xlsx');
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
        } else if (format === 'pdf') {
            const doc = new jsPDF();

            exportDataGridToPdf({
                jsPDFDocument: doc,
                component: e.component,
                indent: 5,
            }).then(() => {
                doc.save('ManualFuelRefills.pdf');
                notify('Export complete', 'success', 2000);
            }).catch(err => {
                console.error("PDF export error:", err);
                notify('Export failed', 'error', 2000);
            });

            e.cancel = true;
        }
    }, []);

    //Cursor - Display current filter information
    const getFilterSummary = () => {
        const siteInfo = currentFilters.siteId === 'all'
            ? 'All Sites'
            : sites.find(s => s.id === currentFilters.siteId)?.name || 'Unknown';
        const dateInfo = `${currentFilters.dateRange[0].toLocaleDateString()} - ${currentFilters.dateRange[1].toLocaleDateString()}`;
        return `Showing ${currentFilters.recordCount} records | ${siteInfo} | ${dateInfo}`;
    };

    if (loading || saving) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <LoadIndicator width={'24px'} height={'24px'} visible={true} />
            </div>
        );
    }


    return (

        <div>


            <h2 className={'content-block'}>Manual Fuel Refill</h2>

            {/* Cursor - Filter summary display */}
            <div className="tw-mb-4 tw-px-4 tw-py-2 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
                <div className="tw-flex tw-items-center tw-justify-between">
                    <div className="tw-text-sm tw-text-blue-800">
                        <i className="fa-light fa-filter tw-mr-2"></i>
                        {getFilterSummary()}
                    </div>
                    <Button
                        text="Modify Filters"
                        icon="fa-light fa-edit"
                        stylingMode="text"
                        onClick={() => setShowFilterPopup(true)}
                        elementAttr={{
                            class: 'tw-text-blue-600 hover:tw-text-blue-800'
                        }}
                    />
                </div>
            </div>

            <div className={'content-block'}>
                <DataGrid
                    ref={gridRef}
                    dataSource={fuelRefills}
                    showBorders={true}
                    keyExpr={'id'}
                    allowColumnReordering={true}
                    allowColumnResizing={true}
                    columnAutoWidth={true}
                    rowAlernationEnable={true}
                    repaintChangesOnly={true}
                    // onRowInserted={onRowInserted}
                    // onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}
                    onRowRemoving={onRowRemoving}
                    onSaving={onSaving}
                    onEditorPreparing={onEditorPreparing}
                    onExporting={onExporting}


                >
                    <ColumnChooser enabled={true} mode="select" height={200} >
                        <Position
                            my="right top"
                            at="right top"
                        />
                    </ColumnChooser>
                    <LoadPanel enabled={true} />
                    <Paging enabled={true} defaultPageSize={30} />
                    <Export enabled={true} allowExportSelectedData={true} formats={exportFormats} />
                    <StateStoring enabled={true} type="sessionStorage" storageKey="dispensingGridState" />

                    <FilterRow visible={true} />
                    <HeaderFilter visible={true} />
                    <SearchPanel visible placeholder='Data Search' />
                    <Sorting mode="multiple" />
                    <Selection mode="multiple" />

                    <Editing
                        mode="popup"
                        allowUpdating={canEdit}
                        allowAdding={true}
                        allowDeleting={canDelete}
                        selectTextOnEditStart={true}
                        startEditAction="dblClick"
                        newRowPosition={'first'}
                        confirmDelete={false}
                    >
                        <Popup title="Add Fuel Refill" showTitle={true} width={800} />


                        <Form formData={formData} onFieldDataChanged={handleFieldChange}  >


                            <FItem itemType={'group'} caption={'Refill Details'} colCount={2} colSpan={2}>
                                <FItem dataField="date" editorType="dxDateBox" editorOptions={{
                                    type: 'datetime',
                                    displayFormat: 'dd/MM/yyyy HH:mm',
                                    dateSerializationFormat: 'yyyy-MM-ddTHH:mm:ss'
                                }}>
                                </FItem>
                                <FItem dataField="vehicleId" editorType="dxSelectBox" editorOptions={{ dataSource: vehicles, valueExpr: 'vehicleId', displayExpr: 'vehicleCode' }}>
                                    <RequiredRule />
                                </FItem>
                                {/* Employee selection - shows ALL employees regardless of site selection */}
                                <FItem dataField={'driverId'} editorType={'dxSelectBox'} editorOptions={{
                                    dataSource: employees,
                                    valueExpr: 'id',
                                    displayExpr: 'fullName',
                                    searchEnabled: true,
                                    placeholder: 'Select employee'
                                }}>
                                    <RequiredRule />
                                </FItem>
                                <FItem dataField="siteId" editorType="dxSelectBox" editorOptions={{
                                    dataSource: sites,
                                    valueExpr: 'id',
                                    displayExpr: 'name',
                                    onValueChanged: handleSiteChange,
                                    value: formData.siteId,
                                    searchEnabled: true
                                }}>
                                </FItem>
                                <FItem dataField="tankId"
                                    caption={'Tank Used'} editorType={'dxSelectBox'}
                                    editorOptions={{
                                        dataSource: filteredTanks, // chatgptcomment
                                        valueExpr: 'id',
                                        displayExpr: 'name',
                                        disabled: filteredTanks.length === 0, // chatgptcomment
                                        placeholder: noTanksAvailable ? "No tank. Inquire from Admin" : "Select a tank",
                                        noDataText: "No tank. Inquire from Admin",
                                        // onValueChanged: handleTankChange, // chatgptcomment
                                        value: formData.tankId, // chatgptcomment
                                        searchEnabled: true
                                    }}>
                                    <RequiredRule />
                                </FItem>
                            </FItem>
                            <FItem itemType={'group'} caption={'Meter Readings'} colCount={2} colSpan={2}>
                                <FItem dataField="currentMeterReading" editorType="dxNumberBox" />
                                <FItem dataField="previousMeterReading" editorType="dxNumberBox" />

                                <FItem dataField="manualFuelrefillAmount" editorType="dxNumberBox">
                                    <RequiredRule />
                                </FItem>
                            </FItem>
                            <FItem dataField="comment" editorType="dxTextArea" editorOptions={{ height: 100 }} colSpan={2} />

                            {/* Future Records Warning */}
                            {(showWarning || validationError) && (
                                <FItem itemType={'group'} colSpan={2} cssClass="future-records-warning-container">
                                    <FutureRecordsWarning
                                        validationResult={validationResult}
                                        onConfirm={confirmProceed}
                                        onCancel={cancelProceed}
                                        isVisible={showWarning}
                                    />
                                    {validationError && (
                                        <div className="tw-mt-2 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-text-red-700">
                                            <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                                            {validationError}
                                        </div>
                                    )}
                                </FItem>
                            )}

                            <FItem itemType={'group'} caption={'Integration'} colCount={2} colSpan={2}>

                                <FItem dataField="fuelBy" editorType="dxTextBox" disabled={true} value={user.userName}>
                                </FItem>
                            </FItem>
                        </Form>
                    </Editing>
                    <Toolbar>
                        <TItems location='before' locateInMenu='auto'>
                            <Button
                                icon='plus'
                                text='Add Fuel Refill'
                                type='default'
                                stylingMode='contained'
                                onClick={addRow}
                                visible={canCreate}
                            />
                        </TItems>
                        {/* Cursor - Replace take/apply with filter button */}
                        <TItems location="after" locateInMenu="auto">
                            <Button
                                text="Filter Records"
                                icon="fa-light fa-filter"
                                stylingMode="outlined"
                                onClick={() => setShowFilterPopup(true)}
                                hint="Filter records by date, site, and count"
                            />
                        </TItems>

                        {/* Cursor - Add Quick Actions Menu */}
                        <TItems location="after" locateInMenu="auto">
                            <QuickActionsMenu
                                onActionComplete={handleQuickAction}
                                selectedSite={currentFilters.siteId}
                                sites={sites}
                                tanks={tanks}
                                permissions={permissions}
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
                            />
                        </TItems>
                        <TItems name="exportButton" locateInMenu={'auto'} />

                        <TItems location='after' locateInMenu='auto'>
                            <div className='separator' />
                        </TItems>
                        <TItems name="columnChooserButton" />


                    </Toolbar>

                    <Column dataField="date" caption="Date" dataType="date" defaultSortOrder={'dsc'} fixed={true} defaultValue={new Date().toISOString()} />
                    <Column dataField="vehicleId" caption="Vehicle" minWidth={150}>
                        <Lookup
                            dataSource={vehicles}
                            valueExpr="vehicleId"
                            displayExpr="vehicleCode" // Adjust the field name based on your vehicle data
                        />

                    </Column>
                    <Column dataField="siteId" caption="Site" minWidth={100} >
                        <Lookup
                            dataSource={sites}
                            valueExpr="id"
                            displayExpr="name"
                        />

                    </Column>


                    <Column dataField="manualFuelrefillAmount" caption="Fuel Amount" dataType="number" minWidth={100}>
                    </Column>
                    <Column dataField="previousMeterReading" caption="Previous Meter Readings" dataType="number" width={150} hidingPriority={3}>
                    </Column>
                    <Column dataField="currentMeterReading" caption="Current Meter Reading" dataType="number" width={150} hidingPriority={3} >
                    </Column>
                    <Column dataField="driverId" caption="Driver" minWidth={180} hidingPriority={3}>
                        <Lookup
                            dataSource={employees}
                            valueExpr="id"
                            displayExpr="fullName"
                        />
                    </Column>



                    <Column dataField="comment" caption="Comment" minWidth={180} hidingPriority={3} />
                    <Column dataField="fuelBy" caption="Fuel By" minWidth={120} hidingPriority={3}
                        cellRender={(cellData) => {
                            const user = fuelBy.find(u => u.id === cellData.value);
                            return user ? user.userName : cellData.value;
                        }}>
                        <Lookup dataSource={fuelBy} valueExpr="id" displayExpr="userName" />
                    </Column>

                    <Column dataField="dateCreated" caption="Date Created" dataType="Date" defaultSortOrder="asc" cellRender={formatDateTime} />
                </DataGrid>
            </div>

            {/* Cursor - Filter Popup Component */}
            <FilterPopup
                visible={showFilterPopup}
                onHiding={() => setShowFilterPopup(false)}
                onApplyFilter={handleApplyFilter}
                sites={sites}
                initialFilters={currentFilters}
            />

        </div>
    );

}
