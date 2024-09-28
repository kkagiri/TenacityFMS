import react , {useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter, Export ,ColumnChooser,Lookup,  Grouping,GroupPanel
} from 'devextreme-react/data-grid';
import { formatDate } from './../../utils/dateUtils';
import { fetchTanks } from '../../redux/actions/tankActions';
import { fetchUsers } from '../../redux/actions/userActions';
import { fetchSiteList} from '../../redux/actions/siteActions';
import { fetchSuppliers } from '../../redux/actions/SupplierActions';


const TankDeliveryDatagrid = ({ tankDeliveryData }) => {

    const dispatch = useDispatch();
    const tanks = useSelector((state) => state.tank.tanks);
    const users = useSelector((state) => state.user.users);
    const sites = useSelector((state) => state.site.sites);
    const suppliers = useSelector((state) => state.supplier.suppliers);


    useEffect(() => {
        dispatch(fetchTanks());
        dispatch(fetchUsers());
        dispatch(fetchSiteList());
        dispatch(fetchSuppliers());
    }, [dispatch]);

  


    return (
        <div style={{ display: 'flex',  marginTop:'20px' }}>
            <DataGrid
                dataSource={tankDeliveryData}
                showBorders={true}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                columnHidingEnabled={true}


            >
                <FilterRow visible={true} />
                <Paging defaultPageSize={10} />
                <GroupPanel visible={true} />
                <Grouping autoExpandAll= {true} />
                <ColumnChooser enabled={true} mode="select" />
                <Column dataField="site" caption="Site"   groupIndex={0} lookup={{
                    dataSource: sites,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />

                <Column dataField="id" caption="ID" visible={false} defaultSortOrder="asc" />
                <Column dataField="deliveryDate" caption="Timestamp" dataType="datetime"  width={120} />
                
                <Column dataField="tankId" width={100} caption="Tank" lookup={{
                    dataSource: tanks,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />
                     <Column dataField="manualDeliveryAmount" caption="Volume" minWidth={120} />
                <Column dataField="supplierId" caption="Supplier"  maxWidth={100} lookup={{
                    dataSource: suppliers,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />   
         

               <Column dataField="stockBeforeDelivery" hidingPriority={1} caption="Stock Before Delivery" maxWidth={120}  visible={false}/>
                <Column dataField="stockAfterDelivery" hidingPriority={1} caption="Stock After Delivery" maxWidth={120}  visible={false}/>
                <Column dataField="sensorDeliveryAmount" hidingPriority={1} caption="Sensor Delivery Amount" maxWidth={120}  visible={false}/>

                <Column dataField="deliveryTemperature"  hidingPriority={1} caption="Delivery Temperature" maxWidth={120} visible={false} />
                <Column dataField="deliveryDensity" hidingPriority={1} caption="Delivery Density"  visible={false} maxWidth={120} />
                <Column dataField="deliveryMass" hidingPriority={1} caption="Delivery weight"  visible={false} maxWidth={120} />

              

                <Column dataField="lponumber" hidingPriority={1} caption="Lponumber"  visible={false} maxWidth={120} />
                <Column dataField="product" hidingPriority={1} caption="Product"  visible={false} maxWidth={200} />

                <Column 
                    dataField="recordedBy" 
                    caption="Recorded By" 
                    minWidth={120}  
                    hidingPriority={0}
                    cellRender={(cellData) => {
                        const user = users.find(u => u.id === cellData.value);
                        return user ? user.userName : cellData.value;
                    }}
                >
                    <Lookup dataSource={users} valueExpr="id" displayExpr="userName" />
                </Column>




            </DataGrid>
        </div>
    );
            }

export default TankDeliveryDatagrid;
