import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem ,GroupItem,ButtonItem, Label, RequiredRule,NumericRule } from 'devextreme-react/form';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import { fetchSitebyUserId } from '../../redux/actions/siteActions';
import { fetchTanks } from '../../redux/actions/tankActions';
import { fetchSuppliers } from '../../redux/actions/SupplierActions'; // Assuming you have this action
//import './deliveryForm.scss';
import LoadIndicator from 'devextreme-react/load-indicator';


const Products = [ {id:1, name:'Diesel'},{id:2, name:'Petrol'},{id:3, name:'Kerosene'}];

const TankDeliveryForm = ({ updateFormData, isLoading  }) => {
    const [localFormData, setLocalFormData] = useState({});

    const dispatch = useDispatch();
    const sites = useSelector((state) => state.site.sites);
    const tanks = useSelector((state) => state.tank.tanks);
    const suppliers = useSelector((state) => state.supplier.suppliers);
    const [filteredTanks, setFilteredTanks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        siteId: 0,
        tankId: 0,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
         manualDeliveryAmount: 0,
        sensorDeliveryAmount: 0,
        deliveryTemperature: 0,
        deliveryDensity: 0,
        deliveryMass: 0,
        stockBeforeDelivery: 0,
        stockAfterDelivery: 0,
        supplierId: 0,
        lpoNumber: '',
        product: ''
    });

    const handleChange = useCallback((e) => {
        const { dataField, value } = e;
        let updatedValue = value;
    
        // Special handling for product field
        if (dataField === 'product') {
          updatedValue = Products.find(p => p.id === value)?.name || '';
        }
    
        setFormData(prev => {
          const updated = { ...prev, [dataField]: updatedValue };
          updateFormData(updated);
          return updated;
        });
      }, [updateFormData]);


    useEffect(() => {
        dispatch(fetchSitebyUserId());
        dispatch(fetchTanks());
        dispatch(fetchSuppliers());
    }, [dispatch]);

    const handleSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            siteId: siteId,
            tankId: null
        }));
        const tanksForSite = tanks.filter(tank => tank.siteId === siteId);
        setFilteredTanks(tanksForSite);
    }, [tanks]);


   

   
    return (
        <ScrollView className='delivery-form'>       
            <Form 
             formData={localFormData}  
                readOnly={isLoading} showColonAfterLabel={true} labelLocation="top"
                 onFieldDataChanged={handleChange} >

                <GroupItem caption="General Details" colCount={2}>
                <SimpleItem 
                        dataField="date" 
                        editorType="dxDateBox"
                        editorOptions={{
                            max: new Date(),
                            displayFormat: "yyyy-MM-dd HH:mm",
                            type: "datetime",
                            // Set pickerType to 'calendar' for better date-time selection UI
                            pickerType: 'calendar'
                        }}
                    >
                        <RequiredRule message="Date and time are required" />
                    </SimpleItem>
                <SimpleItem dataField="siteId" editorType="dxSelectBox"
                    editorOptions={{items: sites, displayExpr: 'name', valueExpr: 'id', onValueChanged: handleSiteChange}} ><Label text="Site" /></SimpleItem>
                <SimpleItem dataField="tankId" editorType="dxSelectBox"
                    editorOptions=
                    {{items: filteredTanks,
                     displayExpr: 'name',
                      valueExpr: 'id',
                        disabled: !formData.siteId
                      
                      }}>
                   </SimpleItem>

                    </GroupItem>
           <GroupItem caption="Delivery Details" colCount={2}>
                     
           <SimpleItem dataField="stockBeforeDelivery" editorType="dxNumberBox">
            <RequiredRule message="Stock Before Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="stockAfterDelivery" editorType="dxNumberBox">
            <RequiredRule message="Stock After Delivery is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>         
      
     <SimpleItem dataField="manualDeliveryAmount" editorType="dxNumberBox">
            <RequiredRule message="Manual Delivery Amount is required" />
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>

          <SimpleItem dataField="sensorDeliveryAmount" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>


                </GroupItem>
                <GroupItem caption="Delivery Measurements" colCount={2}>
                <SimpleItem
            dataField="product"
            editorType="dxSelectBox"
            editorOptions={{
              items: Products,
              displayExpr: 'name',
              valueExpr: 'id'
            }}
          >
            <RequiredRule message="Product is required" />
          </SimpleItem>
          <SimpleItem dataField="deliveryTemperature" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="deliveryDensity" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
          <SimpleItem dataField="deliveryMass" editorType="dxNumberBox">
            <NumericRule min={0} message="Value cannot be negative" />
          </SimpleItem>
                </GroupItem>
                <GroupItem caption="Supplier Details" colCount={2}>
                <SimpleItem dataField="supplierId" editorType="dxSelectBox"
                    editorOptions={{items: suppliers, displayExpr: 'name', valueExpr: 'id'}} />
                <SimpleItem dataField="lpoNumber" />
                </GroupItem>
            </Form>
          
        </ScrollView>
    );
};

export default TankDeliveryForm;