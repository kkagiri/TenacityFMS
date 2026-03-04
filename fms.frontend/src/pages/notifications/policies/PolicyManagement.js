import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DataGrid,
  Button,
  TextBox,
  SelectBox,
  Popup,
  LoadIndicator
} from 'devextreme-react';
import {
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  Toolbar as GridToolbar,
  Item as ToolbarItem,
  SearchPanel,
  Export
} from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import notificationsApi from '../../../dataservice/notificationsApi';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';

const PolicyManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const categoryOptions = [
    { value: 'all', text: 'All Groups' },
    { value: 'Tank Operations', text: 'Tank Operations' },
    { value: 'PTS Device', text: 'PTS Device' },
    { value: 'GPS & Vehicle', text: 'GPS & Vehicle' },
    { value: 'System', text: 'System' }
  ];

  const statusOptions = [
    { value: 'all', text: 'All Status' },
    { value: 'active', text: 'Active' },
    { value: 'inactive', text: 'Inactive' }
  ];

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsApi.getPolicies();
      if (!result.isSuccess) throw new Error(result.message);
      // Normalize shape if backend differs
      const transformed = (result.data || []).map(p => ({
        id: p.id || p.policyId,
        name: p.name,
        description: p.description,
        alertTypeKey: p.alertTypeKey || null,
        alertGroup: p.alertGroup || p.category || p.categoryName || 'Uncategorized',
        alertDisplayName: p.alertDisplayName || p.alertTypeKey || null,
        priority: p.priority || p.severity || 'Medium',
        status: (p.isActive === false ? 'Inactive' : 'Active'),
        recipients: p.recipientCount ?? p.recipients?.length ?? 0,
        lastTriggered: p.lastTriggered ? new Date(p.lastTriggered) : null,
        triggerCount: p.triggerCount ?? p.executions ?? 0,
        rules: Array.isArray(p.rules) ? p.rules.length : (p.ruleCount ?? 0),
        createdBy: p.createdBy || p.createdByUser || '—',
        createdAt: p.createdAt ? new Date(p.createdAt) : null,
        successRate: p.successRate ?? null
      }));
      setPolicies(transformed);
    } catch (error) {
      notify(error.message || 'Error loading policies', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleEditPolicy = (policy) => {
    navigate(notificationRoutes.policyEdit(policy.id));
  };

  const handleDeletePolicy = (policy) => {
    setPolicyToDelete(policy);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      const res = await notificationsApi.deletePolicy(policyToDelete.id);
      if (!res.isSuccess) throw new Error(res.message);
      setPolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
      notify('Policy deleted successfully', 'success', 3000);
    } catch (error) {
      notify(error.message || 'Error deleting policy', 'error', 3000);
    } finally {
      setDeleteConfirmVisible(false);
      setPolicyToDelete(null);
    }
  };

  const togglePolicyStatus = async (policy) => {
    try {
      const newStatus = policy.status === 'Active' ? 'Inactive' : 'Active';
      const res = await notificationsApi.updatePolicyStatus(policy.id, newStatus);
      if (!res.isSuccess) throw new Error(res.message);
      setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, status: newStatus } : p));
      notify(`Policy ${newStatus.toLowerCase()} successfully`, 'success', 3000);
    } catch (error) {
      notify(error.message || 'Error updating policy status', 'error', 3000);
    }
  };

  const duplicatePolicy = async (policy) => {
    try {
      const res = await notificationsApi.duplicatePolicy(policy.id);
      if (!res.isSuccess) throw new Error(res.message);
      // Reload list to include new duplicate (assuming backend returns it)
      await loadPolicies();
      notify('Policy duplicated successfully', 'success', 3000);
    } catch (error) {
      notify(error.message || 'Error duplicating policy', 'error', 3000);
    }
  };

  const onRowPrepared = (e) => {
    if (e.rowType === 'data') {
      if (e.data.status === 'Inactive') {
        e.rowElement.style.opacity = '0.6';
      }
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator visible={true} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Policy Management</h2>
          <p className="tw-text-gray-600 tw-mt-1">Configure and monitor notification policies</p>
        </div>
        <Link
          to={notificationRoutes.policyCreate}
          className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-border tw-border-transparent tw-rounded-md hover:tw-bg-blue-700"
        >
          <i className="fa-light fa-plus tw-mr-2"></i>
          Create Policy
        </Link>
      </div>

      {/* Filters */}
      <div className="tw-bg-white dark:tw-bg-gray-900 tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm tw-mb-6">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Search Policies
            </label>
            <TextBox
              value={searchValue}
              onValueChanged={(e) => setSearchValue(e.value)}
              placeholder="Search by name or description..."
              showClearButton={true}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Alert Group
            </label>
            <SelectBox
              value={filterCategory}
              dataSource={categoryOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setFilterCategory(e.value)}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Status
            </label>
            <SelectBox
              value={filterStatus}
              dataSource={statusOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setFilterStatus(e.value)}
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white dark:tw-bg-gray-900 tw-rounded-lg tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm">
        <DataGrid
          dataSource={policies}
          showBorders={false}
          showRowLines={true}
          onRowPrepared={onRowPrepared}
          height={600}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
        >
          <SearchPanel
            visible={true}
            searchVisibleColumnsOnly={false}
            placeholder="Search policies..."
          />

          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Export enabled={true} fileName="notification-policies" />

          <Column
            dataField="name"
            caption="Policy Name"
            cellRender={({ data }) => (
              <div>
                <div className="tw-font-medium tw-text-gray-900">{data.name}</div>
                <div className="tw-text-sm tw-text-gray-600 tw-mt-1">{data.description}</div>
              </div>
            )}
          />

          <Column
            dataField="alertDisplayName"
            caption="Alert Type"
            width={160}
            cellRender={({ data }) => (
              <div>
                <div className="tw-font-medium tw-text-gray-800">{data.alertDisplayName || '—'}</div>
                {data.alertGroup && (
                  <span className="tw-text-xs tw-text-gray-500">{data.alertGroup}</span>
                )}
              </div>
            )}
          />

          <Column
            dataField="alertGroup"
            caption="Group"
            width={130}
            cellRender={({ data }) => (
              <span className="tw-inline-block tw-text-xs tw-font-medium tw-bg-gray-100 tw-text-gray-600 tw-px-2 tw-py-0.5 tw-rounded">
                {data.alertGroup}
              </span>
            )}
          />

          <Column
            dataField="priority"
            caption="Priority"
            width={100}
            cellRender={({ data }) => (
              <span className={`priority-badge ${data.priority?.toLowerCase()}`}>
                {data.priority}
              </span>
            )}
          />

          <Column
            dataField="status"
            caption="Status"
            width={100}
            cellRender={({ data }) => (
              <span className={`status-badge ${data.status?.toLowerCase()}`}>
                {data.status}
              </span>
            )}
          />

          <Column
            dataField="recipients"
            caption="Recipients"
            width={100}
            cellRender={({ data }) => (
              <div className="tw-flex tw-items-center">
                <i className="fa-light fa-users tw-mr-1 tw-text-gray-400"></i>
                {data.recipients}
              </div>
            )}
          />

          <Column
            dataField="triggerCount"
            caption="Triggers"
            width={100}
          />

          <Column
            dataField="successRate"
            caption="Success Rate"
            width={120}
            cellRender={({ data }) => (
              data.successRate !== null ? (
                <div className="tw-flex tw-items-center">
                  <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${data.successRate >= 95 ? 'tw-bg-green-400' :
                      data.successRate >= 85 ? 'tw-bg-yellow-400' : 'tw-bg-red-400'
                    }`}></div>
                  {data.successRate}%
                </div>
              ) : (
                <span className="tw-text-gray-400">N/A</span>
              )
            )}
          />

          <Column
            dataField="lastTriggered"
            caption="Last Triggered"
            width={140}
            cellRender={({ data }) => (
              <span className="tw-text-sm tw-text-gray-600">
                {formatTimestamp(data.lastTriggered)}
              </span>
            )}
          />

          <Column
            caption="Actions"
            width={200}
            cellRender={({ data }) => (
              <div className="tw-flex tw-items-center tw-space-x-2">
                <Button
                  hint="Edit Policy"
                  icon="edit"
                  onClick={() => handleEditPolicy(data)}
                  stylingMode="text"
                />
                <Button
                  hint={data.status === 'Active' ? 'Deactivate' : 'Activate'}
                  icon={data.status === 'Active' ? 'play' : 'runner'}
                  onClick={() => togglePolicyStatus(data)}
                  stylingMode="text"
                />
                <Button
                  hint="Duplicate Policy"
                  icon="copy"
                  onClick={() => duplicatePolicy(data)}
                  stylingMode="text"
                />
                <Button
                  hint="Delete Policy"
                  icon="trash"
                  onClick={() => handleDeletePolicy(data)}
                  stylingMode="text"
                />
              </div>
            )}
            allowSorting={false}
            allowFiltering={false}
          />

          <Paging enabled={true} pageSize={20} />

          <GridToolbar>
            <ToolbarItem location="before">
              <div className="tw-text-sm tw-text-gray-600">
                {policies.length} policies total
              </div>
            </ToolbarItem>
            <ToolbarItem location="after" name="exportButton" />
            <ToolbarItem location="after" name="searchPanel" />
          </GridToolbar>
        </DataGrid>
      </div>

      {/* Delete Confirmation */}
      <Popup
        visible={deleteConfirmVisible}
        onHiding={() => setDeleteConfirmVisible(false)}
        width={400}
        height={200}
        title="Confirm Delete"
        showCloseButton={true}
      >
        <div className="tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-4">
            <i className="fa-light fa-exclamation-triangle tw-text-red-500 tw-text-2xl tw-mr-3"></i>
            <div>
              <p className="tw-font-medium tw-text-gray-900">Delete Policy</p>
              <p className="tw-text-sm tw-text-gray-600">
                Are you sure you want to delete "{policyToDelete?.name}"?
              </p>
            </div>
          </div>
          <div className="tw-text-sm tw-text-gray-600 tw-mb-6">
            This action cannot be undone. The policy and all its configuration will be permanently removed.
          </div>
          <div className="tw-flex tw-justify-end tw-space-x-2">
            <Button
              text="Cancel"
              onClick={() => setDeleteConfirmVisible(false)}
              stylingMode="outlined"
            />
            <Button
              text="Delete"
              type="danger"
              onClick={confirmDelete}
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default PolicyManagement;
