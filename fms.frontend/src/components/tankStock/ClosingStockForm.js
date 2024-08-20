import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, ButtonItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import DataGrid, { Column ,    GroupPanel, 
    Grouping,
    Summary,
    GroupItem,
    TotalItem ,Lookup} from 'devextreme-react/data-grid';
import { fetchSitebyUserId } from '../../redux/actions/siteActions';
import { fetchTanks } from '../../redux/actions/tankActions';
import { fetchTankVolumeHistoryByTankId } from '../../redux/actions/tankVolumeHistoryActions';
import { createClosingStock } from '../../redux/actions/tankStockAction';
import { VolumeChangeReasonEnum } from '../../utils/enums';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import ScrollView from 'devextreme-react/scroll-view';

import './closingForm.scss';
import { LayoutTypeItem } from 'devexpress-reporting/dx-reportdesigner';
const ClosingStockForm = ({ updateFormData , isLoading }) => {
    const [localFormData, setLocalFormData] = useState({});

    const dispatch = useDispatch();
    const sites = useSelector((state) => state.site.sites);
    const tanks = useSelector((state) => state.tank.tanks);
    const tankVolumeHistory = useSelector((state) => {
        return state.tankVolumeHistory.tankVolumeHistory;
    });
        const [filteredTanks, setFilteredTanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        siteId: null,
        tankId: null,
        amount: null,
        date :  new Date()
    });
 const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    useEffect(() => {
        dispatch(fetchSitebyUserId());
        dispatch(fetchTanks());
    }, [dispatch]);

    const fetchTankVolumeHistory = useCallback(() => {
        if (formData.tankId && formData.date) {
            const formattedDate = formatDate(formData.date);
            dispatch(fetchTankVolumeHistoryByTankId(formattedDate, formattedDate, formData.tankId));
        }
    }, [dispatch, formData.tankId, formData.date]);


    useEffect(() => {
        if (formData.tankId && formData.date) {
            fetchTankVolumeHistory();
        }
    }, [formData.tankId, formData.date]);

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

    const formatTime = (cellInfo) => {
        if (cellInfo.value) {
            const date = new Date(cellInfo.value);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return '';
    };
    const handleTankChange = useCallback((e) => {
        const tankId = e.value;
        setFormData(prevData => ({
            ...prevData,
            tankId: tankId
        }));
    }, []);

    const handleDateChange = useCallback((e) => {
        const newDate = e.value;
        setFormData(prevData => ({
            ...prevData,
            date: newDate
        }));
        // This will trigger the useEffect hook to fetch new data
    }, []);


   
    // const handleFormChange = useCallback((e) => {
    //     const { dataField, value } = e;
    //     setFormData(prev => ({ ...prev, [dataField]: value }));

    //     if (dataField === 'siteId') {
    //         const tanksForSite = tanks.filter(tank => tank.siteId === value);
    //         setFilteredTanks(tanksForSite);
    //         setFormData(prev => ({ ...prev, tankId: null }));
    //     }

    //     if (dataField === 'tankId' || dataField === 'date') {
    //         fetchTankVolumeHistory();
    //     }
    // }, [tanks, fetchTankVolumeHistory]);
    const handleChange = (e) => {
        const updatedData = { ...localFormData, [e.dataField]: e.value };
        setLocalFormData(updatedData);
        updateFormData(updatedData);
      };

    const calculateTotalFuelDispensed = (options) => {
        if (options.name === 'TotalFuelDispensed') {
            const dispensingTotal = options.data.reduce((acc, item) => {
                if (item.changeReason === 'Dispensing' || item.changeReason === 'TransferOut') {
                    return acc + Math.abs(item.volumeChange);
                }
                return acc;
            }, 0);
            return dispensingTotal;
        }
    };
    return (
        <ScrollView className='closing-stock-form'>       

        <Form 
        readOnly={ isLoading} 
        formData={localFormData}  

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
                    >
                        <RequiredRule message="Date is required" />
                    </SimpleItem>
               <SimpleItem
                dataField="siteId"
                label="Site"
                editorType="dxSelectBox"
                editorOptions={{
                    items: sites,
                    displayExpr: 'name',
                    valueExpr: 'id',
                    onValueChanged: handleSiteChange,
                    value: formData.siteId
                }}
            ><Label text="Site" /></SimpleItem>
            <SimpleItem
                dataField="tankId"
                editorType="dxSelectBox"
                editorOptions={{
                    items: filteredTanks,
                    displayExpr: 'name',
                    valueExpr: 'id',
                    onValueChanged: handleTankChange,
                    value: formData.tankId,
                    disabled: !formData.siteId
                    
                }}>
            <RequiredRule message="Tank required"/>
          
             </SimpleItem>
            <SimpleItem> <div className="data-grid-container">
                <DataGrid
                  key={`${formData.tankId}-${formData.date}`}
                   dataSource={formData.tankId ? tankVolumeHistory : []}
                    showBorders={true}
                    height="100%"
                    allowColumnReordering={false}
                    allowColumnResizing={false}
                    columnAutoWidth={true}
                    showRowLines={true}
                    rowAlternationEnabled={true}
                >
                      <GroupPanel visible={true} allowColumnDragging={false} />
                    <Grouping autoExpandAll={true} />


                    <Column dataField="timestamp" caption="Time"dataType="datetime"
                cellRender={formatTime} />
                    <Column dataField="volumeChange" caption="Volume Change" />
                    <Column dataField="newVolume" caption="New Volume" />
                    <Column dataField="changeReason" caption="Reason" groupIndex={0}>
                        <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
                    </Column>
                    <Summary>
                        <GroupItem
                            column="volumeChange"
                            summaryType="sum"
                            displayFormat="Total: {0}"
                            showInGroupFooter={true}
                        />
                        <TotalItem
                            column="volumeChange"
                            summaryType="sum"
                            displayFormat="Grand Total: {0}"
                        />
                        <TotalItem
                            name="TotalFuelDispensed"
                            displayFormat="Total Fuel Dispensed: {0}"
                            calculateCustomSummary={calculateTotalFuelDispensed}
                        />
                    </Summary>
                </DataGrid>
              </div>
            </SimpleItem>
            <SimpleItem
                    dataField="amount"
                    editorType="dxNumberBox"
                    editorOptions={{
                        showSpinButtons: true,
                        value: formData.amount,
                        // Changed from closingStock to amount
                        onValueChanged: (e) => setFormData(prev => ({ ...prev, amount: e.value }))
                    }}
               />
        </Form>
       
        </ScrollView>
    );
};

export default ClosingStockForm;