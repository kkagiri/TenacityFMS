import React, { useState, useEffect } from 'react';
import { TreeList, Selection, Column, Editing,SearchPanel, FilterRow, RequiredRule } from 'devextreme-react/tree-list';
import { createPermission, updatePermission, deletePermission, getPermissionList } from './../../dataservice/permissionservice';


 const PermissionTreeList = () => {
    const [permissions, setPermissions] = useState([]);

    const fetchPermissions = async () => {
        const data = await getPermissionList();
        console.log("data", data);

        // Fix the da//ta to have parentId as null for the root items
        const fixedData = data.map(item => ({
            ...item,
            parentId: item.parentId === item.id ? null : item.parentId
        }));

        setPermissions(fixedData);
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const onRowInserted = async (e) => {
        try {
      await createPermission(e.data);
            fetchPermissions();
        } catch (error) {
            console.error('Error creating permission:', error);
        }
    };

    const onRowUpdated = async (e) => {
        try {
            const { id, ...updatedData } = e.data;
            console.log("updatedData",updatedData);
            console.log("id",id);
       
        await updatePermission(id, updatedData);
                    fetchPermissions();
        } catch (error) {
            console.error('Error updating permission:', error);
        }
    };

    const onRowDeleted = async (e) => {
        try {
            await deletePermission(e.data.id);
            fetchPermissions();
        } catch (error) {
            console.error('Error deleting permission:', error);
        }
    };
    
    return (
        <div className="view-port">
            <h2>Manage Permissions</h2>

            <TreeList
                dataSource={permissions}
                //id="permissions"
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
                allowDeleting={false}
                mode="cell"
                />
                <Column dataField="name" caption="Name"> <RequiredRule message="Name is required" /></Column>


            </TreeList>
        </div>
    );
    };
export default PermissionTreeList;