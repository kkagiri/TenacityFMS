import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollView from 'devextreme-react/scroll-view';
import consumptionDataGridRules from '../../utils/consumptionDataGridRules';
import DataGrid, {
  Column, Selection, Sorting, HeaderFilter, DataGridTypes,
  RequiredRule,FilterRow, Paging, Pager, Editing, Scrolling, LoadPanel,Lookup
} from 'devextreme-react/data-grid';

import { getEmployeeList,getVehicleList,getSiteList } from '../../dataservice';

import SelectBox from 'devextreme-react/select-box';



export const VehicleConsumptionGridList = (dataSource,pagingNo) => {
  const [data, setData] = useState();
  const navigate = useNavigate();
  const [vehicles,setvehicles] = useState([]);
  const [employees,setemployees] = useState([]);
  const [sites,setsites] = useState([]);
 // const employeeData = getEmployeeList();




const onRowPrepared = (e) => {
  const rowData = e.data;

  consumptionDataGridRules.forEach((rule) => {
    if (rule.condition(rowData)) {
      e.rowElement.classList.add(rule.rowClassName);
    }
  });
};


useEffect(() => {

const fetchtsidedata = async() => {
   const vehicledata= await getVehicleList();
   setvehicles(vehicledata);
   const employeedata = await getEmployeeList();
   setemployees(employeedata);
   const sitedata = await getSiteList();
   setsites(sitedata);

};  // Perform any side effects or data fetching here
fetchtsidedata();
  setData(dataSource.dataSource);
  }, [dataSource]); // Empty dependency array means the effect runs only once on component mount


  const navigationToDetails = useCallback((rowData) => {
    navigate(`/vehicleConsumptionDetails/${rowData.data.id}`);
  }, [navigate]);

// const toogleUseNavigation = useCallback(() => {
//   useNavigation = !useNavigation;
// }, []);


return(
  <div>
    <DataGrid
    className='theme-dependent'

      dataSource={data}
      showBorders={true}
      showColumnLines={true}
      showRowLines={true}
      rowAlternationEnabled={true}
      columnAutoWidth={true}
      allowColumnReordering={true}
      allowColumnResizing={true}
      allowColumnDragging={true}
      allowColumnGrouping={true}
      onRowPrepared={onratechange}
      allowColumnHiding={true}
      showColumnHeaders={true}
       hoverStateEnabled={true}
      //  onEditingStart={toogleUseNavigation}
      //  onEditCanceled={toogleUseNavigation}
      //  onSaved={toogleUseNavigation}
       onRowClick={navigationToDetails}
      >
        <LoadPanel enabled={true} />
        <Sorting mode="multiple" />
        <scrolling mode="virtual"  />
        <Paging defaultPageSize={pagingNo} />
        <Pager
          showPageSizeSelector={true}
          showInfo={true} />
          <Editing mode="row" allowUpdating={true} allowDeleting={false} useIcons={true} />
          <Selection mode="multiple" selectAllMode={'allPages'} showCheckBoxesMode={'always'} />
          <HeaderFilter visible={true} />
         <FilterRow visible={true} />
          <Column dataField="date"
                    width={100}
                    FilterRow={false}
                    fixed={true}
                    dataType="date"
                    caption="Date" 
                    allowEditing={false}
                    
                    defaultSortOrder="asc"
                    />
          <Column dataField="vehicleId" visible={false} caption="Vehicle ID" />
          <Column dataField="vehicleId" allowEditing={false}   fixed={true} caption="Hyoung No" >
            <Lookup
             dataSource={vehicles}
             valueExpr="vehicleId"
             displayExpr="hyoungNo"
            // value={selectedVehicle}
            // onValueChanged={handleVehicleChange} 
            />
          </Column>
          <Column dataField="siteId" caption="Site" >
                    <Lookup dataSource={sites}
                     valueExpr="id"
                      displayExpr="name" />
                </Column>
          <Column dataField='defaultEmployees'  caption="Employee Details" width={200}allowSorting={false} >  
          <Lookup dataSource={employees} valueExpr="id" displayExpr="fullName" />
          </Column>               
          <Column dataField="maxSpeed" caption="Max Speed" />
          <Column dataField="avgSpeed" caption="AVG Speed" />
          <Column dataField="totalDistance"

          dataType="number"
          caption="Distance"
          cellRender={({ value }) => (value / 1000).toFixed(2)
          }
        />
         <Column dataField="engHours"
                    caption="Engine Hours"
                    format={{ type: 'fixedPoint', precision: 1 }}
                    cellRender={({ value }) => (value / 3600).toFixed(2)}
                />
                  <Column dataField="totalFuel"
                    visible={true}
                    caption="Fuel" />

     <Column dataField="expectedAveraged" caption="Expected Averaged" >
                {/* <Lookup dataSource={expectedAveragedDataSource} valueExpr="id" displayExpr="expectedAveragevalue" /> */}
                </Column>
                <Column dataField="fuelEfficiency" caption="Fuel Efficiency" />
                <Column dataField="fuelLost" caption="Fuel Lost" />
          
      <Column dataField="comments" caption="comments" ></Column>
      </DataGrid>
      </div>
)


};

export default VehicleConsumptionGridList;

