import React, { useEffect, useCallback, useRef, useState ,useMemo} from "react";

import {fetchVehicleList,updateVehicle} from '../../redux/actions/vehicleActions';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicleManufacturers } from "../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../redux/actions/vehicleModelActions";
import { fetchVehicleTypes } from "../../redux/actions/vehicleTypeActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchEmployees } from "../../redux/actions/employeeActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { exportDataGrid } from 'devextreme/pdf_exporter';
import { fetchpermissionbyUserId } from '../../redux/actions/permissionActions';
import notify from 'devextreme/ui/notify';  
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';

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
    Toolbar, Item as TItems,
    Export,
    Selection,
    Summary,
    GroupItem,
    FilterPanel,
    StateStoring,
    LoadPanel
  } from 'devextreme-react/data-grid';

  
const VehicleDataGrid = () => { 
 const dispatch = useDispatch();
    const vehicles = useSelector((state) => state.vehicle.vehicles);
    const manufacturers = useSelector((state) => state.vehicleManufacturer.manufacturers);
    const allVehicleModels = useSelector((state) => state.vehicleModel.vehicleModels);
    const vehicleType = useSelector((state) => state.vehicleType.vehicleTypes);
    const site = useSelector((state) => state.site.sites);
    const employee = useSelector((state) => state.employee.employees);
    const users = useSelector((state) => state.user.users);
   const user = useSelector((state) => state.auth.user);
   const permissions = useSelector((state) => state.permission.permissions);
   
    const expectedAVG = useSelector((state) => state.vehicle.expectedAVG);
    const [useFilteredDataSource, setUseFilteredDataSource] = useState(false);
    const [filteredExpectedAVG, setFilteredExpectedAVG] = useState([]);
    const [filteredVehicleModels, setFilteredVehicleModels] = useState([]);
    const [filteredManufacturers, setFilteredManufacturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const exportFormats = ['xlsx'];

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
    const modelLookup = useMemo(() => {
      return allVehicleModels.reduce((acc, model) => {
          if (!acc[model.manufacturerId]) {
              acc[model.manufacturerId] = [];
          }
          acc[model.manufacturerId].push(model);
          return acc;
      }, {});
  }, [allVehicleModels]);

  const refresh = () => {
    fetchData();
};
console.log(vehicles);
  const onEditorPreparing = (e) => {
    if (e.dataField === "vehicleModelId" && e.parentType === "dataRow") {
        const currentManufacturerId = e.row.data.vehicleManufacturerId;
        e.editorOptions.dataSource = modelLookup[currentManufacturerId] || [];
    }
};

const vehicleModelDisplayValue = (rowData) => {
    if (rowData.vehicleManufacturerId && rowData.vehicleModelId) {
        const modelOptions = modelLookup[rowData.vehicleManufacturerId] || [];
        const model = modelOptions.find(m => m.id === rowData.vehicleModelId);
        return model ? model.name : '';
    }
    return '';
};
    const onRowUpdated = async (e) => {
      e.cancel = true;
      if (saving) return;

      try {
          setSaving(true);
          const { vehicleId, ...updatedData } = e.data;
          const response = await dispatch(updateVehicle(vehicleId, updatedData));

          if (response.success) {
            if (gridRef.current && gridRef.current.instance) {
              gridRef.current.instance.cancelEditData();
          }
                        await fetchData();
              notify(response.message, 'success', 3000);
          } else {
              throw new Error(response.message);
          }
      } catch (error) {
          console.error('Error:', error);
          notify(error.message, 'error', 5000);
          if (gridRef.current && gridRef.current.instance) {
            gridRef.current.instance.cancelEditData();
        }
      } finally {
          setSaving(false);
      }
  };

const canEdit = permissions.includes('_EditVehicle');

if (loading || saving) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <LoadIndicator width={'24px'} height={'24px'} visible={true} />
      </div>
    );
  }
    return(
        <div>
               <DataGrid
               ref={gridRef}
                dataSource={vehicles}
                keyExpr={'vehicleId'}
                showBorders={true}
                allowColumnReordering={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                rowAlernationEnable={true}        
                repaintChangesOnly={true}
                onRowUpdated={onRowUpdated}
                onEditorPreparing={onEditorPreparing}
                >
            <Export enabled={true} allowExportSelectedData={true} formats ={exportFormats} />

              <StateStoring enabled={true} type="sessionStorage" storageKey="vehicleGridState" />
                <Paging enabled={true} defaultPageSize={30} />
                <ColumnChooser enabled={true} mode="select" height={200} />
                <LoadPanel enabled={true} />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Selection mode="multiple" />
                <Sorting mode="multiple" />

                


                <Editing
                    mode="batch"
                    allowUpdating={true}
                    selectTextOnEditStart={true}
                    startEditAction="dblClick"
                />
             

                <Column dataField="vehicleId" caption="Vehicle ID" allowEditing={false} visible={true} defaultSortOrder="asc" />
                <Column dataField="hyoungNo" allowHiding={false} fixed={true} caption="Hyoung No" allowEditing={true} minWidth={100} />
                <Column dataField="passenger" caption="Passenger" minWidth={150}  />
                <Column dataField="workingSiteId" caption="Working Site" minWidth={100} >
                    <Lookup
                        dataSource={site}
                        valueExpr="id"
                        displayExpr="name"
                      //  onSelectionChanged={(selectedRowKeys) => handleSiteChange(selectedRowKeys)}

                    />
                </Column>
                <Column dataField="vehicleTypeId" caption="Vehicle Type" minWidth={150}>
                    <Lookup dataSource={vehicleType} valueExpr="id" displayExpr="name" />
                </Column>
                <Column dataField="defaultExpectedAverageId" minWidth={100} caption="Default Expected AVG" alignment="center" hidingPriority={4} >
                    {/* <Lookup
                        // dataSource={useFilteredDataSource ? expectedAVGDatasource : loadExpectedAVGData}
                        dataSource={getFilteredExpectedAVG}
                        valueExpr="id"
                        displayExpr="combinedExpectedAverage"

                    /> */}

                </Column>
                
                <Column dataField="averageKmL" caption="is km/l" minWidth={100} />
                <Column dataField="defaultEmployeeId" caption="Default Driver" minWidth={230}  >
                    <Lookup dataSource={employee} valueExpr="id"  displayExpr="fullName"  />
                </Column>

              

                <Column dataField="vehicleManufacturerId"  caption="Vehicle Manufacturer" minWidth={200}>
                    <Lookup dataSource={manufacturers} valueExpr="id" displayExpr="name" />
                </Column>
                <Column dataField="vehicleModelId" caption="Vehicle Model"  minWidth={200} 
                                    calculateDisplayValue={vehicleModelDisplayValue}
                >
                    <Lookup dataSource={[]} valueExpr="id" displayExpr="name" />
                                    </Column>
                <Column   dataField="excessWorkingHrCost" 
                 caption="Excess Working Hr Cost" 
                 dataType="number"
                 setCellValue={(newData, value) => {
                    // Enforce the number range 0 - 10000
                    newData.excessWorkingHrCost = Math.max(0, Math.min(10000, Number(value)));
                }}
              
                
                />


            </DataGrid>  
        </div>
    )
}

export default VehicleDataGrid;