//contains the details of a single role that is Form, PermissionList and UserList underForm with a save buttons that collect the changes from all the copmonets and save the changes 
import   React ,{useState,useEffect} from 'react';

import Accordion, { AccordionTypes,item } from 'devextreme-react/accordion';
import { getRoleById ,getPermissionListByRoleId, getUserListByRoleId } from '../../../dataservice/permissionservice';
import UserDataList from './../../user/userdatalist';
import { Button } from 'devextreme-react';
import RoleForm from './roleForm';

const RoleDetails = ({ roleId }) => {
    const [roleDetails, setRoleDetails] = useState({});
    const [permissions, setPermissions] = useState([]);
    const [users, setUsers] = useState([]);



    const onSaveData = async (e) => { 
        try{
            //update RoleEdit detail data 
           

        }
        catch (error) {
            console.error('Error fetching role data:', error);
        }
    
    
    }

   const fetchData = async () => {
        try {
            const roleDetailData = await getRoleById(roleId);
            setRoleDetails(roleDetailData);

            //update permissons that the role can access
            const permissionData = await getPermissionListByRoleId(roleId);
            setPermissions(permissionData);

            //update users that the role can access
            const userData = await getUserListByRoleId(roleId);
            setUsers(userData);
            
        }
        catch (error) {
            console.error('Error fetching role data:', error);
        }
    };  


    useEffect(() => {
        fetchData();
    }, [roleId]);
    
    
    return (
        <div>
            <div style={{ padding: '20px', boxSizing: 'border-box' }}>
                <Accordion>
                    <item title="Role Details">
                        <div style={{ padding: '20px' }}>
                            <div style={{ padding: '20px' }}>
                            <RoleForm editData={roleDetails} />          
                                              </div>
                            
                        </div>
                    </item>
                    <item title="Permissions">
                        <div style={{ padding: '20px' }}>
                            {permissions.map((permission) => (
                              <div key={permission.id}>{permission.name}</div>
                            ))}
                        </div>  
                        /   </item>
                        <item title="Users">
                            <div style={{ padding: '20px' }}>
                                {users.map((user) => (
                                                          <UserDataList users={users} />
                                ))}
                            </div>  
                        </item>
                        </Accordion>

                        <Button onClick={onSaveData}>Save</Button>
                  {/* <Button onClick={CancelData}>Cancel</Button> */}
                    </div>
                </div>
);}

export default RoleDetails;

                                


