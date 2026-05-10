// Code Created by Kevin Kagiri@kagz100 
// Date Created: 15th July 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js
import React ,{useCallback,useEffect,useMemo  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Lookup , MasterDetail ,   GroupPanel, 
    Grouping,
    Summary,
    GroupItem,
    TotalItem ,  StateStoring,
} from 'devextreme-react/data-grid';
import { fetchTanks } from '../../redux/actions/tankActions';
import { fetchSiteList } from '../../redux/actions/siteActions';
import { formatDate } from './../../utils/dateUtils';
import TankHistoryVolumeDatagrid from './tankHistoryVolumeDatagrid';

const TankStockDatagrid = ({ tankStockDataSource }) => {

    const dispatch = useDispatch();



    const fetchData = useCallback(async () => {
        try {
            await Promise.all([
                dispatch(fetchTanks()),
                dispatch(fetchSiteList()),
            ]);
        } catch (error) {
            console.log(error);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    
    const renderDetail = useCallback((props) => {
        return (
            <TankHistoryVolumeDatagrid
                startDate={props.data.data.reconciliationDate}
                endDate={props.data.data.reconciliationDate}
                tankId={props.data.data.tankId}

            />
        );
    }, []);
    const MemoizedMasterDetail = useMemo(() => {
        return (
            <MasterDetail
                enabled={true}
                component={renderDetail}
            />
        );
    }, [renderDetail]);
    return (
        <div>
        <DataGrid
            dataSource={tankStockDataSource}
            showBorders={true}
            showColumnLines={true}
            showRowLines={true}
            allowColumnResizing={true}
            showColumnHeaders={true}
        >
        <StateStoring enabled={true} type="sessionStorage" storageKey="tankStockDataGrid" />

        <GroupPanel visible={true} allowColumnDragging={false} />
                    <Grouping autoExpandAll={true} />
          <Column dataField="id" caption="ID"  visible={false} defaultSortOrder="asc" />
          <Column dataField="siteName" caption="Site" groupIndex={0} />
          <Column dataField="tankName" caption="Tank" />
           <Column dataField="reconciliationDate" caption="Date"      cellRender={formatDate} />
           <Column dataField="openingLevel" caption="Opening Level"  />
           <Column dataField="closingLevel" caption="Closing Level"  />
           
            <Column dataField="totalDeliveries" caption="Total Deliveries" />
            <Column dataField="totalRefills" caption="Total Fuel Dispense" />
            <Column dataField="totalTransfersIn" caption="Total Fuel Transfered In"/>
            <Column dataField="totalTransfersOut" caption="Total Fuel Transfered Out"/>   
            {MemoizedMasterDetail}

        </DataGrid>
        </div>
    );

}

export  default TankStockDatagrid;