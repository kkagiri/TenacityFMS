import React, { useState, useEffect } from 'react';
import './vehicles.scss';
import Datagrid, { Paging, HeaderFilter, SearchPanel, Editing, FilterRow, Column, Lookup, Sorting, RequiredRule } from 'devextreme-react/data-grid';
import CustomStore from 'devextreme/data/custom_store';
import axios from "axios";
import { getVehicleDataSource,getExpectedAvg
         ,getManufacturers,getVehicleModels,
         getSiteList ,getEmployeeList,getVehicleTypeList,getVehicleList} from '../../dataservice';
 import ScrollView from 'devextreme-react/scroll-view';

const apiUrl = process.env.REACT_APP_FMS_API_URL;



export default  function Vehicles() 
{ 
    const [expectedAVG, setExpectedAVG] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [site, setSite] = useState([]);
    const [employee, setEmployee] = useState([]);
    const [vehicleType, setVehicleType] = useState([]); 
    const vehicleDataSource = getVehicleDataSource;

    const [selectedSiteId, setSelectedSiteId] = useState(null);
        const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  


    useEffect(() => {

        const fetchdata = async () => {
            try{
            const[ manufacturersResponse, 
              vehicleModelsResponse ,
              expectedAVGResponce ,
               siteResponse,
               employeeResponse  , vehicleTypeResponse] 
               
               = await Promise.all([
                getManufacturers(),
               getVehicleModels(),
                getExpectedAvg(),
                  getSiteList(),
                  getEmployeeList(),
                  getVehicleTypeList()
            ]);
              
         setManufacturers(manufacturersResponse);
            setVehicleModels(vehicleModelsResponse);
            setExpectedAVG(expectedAVGResponce);
              setSite(siteResponse);
              setEmployee(employeeResponse);
              setVehicleType(vehicleTypeResponse);
        }
        catch(error){
            console.error('Error loading Support data:', error);
            throw 'Data loading error'; 
        };
      }
      
      
        fetchdata();
      },[]);
      






//   const fetchFilteredExpectedAVGData = (options) => {
  
  
//     if(options.data && options.data.vehicleId && options.data.workingSiteId)
//     {
   
//         console.log("expectedAVG", expectedAVG);
//         console.log("options.data", options.data);
//         console.log("options.data.vehicleId", options.data.vehicleId);
//         console.log("options.data.workingSiteId", options.data.workingSiteId);
  
        
//         const filterData = expectedAVG.filter(item =>
//              item.vehicleID === options.data.vehicleId && 
//             item.siteId === options.data.workingSiteId);
  
//      console.log("Filtered Data:", filterData); 
//         return filterData;
       
//     }else{
//         console.log("Returning empty array expectedAVG",expectedAVG);
//         return {store: expectedAVG};
//     };
  
//   };

  

//   const getFilteredVehicleModels = (options) => {
//     //console.log("Options.data:", options.data)
//     if (options.data && options.data.vehicleManufacturerId) {

//           console.log("Options.data.vehicleManufacturerId:", options.data.vehicleManufacturerId);

//         const filteredModels = vehicleModels.filter(model => model.manufacturerId === options.data.vehicleManufacturerId);
//        console.log("Filtered Models:", filteredModels);
//         return {
//             store: filteredModels,
//         };
//     } else {
//         console.log("Vehicle Models:", vehicleModels);

//         return {
//             store: vehicleModels,
//         };
//     }
// };
//   function setExpectedAVGCellValue(rowData, value) {
//     console.log("Row data:", rowData);
//     //rowData.defaultExpectedAverageId = null;
//     this.defaultSetCellValue(rowData, value);
// };




// function setManufacturersCellValue (rowData,value){
//   console.log("Row data manu facturer:", rowData);

//   rowData.vehicleModelId =null;
//   this.defaultSetCellValue(rowData, value);
// };


const getFilteredExpectedAVG = (options) => {
    if (options.data && options.data.vehicleId && options.data.workingSiteId) {
        return expectedAVG.filter(item =>
            item.vehicleID === options.data.vehicleId &&
            item.siteId === options.data.workingSiteId
        );
    }
    return expectedAVG;
};
const getFilteredVehicleModels = () => {
    if (selectedManufacturer) {
        return vehicleModels.filter(model => model.manufacturerId === selectedManufacturer);
    }
    return vehicleModels;
};

const handleSiteChange = (selectedRowKeys) => {
    setSelectedSiteId(selectedRowKeys[0]);
};

const handleManufacturerChange = (selectedRowKeys) => {
    setSelectedManufacturer(selectedRowKeys[0]);
};

   return(
     <ScrollView className='view-wrapper-scroll'>
    <h2 className={'content-block'}>Vehicles</h2>
    <div className={'content-block'}>
      <div className={'responsive-paddings'}>
      <Datagrid
                dataSource={getVehicleDataSource()}
                showBorders={true}
                allowColumnReordering={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                rowAlernationEnable={true}        
                repaintChangesOnly={true}>
                <Paging enabled={true} defaultPageSize={30} />
                

                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Sorting mode="multiple" />
                <Editing
                    mode="row"
                    allowUpdating={true}
                    allowAdding={false}
                    allowDeleting={false}
                    selectTextOnEditStart={true}
                    startEditAction="dblClick"
                   
                    />
               
                <Column dataField="vehicleId" caption="Vehicle ID" allowEditing={false} visible={false} defaultSortOrder="asc" />
                <Column dataField="hyoungNo" fixed={true} caption="Hyoung No" allowEditing={false} width={100} />
                <Column dataField="defaultExpectedAverageId"width={200} caption="Default Expected AVG" alignment="center"
                >
                    <Lookup
                        // dataSource={useFilteredDataSource ? expectedAVGDatasource : loadExpectedAVGData}
                        dataSource={getFilteredExpectedAVG}
                        valueExpr="id"
                        displayExpr="combinedExpectedAverage"

                    />

                </Column>
                <Column dataField="workingSiteId" caption="Working Site"
                  //  setCellValue={setExpectedAVGCellValue}
                    width={230}

                >
                    <Lookup
                        dataSource={site}
                        valueExpr="id"
                        displayExpr="name"
                        onSelectionChanged={(selectedRowKeys) => handleSiteChange(selectedRowKeys)}

                    />
                </Column>
                <Column dataField="averageKmL" caption="is km/l" width={100} />


                <Column dataField="defaultEmployeeId" caption="Default Employee"
                      width={230}  >
                    <Lookup
                    dataSource={employee} 
                    valueExpr="id" 
                    displayExpr="fullName" 
                   
                    />
                </Column>

                <Column dataField="vehicleTypeId"
                    caption="Vehicle Type"
                // editCellComponent = {VehicleTypeUIComponent}
                >
                    <Lookup
                        dataSource={vehicleType}
                        valueExpr="id"
                        displayExpr="name" />
                </Column>

                <Column dataField="vehicleManufacturerId" 
                caption="Vehicle Manufacturer"    
             //   setCellValue = {setManufacturersCellValue}   
                width={230}

                >
                    <Lookup
                        dataSource={manufacturers}
                        valueExpr="id"
                        displayExpr="name"
                       

                    />
                </Column>
                <Column dataField="vehicleModelId" caption="Vehicle Model"       width={230}
>

                    <Lookup
                        dataSource ={getFilteredVehicleModels}
                        valueExpr="id"
                        displayExpr="name"
                    />
                </Column>
                <Column 
                dataField="excessWorkingHrCost" 
                caption="Excess Working Hr Cost" 
                dataType="number"
                setCellValue={(newData, value) => {
                    // Enforce the number range 0 - 10000
                    newData.excessWorkingHrCost = Math.max(0, Math.min(10000, Number(value)));
                }}
                
                />



            </Datagrid>      </div>
    </div>
  </ScrollView>

)}
