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
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';

const ConsumptionBasedonRefills = () => {
    const dispatch = useDispatch();
    const consumption = useSelector((state) => state.consumption.consumption);
    const loading = useSelector((state) => state.consumption.loading);
    const [dataCounter, setDataCounter] = useState(0);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const dataGridRef = React.useRef(null);


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
        return (
            <RefillDetails
                vehicleId={props.data.data.vehicleId}
                startDate={startDate}
                endDate={endDate}
            />
        );
    };


    const onExporting = useCallback((e) => {
        console.log('Export started', { event: e });
    
        try {
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Consumption Based on Refills');
            
            console.log('Workbook and worksheet created');
            notify('Preparing export...', 'info', 2000);
    
            console.log('Starting exportDataGrid with component:', e.component);
            
            exportDataGrid({
                component: e.component,
                worksheet,
                autoFilterEnabled: true,
                customizeCell: ({ gridCell, excelCell }) => {
                    if (gridCell.rowType === 'data') {
                        excelCell.font = { size: 12 };
                    }
                    if (gridCell.rowType === 'header') {
                        excelCell.font = { bold: true };
                    }
                    console.log('Customizing cell:', { rowType: gridCell.rowType });
                }
            }).then(() => {
                console.log('exportDataGrid completed, creating buffer');
                workbook.xlsx.writeBuffer()
                    .then((buffer) => {
                        console.log('Buffer created, saving file');
                        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'ConsumptionBasedonRefills.xlsx');
                        notify('Export complete', 'success', 2000);
                    })
                    .catch(err => {
                        console.error("Buffer creation error:", err);
                        notify('Export failed', 'error', 2000);
                    });
            }).catch(err => {
                console.error("exportDataGrid error:", err);
                notify('Export failed', 'error', 2000);
            });
    
            e.cancel = true;
        } catch (error) {
            console.error("General export error:", error);
            notify('Export failed', 'error', 2000);
        }
    }, []);



    return (
        <div className='content-block'>
        <DataGrid
            dataSource={consumption}
            ref={dataGridRef}
            keyExpr="id" 
            showBorders={true}
            focusedRowEnabled={true}
            height={'100%'}
            onExporting={onExporting}
            >
            <Paging enabled={true} defaultPageSize={30} />
            <FilterRow visible={true} />
            {/* <Pager visible={true} showPageSizeSelector={true} showInfo={true} /> */}
             <Scrolling mode="infinite" />  
            <SearchPanel visible={true} />
            <HeaderFilter visible={true} />
            <Selection 
                mode="multiple"
                deferred={true}  // Add this
                selectAllMode="page"  // Add this
            />
            <LoadPanel enabled={true} /> 
           <Grouping autoExpandAll={true} />
           <GroupPanel visible={true} />

           <StateStoring enabled={true} type="sessionStorage" storageKey="refuelingGridState" />

            <Export 
                enabled={true}
                formats={['xlsx']}
                allowExportSelectedData={true}
            />
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
           <TItems name="exportButton" 
           locateInMenu={'auto'}
           
/>

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