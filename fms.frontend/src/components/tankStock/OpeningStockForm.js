import { useDispatch, useSelector } from 'react-redux';
import React, { useState,useEffect } from 'react';
import {fetchSitebyUserId} from '../../redux/actions/siteActions';
import {fetchTanks} from '../../redux/actions/tankActions';
import { Form, SimpleItem, GroupItem  ,ButtonItem ,Label,   RequiredRule } from 'devextreme-react/form';
import {getSizeQualifier} from '../../utils/media-query';
import ScrollView from 'devextreme-react/scroll-view';

import notify from 'devextreme/ui/notify';  

import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';
import { width } from 'devexpress-reporting/scopes/reporting-designer-controls-metadata';
import { useScreenSize } from '../../utils/media-query';
import LoadIndicator from 'devextreme-react/load-indicator';

const OpeningStockForm = ({  updateFormData, isLoading  }) => {
    const [localFormData, setLocalFormData] = useState({});
    const dispatch  = useDispatch();
    const sites = useSelector((state) => state.site.sites);
    const tanks = useSelector((state) => state.tank.tanks);
    const [filteredTanks, setFilteredTanks] = useState([]);
    const [noTanksAvailable, setNoTanksAvailable] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [currentStock, setCurrentStock] = useState(null);
    const [selectedTank, setSelectedTank] = useState(null);
    const [formData, setFormData] = useState({
        siteId: null,
        tankId: null,
        amount: null,
        date: new Date().toISOString()
        
    });

    const handleChange = (e) => {
        const updatedData = { ...localFormData, [e.dataField]: e.value };
        setLocalFormData(updatedData);
        updateFormData(updatedData);
      };

      
    useEffect(() => {
        dispatch(fetchSitebyUserId());
        dispatch(fetchTanks());
    }, [dispatch]);

    
    const handleSiteChange = (e) => {
        const siteId = e.value;
        setSelectedSiteId(siteId);
        setFormData(prevData => ({
            ...prevData,
            siteId: siteId,
            tankId: null
        }));
        const tanksForSite = tanks.filter(tank => tank.siteId === siteId);
        setFilteredTanks(tanksForSite);
        setNoTanksAvailable(tanksForSite.length === 0);
        setCurrentStock(null);
        setSelectedTank(null);
    };
    const handleTankChange = (e) => {
        const tankId = e.value;
        setFormData(prevData => ({
            ...prevData,
            tankId: tankId
        }));
        const selectedTank = tanks.find(tank => tank.id === tankId);
        setSelectedTank(selectedTank);
        if (selectedTank) {
            setCurrentStock(selectedTank.currentStock);
        } else {
            setCurrentStock(null);
        }
    };


    return (
         <ScrollView>       
            
             <Form 
             formData={localFormData}  
                readOnly={isLoading} 
                showColonAfterLabel={true} 
                labelLocation="top"
                 onFieldDataChanged={handleChange} >
          
          <SimpleItem
                    dataField="date"
                    editorType="dxDateBox"
                    editorOptions={{
                        value: formData.date,
                        max: new Date(),
                        displayFormat: "yyyy-MM-dd HH:mm",
                        type: "datetime",
                        onValueChanged: (e) => setFormData(prev => ({ ...prev, date: e.value }))
                    }}
                />
                 

                <SimpleItem dataField="siteId"  editorType="dxSelectBox" editorOptions={{ 
                    items: sites, displayExpr: 
                    'name', valueExpr: 'id',
                     onValueChanged: handleSiteChange,
                     value: formData.siteId }} />

<SimpleItem 
  dataField="tankId" 
  editorType="dxSelectBox" 
  editorOptions={{
    items: filteredTanks, 
    displayExpr: 'name',
    valueExpr: 'id',
    onValueChanged: handleTankChange, 
    value: formData.tankId,
    disabled: !formData.siteId,
  }} 
>  
  <RequiredRule message="Tank is required" />
</SimpleItem>



                      {currentStock !== null && (
                <SimpleItem>
                    <TextBox
                        value={`Current Stock: ${currentStock}`}
                        readOnly={true}
                    />
                </SimpleItem>
            )}
                <SimpleItem 
                dataField="amount" 
                editorType="dxNumberBox"
                 editorOptions={{  
                    showSpinButtons: true ,
                    value: formData.amount,
                    onValueChanged: (e) => setFormData(prev => ({ ...prev, amount: e.value }))
                                 
                 }} ><RequiredRule   /></SimpleItem>
       
                {/* <SimpleItem >
                    <ButtonItem horizontalAlignment="left" buttonOptions={automaticStockButtonOptions} />

                    <label> get automatic tank level from sensor </label>
                </SimpleItem> */}

            {/* <ButtonItem horizontalAlignment="right" buttonOptions={submitButtonOptions} /> */}
        </Form>
        </ScrollView>

    );
}

export default OpeningStockForm;