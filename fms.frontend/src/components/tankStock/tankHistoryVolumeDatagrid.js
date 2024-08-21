//code created: kevin.kagiri@kagz100
//date created:05 Aug 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Lookup, Paging, FilterRow, HeaderFilter,LoadPanel , Export, Grouping, GroupPanel, FilterPanel, Summary, GroupItem } from 'devextreme-react/data-grid';
import { formatDate } from './../../utils/dateUtils';

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
    const [groupedColumns, setGroupedColumns] = useState(['site', 'tankId']);
    const exportFormats = ['xlsx'];
    const [isLoading, setIsLoading] = useState(true);
    const onDataGridReady = useCallback(() => {
        setIsLoading(false);
    }, []);


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
        
        if (selectedPeriod === 'Today') {
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
        } else {
            if (options.summaryProcess === 'finalize') {
                options.totalValue = 'N/A';
            }
        }
    }, [selectedPeriod, filteredTanks]);

    return (
        <div>            
            <DataGrid
                dataSource={tankVolumeHistory}
                showBorders={true}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                showColumnHeaders={true}
            >
                <FilterPanel visible={true} />
                <GroupPanel visible={true} />
                <Grouping visible={true} autoExpandAll={true} />
                <HeaderFilter visible={true} />
                <FilterRow visible={true} />

                <Paging defaultPageSize={20} />

                <LoadPanel enabled={isLoading} />
                <Column dataField="id" caption="ID" visible={false} defaultSortOrder="asc" />

                <Column dataField="timestamp" caption="Timestamp" cellRender={formatTime} minWidth={100} />
                <Column dataField="site" caption="Site" groupIndex={0} />
                <Column dataField="tankId" caption="Tank" groupIndex={1} >
                    <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
                </Column>

                <Column dataField="changeReason" caption="Change Reason " minWidth={130}>
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
                </Summary>
            </DataGrid>
          
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