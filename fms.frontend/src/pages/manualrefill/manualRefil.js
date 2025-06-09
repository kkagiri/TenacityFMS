import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataGrid, { Paging, HeaderFilter, Item, SearchPanel, Toolbar, Editing, FilterRow, Column, Lookup, Sorting, RequiredRule } from 'devextreme-react/data-grid';
import { getVehicleList, getSiteList } from '../../dataservice';
import { getManualFuelRefills, createManualFuelRefill, updateManualFuelRefill, deleteManualFuelRefill } from '../../dataservice/manualFuelRefillServices';
import Button from 'devextreme-react/button';
import { Toast } from 'devextreme-react/toast';


export default function FuelRefill() {
    const [vehicles, setVehicles] = useState([]);
    const [sites, setSites] = useState([]);
    const [manualFuelRefill, setManualFuelRefill] = useState([]);
    const [newFuelRefill, setNewFuelRefill] = useState({});
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const gridRef = useRef(null);

    const refresh = useCallback(() => {
        gridRef.current?.instance.refresh();
    }, []);
    const validateRow = (data) => {
        if (data.previousMeterReading >= data.currentMeterReading) {
            return { isValid: false, message: "Previous meter reading cannot be greater than or equal to current meter reading." };
        }
        if ((data.currentMeterReading - data.previousMeterReading) > 5000) {
            return { isValid: false, message: "Difference between readings cannot be more than 5000. Check " };
        }
        if (new Date(data.date) > new Date()) {
            return { isValid: false, message: "Date cannot be in the future." };
        }
        return { isValid: true };
    };
    const fetchData = useCallback(async () => {
        try {
            const vehicles = await getVehicleList();
            const sites = await getSiteList();
            const manualFuelRefill = await getManualFuelRefills();
            setVehicles(vehicles);
            // console.log("vehicles",vehicles);
            setSites(sites);
            setManualFuelRefill(manualFuelRefill);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const showToast = (message, type) => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const onRowInserted = useCallback(async (e) => {
        const validation = validateRow(e.data);
        if (!validation.isValid) {
            e.cancel = true;
            showToast(validation.message, 'error');
            return;
        }
        try {
            console.log(e.data);

            const newData = await createManualFuelRefill(e.data);
            setManualFuelRefill(prevData => [...prevData, newData]);
            showToast('Manual fuel refill created successfully.', 'success');
        } catch (error) {
            console.error('Error creating manual fuel refill:', error);
            showToast('Error creating manual fuel refill.', 'error');
        }
    }, []);

    const onRowRemoved = useCallback(async (e) => {
        try {
            await deleteManualFuelRefill(e.key);
            setManualFuelRefill(prevData => prevData.filter(item => item.id !== e.key));
            showToast('Manual fuel refill deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting manual fuel refill:', error);
            showToast('Error deleting manual fuel refill.', 'error');
        }
    }, []);

    const onRowUpdated = useCallback(async (e) => {
        const validation = validateRow(e.data);
        if (!validation.isValid) {
            e.cancel = true;
            showToast(validation.message, 'error');
            return;
        }
        try {
            const updatedData = await updateManualFuelRefill(e.key, e.data);
            setManualFuelRefill(prevData => prevData.map(item => item.id === e.key ? updatedData : item));
            showToast('Manual fuel refill updated successfully.', 'success');
        } catch (error) {
            console.error('Error updating manual fuel refill:', error);
            showToast('Error updating manual fuel refill.', 'error');
        }
    }, []);


    return (
        <React.Fragment>
            <h2 className={'content-block'}>Manual Fuel Refill</h2>
            <div className={'content-block'}>
                <DataGrid
                    ref={gridRef}
                    dataSource={manualFuelRefill}
                    showBorders={true}

                    allowColumnReordering={true}
                    allowColumnResizing={true}
                    columnAutoWidth={true}
                    rowAlernationEnable={true}
                    repaintChangesOnly={true}
                    onRowInserted={onRowInserted}
                    onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}



                >
                    <Paging enabled={true} defaultPageSize={30} />
                    <headerFilter>
                        <FilterRow visible={true} />
                    </headerFilter>
                    <SearchPanel visible placeholder='Data Search' />
                    <Sorting mode="multiple" />
                    <Editing
                        mode="popup"
                        allowUpdating={true}
                        allowAdding={true}
                        allowDeleting={true}
                        selectTextOnEditStart={true}
                        startEditAction="dblClick"

                    />

                    {/* <Toolbar>


                        <Item location='before' locateInMenu='auto'>
                            <Button
                                icon='plus'
                                text='Add Fuel Refill'
                                type='default'
                                stylingMode='contained'
                                onClick={addNewRow}
                            />
                        </Item>
                        <Item
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
                        </Item>

                        <Item location='after' locateInMenu='auto'>
                            <div className='separator' />
                        </Item>
                        <Item name='searchPanel' locateInMenu='auto' />
                    </Toolbar> */}
                    <Column dataField="vehicleId" caption="Vehicle">
                        <Lookup
                            dataSource={vehicles}
                            valueExpr="vehicleId"
                            displayExpr="hyoungNo" // Adjust the field name based on your vehicle data
                        />

                        <RequiredRule />
                    </Column>

                    <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" dataType="number" >
                          <RequiredRule />
                    </Column>
                    <Column dataField="previousMeterReading" caption="Previous Meter Readings" dataType="number" >
                    </Column>
                    <Column dataField="currentMeterReading" caption="Current Meter Reading" dataType="number" >
                    </Column>
                    <Column dataField="date" caption="Date" dataType="datetime" defaultValue={new Date().toISOString()}>                        <RequiredRule />
                    </Column>
                    <Column dataField="siteId" caption="Site" >
                        <Lookup
                            dataSource={sites}
                            valueExpr="id"
                            displayExpr="name"
                        />
                        <RequiredRule />

                    </Column>
                    <Column dataField="comment" caption="Comment" />
                </DataGrid>
            </div>
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                displayTime={3000}
                onHiding={() => setToastVisible(false)}
            />
        </React.Fragment>
    );

}
