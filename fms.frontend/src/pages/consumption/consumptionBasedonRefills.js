import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Paging,
          HeaderFilter, SearchPanel, Toolbar, Item as TItems,
           FilterRow, Column, Sorting , Pager,StateStoring,TotalItem,
           LoadPanel,Export,Selection,Grouping,GroupPanel,Summary,GroupItem,
           ColumnChooser,ColumnChooserSelection , Scrolling ,MasterDetail
         } from 'devextreme-react/data-grid';

import { fetchConsumptionByDateRange ,fetchConsumptionByDateRangeByVehicleID } from './../../redux/actions/consumptionActions';
import Button from 'devextreme-react/button';
import  DateBox  from 'devextreme-react/date-box';
import notify from 'devextreme/ui/notify';
const ConsumptionBasedonRefills = () => {
    const dispatch = useDispatch();
    const consumption = useSelector((state) => state.consumption.consumption);
    const loading = useSelector((state) => state.consumption.loading);
    const [dataCounter, setDataCounter] = useState(0);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    
    const exportFormats = ['xlsx'];
    
    const fetchData = useCallback(() => {
        if (startDate && endDate) {
            // NEW: Added date validation
            if (startDate > endDate) {
                notify('Start date cannot be after end date', 'error', 3000);
                return;
            }
            dispatch(fetchConsumptionByDateRange(startDate, endDate));
        }
    }, [dispatch, startDate, endDate]);

    const onStartDateChanged = (e) => {
        setStartDate(e.value);
    };

    const onEndDateChanged = (e) => {
        setEndDate(e.value);
    };

    const applyFilter = () => {
        fetchData();
    };
    const refresh = () => {
        fetchData();
    };
    const handleRowPrepared = (e) => {
        if (e.rowType === 'data') {
          const newCounter = { ...dataCounter };
          newCounter[e.key] = Object.keys(dataCounter).length + 1;
          setDataCounter(newCounter);
        }
      };

    const renderDetail = (props) => {
        console.log(props.data.data);
        return (
            <RefillDetails
                vehicleId={props.data.data.vehicleId}
                startDate={startDate}
                endDate={endDate}
            />
        );
    };
    return (
        <div className='content-block'>
        <DataGrid
            dataSource={consumption}
            keyExpr="id" 
                        showBorders={true}
            focusedRowEnabled={true}
            height={'100%'}
            onContentReady={(e) => {
                console.log('DataGrid content ready:', e);
                console.log('Visible rows:', e.component.getVisibleRows());
            }}
            >
            <Paging enabled={true} defaultPageSize={30} />
            <FilterRow visible={true} />
            {/* <Pager visible={true} showPageSizeSelector={true} showInfo={true} /> */}
             <Scrolling mode={'infinite'} />  
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Selection mode={'multiple'} />
            <LoadPanel enabled={true} /> 
           <Grouping autoExpandAll={true} />
           <GroupPanel visible={true} />

           <StateStoring enabled={true} type="sessionStorage" storageKey="refuelingGridState" />

            <Export enabled={true} allowExportSelectedData={true} formats ={exportFormats} />
            <Toolbar >

<TItems location="before" widget={'dxDateBox'}>
        <DateBox
            value={startDate}
            onValueChanged={onStartDateChanged}
            placeholder="Start Date"
            type="date"
        />
    </TItems>
    <TItems location="before" widget={'dxDateBox'}>
        <DateBox
            value={endDate}
            onValueChanged={onEndDateChanged}
            placeholder="End Date"
            type="date"
        />
    </TItems>
    <TItems location="after" locateInMenu={'auto'} showText='inMenu'>
        <Button
            text="Apply"
            onClick={applyFilter}
            type='default'

            stylingMode='contained'

        />
    </TItems>

         <TItems
            location='after'
            locateInMenu='auto'
            showText='inMenu'
            widget='dxButton'
        >
            <Button
                icon='refresh'
                text='Refresh'
                stylingMode='text'
                onClick={refresh}
            />
        </TItems>
           <TItems name="exportButton" locateInMenu={'auto'} />

</Toolbar>
<Column 
        caption="#" 
        cellRender={(cellData) => {
          return cellData.rowType === 'data' ? dataCounter[cellData.key] : '';
        }} 
        width={70} 
      />
           <Column dataField={'vehicleId'} caption={'ID'} width={100}  visible={false}/>
            <Column dataField="hyoungNo" caption="Vehicle Number"  />

            <Column dataField="vehicleType" caption="Vehicle Type" />
            <Column dataField="workingSiteName" caption="Working Site" groupIndex={0} />
            <Column dataField="totalFuelAmount" caption="Fuel Amount"format="fixedPoint" precision={0} />
            <Column 
                dataField="consumption" 
                caption="Consumption" 
                dataType="number" 
                format="#,##0.0"
                calculateCellValue={(rowData) => {
                    if (rowData.consumption === 0 && rowData.distanceOrEngineHours > 0 && rowData.manualFuelrefilAmount > 0) {
                        return rowData.isKmL 
                            ? (rowData.distanceOrEngineHours / rowData.manualFuelrefilAmount).toFixed(2)
                            : (rowData.manualFuelrefilAmount / rowData.distanceOrEngineHours).toFixed(2);
                    }
                    return rowData.consumption;
                }}
            />
            <Column dataField="distanceOrEngineHours" caption="Distance/Engine Hours" dataType="number" format="fixedPoint" precision={1} />
            <Column dataField="passenger" caption="Passenger" />
            <Column dataField="vehicleInfo" caption="Vehicle Info" />

            <Column dataField="refillCount" caption="Refill Count" width={150} />

                        <Summary>
                <GroupItem
                    column="totalFuelAmount"
                    summaryType="sum"
                    displayFormat="{0} Total Fuel"
                    valueFormat="#,##0"
                />
              <GroupItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="{0} vehicles"
                    />
                       <TotalItem
                        column="hyoungNo"
                        summaryType="count"
                        displayFormat="Total: {0} vehicles"
                    />
            </Summary>
                   
            <MasterDetail
                    enabled={true}
                    component={renderDetail}
                />

        </DataGrid>
        </div>  

    );

};
const RefillDetails = ({ vehicleId, startDate, endDate }) => {
    const dispatch = useDispatch();
    const refills = useSelector((state) => state.consumption.vehicleRefills);

    useEffect(() => {
        console.log("vehicleId",vehicleId);
        dispatch(fetchConsumptionByDateRangeByVehicleID(startDate, endDate, vehicleId));
    }, [dispatch, startDate, endDate, vehicleId]);

    return (
        <DataGrid
            dataSource={refills}
            showBorders={true}
            columnAutoWidth={true}

        >
            <Paging defaultPageSize={5} />
            <Column dataField="date" dataType="date" />
            <Column dataField="manualFuelrefilAmount" caption="Fuel Amount" />
            <Column dataField="previousMeterReading" caption="Previous Reading" />
            <Column dataField="currentMeterReading" caption="Current Reading" />
            <Column dataField="distanceOrEngineHours" caption="Distance/Engine Hours" dataType="number" format="fixedPoint" precision={0} />
            <Column dataField="consumption" caption="Consumption" dataType="number" format="fixedPoint" precision={1} />
            <Column dataField="siteName" caption="Site" />
            <Column dataField="fuelBy" caption="Fuel By" />
            <Column dataField="driverName" caption="Driver" />
            <Column dataField="comment" caption="Comment" />
        </DataGrid>
    );
};


export default ConsumptionBasedonRefills;