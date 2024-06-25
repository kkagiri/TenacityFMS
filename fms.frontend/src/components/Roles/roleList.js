//this should display list of role and pass rolename and roleID selection to parent component 


import React, { useCallback } from 'react';
import { List } from 'devextreme-react/list';

const RoleList = ({ roles, onRoleSelect }) => {   
    
    return (
        <List
            dataSource={roles}
            selectionMode="single"
            displayExpr="name"
            searchEnabled = {true}
            onSelectionChanged={(e) => {
               if (e.addedItems.length > 0) {
                onRoleSelect(e.addedItems[0]);
              }
            }}
          

            
        />
    );
};

export default RoleList;