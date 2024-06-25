import React, { useCallback, useEffect,useState } from "react";
import DataGrid, { Column ,FilterRow,Export} from 'devextreme-react/data-grid';
import { getConsumptionHistoryByVehicle } from "../../dataservice";
import NumberBox from 'devextreme-react/number-box';


export const VehicleConsumptionHistoryDetails = (vehicleID,startDate) => {

    const [consumptionHistory, setConsumptionHistory] = useState();
    const [data, setData] = useState();
    const [entry, setEntry] = useState(5);
    
useEffect(() => {
    console.log("starting data",vehicleID,startDate,entry);

       const fetchData = async () => {
        if(vehicleID && startDate) 
        { // Ensure vehicleId and date are present and no data has been loaded yet
          try {     
            
                const response = await getConsumptionHistoryByVehicle(vehicleID,startDate,entry);
                setData(response);
            }
        
            catch (error) {
                console.error(error);
            }
        }
        };
    
        fetchData();
    }, [vehicleID,startDate,entry]);

    const handleEntryChange = (e) => {
        const newEntry = Math.min(Math.max(e.value, 5), 30); // Ensure the entry is between 5 and 30
        setEntry(newEntry);
    };

   

    return (
        <div style={{padding:"20px" , boxSizing: 'border-box' ,height:"100%"}}>
<div className="dx-field" style={{marginTop:"20px"}}>
          <div className="field-label" style={{marginRight:"10px"}}  > Number of Days to Show</div>
          <div className="">
            <NumberBox
              value={entry}
              width={100}
              min={5}
              max={30}
              showSpinButtons={true}
            //  inputAttr={endValueLabel}
              onValueChanged={(e) => handleEntryChange(e)}
            />
          </div>
        </div>
  
    
<div style={{marginTop:"10px"}}>
            <DataGrid
                height={500}
                dataSource={data}
                showBorders={true}
                showColumnLines={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                allowColumnReordering={true}
                allowColumnResizing={true}

            >
                <FilterRow visible={true} />

              
                         <Column dataField="date" caption="Date" dataType="date" />
                           <Column dataField="employee" caption="Employee" />
                                <Column dataField="totalFuel" caption="Total Fuel" />
                                <Column dataField="expectedAveraged" caption="ExpectedAveraged" />
                                <Column dataField="totalDistance" caption="Total Distance" />
                                <Column dataField="engHours" caption="Engine Hours" />
                                <Column dataField="maxSpeed" caption="Max Speed" />
                                <Column dataField="avgSpeed" caption="Avg Speed" />
                                <Column dataField="fuelEfficiency" caption="Fuel Efficiency" />
                                <Column dataField="fuelLost" caption="Fuel Lost" />
                                <Column dataField="isNightShift" caption="Is Night Shift" />
                                <Column dataField="isAverageKm" caption="Is Km/l" />
                                <Column dataField="comments" caption="Comments" />
                                <Column dataField="site" caption="Site" />
            </DataGrid>
            </div>
        </div>
    );
    
}