import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {useDispatch,useSelector} from "react-redux";
import {fetchEmployees } from "../../redux/actions/employeeActions";
import {fetchSiteList} from '../../redux/actions/siteActions';

import ScrollView from 'devextreme-react/scroll-view';
import consumptionDataGridRules from '../../utils/consumptionDataGridRules';
import DataGrid, { Paging,
  HeaderFilter, SearchPanel,  
  Editing, FilterRow, Column, Lookup,Toolbar, Item as TItems , Sorting, RequiredRule ,ColumnChooser,ColumnChooserSelection,
  Form,Popup ,  Grouping,Position,Export,Selection,
  GroupPanel ,Summary ,SortByGroupSummaryInfo ,GroupItem , FilterPanel,
  FilterBuilderPopup,LoadPanel ,Pager
 } from 'devextreme-react/data-grid';

import { getEmployeeList,getVehicleList,getSiteList } from '../../dataservice';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';  

import SelectBox from 'devextreme-react/select-box';



export const VehicleConsumptionGridList = (dataSource,pagingNo) => {
  const [data, setData] = useState();
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const [vehicles,setvehicles] = useState([]);
  const employees = useSelector(state => state.employee.employees);

  const sites= useSelector((state) => state.site.sites);
  // const employeeData = getEmployeeList();
  const [includeTerminated, setIncludeTerminated] = useState(false);




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
   await Promise.all([
   dispatch(fetchEmployees(includeTerminated)),
   dispatch(fetchSiteList())
  ]);

};  // Perform any side effects or data fetching here
fetchtsidedata();
  setData(dataSource.dataSource);
  }, [dispatch,dataSource]); // Empty dependency array means the effect runs only once on component mount


  const navigationToDetails = useCallback((rowData) => {
    navigate(`/vehicleConsumptionDetails/${rowData.data.id}`);
  }, [navigate]);



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
                    hidingPriority={5}

                    dataType="date"
                    caption="Date" 
                    allowEditing={false}
                    
                    defaultSortOrder="asc"
                    />
          <Column dataField="vehicleId" visible={false} caption="Vehicle ID" minWidth={150} />
          <Column dataField="vehicleId" allowEditing={false}  hidingPriority={5} caption="Hyoung No" >
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

