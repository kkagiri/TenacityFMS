/**
 * File: DepartmentFormPopup.js
 * Purpose: M365 slide-in side panel for creating and editing departments with Details + Users tabs
 * Dependencies: React, DevExtreme DataGrid, m365 panel styles
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - DepartmentFormPopup(props): Side panel — Details tab (name/desc) and Users tab (assignment grid)
 */
import React from 'react';
import DataGrid, {
    Column,
    Paging,
    SearchPanel,
    Selection,
} from 'devextreme-react/data-grid';
import SlidePanel from '../../../components/ui/SlidePanel';

/**
 * @param {object}   props
 * @param {boolean}  props.visible
 * @param {Function} props.onHide
 * @param {object}   props.formData           - { departmentId, name, code, description, isActive }
 * @param {Function} props.onFormDataChange   - (newData) => void
 * @param {boolean}  props.saving
 * @param {number}   props.activeTab          - 0=Details, 1=Users
 * @param {Function} props.onTabChange        - (index) => void
 * @param {Function} props.onSave
 * @param {Function} props.onAssignUsers
 * @param {Array}    props.usersInDept
 * @param {Array}    props.availableUsers
 * @param {Array}    props.selectedUserIds
 * @param {Function} props.onSelectionChange  - (ids) => void
 */
const DepartmentFormPopup = ({
    visible,
    onHide,
    formData,
    onFormDataChange,
    saving,
    activeTab,
    onTabChange,
    onSave,
    onAssignUsers,
    usersInDept = [],
    availableUsers = [],
    selectedUserIds = [],
    onSelectionChange,
}) => {
    const isEditMode = !!formData?.departmentId;
    const title = isEditMode ? 'Edit Department' : 'Add Department';

    const handleFieldChange = (field, value) => {
        onFormDataChange?.({ ...formData, [field]: value });
    };

    if (!visible) return null;

    return (
        <SlidePanel open={visible} onClose={onHide} title={title} width={420} panelClassName="department-form-panel">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Tab bar */}
                <div className="m365-detail-tabs">
                    <button
                        className={`m365-detail-tab${activeTab === 0 ? ' m365-detail-tab--active' : ''}`}
                        onClick={() => onTabChange(0)}
                    >
                        Details
                    </button>
                    <button
                        className={`m365-detail-tab${activeTab === 1 ? ' m365-detail-tab--active' : ''}`}
                        onClick={() => onTabChange(1)}
                        disabled={!isEditMode}
                        style={{ opacity: !isEditMode ? 0.4 : 1 }}
                        title={!isEditMode ? 'Save the department first to manage users' : ''}
                    >
                        Users ({usersInDept.length})
                    </button>
                </div>

                {/* Body */}
                <div className="m365-panel-body">
                    {/* Details tab */}
                    {activeTab === 0 && (
                        <div>
                            <div className="m365-field">
                                <label className="m365-field__label">Status</label>
                                <div className="department-form-panel__status-row">
                                    <span className={`m365-badge ${formData?.isActive !== false ? 'm365-badge--success' : 'm365-badge--neutral'}`}>
                                        <i className={`fa-light ${formData?.isActive !== false ? 'fa-circle-check' : 'fa-circle-minus'}`} />
                                        {formData?.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                    <label className="department-form-panel__toggle">
                                        <input
                                            type="checkbox"
                                            checked={formData?.isActive !== false}
                                            onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                                        />
                                        <span>Department can be assigned to users</span>
                                    </label>
                                </div>
                            </div>

                            <div className="m365-field">
                                <label className="m365-field__label m365-field__label--required">
                                    Department Name
                                </label>
                                <input
                                    className="m365-input"
                                    value={formData?.name || ''}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    placeholder="Enter department name"
                                />
                            </div>

                            <div className="m365-field">
                                <label className="m365-field__label">Code</label>
                                <input
                                    className="m365-input"
                                    value={formData?.code || ''}
                                    onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                                    placeholder="Optional short code, e.g. CTRL"
                                    maxLength={20}
                                />
                            </div>

                            <div className="m365-field">
                                <label className="m365-field__label">Description</label>
                                <textarea
                                    className="m365-input"
                                    style={{ height: 80, resize: 'vertical', padding: '8px 10px' }}
                                    value={formData?.description || ''}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    placeholder="Enter description (optional)"
                                />
                            </div>
                        </div>
                    )}

                    {/* Users tab */}
                    {activeTab === 1 && (
                        <div>
                            {!isEditMode ? (
                                <div className="m365-empty" style={{ padding: '32px 0' }}>
                                    <i className="fa-light fa-circle-info m365-empty__icon" style={{ fontSize: 24 }} />
                                    <p className="m365-empty__title">Save department first</p>
                                    <p className="m365-empty__subtitle">Go to Details and save before assigning users.</p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ fontSize: 12, color: '#605e5c', marginBottom: 12 }}>
                                        <i className="fa-light fa-circle-info" style={{ marginRight: 6 }} />
                                        Select users to assign to this department.
                                    </p>
                                    <div className="m365-datagrid-wrap">
                                        <DataGrid
                                            dataSource={availableUsers}
                                            keyExpr="id"
                                            showBorders={false}
                                            rowAlternationEnabled={false}
                                            hoverStateEnabled={true}
                                            height={320}
                                            selectedRowKeys={selectedUserIds}
                                            onSelectionChanged={(e) => onSelectionChange?.(e.selectedRowKeys)}
                                            noDataText="No users available"
                                        >
                                            <Selection mode="multiple" showCheckBoxesMode="always" />
                                            <Column dataField="userName" caption="Username" />
                                            <Column dataField="email" caption="Email" />
                                            <Column
                                                dataField="currentDepartmentName"
                                                caption="Current Dept"
                                                cellRender={(data) => (
                                                    <span style={{
                                                        color: data.value !== 'None' && data.data.departmentId !== formData?.departmentId
                                                            ? '#ca5010'
                                                            : undefined,
                                                        fontSize: 12,
                                                    }}>
                                                        {data.value !== 'None' && data.data.departmentId !== formData?.departmentId && (
                                                            <i className="fa-light fa-arrow-right-arrow-left" style={{ marginRight: 4 }} />
                                                        )}
                                                        {data.value}
                                                    </span>
                                                )}
                                            />
                                            <Paging enabled={true} pageSize={10} />
                                            <SearchPanel visible={true} placeholder="Search users..." />
                                        </DataGrid>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="m365-panel-footer">
                    <button className="m365-btn m365-btn--ghost" onClick={onHide} disabled={saving}>
                        Cancel
                    </button>
                    {activeTab === 0 ? (
                        <button className="m365-btn m365-btn--primary" onClick={onSave} disabled={saving}>
                            <i className="fa-light fa-check" />
                            {saving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                        </button>
                    ) : (
                        <button className="m365-btn m365-btn--primary" onClick={onAssignUsers} disabled={saving || !isEditMode}>
                            <i className="fa-light fa-users" />
                            {saving ? 'Saving...' : 'Save Assignments'}
                        </button>
                    )}
                </div>
            </div>
        </SlidePanel>
    );
};

export default DepartmentFormPopup;
