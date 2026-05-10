import React, { useState, useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { TreeList, Selection, Column, Editing,SearchPanel, FilterRow, RequiredRule } from 'devextreme-react/tree-list';
import { createPermission, updatePermission, deletePermission,fetchPermissions } from './../../redux/actions/permissionActions';


 const PermissionTreeList = () => {

    const dispatch = useDispatch();
    const permissions = useSelector(state => state.permission.permissions);

    useEffect(() => {
        dispatch(fetchPermissions());
        console.log("permissions",permissions);
    }, [dispatch]);

    const onRowInserted = async (e) => {
        console.log("Inserted Data:", e.data);
        const permissionData = {
            ...e.data,
            parentId: e.data.parentId || null // Ensure parentId is null if not provided
        };
        dispatch(createPermission(permissionData));
    };

    const onRowUpdated = async (e) => {
        const { id, ...updatedData } = e.data;
        dispatch(updatePermission(id, updatedData));
    };

    const onRowDeleted = async (e) => {
        dispatch(deletePermission(e.data.id));
    };

    
    return (
        <div className="view-port">
            <h2>Manage Permissions</h2>

            <TreeList
                dataSource={permissions}       
                parentIdExpr="parentId"
                keyExpr="id"
                onRowInserted={onRowInserted}
                onRowUpdated={onRowUpdated}
                onRowDeleted={onRowDeleted}
                showBorders={true}                
                >
                        <SearchPanel visible={true} />

                <Selection mode="multiple" recursive="all" />
                <Editing 
                allowAdding={true}
                allowUpdating={true}
                allowDeleting={true}
                mode="cell"
                />
                <Column dataField="name" caption="Permissions"> <RequiredRule message="Name is required" /></Column>


            </TreeList>
        </div>
    );
    };
export default PermissionTreeList;