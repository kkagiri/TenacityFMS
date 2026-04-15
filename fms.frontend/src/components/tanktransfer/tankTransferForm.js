import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, GroupItem, RequiredRule } from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import { fetchSitebyUserId } from '../../redux/actions/siteActions';
import { fetchTanks } from '../../redux/actions/tankActions';
import './tankTransferForm.scss';

const TankTransferForm = ({ updateFormData, isLoading }) => {
    const [localFormData, setLocalFormData] = useState({});

    const dispatch = useDispatch();
    const sites = useSelector((state) => state.site.sites);
    const tanks = useSelector((state) => state.tank.tanks);
    const [sourceTanks, setSourceTanks] = useState([]);
    const [destinationTanks, setDestinationTanks] = useState([]);
    const [formData, setFormData] = useState({
        sourceSiteId: null,
        sourceTankId: null,
        destinationSiteId: null,
        destinationTankId: null,
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

    const handleSourceSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            sourceSiteId: siteId,
            sourceTankId: null
        }));
        const tanksForSite = tanks.filter(tank => tank.siteId === siteId);
        setSourceTanks(tanksForSite);
    }, [tanks]);

    const handleDestinationSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            destinationSiteId: siteId,
            destinationTankId: null
        }));
        const tanksForSite = tanks.filter(tank => tank.siteId === siteId);
        setDestinationTanks(tanksForSite);
    }, [tanks]);




    return (
        <ScrollView className='tank-transfer-form'>
            {isLoading && (
                <div className='tank-transfer-form__loading'>
                    <LoadIndicator width={20} height={20} visible={true} />
                    <span>Posting transfer...</span>
                </div>
            )}
            <Form
                formData={localFormData}
                readOnly={isLoading} showColonAfterLabel={true} labelLocation="top"
                onFieldDataChanged={handleChange} >

                <SimpleItem dataField="date" editorType="dxDateBox"
                    editorOptions={{
                        max: new Date().toISOString(),
                        displayFormat: "yyyy-MM-dd HH:mm",
                        type: "datetime",
                        placeholder: 'Select Transfer Date'
                    }} />
                <GroupItem caption="Source">
                    <SimpleItem dataField="sourceSiteId" editorType="dxSelectBox"
                        editorOptions={{
                            items: sites,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleSourceSiteChange,
                            placeholder: 'Select Source Site',

                        }} />
                    <SimpleItem dataField="sourceTankId" editorType="dxSelectBox"
                        editorOptions={{
                            items: sourceTanks,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            placeholder: 'Select Source Tank',
                            disabled: !formData.sourceSiteId
                        }} />
                </GroupItem>
                <GroupItem caption="Destination">
                    <SimpleItem dataField="destinationSiteId" editorType="dxSelectBox"
                        editorOptions={{
                            items: sites,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleDestinationSiteChange,
                            placeholder: 'Select Destination Site'
                        }} />
                    <SimpleItem dataField="destinationTankId" editorType="dxSelectBox"
                        editorOptions={{
                            items: destinationTanks,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            placeholder: 'Select Destination Tank',
                            disabled: !formData.destinationSiteId
                        }} />
                </GroupItem>
                <SimpleItem dataField="amount" editorType="dxNumberBox"
                    editorOptions={{
                        placeholder: 'Enter Transfer Amount'
                    }} />

            </Form>

        </ScrollView>
    );
};

export default TankTransferForm;