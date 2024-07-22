import React, { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {fetchVehicleList,updateVehicles} from '../../actions/vehicleActions';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleManufacturers } from "../../actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../actions/vehicleModelActions";
import { fetchVehicleTypes } from "../../actions/vehicleTypeActions";
import { fetchSiteList } from "../../actions/siteActions";
import { fetchEmployees } from "../../actions/employeeActions";
import { fetchUsers } from "../../actions/userActions";
import { exportDataGrid } from 'devextreme/pdf_exporter';
import { fetchpermissionbyUserId } from '../../actions/permissionActions';
import notify from 'devextreme/ui/notify';  

import DataGrid, {
    Paging,
    HeaderFilter,
    SearchPanel,
    Editing,
    FilterRow,
    Column,
    Lookup,
    Sorting,
    RequiredRule,
    ColumnChooser,
    Export,
    Selection,
    Summary,
    GroupItem,
    FilterPanel,
    LoadPanel
  } from 'devextreme-react/data-grid';

  
const VehicleDataGrid = () => { 
 const dispatch = useDispatch();
    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const manufacturers = useSelector((state) => state.vehicleManufacturer.manufacturers);
    const vehicleModels = useSelector((state) => state.vehicleModel.vehicleModels);
    const vehicleType = useSelector((state) => state.vehicleType.vehicleTypes);
    const site = useSelector((state) => state.site.sites);
    const employee = useSelector((state) => state.employee.employees);
    const users = useSelector((state) => state.user.users);
  const userId = useSelector((state) => state.auth.user);
    const expectedAVG = useSelector((state) => state.vehicle.expectedAVG);
    const [useFilteredDataSource, setUseFilteredDataSource] = useState(false);
    const [filteredExpectedAVG, setFilteredExpectedAVG] = useState([]);
    const [filteredVehicleModels, setFilteredVehicleModels] = useState([]);
    const [filteredManufacturers, setFilteredManufacturers] = useState([]);
    const [loading, setLoading] = useState(true);

    const gridRef = useRef(null);
    const fetchData = useCallback(async () => {
        try {
            await Promise.all([
                dispatch(fetchVehicleList()),
                dispatch(fetchVehicleManufacturers()),
                dispatch(fetchVehicleModels()),
                dispatch(fetchVehicleTypes()),
                dispatch(fetchSiteList()),
                dispatch(fetchEmployees()),
                dispatch(fetchUsers()),
                dispatch(fetchpermissionbyUserId(user.id))
            ])
         } catch (error) {
                console.error(error);
              } finally {
                setLoading(false);
              }
            }, [dispatch, user.id]);

    useEffect(() => {
        fetchData();
    }
    , [fetchData]);



const onRowUpdated =async  (e) => {
    try {
        const response = await dispatch(updateVehicles(e.key, e.data));
        if (response && response.success) {
          await dispatch(fetchVehicleList());
          notify('Vehicle updated successfully', 'success', 3000);
          e.component.navigateToRow(e.key);
        } else {
          throw new Error('Vehicle update failed');
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.response?.message || error.message || 'Error processing operation.';
        notify(errorMessage, 'error', 3000);
      }
}

const canEdit = permissions.includes('_editVehicle');
if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadPanel visible={true} />
      </div>
    );
  }
    return(
        <div>
               <Datagrid
               ref={gridRef}
                dataSource={vehicles}
                keyExpr={'vehicleId'}
                showBorders={true}
                allowColumnReordering={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                rowAlernationEnable={true}        
                repaintChangesOnly={true}
                onRowUpdated={onRowUpdated}>


                <Paging enabled={true} defaultPageSize={30} />
                <FilterPanel visible={true} />
                <ColumnChooser enabled={true} mode="select" height={200} />
                <LoadPanel enabled={true} />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Selection mode="multiple" />
                <Sorting mode="multiple" />
                <Editing
                    mode="batch"
                    allowUpdating={canEdit}
                    selectTextOnEditStart={true}
                    startEditAction="dblClick"
                   
                    />
               
                <Column dataField="vehicleId" caption="Vehicle ID" allowEditing={false} visible={false} defaultSortOrder="asc" />
                <Column dataField="hyoungNo" fixed={true} caption="Hyoung No" allowEditing={false} minWidthwidth={100} hidingPriority={5} />
                <Column dataField="defaultExpectedAverageId" minWidthwidth={200} caption="Default Expected AVG" alignment="center" >
                    {/* <Lookup
                        // dataSource={useFilteredDataSource ? expectedAVGDatasource : loadExpectedAVGData}
                        dataSource={getFilteredExpectedAVG}
                        valueExpr="id"
                        displayExpr="combinedExpectedAverage"

                    /> */}

                </Column>
                <Column dataField="workingSiteId" caption="Working Site" minWidth={230} hidingPriority={5}>
                    <Lookup
                        dataSource={site}
                        valueExpr="id"
                        displayExpr="name"
                      //  onSelectionChanged={(selectedRowKeys) => handleSiteChange(selectedRowKeys)}

                    />
                </Column>
                <Column dataField="averageKmL" caption="is km/l" minWidth={100} hidingPriority={4}/>
                <Column dataField="defaultEmployeeId" caption="Default Employee" minWidth={230} hidingPriority={4} >
                    <Lookup dataSource={employee} valueExpr="id"  displayExpr="fullName"  />
                </Column>

                <Column dataField="vehicleTypeId" caption="Vehicle Type" minWidth={150} hidingPriority={3}>
                    <Lookup dataSource={vehicleType} valueExpr="id" displayExpr="name" />
                </Column>

                <Column dataField="vehicleManufacturerId"  caption="Vehicle Manufacturer" minWidth={200} hidingPriority={3}>
                    <Lookup dataSource={manufacturers} valueExpr="id" displayExpr="name" />
                </Column>
                <Column dataField="vehicleModelId" caption="Vehicle Model"  minWidth={200}  hidingPriority={3}>
                  <Lookup  dataSource ={getFilteredVehicleModels} valueExpr="id" displayExpr="name" />
                </Column>
                <Column   dataField="excessWorkingHrCost" 
                 caption="Excess Working Hr Cost" 
                 dataType="number"
                 setCellValue={(newData, value) => {
                    // Enforce the number range 0 - 10000
                    newData.excessWorkingHrCost = Math.max(0, Math.min(10000, Number(value)));
                }}
              
                
                />
              <Column dataField="passenger" caption="Passenger" minWidth={100} hidingPriority={2} />


            </Datagrid>  
        </div>
    )
}