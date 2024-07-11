import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Paging,
          HeaderFilter, SearchPanel, Toolbar, Item as TItems,
          Editing, FilterRow, Column, Lookup, Sorting, RequiredRule ,
          Form,Popup ,  Grouping,
          GroupPanel ,Summary ,SortByGroupSummaryInfo ,GroupItem , FilterPanel,
          FilterBuilderPopup
         } from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import FormPopup from '../../components/FormPopup/formPopup';
import ManualFuelRefillForm from '../../components/FormPopup/ManualRefilForm';
import 'devextreme-react/text-area';
import 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';

import {fetchVehicleList} from '../../actions/vehicleActions';
import {fetchEmployees} from '../../actions/employeeActions';
import {fetchSiteList} from '../../actions/siteActions';
import { fetchTanks} from '../../actions/tankActions';
import { fetchUsers } from '../../actions/userActions';
import { fetchFuelRefills, createFuelRefill, updateFuelRefill, deleteFuelRefill } from '../../actions/fuelRefillAction';

import { UsersApi } from '../../api/gpsgate';
import  createApiClient from '../../api/gpsgateAPIClient';

import { Item as FItem } from 'devextreme-react/form';
import { fetchpermissionbyUserId } from '../../actions/permissionActions';

export default function Fuelrefil() {
    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const employees = useSelector((state) => state.employee.employees);
    const sites= useSelector((state) => state.site.sites);
    const fuelBy = useSelector((state) => state.user.users);
   const user = useSelector((state) => state.auth.user);
   const tanks = useSelector((state) => state.tank.tanks);
   const [filteredTanks, setFilteredTanks] = useState([]);
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
                        date: new Date(updatedData.date).toISOString(),
                        transactionId: updatedData.transactionId || null,
                        fuelBy: updatedData.fuelBy || user.userName,
                        siteId: updatedData.siteId,
                        tankId: updatedData.tankId
                    };
    
                    if (change.type === 'insert') {

                    const reponse =    await dispatch(createFuelRefill(formattedData));
                        notify('Manual fuel refill created successfully.', 'success', 3000);
                        e.component.navigateToRow(e.key)

                    } else if (change.type === 'update') {
                        await dispatch(updateFuelRefill(change.key, formattedData));
                        notify('Manual fuel refill updated successfully.', 'success', 3000);
                        e.component.navigateToRow(e.key)


                    }

                }

                e.component.refresh(true);
    
            } catch (error) {
                e.cancel = true;
                const errorMessage = error.response?.data?.message || 'Error processing fuel refill operation.';
                notify(errorMessage, 'error', 3000);
            } finally {
                setSaving(false);
                setLoading(false);
                e.cancel =true;
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
        dispatch.fetchData(); 
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
   
                    <Paging enabled={true} defaultPageSize={30} />
                        <FilterRow visible={true} />
                   <HeaderFilter visible={true} />  
                    <SearchPanel visible placeholder='Data Search' />
                    <Sorting mode="multiple" />
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
                                <FItem dataField="date" editorType="dxDateBox" editorOptions={{ type: 'datetime' }}>
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
                                <FItem dataField="previousMeterReading" editorType="dxNumberBox" />
                                <FItem dataField="currentMeterReading" editorType="dxNumberBox" />
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

                        <TItems location='after' locateInMenu='auto'>
                            <div className='separator' />
                        </TItems>
                        <TItems name='searchPanel' locateInMenu='auto' />
                    </Toolbar> 
                    <Column dataField="date" caption="Date" dataType="date" defaultSortOrder={'dsc'} fixed={true}  defaultValue={new Date().toISOString()} />
                    <Column dataField="siteId" caption="Site"  fixed={true} >
                        <Lookup
                            dataSource={sites}
                            valueExpr="id"
                            displayExpr="name"
                        />

                    </Column>
                    <Column dataField="vehicleId" caption="Vehicle" width={150}>
                        <Lookup
                            dataSource={vehicles}
                            valueExpr="vehicleId"
                            displayExpr="hyoungNo" // Adjust the field name based on your vehicle data
                        />

                    </Column>

                    <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" dataType="number" width={120} >       
                    </Column>
                    <Column dataField="previousMeterReading" caption="Previous Meter Readings" dataType="number" width={150} >       
                    </Column>
                    <Column dataField="currentMeterReading" caption="Current Meter Reading" dataType="number" width={150} >       
                    </Column>
                    <Column dataField="driverId" caption="Driver">
                        <Lookup
                            dataSource={employees}
                            valueExpr="id"
                            displayExpr="fullName"
                        />
                        </Column>

                  
               
                    <Column dataField="comment" caption="Comment" width={150} />
                    <Column dataField="fuelBy" caption="Fuel By" width={100} 
                        cellRender={(cellData) => {
                            const user = fuelBy.find(u => u.id === cellData.value);
                            return user ? user.userName : cellData.value;
                        }}>
                        <Lookup dataSource={fuelBy} valueExpr="id" displayExpr="userName" />
                    </Column>

                  
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
