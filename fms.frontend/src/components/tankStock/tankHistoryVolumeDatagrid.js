//code created: kevin.kagiri@kagz100
//date created:05 Aug 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Toolbar, { Item as thvdItem } from 'devextreme-react/toolbar';

import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Lookup, Paging, FilterRow,Selection,
      TotalItem,Toolbar as TB,
       Item as TBItem,HeaderFilter,LoadPanel , Export,
        Grouping, GroupPanel, FilterPanel, Summary, GroupItem } from 'devextreme-react/data-grid';
import { formatDate } from './../../utils/dateUtils';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import Button from 'devextreme-react/button';
import { exportDataGrid } from 'devextreme/excel_exporter';


const TankHistoryVolumeDatagrid = ({ tankVolumeHistory, selectedSite, selectedPeriod }) => {
    const VolumeChangeReasonEnum = [
        { id: 0, name: 'OpeningStock' },
        { id: 1, name: 'ClosingStock' },
        { id: 2, name: 'Delivery' },
        { id: 3, name: 'TransferIn' },
        { id: 4, name: 'TransferOut' },
        { id: 5, name: 'Adjustment' },
        { id: 6, name: 'Dispensing' }
    ];
    const dataGridRef = React.useRef(null);

    const [groupedColumns, setGroupedColumns] = useState(['site', 'tankId']);
    const exportFormats = ['xlsx'];
    const [isLoading, setIsLoading] = useState(true);
    const onDataGridReady = useCallback(() => {
        setIsLoading(false);
    }, []);
    const changeReasonCellRender = (cellInfo) => {
        const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
        if (reason) {
            if (reason.name === 'Dispensing' && cellInfo.data.vehicleName) {
                return `${reason.name} - ${cellInfo.data.vehicleName}`;
            }
            return reason.name;
        }
        return cellInfo.value;
    };

    const formatTime = (cellInfo) => {
        const date = new Date(cellInfo.value);
        const utcDate = new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds()
            )
        );
        return utcDate.toLocaleString();
    };

    const tanks = useSelector((state) => state.tank.tanks);
    const users = useSelector((state) => state.user.users);
    const filteredTanks = useMemo(() => {
        if (selectedSite === 'all') {
            return tanks;
        }
        return tanks.filter(tank => tank.siteId === selectedSite);
    }, [tanks, selectedSite]);

    


    const totalCapacity = useMemo(() => {
        return filteredTanks.reduce((sum, tank) => sum + tank.tankVolume, 0);
    }, [filteredTanks]);

    const currentTotalStock = useMemo(() => {
        return filteredTanks.reduce((sum, tank) => sum + tank.currentStock, 0);
    }, [filteredTanks]);

    const percentageRemaining = useMemo(() => {
        return totalCapacity > 0 ? (currentTotalStock / totalCapacity) * 100 : 0;
    }, [currentTotalStock, totalCapacity]);

    const calculateCustomSummary = useCallback((options) => {
        
        
            if (options.summaryProcess === 'start') {
                options.totalValue = { currentStock: 0, capacity: 0, count: 0, processedTanks: new Set() };
            }
            if (options.summaryProcess === 'calculate') {
                const isSiteLevel = options.groupIndex === 0;
                const tankId = options.value;
                
                const tank = filteredTanks.find(t => t.id === tankId);
                if (tank) {
                    if (isSiteLevel) {
                        // Site level aggregation
                        if (!options.totalValue.processedTanks.has(tank.id)) {
                            options.totalValue.currentStock += tank.currentStock;
                            options.totalValue.capacity += tank.tankVolume;
                            options.totalValue.count += 1;
                            options.totalValue.processedTanks.add(tank.id);}
                    } else {
                        // Tank level
                        options.totalValue.currentStock = tank.currentStock;
                        options.totalValue.capacity = tank.tankVolume;
                        options.totalValue.count = 1;
                    }
                }
            }
            if (options.summaryProcess === 'finalize') {
                switch (options.name) {
                    case 'currentStock':
                        options.totalValue = options.totalValue.currentStock.toFixed(2);
                        break;
                    case 'capacity':
                        options.totalValue = options.totalValue.capacity.toFixed(2);
                        break;
                    case 'percentageRemaining':
                        const percentage = options.totalValue.capacity > 0
                            ? (options.totalValue.currentStock / options.totalValue.capacity) * 100
                            : 0;
                        options.totalValue = percentage.toFixed(2) + '%';
                        break;
                }
            }
        
    }, [selectedPeriod, filteredTanks]);


    const onExporting = useCallback((e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Tank History Volume');

        const changeReasonCellPrepareFunction = (cell, cellInfo) => {
            const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
            if (reason) {
                if (reason.name === 'Dispensing' && cellInfo.data.vehicleName) {
                    cell.value = `${reason.name} - ${cellInfo.data.vehicleName}`;
                } else {
                    cell.value = reason.name;
                }
            }
        };

        const dateCellPrepareFunction = (cell) => {
            if (cell.value instanceof Date) {
                cell.value = cell.value.toLocaleString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(/\//g, '-');
            }
        };

        exportDataGrid({
            component: dataGridRef.current.instance,
            worksheet: worksheet,
            autoFilterEnabled: true,
            customizeCell: ({ gridCell, excelCell }) => {
                if (gridCell.column.dataField === 'changeReason') {
                    changeReasonCellPrepareFunction(excelCell, gridCell);
                }
                if (gridCell.column.dataField === 'timestamp') {
                    dateCellPrepareFunction(excelCell);
                }
            }
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'TankHistoryVolume.xlsx');
            });
        });
        e.cancel = true;
    }, [VolumeChangeReasonEnum]);

      
    return (
            <div style={{ display: 'flex',  marginTop:'20px' }}>
       
            <DataGrid
                dataSource={tankVolumeHistory}
                showBorders={true}
                ref={dataGridRef}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                showColumnHeaders={true}
                instanceName="tankHistoryVolumeGrid"

            >
                <FilterPanel visible={true} />
                <GroupPanel visible={false} />
                <Grouping visible={true} autoExpandAll={false} />
                <HeaderFilter visible={true} />
                <FilterRow visible={true} />
                <Paging defaultPageSize={20} />
                <Selection mode="multiple" />
                <TB visible={true}  >
                    <TBItem    location="after"
                    widget="dxButton"
                    options={{
                        icon: 'fa-light fa-file-export',
                        text: 'Export',
                        onClick: onExporting
                    }}   
                       />

                </TB>

                <LoadPanel enabled={isLoading} />
                <Column dataField="id" caption="ID" visible={false} defaultSortOrder="asc" />

                <Column dataField="timestamp" caption="Timestamp" cellRender={formatTime} minWidth={100} />
                <Column dataField="site" caption="Site" groupIndex={0} />
                <Column dataField="tankId" caption="Tank" groupIndex={1} >
                    <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
                </Column>

                <Column dataField="changeReason"  caption="Change Reason"  minWidth={130}
           cellRender={changeReasonCellRender}
                >
      <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
               </Column>
                <Column dataField="newVolume" caption="New Volume" minWidth={120} />

                <Column dataField="volumeChange" caption="Volume Change" minWidth={150} />

                <Column dataField="recordedBy" caption="Recorded By" minWidth={100} hidingPriority={3} cellRender={(cellData) => {
                    const user = users.find(u => u.id === cellData.value);
                    return user ? user.userName : cellData.value;
                }}>
                    <Lookup dataSource={users} valueExpr="id" displayExpr="userName" />
                </Column>
                <Summary calculateCustomSummary={calculateCustomSummary}>
                    <GroupItem
                        column="tankId"
                        summaryType="custom"
                        name="currentStock"
                        showInGroupFooter={false}
                        alignByColumn={true}
                        displayFormat="Current Stock: {0}"
                        valueFormat="fixedPoint"
                        precision={2}

                    />
                    <GroupItem
                        column="tankId"
                        summaryType="custom"
                        name="capacity"
                        showInGroupFooter={false}
                        alignByColumn={true}
                        displayFormat="/ {0} liters"
                        valueFormat="fixedPoint"
                        precision={2}
                    />
                    <GroupItem
                        column="tankId"
                        summaryType="custom"
                        name="percentageRemaining"
                        showInGroupFooter={false}
                        alignByColumn={true}
                        displayFormat="Remaining: {0} %"
                    />
                           <GroupItem
                        column="volumeChange"
                        summaryType="sum"
                        valueFormat="fixedPoint"
                        precision={2}
                        displayFormat="Total : {0} liters"
                        showInGroupFooter={true}
                      
                    />
                <TotalItem
                        column="volumeChange"
                        summaryType="sum"
                        valueFormat="fixedPoint"
                        precision={2}
                        calculateCustomSummary={(options) => {
                            if (options.summaryProcess === 'finalize') {
                                options.totalValue = Math.abs(options.totalValue);
                            }
                        }}
                    />

                </Summary>
            </DataGrid>
          <style jsx>{`
                :global(.dark-group-item) {
                    font-weight: bold;
                    color: #333;
                }
            `}</style>
        </div>
    );
}


export default TankHistoryVolumeDatagrid;




// enum VolumeChangeReasonEnum
//{
//  OpeningStock = 0,
//  ClosingStock,
//  Delivery,
//   TransferIn,
//   TransferOut,
//   Adjustment,
//    Dispensing
//}