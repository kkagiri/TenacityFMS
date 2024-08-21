import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Paging,
          HeaderFilter, SearchPanel, Toolbar, Item as TItems,
          Editing, FilterRow, Column, Lookup, Sorting, RequiredRule ,
          Form,Popup ,LoadPanel,Export,Selection, FilterPanel,
          FilterBuilderPopup, ColumnChooser,ColumnChooserSelection ,Position,StateStoring
         } from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import 'devextreme-react/text-area';
import 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';

import {fetchVehicleList} from '../../redux/actions/vehicleActions';
import {fetchEmployees} from '../../redux/actions/employeeActions';
import {fetchSiteList} from '../../redux/actions/siteActions';
import { fetchTanks} from '../../redux/actions/tankActions';
import { fetchUsers } from '../../redux/actions/userActions';
import { fetchFuelRefills, createFuelRefill, updateFuelRefill, deleteFuelRefill } from '../../redux/actions/fuelRefillAction';

import { UsersApi } from '../../api/gpsgate';
import  createApiClient from '../../api/gpsgateAPIClient';

import { Item as FItem } from 'devextreme-react/form';
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';

import { formatDate } from '../../utils/dateUtils';

export default function Fuelrefil() {
    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const employees = useSelector((state) => state.employee.employees);
    const sites= useSelector((state) => state.site.sites);
    const fuelBy = useSelector((state) => state.user.users);
   const user = useSelector((state) => state.auth.user);
   const tanks = useSelector((state) => state.tank.tanks);
   const [filteredTanks, setFilteredTanks] = useState([]);
   const exportFormats = ['pdf','xlsx'];

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
        manualFuelrefilAmount: null,
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

    const validateRow = (data) => {
        console.log("data",data)
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
    const fetchData = useCallback(async () => {
        try {
            
            await Promise.all([
                dispatch(fetchFuelRefills()),
                dispatch(fetchVehicleList()),
                dispatch(fetchEmployees()),
                dispatch(fetchSiteList()),
                dispatch(fetchpermissionbyUserId(user.id)),
                dispatch(fetchTanks()),
                dispatch(fetchUsers())
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    },  [dispatch, user.id]);

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
    
                    const formattedData = {
                        ...updatedData,
                        date: updatedData.date,
                        transactionId: updatedData.transactionId || null,
                        fuelBy: updatedData.fuelBy || user.userName,
                        siteId: updatedData.siteId,
                        tankId: updatedData.tankId
                    };
    
                    if (change.type === 'insert') {

                    const response =    await dispatch(createFuelRefill(formattedData));
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


  




    const addRow = () => {
         gridRef.current.instance.addRow();
    };

    const refresh = useCallback(() => {
        gridRef.current?.instance.refresh();
        fetchData()
    }, []);

    const handleFieldChange = (e) => {
        const { dataField, value } = e;
        setFormData(prevData => ({
            ...prevData,
            [dataField]: value
        }));
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
    setFormData(prevData => ({
        ...prevData,
        tankId: selectedTankId
    }));
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
    const canEdit = permissions.includes('_editFuelRefill');
    const canDelete = permissions.includes('_deleteFuelRefill');
    const canCreate = permissions.includes('_createFuelRefill');

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
                    onSaving={onSaving}
                    onEditorPreparing={onEditorPreparing}


                >
                      <ColumnChooser enabled={true} mode="select"  height={200} >
                    <Position
                     my="right top"
                     at="right top"
                    />                          
                     </ColumnChooser>
                    <LoadPanel enabled={true} />
                    <Paging enabled={true} defaultPageSize={30} />
                    <Export enabled={true} allowExportSelectedData={true} formats ={exportFormats} />
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

                    >
                     <Popup title="Add Fuel Refill"  showTitle={true} width={800} />

                    
                     <Form  formData={formData}    onFieldDataChanged={handleFieldChange}  >
   
                           
                            <FItem itemType={'group'} caption={'Refill Details'} colCount={2} colSpan={2}>
                            <FItem dataField="date" editorType="dxDateBox" editorOptions={{ 
    type: 'datetime', 
    displayFormat: 'dd/MM/yyyy HH:mm',
    dateSerializationFormat: 'yyyy-MM-ddTHH:mm:ss'
}}>
</FItem>
                                <FItem dataField="vehicleId" editorType="dxSelectBox" editorOptions={{ dataSource: vehicles, valueExpr: 'vehicleId', displayExpr: 'hyoungNo' }}>
                                    <RequiredRule />
                                </FItem>
                                <FItem dataField={'driverId'} editorType={'dxSelectBox'} editorOptions={{ dataSource: employees, valueExpr: 'id', displayExpr: 'fullName' }}>
                                    <RequiredRule />
                                </FItem>
                                <FItem dataField="siteId" editorType="dxSelectBox" editorOptions={{ 
                                    dataSource: sites, 
                                    valueExpr: 'id',
                                     displayExpr: 'name',
                                    onValueChanged: handleSiteChange,
                                    value: formData.siteId                                    
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
                                        value: formData.tankId // chatgptcomment
                                    }}>
                                    <RequiredRule />
                                    </FItem>
                            </FItem>
                            <FItem itemType={'group'} caption={'Meter Readings'} colCount={2} colSpan={2}>
                                <FItem dataField="currentMeterReading" editorType="dxNumberBox" />
                                <FItem dataField="previousMeterReading" editorType="dxNumberBox" />

                                <FItem dataField="manualFuelrefilAmount" editorType="dxNumberBox">
                                    <RequiredRule />
                                </FItem>
                            </FItem>
                            <FItem dataField="comment" editorType="dxTextArea" editorOptions={{ height: 100 }} colSpan={2} />
                            <FItem itemType={'group'} caption={'Integration'} colCount={2} colSpan={2}>
                                
                                <FItem dataField="fuelBy" editorType="dxTextBox" disabled ={true} value={user.userName}>
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
                                visible ={canCreate}
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

                    <Column dataField="date" caption="Date" dataType="date" defaultSortOrder={'dsc'} fixed={true}  defaultValue={new Date().toISOString()} />
                    <Column dataField="vehicleId" caption="Vehicle" minWidth={150}>
                        <Lookup
                            dataSource={vehicles}
                            valueExpr="vehicleId"
                            displayExpr="hyoungNo" // Adjust the field name based on your vehicle data
                        />

                    </Column>
                    <Column dataField="siteId" caption="Site"  minWidth={100} >
                        <Lookup
                            dataSource={sites}
                            valueExpr="id"
                            displayExpr="name"
                        />

                    </Column>
               

                    <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" dataType="number" minWidth={100}>       
                    </Column>
                    <Column dataField="previousMeterReading" caption="Previous Meter Readings" dataType="number" width={150} hidingPriority={3}>       
                    </Column>
                    <Column dataField="currentMeterReading" caption="Current Meter Reading" dataType="number" width={150}hidingPriority={3} >       
                    </Column>
                    <Column dataField="driverId" caption="Driver" minWidth={180} hidingPriority={3}>
                        <Lookup
                            dataSource={employees}
                            valueExpr="id"
                            displayExpr="fullName"
                        />
                        </Column>

                  
               
                    <Column dataField="comment" caption="Comment" minWidth={180} hidingPriority={3}/>
                    <Column dataField="fuelBy" caption="Fuel By" minWidth={120}  hidingPriority={3}
                        cellRender={(cellData) => {
                            const user = fuelBy.find(u => u.id === cellData.value);
                            return user ? user.userName : cellData.value;
                        }}>
                        <Lookup dataSource={fuelBy} valueExpr="id" displayExpr="userName" />
                    </Column>

                  <Column dataField="dateCreated" caption="Date Created"  dataType="Date"  defaultSortOrder="asc" cellRender={formatDateTime} />
                </DataGrid>
                {/* {formVisible && (
                <FormPopup
                    title="Add Fuel Refill"
                    visible={formVisible}
                    setVisible={setFormVisible}
                    onSave={handleFormSave}
                    width={800}
                   
                >
                    <ManualFuelRefillForm
                        initData={formData}
                        onDataChanged={handleFormDataChange}
                    />
                </FormPopup>
            )} */}
            </div>
            
        </div>
    );

}
