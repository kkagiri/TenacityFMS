/**
 * File: TemplateActionsPanel.js
 * Purpose: Admin panel for managing completion actions per issue template.
 *          Rendered inside a Popup from IssueTemplatesSettingsPage.
 * Dependencies: React, DevExtreme DataGrid, Form, issueTrackerV2Service
 * Last Modified: 2026-02-23
 *
 * Key Functions:
 * - TemplateActionsPanel: Compact CRUD DataGrid with styled badges and grouped edit form
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataGrid, {
    Column,
    Editing,
    Popup as EditPopup,
    Form as EditForm,
    Paging,
    Sorting,
    Lookup,
    Toolbar,
    Item as ToolbarItem
} from 'devextreme-react/data-grid';
import { SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

const ACTION_TYPES = [
    { value: 'General', text: 'General' },
    { value: 'DeviceChange', text: 'Device Change' },
    { value: 'CameraInstall', text: 'Camera Install' }
];

/**
 * @param {Object} props
 * @param {number} props.templateId - Parent template ID
 * @param {string} [props.templateName] - Template name for display
 */
const TemplateActionsPanel = ({ templateId, templateName }) => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTypeInfo, setShowTypeInfo] = useState(false);
    const dataGridRef = useRef(null);

    const loadActions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await issueTrackerV2Service.getTemplateActions(templateId);
            setActions(data || []);
        } catch (error) {
            console.error('Error loading template actions:', error);
            notify({ message: 'Failed to load template actions', type: 'error', displayTime: 3000 });
            setActions([]);
        } finally {
            setLoading(false);
        }
    }, [templateId]);

    useEffect(() => {
        if (templateId) {
            loadActions();
        }
    }, [templateId, loadActions]);

    const handleRowInserting = async (e) => {
        e.cancel = true;
        try {
            const newAction = {
                name: e.data.name,
                actionType: e.data.actionType || 'General',
                description: e.data.description || null,
                requiresDeviceDetails: Boolean(e.data.requiresDeviceDetails),
                requiresSourceVehicle: Boolean(e.data.requiresSourceVehicle),
                requiresCameraDetails: Boolean(e.data.requiresCameraDetails),
                sortOrder: e.data.sortOrder || 0,
                isActive: e.data.isActive !== false
            };

            await issueTrackerV2Service.createTemplateAction(templateId, newAction);
            await loadActions();

            if (dataGridRef.current) {
                dataGridRef.current.instance.cancelEditData();
            }
            notify({ message: 'Action created', type: 'success', displayTime: 2000 });
        } catch (error) {
            console.error('Error creating template action:', error);
            notify({ message: 'Failed to create action', type: 'error', displayTime: 3000 });
        }
    };

    const handleRowUpdating = async (e) => {
        e.cancel = true;
        try {
            const updatedData = { ...e.oldData, ...e.newData };
            await issueTrackerV2Service.updateTemplateAction(templateId, e.key, {
                name: updatedData.name,
                actionType: updatedData.actionType || 'General',
                description: updatedData.description || null,
                requiresDeviceDetails: Boolean(updatedData.requiresDeviceDetails),
                requiresSourceVehicle: Boolean(updatedData.requiresSourceVehicle),
                requiresCameraDetails: Boolean(updatedData.requiresCameraDetails),
                sortOrder: updatedData.sortOrder || 0,
                isActive: updatedData.isActive
            });
            await loadActions();

            if (dataGridRef.current) {
                dataGridRef.current.instance.cancelEditData();
            }
            notify({ message: 'Action updated', type: 'success', displayTime: 2000 });
        } catch (error) {
            console.error('Error updating template action:', error);
            notify({ message: 'Failed to update action', type: 'error', displayTime: 3000 });
        }
    };

    const handleRowRemoving = async (e) => {
        e.cancel = true;
        try {
            await issueTrackerV2Service.deleteTemplateAction(templateId, e.key);
            await loadActions();
            notify({ message: 'Action removed', type: 'success', displayTime: 2000 });
        } catch (error) {
            console.error('Error deleting template action:', error);
            notify({ message: 'Failed to delete action', type: 'error', displayTime: 3000 });
        }
    };

    // Styled type badge
    const renderTypeBadge = (cellInfo) => {
        const styleMap = {
            General: { bg: 'tw-bg-gray-100', text: 'tw-text-gray-700', icon: 'fa-light fa-circle-dot' },
            DeviceChange: { bg: 'tw-bg-blue-50', text: 'tw-text-blue-700', icon: 'fa-light fa-microchip' },
            CameraInstall: { bg: 'tw-bg-violet-50', text: 'tw-text-violet-700', icon: 'fa-light fa-camera' }
        };
        const s = styleMap[cellInfo.value] || styleMap.General;
        const label = cellInfo.value === 'DeviceChange' ? 'Device' : cellInfo.value === 'CameraInstall' ? 'Camera' : 'General';
        return (
            <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium ${s.bg} ${s.text}`}>
                <i className={`${s.icon} tw-text-[10px]`}></i>{label}
            </span>
        );
    };

    // Active/inactive badge
    const renderStatusBadge = (cellInfo) => (
        cellInfo.value
            ? <span className="tw-inline-flex tw-items-center tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-bg-emerald-50 tw-text-emerald-700">Active</span>
            : <span className="tw-inline-flex tw-items-center tw-px-1.5 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-bg-red-50 tw-text-red-600">Off</span>
    );

    // Boolean check/uncheck icon
    const renderCheckIcon = (cellInfo) => (
        <div className="tw-flex tw-justify-center">
            {cellInfo.value
                ? <i className="fa-light fa-circle-check tw-text-emerald-500 tw-text-sm"></i>
                : <i className="fa-light fa-circle tw-text-gray-300 tw-text-sm"></i>
            }
        </div>
    );

    if (loading && actions.length === 0) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
                <LoadIndicator visible={true} height={28} width={28} />
                <span className="tw-ml-2 tw-text-sm tw-text-gray-500">Loading...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2px 4px' }}>
            {/* Action type info toggle */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <div className="tw-flex tw-items-center tw-gap-2">
                    <span className="tw-text-xs tw-text-gray-500">
                        {actions.length === 0
                            ? 'No actions yet — add actions that technicians select when completing issues.'
                            : `${actions.filter(a => a.isActive).length} active action${actions.filter(a => a.isActive).length !== 1 ? 's' : ''} configured`
                        }
                    </span>
                </div>
                <span
                    className="tw-flex tw-items-center tw-gap-1 tw-text-[11px] tw-text-blue-600 hover:tw-text-blue-800 tw-cursor-pointer tw-select-none tw-transition-colors"
                    onClick={() => setShowTypeInfo(!showTypeInfo)}
                >
                    <i className={`fa-light ${showTypeInfo ? 'fa-circle-xmark' : 'fa-circle-info'} tw-text-xs`}></i>
                    {showTypeInfo ? 'Hide' : 'Action Types'}
                </span>
            </div>

            {/* Action type explanation - clean inline text */}
            {showTypeInfo && (
                <div className="tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-mb-2 tw-pl-1">
                    <span className="tw-text-[11px] tw-text-blue-600">
                        <i className="fa-light fa-wrench tw-mr-1"></i>
                        <strong>General</strong> — root cause &amp; notes (e.g. reset, check wiring)
                    </span>
                    <span className="tw-text-[11px] tw-text-blue-600">
                        <i className="fa-light fa-microchip tw-mr-1"></i>
                        <strong>Device Change</strong> — adds old/new IMEI, device type, source vehicle fields
                    </span>
                    <span className="tw-text-[11px] tw-text-blue-600">
                        <i className="fa-light fa-camera tw-mr-1"></i>
                        <strong>Camera Install</strong> — adds camera IMEI, position, SIM number fields
                    </span>
                </div>
            )}

            <DataGrid
                ref={dataGridRef}
                dataSource={actions}
                keyExpr="id"
                width="100%"
                height="100%"
                showBorders={true}
                showRowLines={true}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                allowColumnResizing={true}
                onRowInserting={handleRowInserting}
                onRowUpdating={handleRowUpdating}
                onRowRemoving={handleRowRemoving}
                noDataText="No completion actions yet. Click the + button above to add your first action."
            >
                <Editing
                    mode="popup"
                    allowAdding={true}
                    allowUpdating={true}
                    allowDeleting={true}
                    useIcons={true}
                >
                    <EditPopup
                        title="Completion Action"
                        showTitle={true}
                        width={580}
                        height="auto"
                    />
                    <EditForm colCount={2} labelLocation="top">
                        <SimpleItem dataField="name" colSpan={2}>
                            <Label text="Action Name" />
                            <RequiredRule message="Action name is required" />
                        </SimpleItem>
                        <SimpleItem dataField="actionType">
                            <Label text="Type" />
                        </SimpleItem>
                        <SimpleItem dataField="sortOrder" editorType="dxNumberBox" editorOptions={{ min: 0, showSpinButtons: true }}>
                            <Label text="Sort Order" />
                        </SimpleItem>
                        <SimpleItem
                            dataField="description"
                            colSpan={2}
                            editorType="dxTextArea"
                            editorOptions={{ height: 56 }}
                        >
                            <Label text="Description" />
                        </SimpleItem>
                        <GroupItem caption="Requirements" colSpan={2} colCount={3}>
                            <SimpleItem
                                dataField="requiresDeviceDetails"
                                editorType="dxCheckBox"
                                editorOptions={{ text: 'Device Details' }}
                            >
                                <Label visible={false} />
                            </SimpleItem>
                            <SimpleItem
                                dataField="requiresSourceVehicle"
                                editorType="dxCheckBox"
                                editorOptions={{ text: 'Source Vehicle' }}
                            >
                                <Label visible={false} />
                            </SimpleItem>
                            <SimpleItem
                                dataField="requiresCameraDetails"
                                editorType="dxCheckBox"
                                editorOptions={{ text: 'Camera Details' }}
                            >
                                <Label visible={false} />
                            </SimpleItem>
                        </GroupItem>
                        <SimpleItem
                            dataField="isActive"
                            colSpan={2}
                            editorType="dxCheckBox"
                            editorOptions={{ text: 'Active' }}
                        >
                            <Label visible={false} />
                        </SimpleItem>
                    </EditForm>
                </Editing>
                <Paging defaultPageSize={10} />
                <Sorting mode="single" />

                <Toolbar>
                    <ToolbarItem name="addRowButton" />
                    <ToolbarItem location="after">
                        <Button icon="refresh" hint="Refresh" stylingMode="text" onClick={loadActions} />
                    </ToolbarItem>
                </Toolbar>

                <Column dataField="id" caption="#" width={40} allowEditing={false} sortOrder="asc" alignment="center" />
                <Column dataField="name" caption="Action Name" minWidth={140} />
                <Column dataField="actionType" caption="Type" width={100} cellRender={renderTypeBadge}>
                    <Lookup dataSource={ACTION_TYPES} valueExpr="value" displayExpr="text" />
                </Column>
                <Column dataField="description" caption="Description" width={160} />
                <Column dataField="requiresDeviceDetails" caption="Device" width={55} dataType="boolean" cellRender={renderCheckIcon} alignment="center" />
                <Column dataField="requiresSourceVehicle" caption="Src Veh" width={58} dataType="boolean" cellRender={renderCheckIcon} alignment="center" />
                <Column dataField="requiresCameraDetails" caption="Camera" width={55} dataType="boolean" cellRender={renderCheckIcon} alignment="center" />
                <Column dataField="sortOrder" caption="Ord" width={42} dataType="number" alignment="center" />
                <Column dataField="isActive" caption="Status" width={65} dataType="boolean" cellRender={renderStatusBadge} />
                <Column type="buttons" width={70} />
            </DataGrid>
        </div>
    );
};

export default TemplateActionsPanel;
