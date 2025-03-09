import React, { useState } from 'react';
import './vehicles.scss';
import VehicleDataGrid from '../../components/vehicle/vehicleDataGrid';
import ScrollView from 'devextreme-react/scroll-view';
import { Popup } from 'devextreme-react/popup';
import { useSelector } from 'react-redux';
import TagAssignmentForm from '../../components/Tags/TagAssignmentForm/TagAssignmentForm';

const VehiclePage = () => {




    return (
        <ScrollView className='view-wrapper-scroll'>
            <h2 className={'content-block'}>Vehicles</h2>
            <div className={'content-block'}>
                <VehicleDataGrid
                />
            </div>


        </ScrollView>
    );
};

export default VehiclePage;