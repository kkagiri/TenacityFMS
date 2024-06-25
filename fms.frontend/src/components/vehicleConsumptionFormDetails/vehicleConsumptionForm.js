import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Form, {
    ButtonItem,
    GroupItem,
    SimpleItem,
    Item,
    Label,
    CompareRule,
    EmailRule,
    PatternRule,
    RangeRule,
    RequiredRule,
    StringLengthRule,
    AsyncRule,
    CustomRule,
    FormTypes,
  } from 'devextreme-react/form';
  import { Lookup } from "devextreme-react";
  import CustomStore from 'devextreme/data/custom_store';
import { FormItem} from 'devextreme-react/form';
import {getConsumptionById, getVehicleByKey,getEmployeeList,getEmployeeBySite ,getExpectedAvgBySiteIdAndVehicleId} from "../../dataservice";


const apiUrl = process.env.REACT_APP_FMS_API_URL;



export const VehicleConsumptionFormDetails = ({editData}) => {
     
  const [expectedAverageData, setExpectedAverageData] = useState();
  const [employeeData, setEmployeeData] = useState();
  const [selectedEmployee, setSelectedEmployee] = useState(); 
  const [defaultEmployee, setDefaultEmployee] = useState();
  const [totalDistance, setTotalDistance] = useState(editData.totalDistance);
  const [engHours, setEngHours] = useState(editData.engHours);
  const [totalFuel, setTotalFuel] = useState(editData.totalFuel);
  const [expectedAveraged, setExpectedAveraged] = useState(editData.expectedAveraged);



  


  const fetchData = useCallback(async (siteID, vehicleID) => {
    try {
      const [vehicleResponse, expectedAvgResponse,consumptionResponse] = await Promise.all([
        getVehicleByKey(vehicleID),
        getExpectedAvgBySiteIdAndVehicleId(vehicleID, siteID),
        getConsumptionById(editData.id)
      ]);
  
     
    if (vehicleResponse && vehicleResponse.defaultEmployee) {
      setDefaultEmployee(vehicleResponse.defaultEmployee.fullName);
    }

    if (expectedAvgResponse) {
      setExpectedAverageData(expectedAvgResponse);
    }

    if (consumptionResponse && consumptionResponse.employee) {
      setEmployeeData([consumptionResponse.employee]);
    
      }
      //if (employeeResponse) {
      //  const modifiedEmployeeData = employeeResponse.map((emp) => ({
       //   ...emp,
     //     displayString: `${emp.fullName}: ${emp.vehicles && emp.vehicles.slice(0, 2).map((v) => v.hyoungNo).join(", ")}`,
      //  }));
       // setEmployeeData(modifiedEmployeeData);
      
    } catch (error) {
      console.error("Error loading data:", error);
      // Handle the error appropriately (e.g., show an error message)
    }
  }, [getConsumptionById,getVehicleByKey, getExpectedAvgBySiteIdAndVehicleId]);
  


  useEffect(() => {
    console.log("Edit Data", editData);
  
    if (editData.siteId && editData.vehicleId) {
      fetchData(editData.siteId, editData.vehicleId);
    }
  }, [editData.siteId, editData.vehicleId, fetchData]);

  const onEmployeeChanged = (e) => {
    const selectedEmployeeID = e.value;
    if (employeeData) {
      const selectedEmployee = employeeData.find((emp) => emp.id === selectedEmployeeID);
      if (selectedEmployee) {
        setSelectedEmployee(selectedEmployee);
      }
    }
  };

const employeeEditorOptions = {
  dataSource: employeeData || [],
  valueExpr: 'id',
  displayExpr: 'fullName',
  onValueChanged: onEmployeeChanged,
  value: editData.employeeId
};


  const calculateFuelLost = () => {
    let fuelLost = 0;

  if (editData.isAverageKm) {
    if (expectedAveraged && totalDistance && totalFuel && expectedAveraged < totalDistance / totalFuel && totalDistance / totalFuel > 0) {
      fuelLost = totalFuel - (totalDistance / expectedAveraged);
    }
  } else {
    if (expectedAveraged && engHours && totalFuel && expectedAveraged > totalFuel / engHours && totalFuel / engHours > 0) {
      fuelLost = totalFuel - (expectedAveraged * engHours);
    }
  }

  return fuelLost.toFixed(2);
};

const handleTotalDistanceChange = (e) => {
  setTotalDistance(e.value);
};

const handleEngHoursChange = (e) => {
  setEngHours(e.value);
};

const handleTotalFuelChange = (e) => {
  setTotalFuel(e.value);
};

const handleExpectedAveragedChange = (e) => {
  setExpectedAveraged(e.value);
};
;


return (


  <Form formData={editData}>
    <label text="%{editData.vehicleId} Consumption Form" />
   <GroupItem colCount={4}>
  <GroupItem caption="Employee Details">
  <Item
            dataField="employeeId"
            caption="Default Employee"           
            editorType="dxSelectBox"
            editorOptions={employeeEditorOptions}
            
          />


           <Item
            dataField="employeeWorkNo"
            caption="Work Number"
            editorOptions={{ readOnly: true, value: selectedEmployee?.employeeWorkNo }}
          />
        <Item
            dataField="employeePhoneNumber"
            caption="Phone Number"
            editorOptions={{ readOnly: true, value: selectedEmployee?.employeePhoneNumber }}
          />

    </GroupItem>
    <Item itemType="group" caption="Operation Details">
    <Item dataField="isNightShift" caption="Night Shift"
      editorType="dxCheckBox"
     />
    <Item dataField="isAverageKm" caption="Km/l"        editorType="dxCheckBox"
/>
    <Item
            dataField="comments"
            caption="Comments"
            editorType="dxTextArea"
            colSpan={2}
            editorOptions={{ height: 140 }}
          />
     </Item>
     <Item itemType="group" caption="Vehicle Telemetry Details">
          <Item
            dataField="totalDistance"
            caption="Distance"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.## km",
              value: totalDistance / 1000,
              placeholder: "km",
              onValueChanged: handleTotalDistanceChange,
            }}
          />
  <Item
            dataField="engHours"
            caption="Engine Hours"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.## hrs",
              value: engHours / 3600,
              placeholder: "hrs",
              onValueChanged: handleEngHoursChange,
            }}
          />
          <Item
            dataField="maxSpeed"
            caption="Max Speed"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.## km/h",
              placeholder: "km/h",
            }}
          />
          <Item
            dataField="avgSpeed"
            caption="Avg Speed"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.## km/h",
              placeholder: "km/h",
            }}
          />
        </Item>

        <Item itemType="group" caption="Fuel Details">
          <Item
            dataField="totalFuel"
            caption="Total Fuel used"
            editorType="dxNumberBox"
            editorOptions={{
              format: "#0.## liters",
              placeholder: "liters",
              onValueChanged: handleTotalFuelChange,
            }}
          />
          <Item dataField="expectedAveraged" caption="Expected Averaged">
            <Lookup
             dataSource={expectedAverageData}
             valueExpr="id"
             displayExpr="expectedAveraged"
             value={expectedAveraged}
             onValueChanged={handleExpectedAveragedChange}
            />
          </Item>
          <Item
            dataField="fuelEfficiency"
            caption="Fuel Efficiency"
            editorType="dxNumberBox"
          />
          <Item
            dataField="fuelLost"
            caption="Fuel Lost"
            editorOptions={{ readOnly: true, value: calculateFuelLost() }}
          />
        </Item>



    </GroupItem>



    </Form>


)
}
