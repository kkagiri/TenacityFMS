
//this should display a list of roles on the left and the details of the (roleDetails) on the right based on the selected role . 
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import  RoleList  from '../../components/Roles/roleList';
import RoleDetails  from '../../components/Roles/RoleDetails/roleDetails';
import { getRoleList } from '../../dataservice/permissionservice';
import { Item, Toolbar } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import { fetchRoles,setSelectedRole , assignPermissions } from '../../actions/roleActions';
//import { setRoles, setSelectedRole } from '../../reducers/roleSlice';
import "./rolepage.scss"

const Rolepage = () => {
const dispatch = useDispatch();
  const roles = useSelector((state) => state.role.roles);
  const selectedRole = useSelector((state) => state.role.selectedRole);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleRoleSelection = (role) => {
    dispatch(setSelectedRole(role));  };

    return (
        <div>
            <div className={' view-wrapper view-wrapper-role-page'}>
              <div className='view-container '>
            <Toolbar className='toolbar-details theme-dependent' style={{padding:"10px"}}>
          <Item location='before'>
          <h2 style={{marginLeft:"20pm"}}>Roles</h2>
          </Item>
          <Item location='after' locateInMenu='auto'>
            <Button
              text='Add Role'
              type='default'
              stylingMode='contained'
            />
          </Item>

          <Item
            location='after'
            locateInMenu='auto'
            widget='dxButton'
            showText='inMenu'
          >
       <Button text="Refresh" icon="refresh" stylingMode="text" onClick={() => dispatch(fetchRoles())} />
          </Item>
             </Toolbar>
             </div>
             <div className='content content-block'>
                <div className='panels'>
                    <div className='left'>
                        <RoleList roles={roles} onRoleSelect={handleRoleSelection} />
                    </div>
                    <div className='right'>
                        {/* //set all components to be disabled if no role is selected */}
                        {selectedRole && <RoleDetails roleId={selectedRole.id} />}
                       {/* <RoleDetails roleId={selectedRole.id} /> */}

                    </div>

                </div>
                </div>

            </div>

        </div>
    );

}


export default Rolepage;