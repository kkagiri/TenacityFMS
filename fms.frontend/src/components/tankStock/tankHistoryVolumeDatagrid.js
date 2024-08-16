//code created: kevin.kagiri@kagz100
//date created:05 Aug 2024
//Code for showing tank Stock Activity from Tank stock Page or tankStockPage.js

import React ,{useCallback,useEffect ,useState } from 'react';
import { useDispatch, useSelector,useEffct } from 'react-redux';
import { DataGrid, Column, Lookup ,Paging,FilterRow ,HeaderFilter,Export} from 'devextreme-react/data-grid';
import { formatDate } from './../../utils/dateUtils';


const TankHistoryVolumeDatagrid = ({ tankVolumeHistory }) => {
    const VolumeChangeReasonEnum = [
        { id: 0, name: 'OpeningStock' },
        { id: 1, name: 'ClosingStock' },
        { id: 2, name: 'Delivery' },
        { id: 3, name: 'TransferIn' },
        { id: 4, name: 'TransferOut' },
        { id: 5, name: 'Adjustment' },
        { id: 6, name: 'Dispensing' }
    ];

    const exportFormats = ['xlsx'];

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
      
    const dispatch = useDispatch();
    const tanks = useSelector((state) => state.tank.tanks);
 const  users =useSelector((state) => state.user.users);
  

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
            <HeaderFilter visible={true} />
                <FilterRow visible={true} />

                      <Paging defaultPageSize={10} />


          <Column dataField="id" caption="ID"  visible={false} defaultSortOrder="asc" />
         
            <Column dataField="timestamp" caption="Timestamp"   cellRender={formatTime}   />
            <Column dataField="site" caption="site"  />
            <Column dataField="tankId" caption="Tank" >
                <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
            </Column>
            <Column dataField="volumeChange" caption="Volume Change"  />
            <Column dataField="newVolume" caption="New Volume"  />
            <Column dataField="changeReason" caption="Change Reason " >
             <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
            </Column>
            <Column dataField="recordedBy" caption="Recorded By" cellRender={(cellData) => {
                            const user = users.find(u => u.id === cellData.value);
                            return user ? user.userName : cellData.value;
                        }}>
                        <Lookup dataSource={users} valueExpr="id" displayExpr="userName" />
            </Column>

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