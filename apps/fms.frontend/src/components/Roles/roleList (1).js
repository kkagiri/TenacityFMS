//this should display list of role and pass rolename and roleID selection to parent component 


import React, { useState, useEffect } from 'react';
import { List } from 'devextreme-react/list';


const RoleList = ({ roles, onRoleSelect }) => {   

    return (
        <List
            dataSource={roles}
            selectionMode="single"
            displayExpr="name"
            onSelectionChanged={(e) => {
                console.log("Selected Role ID in RoleList: ", e.value);
                onRoleSelect(e);
            }}

            
        />
    );
};

export default RoleList;