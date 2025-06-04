import React, { useEffect, useState , useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TreeList, Column, Editing, Popup, Form, RequiredRule, Pager, Paging, Lookup ,Item as FormItem} from 'devextreme-react/tree-list';
import {
    fetchAllNavigationItems,
    createNavigationItem,
    updateNavigationItem,
    deleteNavigationItem,
    assignRolesToNavigationItem
} from './../../redux/actions/navigationActions';
import { fetchRoles } from './../../redux/actions/roleActions';
import notify from 'devextreme/ui/notify';
import { SelectBox } from 'devextreme-react/select-box';
import NavigationGuide from './../../components/Navigation/NavigationGuide';

const NavigationPage = () => {
    const dispatch = useDispatch();
    const { allNavigationItems, loading, error } = useSelector((state) => state.navigation);
    const { roles } = useSelector((state) => state.role);
    const [formData, setFormData] = useState({});
    const formDataRef = useRef({});

    useEffect(() => {
        dispatch(fetchAllNavigationItems());
        dispatch(fetchRoles());
    }, [dispatch]);

    const onRowInserted = async (e) => {
        const data = {
            page: e.data.page,
            link: e.data.link,
            parentId: e.data.parentId || null,
            icon: e.data.icon || null,
            RoleIds: Array.isArray(e.data.roles) ? e.data.roles : []
        };
        console.log("Inserted Data:", data);
        try {
            await dispatch(createNavigationItem(data));
            notify("Navigation item created successfully", "success");
            dispatch(fetchAllNavigationItems());
        } catch (error) {
            notify("Failed to create navigation item", "error");
        }
    };

    const onRowUpdated = async (e) => {
        console.log("onRowUpdated triggered with event:", e);
        console.log("e.data:", e.data);
        console.log("e.key:", e.key);

        const originalItem = allNavigationItems.find(item => item.id === e.key);
        console.log("Original item:", originalItem);

        const mergedData = {
            ...originalItem,
            ...e.data
        };
        console.log("Merged data:", mergedData);

        const data = {
            id: e.key,
            link: mergedData.link || '',
            pageName: mergedData.page || '',  // Use 'page' from data, send as 'pageName'
            parentId: mergedData.parentId !== undefined ? mergedData.parentId : null,
            icon: mergedData.icon || null,
            RoleIds: Array.isArray(mergedData.roles) ? mergedData.roles :
                     (mergedData.rolenavigations ? mergedData.rolenavigations.map(rn => rn.roleId) : [])
        };
        console.log("Updated Data to send:", data);

        // Validate required fields
        if (!data.link || !data.pageName) {
            console.error("Missing required fields:", { link: data.link, pageName: data.pageName });
            notify("Link and Page Name are required", "error");
            return;
        }

        try {
            await dispatch(updateNavigationItem(e.key, data));
            notify("Navigation item updated successfully", "success");
            dispatch(fetchAllNavigationItems());
        } catch (error) {
            console.error("Error in onRowUpdated:", error);
            notify("Failed to update navigation item", "error");
        }
    };

    const onRowRemoved = async (e) => {
        try {
            await dispatch(deleteNavigationItem(e.key));
            notify("Navigation item deleted successfully", "success");
            dispatch(fetchAllNavigationItems());
        } catch (error) {
            notify("Failed to delete navigation item", "error");
        }
    };

    const onAssignRoles = (id, roles) => {
        console.log("Selected roles:", roles);
        dispatch(assignRolesToNavigationItem(id, roles));
    };

    const onInitNewRow = (e) => {
        // Create a new object instead of mutating existing data
        e.data = { ...e.data, roles: [] }; //Cursor
    };

    const onEditingStart = (e) => {
        // Load existing roles for the navigation item and ensure it's always an array
        const navigationItem = allNavigationItems.find(item => item.id === e.data.id);
        let existingRoles = [];

        if (navigationItem && navigationItem.rolenavigations && Array.isArray(navigationItem.rolenavigations)) {
            existingRoles = navigationItem.rolenavigations.map(rn => rn.roleId);
        }

        // Create a new object instead of mutating the existing Redux state
        e.data = { ...e.data, roles: [...existingRoles] }; //Cursor
    };

    // Ensure roles is always available as an array
    const rolesDataSource = Array.isArray(roles) ? roles.map(role => ({ id: role.id, text: role.name })) : [];

    return (
        <div className='content-block'>
            <div className='content'>
                <div className="tw-mb-4 tw-p-4 tw-bg-blue-100 tw-border tw-border-blue-400 tw-rounded">
                    <div className="tw-flex tw-items-center">
                        <i className="fa fa-info-circle tw-text-blue-600 tw-mr-2"></i>
                        <span className="tw-text-blue-800">
                            <strong>Note:</strong> Navigation items require corresponding page components to be created in the application.
                            The <strong>Link</strong> field should match the route path defined in your application.
                        </span>
                    </div>
                </div>

                {/* Cursor - Added test button to manually trigger update */}
                <button
                    className="tw-mb-4 tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded"
                    onClick={async () => {
                        console.log("Test button clicked");
                        if (allNavigationItems && allNavigationItems.length > 0) {
                            const testItem = allNavigationItems[0];
                            const testData = {
                                id: testItem.id,
                                link: testItem.link,
                                pageName: testItem.page,
                                parentId: testItem.parentId,
                                icon: testItem.icon,
                                RoleIds: testItem.rolenavigations ? testItem.rolenavigations.map(rn => rn.roleId) : []
                            };
                            console.log("Testing update with data:", testData);
                            try {
                                await dispatch(updateNavigationItem(testItem.id, testData));
                                notify("Test update completed", "success");
                            } catch (error) {
                                console.error("Test update failed:", error);
                                notify("Test update failed", "error");
                            }
                        }
                    }}
                >
                    Test Update (First Item)
                </button>

                {loading && <p>Loading...</p>}
                {error && <p className="tw-text-red-600">Error: {error}</p>}

                <TreeList
                    dataSource={allNavigationItems}
                    keyExpr="id"
                    parentIdExpr="parentId"
                    showBorders={true}
                    columnAutoWidth={true}
                    repaintChangesOnly={true}
                    onRowInserted={onRowInserted}
                    onRowUpdated={onRowUpdated}
                    onRowRemoved={onRowRemoved}
                    onInitNewRow={onInitNewRow}
                    onEditingStart={onEditingStart}
                    onSaving={(e) => {
                        console.log("onSaving triggered:", e);
                        console.log("Changes:", e.changes);
                    }}
                    wordWrapEnabled={true}
                    showRowLines={true}
                >
                    <Editing
                        mode="popup"
                        allowUpdating={true}
                        allowDeleting={true}
                        allowAdding={true}
                        useIcons={true}
                    >
                        <Popup title="Navigation Item" showTitle={true} width={700} height={600} />
                        <Form>
                            <FormItem
                                dataField="page"
                                editorType="dxTextBox"
                                editorOptions={{
                                    placeholder: 'Enter page name (e.g., Dashboard, Reports)'
                                }}
                            >
                                <RequiredRule message="Page name is required" />
                            </FormItem>
                            <FormItem
                                dataField="link"
                                editorType="dxTextBox"
                                editorOptions={{
                                    placeholder: 'Enter link URL (e.g., /dashboard, /reports)'
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
                                    valueExpr: 'id',
                                    placeholder: 'Select parent (optional)',
                                    searchEnabled: true,
                                    showClearButton: true
                                }}
                            />
                            <FormItem
                                dataField="icon"
                                editorType="dxTextBox"
                                editorOptions={{
                                    placeholder: 'Enter Font Awesome icon class (e.g., fa-home, fa-dashboard)'
                                }}
                            />
                            <FormItem
                                dataField="roles"
                                editorType="dxTagBox"
                                editorOptions={{
                                    dataSource: rolesDataSource,
                                    displayExpr: "text",
                                    valueExpr: "id",
                                    searchEnabled: true,
                                    placeholder: 'Select roles that can access this page',
                                    value: []
                                }}
                            >
                                <RequiredRule message="At least one role is required" />
                            </FormItem>
                        </Form>
                    </Editing>
                    <Column dataField="page" caption="Page Name" width={200} />
                    <Column dataField="link" caption="Link/Route" width={200} />
                    <Column
                        dataField="parentId"
                        caption="Parent Page"
                        width={150}
                        calculateCellValue={(rowData) => {
                            if (!rowData.parentId) return '-';
                            const parent = allNavigationItems.find(item => item.id === rowData.parentId);
                            return parent ? parent.page : '-';
                        }}
                    />
                    <Column
                        dataField="icon"
                        caption="Icon"
                        width={120}
                        cellRender={(cellData) => {
                            return cellData.value ? (
                                <div className="tw-flex tw-items-center">
                                    <i className={`fa ${cellData.value} tw-mr-2`}></i>
                                    <span className="tw-text-xs tw-text-gray-600">{cellData.value}</span>
                                </div>
                            ) : '-';
                        }}
                    />
                    <Column
                        dataField="roles"
                        caption="Allowed Roles"
                        minWidth={200}
                        calculateCellValue={(rowData) => {
                            if (rowData.rolenavigations && Array.isArray(rowData.rolenavigations) && rowData.rolenavigations.length > 0) {
                                const roleNames = rowData.rolenavigations.map(rn => {
                                    const role = roles.find(r => r.id === rn.roleId);
                                    return role ? role.name : rn.roleId;
                                });
                                return roleNames.join(", ");
                            }
                            return 'No roles assigned';
                        }}
                        cellRender={(cellData) => {
                            const rolesText = cellData.value || 'No roles assigned';
                            return (
                                <div className="tw-text-sm">
                                    {rolesText === 'No roles assigned' ? (
                                        <span className="tw-text-red-500">{rolesText}</span>
                                    ) : (
                                        <span>{rolesText}</span>
                                    )}
                                </div>
                            );
                        }}
                    />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />
                    <Paging defaultPageSize={10} />
                </TreeList>

                <NavigationGuide />
            </div>
        </div>
    );
};

export default NavigationPage;
