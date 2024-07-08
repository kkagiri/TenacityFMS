import React, { useState,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CustomStore from 'devextreme/data/custom_store';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Form, SimpleItem, GroupItem ,ColCountByScreen  } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import DataSource from 'devextreme/data/data_source';
import { UsersApi } from '../../api/gpsgate';
import  createApiClient from '../../api/gpsgateAPIClient';
import { Button } from 'devextreme-react/button';
import {fetchVehicleList} from '../../actions/vehicleActions';
import {fetchEmployees} from '../../actions/employeeActions';
import {fetchSiteList} from '../../actions/siteActions';
// import {getSizeQualifier} from '../../utils/media-query';
import  notify from 'devextreme/ui/notify';
import { DateBox } from 'devextreme-react';
const apiUrl = process.env.REACT_APP_FMS_API_URL;

const ManualFuelRefillForm = ({  initData, onDataChanged }) => {

    const dispatch = useDispatch();

    const [formData, setFormData] = useState(initData);
    const sites = useSelector((state) => state.site.sites);
    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const employees = useSelector((state) => state.employee.employees);
    const [fuelLevel, setFuelLevel] = useState(null); // State for fuel level
    const [filteredVehicles, setFilteredVehicles] = useState([]);

    const handleSearch = (event) => {
        const searchValue = event.value;
        const filtered = vehicles.filter((vehicle) =>
            vehicle.hyoungNo.includes(searchValue)
        );
        setFilteredVehicles(filtered);
    };
    

    useEffect(() => {
        setFormData(initData);
    }, [initData]);

    useEffect(() => {
        dispatch(fetchVehicleList());
        dispatch(fetchEmployees());
        dispatch(fetchSiteList());
    }, []);


    const fetchGPSliveData = async () => {
        try{
            const apiClient = createApiClient();
            const usersApi = new UsersApi(apiClient);
            usersApi.getStatus(12,formData.vehicleId,(error,data)=>{
                if(error)
                {
                    notify('Cannot Fetch GPS data','error',3000);
                     setFuelLevel(null);
                }else
                {
                    const fueldata = data.variables.find(v => v.name === 'Fuel Level');
                    setFuelLevel(fueldata? fueldata.value : null);
                }

            });
        }
            catch(error)
            {
               console.log('Error fetching GPS data:',error);
               notify('Cannot Fetch GPS data','error',3000);
            }
        

        };




    const handleFormChange = (e) => {
        const updatedData = { ...formData, [e.component.option('name')]: e.value };
          console.log('e:', e);
        console.log('updatedData:', updatedData);

        if (e.component.option('name') === 'vehicleId') {
            // Update formData with the selected vehicle object
            const selectedVehicle = vehicles.find(v => v.vehicleId === e.value);
            updatedData.vehicleId = selectedVehicle;
        }
        setFormData(updatedData);
        onDataChanged(updatedData);
    };

    const vehiclesDataSource = new DataSource({
        store: new CustomStore({
                         load:async ()=>vehicles,               
                         key: 'vehicleId'      
        }),
        sort: 'hyoungNo',
        group:'vehicleTypeId',
        pagination: true,
        pageSize: 10

    } );


    const employeesDataSource = new DataSource({
        store: new CustomStore({
            load: async () => {
                try {
                    const data = employees;
                    return data;
                } catch (error) {
                    throw 'Data loading error';
                }
            },
            key: 'id'
        })
    } );
    return (
        <Form formData={formData} onFieldDataChanged={handleFormChange} >
            <GroupItem ></GroupItem>
        <GroupItem colCount={2}> 
            <SimpleItem dataField="vehicleId" label={{ text: 'Vehicle' }}>
                <SelectBox
                    dataSource={vehiclesDataSource}
                    valueExpr="vehicleId"
                    displayExpr="hyoungNo"
                    searchEnabled={true}
                    searchMode='contains'
                    searchTimeout={2000}
                    minSearchLength={2}
                    //onValueChanged={handleSearch}
                    showDataBeforeSearch={true}
                />
            </SimpleItem>
            <SimpleItem dataField="manualFuelrefilAmount" label={{ text: 'Fuel Amount' }} />
            <SimpleItem dataField="previousMeterReading" label={{ text: 'Previous Meter Reading' }} />
            <SimpleItem dataField="currentMeterReading" label={{ text: 'Current Meter Reading' }} />
            <SimpleItem dataField="date" label={{ text: 'Date' }} ><DateBox defaultValue={new Date()} type='datetime'/> </SimpleItem>
            <SimpleItem dataField="siteId" label={{ text: 'Site' }} >
                <SelectBox dataSource={sites} valueExpr="id" displayExpr="name" searchEnabled={false} />
            </SimpleItem>
            <SimpleItem dataField="driverId" label={{ text: 'Driver' }}>
                <SelectBox
                    dataSource={employeesDataSource}
                    valueExpr="id"
                    displayExpr="fullName"
                    searchEnabled={true}
                    searchMode='contains'
                    searchTimeout={2000}
                    minSearchLength={0}
                    // searchExpr={['fullName']}

                />
            </SimpleItem>
            <SimpleItem dataField="comment" label={{ text: 'Comment' }} />
            {fuelLevel && (
                <SimpleItem dataField="fuelLevel" label={{ text: 'Live Fuel Level' }} editorType="dxTextBox" editorOptions={{ readOnly: true, value: fuelLevel }} />
            )}
           <SimpleItem>
                <Button
                    type="default"
                    icon='refresh'
                    stylingMode="contained"
                    onClick={fetchGPSliveData}
                />
            </SimpleItem>
        </GroupItem>
    </Form>
    );
};

export default ManualFuelRefillForm;
