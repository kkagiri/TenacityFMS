// Code Created by Kevin Kagiri 
// Date Created: 15th July 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js
import React from 'react';
import { useDispatch, useSelector,useEffct } from 'react-redux';
import { DataGrid, Column, Lookup } from 'devextreme-react/data-grid';
import { fetchTanks } from '../../actions/tankActions';
import { fetchSiteList } from '../../actions/siteActions';
import { fetchUsers } from '../../actions/userActions';
import { fetchpermissionbyUserId } from '../../actions/permissionActions';

const TankStockDatagrid = ({ tankStockDataSource }) => {

    const dispatch = useDispatch();
    const tanks = useSelector((state) => state.tank.tanks);
    const tankStock = useSelector((state) => state.tank.tankStock);
    const users = useSelector((state) => state.user.users);
    const user = useSelector((state) => state.auth.user);



    const fetchData = useCallback(async () => {
        try {
            
            await Promise.all([
                dispatch(fetchTanks()),
                dispatch(fetchSiteList()),
                dispatch(fetchUsers()),
                dispatch(fetchpermissionbyUserId(user.id))
            ]);
        } catch (error) {
            console.log(error);
        }
    }
    , [dispatch, user]);

    useEffect(() => {
        fetchData();
    }
    , [fetchData]);
    


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
            <Column dataField="id" caption="ID" allowEditing={false} visible={false} defaultSortOrder="asc" />
            <Column dataField="tankName" caption="Tank Name" allowEditing={false} >
                 <Lookup dataSource={tank}  valueExpr={id} /> </Column>
            <Column dataField="tankCapacity" caption="Tank Capacity" allowEditing={false} />
            <Column dataField="tankLocation" caption="Tank Location" allowEditing={false} />
            <Column dataField="tankFuelLevel" caption="Tank Fuel Level" allowEditing={false} />
            <Column dataField="tankStatus" caption="Tank Status" allowEditing={false} />
        </DataGrid>
        </div>
    );

}

export  default TankStockDatagrid;