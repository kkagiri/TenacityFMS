import React, { useState, useEffect } from 'react';
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
    { value: 'all', text: 'All Categories' },
    { value: 'Tank Monitoring', text: 'Tank Monitoring' },
    { value: 'Maintenance', text: 'Maintenance' },
    { value: 'Device Monitoring', text: 'Device Monitoring' },
    { value: 'System Reports', text: 'System Reports' },
    { value: 'Emergency', text: 'Emergency' }
  ];

  const statusOptions = [
    { value: 'all', text: 'All Status' },
    { value: 'active', text: 'Active' },
    { value: 'inactive', text: 'Inactive' }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockPolicies = [
        {
          id: 1,
          name: 'Tank Level Critical Alert',
          description: 'Triggers when tank levels fall below critical thresholds',
          category: 'Tank Monitoring',
          priority: 'Critical',
          status: 'Active',
          recipients: 8,
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
          triggerCount: 15,
          rules: 3,
          createdBy: 'John Smith',
          createdAt: new Date('2024-01-15'),
          successRate: 98.5
        },
        {
          id: 2,
          name: 'Pump Maintenance Reminder',
          description: 'Scheduled maintenance notifications for pump equipment',
          category: 'Maintenance',
          priority: 'Medium',
          status: 'Active',
          recipients: 5,
          lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
          triggerCount: 8,
          rules: 2,
          createdBy: 'Sarah Johnson',
          createdAt: new Date('2024-01-10'),
          successRate: 100
        },
        {
          id: 3,
          name: 'Device Connection Failure',
          description: 'Alerts when devices lose connection to the system',
          category: 'Device Monitoring',
          priority: 'High',
          status: 'Active',
          recipients: 12,
          lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
          triggerCount: 42,
          rules: 4,
          createdBy: 'Mike Wilson',
          createdAt: new Date('2024-01-08'),
          successRate: 94.2
        },
        {
          id: 4,
          name: 'Daily System Report',
          description: 'Automated daily system health and activity reports',
          category: 'System Reports',
          priority: 'Low',
          status: 'Active',
          recipients: 3,
          lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
          triggerCount: 30,
          rules: 1,
          createdBy: 'Admin',
          createdAt: new Date('2024-01-01'),
          successRate: 100
        },
        {
          id: 5,
          name: 'Emergency Shutdown Alert',
          description: 'Critical alerts for emergency system shutdowns',
          category: 'Emergency',
          priority: 'Critical',
          status: 'Inactive',
          recipients: 15,
          lastTriggered: null,
          triggerCount: 0,
          rules: 5,
          createdBy: 'John Smith',
          createdAt: new Date('2024-01-20'),
          successRate: null
        }
      ];
      setPolicies(mockPolicies);
    } catch (error) {
      notify('Error loading policies', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

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
    navigate(`${policy.id}/edit`);
  };

  const handleDeletePolicy = (policy) => {
    setPolicyToDelete(policy);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;

    try {
      // Simulate API call - replace with actual API call
      await fetch(`/api/notifications/policies/${policyToDelete.id}`, {
        method: 'DELETE'
      });

      setPolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
      notify('Policy deleted successfully', 'success', 3000);
    } catch (error) {
      notify('Error deleting policy', 'error', 3000);
    } finally {
      setDeleteConfirmVisible(false);
      setPolicyToDelete(null);
    }
  };

  const togglePolicyStatus = async (policy) => {
    try {
      const newStatus = policy.status === 'Active' ? 'Inactive' : 'Active';

      // Simulate API call - replace with actual API call
      await fetch(`/api/notifications/policies/${policy.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setPolicies(prev => prev.map(p =>
        p.id === policy.id ? { ...p, status: newStatus } : p
      ));

      notify(`Policy ${newStatus.toLowerCase()} successfully`, 'success', 3000);
    } catch (error) {
      notify('Error updating policy status', 'error', 3000);
    }
  };

  const duplicatePolicy = async (policy) => {
    try {
      const newPolicy = {
        ...policy,
        id: Math.max(...policies.map(p => p.id)) + 1,
        name: `${policy.name} (Copy)`,
        status: 'Inactive',
        createdAt: new Date(),
        createdBy: 'Current User'
      };

      setPolicies(prev => [...prev, newPolicy]);
      notify('Policy duplicated successfully', 'success', 3000);
    } catch (error) {
      notify('Error duplicating policy', 'error', 3000);
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
      <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-mb-6">
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
              Category
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
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
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
            dataField="category"
            caption="Category"
            width={140}
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
                  <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
                    data.successRate >= 95 ? 'tw-bg-green-400' :
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
