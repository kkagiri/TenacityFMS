import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Form, SimpleItem, GroupItem } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { CheckBox } from 'devextreme-react/check-box';
import notify from 'devextreme/ui/notify';

// Mock data for recipients
// eslint-disable-next-line no-unused-vars
const mockRecipients = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1-555-0123',
    role: 'Manager',
    department: 'Operations',
    groups: ['managers', 'operations'],
    isActive: true,
    preferences: {
      email: true,
      sms: true,
      push: false
    },
    createdAt: '2024-01-10',
    lastNotified: '2024-01-25'
  },
  {
    id: 2,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1-555-0124',
    role: 'Supervisor',
    department: 'Maintenance',
    groups: ['supervisors', 'maintenance'],
    isActive: true,
    preferences: {
      email: true,
      sms: false,
      push: true
    },
    createdAt: '2024-01-08',
    lastNotified: '2024-01-24'
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@company.com',
    phone: '+1-555-0125',
    role: 'Technician',
    department: 'Field Operations',
    groups: ['technicians', 'field'],
    isActive: false,
    preferences: {
      email: true,
      sms: true,
      push: true
    },
    createdAt: '2024-01-05',
    lastNotified: '2024-01-20'
  }
];

// Mock data for groups
// eslint-disable-next-line no-unused-vars
const mockGroups = [
  {
    id: 1,
    name: 'managers',
    displayName: 'Managers',
    description: 'All management personnel',
    memberCount: 5,
    isActive: true
  },
  {
    id: 2,
    name: 'supervisors',
    displayName: 'Supervisors',
    description: 'Supervisory staff',
    memberCount: 8,
    isActive: true
  },
  {
    id: 3,
    name: 'technicians',
    displayName: 'Technicians',
    description: 'Technical staff',
    memberCount: 12,
    isActive: true
  },
  {
    id: 4,
    name: 'operations',
    displayName: 'Operations',
    description: 'Operations department',
    memberCount: 15,
    isActive: true
  },
  {
    id: 5,
    name: 'maintenance',
    displayName: 'Maintenance',
    description: 'Maintenance department',
    memberCount: 10,
    isActive: true
  }
];

