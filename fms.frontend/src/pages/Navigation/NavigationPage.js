import React, { useEffect, useState ,useCallback, useRef } from 'react';
import { CustomRule } from 'devextreme-react/validator';
import { useDispatch, useSelector } from 'react-redux';
import { TreeList, Column, Editing, Popup, Form, RequiredRule, Pager, Paging, Lookup ,Item as FormItem} from 'devextreme-react/tree-list';
import {
    fetchAllNavigationItems,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    assignRolesToNavigationItem
} from './../../actions/navigationActions';
import { fetchRoles } from './../../actions/roleActions';

const NavigationPage = () => {
    const dispatch = useDispatch();
    const { allNavigationItems, loading, error } = useSelector((state) => state.navigation);
    const { roles } = useSelector((state) => state.role); // Assuming roles are available in the auth state
    const [formData, setFormData] = useState({});
    const formDataRef = useRef({});

    useEffect(() => {
        dispatch(fetchAllNavigationItems());
        dispatch(fetchRoles());
    }, [dispatch]);

    const onRowInserted = (e) => {
        const data = { ...e.data, RoleIds: e.data.roles || [] };
        console.log("Inserted Data:", data);
        dispatch(createNavigationItem(data));
    };

    const onRowUpdated = (e) => {
        const data = { ...e.data, RoleIds: e.data.roles || [] };
        console.log("Updated Data:", data);
        dispatch(updateNavigationItem(e.key, data));
    };

    const onRowRemoved = (e) => {
        dispatch(deleteNavigationItem(e.key));
    };

    const onAssignRoles = (id, roles) => {
        console.log("Selected roles:", roles);
        dispatch(assignRolesToNavigationItem(id, roles));
    };



    const rolesDataSource = roles.map(role => ({ id: role.id, text: role.name })); // Adjusted mapping

    return (
        <div className='content-block'>
            <div className='content'>
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error}</p>}
                <TreeList
                    dataSource={allNavigationItems}
                    keyExpr="id"
                    parentIdExpr="parentId"
                    showBorders={true}
                    columnAutoWidth={true}
                    onRowInserted={onRowInserted}
                    onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}
                >
                    <Editing
                        mode="popup"
                        allowUpdating={true}
                        allowDeleting={true}
                        allowAdding={true}
                        useIcons={true}
                    >
                        <Popup title="Navigation Item" showTitle={true} width={700} height={525} />
                        <Form formData={formData}>
                            <FormItem
                                dataField="page"
                                editorType="dxTextBox"
                                editorOptions={{
                                    valueChangeEvent: 'keyup',
                                    placeholder: 'Enter page name'
                                }}
                            >
                                <RequiredRule message="Page name is required" />
                            </FormItem>
                            <FormItem
                                dataField="link"
                                editorType="dxTextBox"
                                editorOptions={{
                                    value: formData.link,
                                }}
                            >
                                <RequiredRule message="Link is required" />
                            </FormItem>
                            <FormItem
                                dataField="parentId"
                                editorType="dxSelectBox"
                                editorOptions={{
                                    dataSource: allNavigationItems,
                                    displayExpr: 'page',
                                    valueExpr: 'id'
                                }}
                            />
                            <FormItem dataField="icon" />
                            <FormItem
                                dataField="roles"
                                editorType="dxTagBox"
                                editorOptions={{
                                    dataSource: rolesDataSource,
                                    displayExpr: "text",
                                    valueExpr: "id",
                                    value: formData.roles
                                }}
                            >
                                <RequiredRule message="At least one role is required" />
                                
                            </FormItem>
                        </Form>
                    </Editing>
                    <Column dataField="page" caption="Page" />
                    <Column dataField="link" caption="Link" />
                    <Column dataField="parentId" caption="Parent ID">
                        <Lookup id="" />
                    </Column>
                    <Column dataField="icon" caption="Icon" />
                    <Column
                        dataField="roles"
                        caption="Roles"
                        allowSorting={false}
                        cellRender={(cellData) => {
                            return (
                                <div>
                                    {cellData.data.roles && cellData.data.roles.join(", ")}
                                </div>
                            );
                        }}
                    />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />
                    <Paging defaultPageSize={10} />
                </TreeList>
            </div>
        </div>
    );
};

export default NavigationPage;
