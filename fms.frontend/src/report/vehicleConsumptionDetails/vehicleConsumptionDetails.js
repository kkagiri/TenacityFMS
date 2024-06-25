import React, { useCallback, useEffect,useState } from "react";
import { useParams  } from 'react-router-dom';
import { Toolbar, Item as ToolbarItem } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import ValidationGroup from 'devextreme-react/validation-group';
import DropDownButton, { Item as DropDownItem } from 'devextreme-react/drop-down-button';
import TabPanel, { Item as TabPanelItem } from 'devextreme-react/tab-panel';
import {VehicleConsumptionChartDetail,
        VehicleConsumptionHistoryDetails,
        VehicleConsumptionMapDetails,
        } from '../../components';
        import { getConsumptionById } from '../../dataservice';
        
//show form and load history data + map details 
const VehicleConsumptionDetails= () => {
  const { id } = useParams();
    const [consumptionData, setConsumptionData] = useState(null);
   

    useEffect(() => {
     
      const fetchData = async () => {
        try {
          const data = await getConsumptionById(id);
          setConsumptionData(data);
        } catch (error) {
          console.error('Error fetching consumption data:', error);
        }
      };
  
      fetchData();
      console.log("consumptionData",consumptionData);
    }, [id]);


    if (!consumptionData) {
      return <div>Loading...</div>;
    }

return (
  <React.Fragment>
    <div className="">
  <Toolbar className='toolbar-details theme-dependent'>
  <ToolbarItem location='before'>
            <Button icon='arrowleft' stylingMode='text' />
    </ToolbarItem>

    <ToolbarItem location='after' locateInMenu='auto'>
    <DropDownButton text='Actions' stylingMode='text' dropDownOptions={{ width: 'auto' }}>
    <DropDownItem text='Request Project Admin assistance' />
    <DropDownItem text='Seek Approval' />

   </DropDownButton>
     </ToolbarItem>
   
  </Toolbar>
        <div className='content content-block'>
        <div className='responsive-paddings dx-card '>
        <ValidationGroup>
        {/* <VehicleConsumptionFormDetails editData ={consumptionData}/> */}

       </ValidationGroup>
            </div>

<div className='content content-block'>
<div className='dx-card details-card'>
        <TabPanel
        height={'auto'}
         showNavButtons
         focusStateEnabled={false}
         deferRendering={false}>
            
            <TabPanelItem title="chart " >
            <VehicleConsumptionChartDetail
                   vehicleId={consumptionData.vehicleId}
                  date={consumptionData.date}/>
            </TabPanelItem>

            <TabPanelItem title="History ">
            <VehicleConsumptionHistoryDetails 
            vehicleId={consumptionData.vehicleId}
            startDate={consumptionData.date} />
            </TabPanelItem>

            <TabPanelItem title="Map ">
         <VehicleConsumptionMapDetails
      vehicleID={consumptionData.vehicleId}
      startDate={consumptionData.date}
           />
            </TabPanelItem>
            <TabPanelItem title="Device Tracker">
              </TabPanelItem>

        </TabPanel>
    </div>
   </div>
    </div>
    </div>
    </React.Fragment>
);




};
export default VehicleConsumptionDetails;







// Suggestions for Improvement

//     Error Handling: Enhance user experience by implementing a more robust error-handling strategy. Display error messages directly on the UI to inform users when data cannot be fetched.

//     Loading State: Consider improving the loading state presentation. For instance, use a spinner or a more visually appealing component instead of a simple text message.

//     Accessibility and Navigation:
//         Ensure that the back button in the toolbar is functional. It appears to be a static button with no action bound to it. You might want to add an onClick handler to navigate back or use history from react-router-dom.
//         The TabPanel component's accessibility can be enhanced by ensuring all interactive elements are keyboard accessible and have appropriate ARIA labels.

//     Performance Optimization:
//         The deferRendering prop on the TabPanel is set to false, which means all tabs are rendered immediately. If the tabs contain complex and heavy components, consider setting deferRendering to true to lazy-load tab contents only when they are activated.

//     Code Organization: Consider separating the components into smaller subcomponents if the logic or markup becomes too complex, improving maintainability and readability.