const RecipientManagement = () => {
  const [recipients, setRecipients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [formData, setFormData] = useState({});
  const [groupFormData, setGroupFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Mock data for recipients
  const mockRecipients = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0123',
      role: 'Manager',
      department: 'Operations',
      groups: ['managers', 'operations'],
      isActive: true,
      preferences: {
        email: true,
        sms: true,
        push: false
      },
      createdAt: '2024-01-10',
      lastNotified: '2024-01-25'
    },
    {
      id: 2,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1-555-0124',
      role: 'Supervisor',
      department: 'Maintenance',
      groups: ['supervisors', 'maintenance'],
      isActive: true,
      preferences: {
        email: true,
        sms: false,
        push: true
      },
      createdAt: '2024-01-08',
      lastNotified: '2024-01-24'
    },
    {
      id: 3,
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@company.com',
      phone: '+1-555-0125',
      role: 'Technician',
      department: 'Field Operations',
      groups: ['technicians', 'field'],
      isActive: false,
      preferences: {
        email: true,
        sms: true,
        push: true
      },
      createdAt: '2024-01-05',
      lastNotified: '2024-01-20'
    }
  ];

  // Mock data for groups
  const mockGroups = [
    {
      id: 1,
      name: 'managers',
      displayName: 'Managers',
      description: 'All management personnel',
      memberCount: 5,
      isActive: true
    },
    {
      id: 2,
      name: 'supervisors',
      displayName: 'Supervisors',
      description: 'Supervisory staff',
      memberCount: 8,
      isActive: true
    },
    {
      id: 3,
      name: 'technicians',
      displayName: 'Technicians',
      description: 'Technical staff',
      memberCount: 12,
      isActive: true
    },
    {
      id: 4,
      name: 'operations',
      displayName: 'Operations',
      description: 'Operations department',
      memberCount: 15,
      isActive: true
    },
    {
      id: 5,
      name: 'maintenance',
      displayName: 'Maintenance',
      description: 'Maintenance department',
      memberCount: 10,
      isActive: true
    }
  ];

  const roles = [
    'Manager', 'Supervisor', 'Technician', 'Operator', 'Administrator'
  ];

  const departments = [
    'Operations', 'Maintenance', 'Field Operations', 'IT', 'Administration'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setRecipients(mockRecipients);
        setLoading(false);
      }, 500);

      // Load groups
      setTimeout(() => {
        setGroups(mockGroups);
      }, 300);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRecipient = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      groups: [],
      isActive: true,
      preferences: {
        email: true,
        sms: false,
        push: false
      }
    });
    setShowCreatePopup(true);
  };

  const handleEditRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setFormData({ ...recipient });
    setShowEditPopup(true);
  };

  const handleCreateGroup = () => {
    setGroupFormData({
      name: '',
      displayName: '',
      description: '',
      isActive: true
    });
    setShowGroupPopup(true);
  };

  const handleSaveRecipient = async () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (selectedRecipient) {
        // Update existing recipient
        setRecipients(prev => prev.map(r =>
          r.id === selectedRecipient.id ? { ...formData, id: selectedRecipient.id } : r
        ));
        notify('Recipient updated successfully!', 'success', 3000);
        setShowEditPopup(false);
      } else {
        // Create new recipient
        const newRecipient = {
          ...formData,
          id: Math.max(...recipients.map(r => r.id)) + 1,
          createdAt: new Date().toISOString().split('T')[0],
          lastNotified: null
        };
        setRecipients(prev => [...prev, newRecipient]);
        notify('Recipient created successfully!', 'success', 3000);
        setShowCreatePopup(false);
      }
      setLoading(false);
      setSelectedRecipient(null);
      setFormData({});
    }, 1000);
  };

  const handleSaveGroup = async () => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newGroup = {
        ...groupFormData,
        id: Math.max(...groups.map(g => g.id)) + 1,
        memberCount: 0
      };
      setGroups(prev => [...prev, newGroup]);
      notify('Group created successfully!', 'success', 3000);
      setShowGroupPopup(false);
      setGroupFormData({});
      setLoading(false);
    }, 1000);
  };

  const handleDeleteRecipient = async (recipient) => {
    if (window.confirm(`Are you sure you want to delete ${recipient.firstName} ${recipient.lastName}?`)) {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        setRecipients(prev => prev.filter(r => r.id !== recipient.id));
        notify('Recipient deleted successfully!', 'success', 3000);
        setLoading(false);
      }, 500);
    }
  };

  const handleToggleStatus = async (recipient) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setRecipients(prev => prev.map(r =>
        r.id === recipient.id ? { ...r, isActive: !r.isActive } : r
      ));
      notify(`Recipient ${recipient.isActive ? 'deactivated' : 'activated'} successfully!`, 'success', 3000);
      setLoading(false);
    }, 500);
  };

  const renderActionButtons = (data) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-solid fa-edit"
          hint="Edit"
          onClick={() => handleEditRecipient(data.data)}
          type="normal"
          stylingMode="text"
        />
        <Button
          icon={data.data.isActive ? "fa-solid fa-pause" : "fa-solid fa-play"}
          hint={data.data.isActive ? "Deactivate" : "Activate"}
          onClick={() => handleToggleStatus(data.data)}
          type="normal"
          stylingMode="text"
        />
        <Button
          icon="fa-solid fa-trash"
          hint="Delete"
          onClick={() => handleDeleteRecipient(data.data)}
          type="normal"
          stylingMode="text"
        />
      </div>
    );
  };

  const renderStatus = (data) => {
    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
        data.value ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
      }`}>
        {data.value ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const renderFullName = (data) => {
    return `${data.data.firstName} ${data.data.lastName}`;
  };

  const renderGroups = (data) => {
    if (!data.value || data.value.length === 0) return '-';

    return (
      <div className="tw-flex tw-flex-wrap tw-gap-1">
        {data.value.slice(0, 2).map(group => (
          <span key={group} className="tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-rounded tw-text-xs">
            {group}
          </span>
        ))}
        {data.value.length > 2 && (
          <span className="tw-px-2 tw-py-1 tw-bg-gray-100 tw-text-gray-600 tw-rounded tw-text-xs">
            +{data.value.length - 2}
          </span>
        )}
      </div>
    );
  };

  const renderPreferences = (data) => {
    const prefs = data.value;
    return (
      <div className="tw-flex tw-space-x-2">
        {prefs.email && <i className="fa-solid fa-envelope tw-text-blue-600" title="Email"></i>}
        {prefs.sms && <i className="fa-solid fa-sms tw-text-green-600" title="SMS"></i>}
        {prefs.push && <i className="fa-solid fa-bell tw-text-orange-600" title="Push"></i>}
      </div>
    );
  };

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
        {/* Header */}
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                <i className="fa-solid fa-users tw-mr-2 tw-text-blue-600"></i>
                Recipient Management
              </h2>
              <p className="tw-text-gray-600 tw-mt-1">
                Manage notification recipients and groups
              </p>
            </div>
            <div className="tw-flex tw-space-x-3">
              <Button
                text="Create Group"
                icon="fa-solid fa-user-friends"
                type="normal"
                onClick={handleCreateGroup}
              />
              <Button
                text="Add Recipient"
                icon="fa-solid fa-plus"
                type="default"
                onClick={handleCreateRecipient}
              />
            </div>
          </div>
        </div>

        {/* Recipients Grid */}
        <div className="tw-p-6">
          <DataGrid
            dataSource={recipients}
            showBorders={true}
            showRowLines={true}
            showColumnLines={false}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            loadPanel={{ enabled: loading }}
          >
            <Column caption="Name" cellRender={renderFullName} />
            <Column dataField="email" caption="Email" />
            <Column dataField="phone" caption="Phone" />
            <Column dataField="role" caption="Role" />
            <Column dataField="department" caption="Department" />
            <Column dataField="groups" caption="Groups" cellRender={renderGroups} />
            <Column dataField="preferences" caption="Preferences" cellRender={renderPreferences} width={120} />
            <Column dataField="isActive" caption="Status" cellRender={renderStatus} width={100} />
            <Column caption="Actions" cellRender={renderActionButtons} width={150} allowSorting={false} />
          </DataGrid>
        </div>
      </div>

      {/* Create Recipient Popup */}
      <Popup
        visible={showCreatePopup}
        onHiding={() => setShowCreatePopup(false)}
        dragEnabled={false}
        title="Add New Recipient"
        width={600}
        height={600}
        showCloseButton={true}
        contentRender={() => (
          <div className="tw-h-full tw-flex tw-flex-col">
            <ScrollView
              className="tw-flex-1"
              showScrollbar="onScroll"
              bounceEnabled={false}
            >
              <div className="tw-p-4">
                <Form formData={formData} onFieldDataChanged={(e) => setFormData(prev => ({ ...prev, [e.dataField]: e.value }))}>
                  <GroupItem caption="Personal Information">
                    <SimpleItem dataField="firstName" isRequired={true} label={{ text: "First Name" }} />
                    <SimpleItem dataField="lastName" isRequired={true} label={{ text: "Last Name" }} />
                    <SimpleItem dataField="email" isRequired={true} label={{ text: "Email" }} />
                    <SimpleItem dataField="phone" label={{ text: "Phone" }} />
                  </GroupItem>

                  <GroupItem caption="Work Information">
                    <SimpleItem dataField="role" label={{ text: "Role" }}>
                      <SelectBox dataSource={roles} />
                    </SimpleItem>
                    <SimpleItem dataField="department" label={{ text: "Department" }}>
                      <SelectBox dataSource={departments} />
                    </SimpleItem>
                    <SimpleItem dataField="groups" label={{ text: "Groups" }}>
                      <TagBox dataSource={groups} valueExpr="name" displayExpr="displayName" />
                    </SimpleItem>
                  </GroupItem>

                  <GroupItem caption="Notification Preferences">
                    <SimpleItem dataField="preferences.email" label={{ text: "Email Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                    <SimpleItem dataField="preferences.sms" label={{ text: "SMS Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                    <SimpleItem dataField="preferences.push" label={{ text: "Push Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                  </GroupItem>
                </Form>
              </div>
            </ScrollView>

            <div className="tw-border-t tw-p-4 tw-bg-gray-50">
              <div className="tw-flex tw-justify-end tw-space-x-3">
                <Button
                  text="Cancel"
                  onClick={() => setShowCreatePopup(false)}
                />
                <Button
                  text="Add Recipient"
                  type="default"
                  onClick={handleSaveRecipient}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      />

      {/* Edit Recipient Popup */}
      <Popup
        visible={showEditPopup}
        onHiding={() => setShowEditPopup(false)}
        dragEnabled={false}
        title="Edit Recipient"
        width={600}
        height={600}
        showCloseButton={true}
        contentRender={() => (
          <div className="tw-h-full tw-flex tw-flex-col">
            <ScrollView
              className="tw-flex-1"
              showScrollbar="onScroll"
              bounceEnabled={false}
            >
              <div className="tw-p-4">
                <Form formData={formData} onFieldDataChanged={(e) => setFormData(prev => ({ ...prev, [e.dataField]: e.value }))}>
                  <GroupItem caption="Personal Information">
                    <SimpleItem dataField="firstName" isRequired={true} label={{ text: "First Name" }} />
                    <SimpleItem dataField="lastName" isRequired={true} label={{ text: "Last Name" }} />
                    <SimpleItem dataField="email" isRequired={true} label={{ text: "Email" }} />
                    <SimpleItem dataField="phone" label={{ text: "Phone" }} />
                  </GroupItem>

                  <GroupItem caption="Work Information">
                    <SimpleItem dataField="role" label={{ text: "Role" }}>
                      <SelectBox dataSource={roles} />
                    </SimpleItem>
                    <SimpleItem dataField="department" label={{ text: "Department" }}>
                      <SelectBox dataSource={departments} />
                    </SimpleItem>
                    <SimpleItem dataField="groups" label={{ text: "Groups" }}>
                      <TagBox dataSource={groups} valueExpr="name" displayExpr="displayName" />
                    </SimpleItem>
                  </GroupItem>

                  <GroupItem caption="Notification Preferences">
                    <SimpleItem dataField="preferences.email" label={{ text: "Email Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                    <SimpleItem dataField="preferences.sms" label={{ text: "SMS Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                    <SimpleItem dataField="preferences.push" label={{ text: "Push Notifications" }}>
                      <CheckBox />
                    </SimpleItem>
                  </GroupItem>
                </Form>
              </div>
            </ScrollView>

            <div className="tw-border-t tw-p-4 tw-bg-gray-50">
              <div className="tw-flex tw-justify-end tw-space-x-3">
                <Button
                  text="Cancel"
                  onClick={() => setShowEditPopup(false)}
                />
                <Button
                  text="Update Recipient"
                  type="default"
                  onClick={handleSaveRecipient}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      />

      {/* Create Group Popup */}
      <Popup
        visible={showGroupPopup}
        onHiding={() => setShowGroupPopup(false)}
        dragEnabled={false}
        title="Create New Group"
        width={400}
        height={400}
        show
      >
        <div className="tw-p-4">
          <Form formData={groupFormData} onFieldDataChanged={(e) => setGroupFormData(prev => ({ ...prev, [e.dataField]: e.value }))}>
            <SimpleItem dataField="name" isRequired={true} label={{ text: "Group Name (ID)" }} />
            <SimpleItem dataField="displayName" isRequired={true} label={{ text: "Display Name" }} />
            <SimpleItem dataField="description" label={{ text: "Description" }} />
          </Form>

          <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6">
            <Button
              text="Cancel"
              onClick={() => setShowGroupPopup(false)}
            />
            <Button
              text="Create Group"
              type="default"
              onClick={handleSaveGroup}
              disabled={loading}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default RecipientManagement;
