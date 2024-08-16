import React from 'react';
import './vehicles.scss';
import VehicleDataGrid from '../../components/vehicle/vehicleDataGrid';

import ScrollView from 'devextreme-react/scroll-view';

const VehiclePage = () => {
    return (
      <ScrollView className='view-wrapper-scroll'>
        <h2 className={'content-block'}>Vehicles</h2>
        <div className={'content-block'}>
        
            <VehicleDataGrid />
        
        </div>
      </ScrollView>
    );
  }
  
  export default VehiclePage;