import react , {useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter, Export ,Lookup,  Grouping,GroupPanel
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
        <div>
            <DataGrid
                dataSource={tankDeliveryData}
                showBorders={true}
                showColumnLines={true}
                showRowLines={true}
                allowColumnResizing={true}
                showColumnHeaders={true}
            >
                <HeaderFilter visible={true} />
                <FilterRow visible={true} />
                <Paging defaultPageSize={10} />
                <GroupPanel visible={true} />
                <Grouping autoExpandAll= {true} />


                <Column dataField="id" caption="ID" visible={false} defaultSortOrder="asc" />
                <Column dataField="deliveryDate" caption="Timestamp" dataType="datetime" />
                <Column dataField="site" caption="Site"   groupIndex={0} lookup={{
                    dataSource: sites,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />
                <Column dataField="tankId" caption="Tank" lookup={{
                    dataSource: tanks,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />
              
               <Column dataField="stockBeforeDelivery" caption="Stock Before Delivery" />
                <Column dataField="stockAfterDelivery" caption="Stock After Delivery" />
                <Column dataField="manualDeliveryAmount" caption="Volume ManualDeliveryAmount" />
                <Column dataField="sensorDeliveryAmount" caption="Sensor Delivery Amount" />

                <Column dataField="deliveryTemperature" caption="Delivery Temperature" />
                <Column dataField="deliveryDensity" caption="Delivery Density" />
                <Column dataField="deliveryMass" caption="Delivery weight" />

                <Column dataField="supplierId" caption="Supplier" lookup={{
                    dataSource: suppliers,
                    valueExpr: 'id',
                    displayExpr: 'name'
                }} />   

                <Column dataField="lponumber" caption="Lponumber" />
                <Column dataField="product" caption="Product" />

                <Column 
                    dataField="recordedBy" 
                    caption="Recorded By" 
                    minWidth={120}  
                    hidingPriority={2}
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
