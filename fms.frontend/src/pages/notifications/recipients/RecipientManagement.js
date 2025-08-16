import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { SelectBox } from 'devextreme-react/select-box';
import { TextBox } from 'devextreme-react/text-box';
import { Form, SimpleItem } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { createUser } from '../../../redux/actions/userActions';
import notificationGroupsApi from '../../../dataservice/notificationGroupsApi';

const RecipientManagement = () => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [addMemberForm, setAddMemberForm] = useState({ memberType: 'User', memberId: '' });
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], includeSelectedUsers: false, isActive: true });
  const [siteOptions, setSiteOptions] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', username: '', password: '', confirmPassword: '', roleName: '' });
  const [rolesList, setRolesList] = useState([]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const dispatch = useDispatch();

  const fallbackRoles = ['Manager', 'Supervisor', 'Technician', 'Operator', 'Administrator'];

  useEffect(() => {
    const loadData = async () => {
      setUsersLoading(true);
      try {
        const { default: axiosInstance } = await import('../../../api/axiosInstance');
        const resp = await axiosInstance.get('/user');
        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.data || []);
        const norm = data.map(u => ({
          id: u.id || u.userId || u.Id,
          firstName: u.firstName || u.FirstName || '',
          lastName: u.lastName || u.LastName || '',
          email: u.email || u.Email || '',
            role: (u.role || u.Role || (Array.isArray(u.roles) ? u.roles.join(',') : '')) ?? '',
          department: u.department || u.Department || '',
          isActive: u.isActive !== false && u.deleted !== true
        })).filter(u => u.id);
        setUsers(norm);
      } catch {
        setUsers([]);
        notify('Failed to load users', 'error', 3000);
      } finally {
        setUsersLoading(false);
      }

      try {
        const res = await notificationGroupsApi.getGroups();
        if (res.isSuccess) {
          const uiGroups = (res.data || []).map(g => ({
            id: g.id,
            name: g.name,
            displayName: g.name,
            description: g.description,
            memberCount: g.memberCount ?? g.members?.length ?? 0,
            isActive: g.isActive === true
          }));
          setGroups(uiGroups);
        } else {
          setGroups([]);
        }
      } catch {
        setGroups([]);
      }

      // roles
      try {
        const { default: axiosInstance } = await import('../../../api/axiosInstance');
        const rolesResp = await axiosInstance.get('/role/getlist');
        const roleData = Array.isArray(rolesResp.data) ? rolesResp.data : [];
        setRolesList(roleData.map(r => r.name || r.roleName || r.Name).filter(Boolean));
      } catch {
        setRolesList([]);
      }
    };
    loadData();
    dispatch(fetchSiteList());
  }, []);

  const sitesFromStore = useSelector(state => state.site?.sites || state.sites || []);
  useEffect(() => {
    if (sitesFromStore && sitesFromStore.length) {
      setSiteOptions(sitesFromStore.map(s => ({ id: s.id || s.siteId || s.Id, name: s.name || s.siteName || s.Name || `Site ${s.id}` })));
    }
  }, [sitesFromStore]);

  const roleDeliveryMap = {
    Administrator: ['Email','Push','Webhook'],
    Manager: ['Email','Push'],
    Supervisor: ['Email','Sms','Push'],
    Technician: ['Sms','Push'],
    Operator: ['Sms'],
    Default: ['Email']
  };
  const computeRoleDefaults = () => {
    const roles = new Set((selectedUsers || []).flatMap(u => (u.role ? String(u.role).split(',') : [])));
    if (!roles.size) return roleDeliveryMap.Default;
    const methods = new Set();
    roles.forEach(r => (roleDeliveryMap[r.trim()] || roleDeliveryMap.Default).forEach(m => methods.add(m)));
    return Array.from(methods);
  };

  // --- Create User Popup Handlers ---
  const openCreateUserPopup = () => {
    setNewUserForm({ email: '', username: '', password: '', confirmPassword: '', roleName: rolesList[0] || '' });
    setShowCreateUserPopup(true);
  };

  const handleNewUserFieldChange = (field, value) => {
    setNewUserForm(prev => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setPasswordErrors(validatePassword(value));
    }
    if (field === 'confirmPassword' && value !== newUserForm.password) {
      // We won't store separate confirm errors; mismatch handled in submit & UI highlight.
    }
  };

  const validatePassword = (pwd) => {
    const errors = [];
    if (!pwd || pwd.length < 6) errors.push('At least 6 characters.');
    if (!/[A-Z]/.test(pwd)) errors.push('At least one uppercase letter.');
    if (!/[a-z]/.test(pwd)) errors.push('At least one lowercase letter.');
    if (!/[0-9]/.test(pwd)) errors.push('At least one digit.');
    if (!/[^a-zA-Z0-9]/.test(pwd)) errors.push('At least one non-alphanumeric character.');
    return errors;
  };

  const submitCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.username || !newUserForm.password) {
      notify('Email, Username and Password are required', 'warning', 3000);
      return;
    }
    const currentPasswordErrors = validatePassword(newUserForm.password);
    if (currentPasswordErrors.length) {
      setPasswordErrors(currentPasswordErrors);
      notify('Please satisfy password requirements', 'error', 4000);
      return;
    }
    if (newUserForm.password !== newUserForm.confirmPassword) {
      notify('Passwords do not match', 'error', 3000);
      return;
    }
    setCreatingUser(true);
    try {
      const resp = await dispatch(createUser({
        email: newUserForm.email,
        username: newUserForm.username,
        password: newUserForm.password,
        roleName: newUserForm.roleName
      }));
      // If FMSResponse shape returned
      if (resp && resp.isSuccess) {
        notify('User created', 'success', 3000);
      } else if (resp && resp.validationErrors) {
        notify(resp.validationErrors.join('; '), 'error', 5000);
        return; // stop further actions
      }
      // reload users list
      try {
        const { default: axiosInstance } = await import('../../../api/axiosInstance');
        const reload = await axiosInstance.get('/user');
        const data = Array.isArray(reload.data) ? reload.data : (reload.data?.data || []);
        const norm = data.map(u => ({
          id: u.id || u.userId || u.Id,
          firstName: u.firstName || u.firstNameValue || u.FirstName || '',
          lastName: u.lastName || u.lastNameValue || u.LastName || '',
          email: u.email || u.Email || '',
          role: (u.role || u.Role || (Array.isArray(u.roles) ? u.roles.join(',') : '')) ?? '',
          department: u.department || u.Department || '',
          isActive: u.isActive !== false && u.deleted !== true,
          groups: []
        })).filter(u => u.id);
        setUsers(norm);
      } catch { /* ignore */ }
      setShowCreateUserPopup(false);
    } catch (err) {
      notify(err.message || 'Failed to create user', 'error', 5000);
    } finally {
      setCreatingUser(false);
    }
  };

  const openMembersPopup = async (group) => {
    setSelectedGroup(group);
    setShowMembersPopup(true);
    setMembersLoading(true);
    try {
      const res = await notificationGroupsApi.getGroupMembers(group.id);
      if (res.isSuccess) {
        const rawMembers = (res.data || []).map(m => ({
          id: m.id,
          memberType: m.memberType,
          memberId: (m.memberId || '').trim()
        }));
        const userMap = new Map(users.map(u => [String(u.id), u]));
        const toFetch = Array.from(new Set(rawMembers.filter(m => m.memberType === 'User' && !userMap.has(m.memberId)).map(m => m.memberId)));
        if (toFetch.length) {
          try {
            const { default: axiosInstance } = await import('../../../api/axiosInstance');
            const fetched = await Promise.all(toFetch.map(id => axiosInstance.get(`/user/${id}`).then(r => ({ id, data: r.data })).catch(() => null)));
            fetched.filter(Boolean).forEach(f => {
              const u = f.data;
              if (u) {
                userMap.set(String(u.id || u.userId || u.Id), {
                  id: u.id || u.userId || u.Id,
                  firstName: u.firstName || u.FirstName || '',
                  lastName: u.lastName || u.LastName || '',
                  email: u.email || u.Email || '',
                  role: (u.role || u.Role || (Array.isArray(u.roles) ? u.roles.join(',') : '')) ?? ''
                });
              }
            });
          } catch { /* ignore */ }
        }
        const enriched = rawMembers.map(m => {
          if (m.memberType === 'User') {
            const u = userMap.get(m.memberId);
            if (u) {
              const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
              return { ...m, name: fullName || u.email || m.memberId, email: u.email, role: u.role };
            }
          }
          return { ...m, name: m.memberId, email: '', role: '' };
        });
        setMembers(enriched);
      } else {
        setMembers([]);
        notify(res.message || 'Failed to load members', 'error', 3000);
      }
    } catch (e) {
      setMembers([]);
      notify('Failed to load members', 'error', 3000);
    } finally {
      setMembersLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedGroup) return;
    if (!addMemberForm.memberId) {
      notify('Please enter a member identifier', 'warning', 2500);
      return;
    }
    setMembersLoading(true);
    try {
      const payload = [{ memberType: addMemberForm.memberType, memberId: addMemberForm.memberId }];
      const res = await notificationGroupsApi.addGroupMembers(selectedGroup.id, payload);
      if (res.isSuccess) {
        const r = res.data || {};
        const detailMsg = `Added ${r.added ?? r.Added ?? 0} / ${r.attempted ?? r.Attempted ?? payload.length}` +
          (r.duplicates || r.Duplicates ? `, duplicates: ${r.duplicates ?? r.Duplicates}` : '') +
          (r.invalid || r.Invalid ? `, invalid: ${r.invalid ?? r.Invalid}` : '');
        notify(res.message || detailMsg, 'success', 3500);
        if ((r.duplicateKeys && r.duplicateKeys.length) || (r.invalidEntries && r.invalidEntries.length)) {
          // Optional secondary toast with specifics
          const dupList = (r.duplicateKeys || r.DuplicateKeys || []).slice(0,5).join(', ');
            const invalidList = (r.invalidEntries || r.InvalidEntries || []).slice(0,5).join(', ');
          if (dupList || invalidList) {
            notify(`Duplicates: ${dupList || 'none'} | Invalid: ${invalidList || 'none'}`, 'info', 5000);
          }
        }
        // reload members
        await openMembersPopup(selectedGroup);
        setAddMemberForm({ memberType: 'User', memberId: '' });
      } else {
        notify(res.message || 'Failed to add member', 'error', 3000);
      }
    } catch (e) {
      notify('Failed to add member', 'error', 3000);
    } finally {
      setMembersLoading(false);
    }
  };

  const removeMember = async (member) => {
    if (!selectedGroup || !member?.id) {
      notify('Missing member id from API to remove', 'warning', 2500);
      return;
    }
    setMembersLoading(true);
    try {
      const res = await notificationGroupsApi.removeGroupMember(selectedGroup.id, member.id);
      if (res.isSuccess) {
        notify('Member removed', 'success', 2000);
        setMembers(prev => prev.filter(m => m.id !== member.id));
      } else {
        notify(res.message || 'Failed to remove member', 'error', 3000);
      }
    } catch (e) {
      notify('Failed to remove member', 'error', 3000);
    } finally {
      setMembersLoading(false);
    }
  };


  const handleCreateGroup = () => {
    setEditingGroupId(null);
    setGroupFormData({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], includeSelectedUsers: false, isActive: true });
    if (!siteOptions.length) dispatch(fetchSiteList());
    setShowGroupPopup(true);
  };

  const handleEditGroup = (g) => {
    setEditingGroupId(g.id);
    setGroupFormData({
      name: g.name || g.displayName,
      description: g.description || '',
      siteId: g.siteId || '',
      allowedDeliveryMethods: g.allowedDeliveryMethods ? g.allowedDeliveryMethods.split(',') : [],
      includeSelectedUsers: false,
      isActive: g.isActive !== false
    });
    if (!siteOptions.length) dispatch(fetchSiteList());
    setShowGroupPopup(true);
  };

  // (Removed legacy recipient create/edit handlers)

  const handleSaveGroup = async () => {
    setLoading(true);
    try {
      // Basic validation
      const errors = [];
      if (!groupFormData.name) errors.push('Group name is required');
      if (groupFormData.name && groupFormData.name.length > 100) errors.push('Name max length 100');
      if (groupFormData.description && groupFormData.description.length > 500) errors.push('Description max length 500');
      if (errors.length) {
        errors.forEach(e => notify(e, 'error', 3000));
        setLoading(false);
        return;
      }
      const deliveryStr = (groupFormData.allowedDeliveryMethods || []).join(',');
      const members = groupFormData.includeSelectedUsers ? (selectedUsers || []).map(u => ({ memberType: 'User', memberId: String(u.id) })) : undefined;
      const basePayload = {
        name: groupFormData.name,
        description: groupFormData.description || null,
        siteId: groupFormData.siteId ? parseInt(groupFormData.siteId) : null,
        allowedDeliveryMethods: deliveryStr || null,
        isActive: groupFormData.isActive,
        members
      };
      let res;
      if (editingGroupId) {
        res = await notificationGroupsApi.updateGroup(editingGroupId, basePayload);
      } else {
        res = await notificationGroupsApi.createGroup(basePayload);
      }
      if (res.isSuccess) {
        notify(editingGroupId ? 'Group updated successfully!' : 'Group created successfully!', 'success', 3000);
        // refresh groups from API
        const reload = await notificationGroupsApi.getGroups();
        if (reload.isSuccess) {
          const uiGroups = (reload.data || []).map(g => ({
            id: g.id,
            name: g.name || g.id || g.groupName,
            displayName: g.name || g.displayName || g.groupName || `Group #${g.id}`,
            description: g.description,
            memberCount: g.memberCount ?? g.members?.length ?? 0,
            isActive: g.isActive !== false
          }));
          setGroups(uiGroups);
        }
  setShowGroupPopup(false);
  setGroupFormData({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], includeSelectedUsers: false, isActive: true });
  setEditingGroupId(null);
      } else {
        notify(res.message || 'Failed to create group', 'error', 4000);
      }
    } catch (e) {
      // final fallback: optimistic add to UI
      const newGroup = {
        ...groupFormData,
        id: groups.length ? Math.max(...groups.map(g => g.id)) + 1 : 1,
        displayName: groupFormData.displayName || groupFormData.name,
        memberCount: 0,
        isActive: true
      };
      setGroups(prev => [...prev, newGroup]);
      notify('Group created locally (API error).', 'warning', 4000);
    } finally {
      setLoading(false);
    }
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

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const addSelectedUsersToGroup = async () => {
    if (!selectedGroup) {
      notify('Select a group first', 'warning', 2500);
      return;
    }
    if (!selectedUsers.length) {
      notify('No users selected', 'warning', 2500);
      return;
    }
    // Filter out duplicates already in group members
    const existingUserIds = new Set(members.filter(m => m.memberType === 'User').map(m => m.memberId));
    const unique = selectedUsers.filter(u => !existingUserIds.has(String(u.id)));
    if (!unique.length) {
      notify('All selected users are already members', 'info', 3000);
      return;
    }
    setMembersLoading(true);
    try {
      const payload = unique.map(u => ({ memberType: 'User', memberId: String(u.id) }));
      const res = await notificationGroupsApi.addGroupMembers(selectedGroup.id, payload);
      if (res.isSuccess) {
        const r = res.data || {};
        const summary = `Added ${r.added ?? r.Added ?? 0}/${r.attempted ?? r.Attempted ?? payload.length}`;
        notify(res.message || summary, 'success', 3500);
        await openMembersPopup(selectedGroup);
        setSelectedUsers([]);
      } else {
        notify(res.message || 'Failed to add users', 'error', 3500);
      }
    } catch (e) {
      notify('Failed to add users', 'error', 3500);
    } finally {
      setMembersLoading(false);
    }
  };


  return (
    <div className="form-container">
      <div className="form-content">
        <div className="tw-p-6 notification-form">
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
                text="Create User"
                icon="fa-solid fa-user"
                type="default"
                onClick={openCreateUserPopup}
              />
            </div>
          </div>
        </div>

  {/* Users Directory */}
        <div className="tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-900">Users Directory</h3>
            <div className="tw-flex tw-space-x-2">
              <input
                type="text"
                className="tw-border tw-rounded tw-px-2 tw-py-1 tw-text-sm"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <Button
                text="Add Selected to Group"
                type="default"
                onClick={addSelectedUsersToGroup}
                disabled={!selectedGroup || !selectedUsers.length || membersLoading}
              />
            </div>
          </div>
          <DataGrid
            dataSource={filteredUsers}
            keyExpr="id"
            showBorders={true}
            rowAlternationEnabled={true}
            height={400}
            columnAutoWidth={true}
            loadPanel={{ enabled: usersLoading }}
            selection={{ mode: 'multiple', showCheckBoxesMode: 'always' }}
            onSelectionChanged={e => setSelectedUsers(e.selectedRowsData)}
          >
            <Column caption="Name" cellRender={renderFullName} />
            <Column dataField="email" caption="Email" />
            <Column dataField="role" caption="Role" />
            <Column dataField="department" caption="Department" />
            <Column dataField="isActive" caption="Active" cellRender={renderStatus} width={90} />
          </DataGrid>
        </div>

  {/* Groups Panel */}
        <div className="tw-px-6 tw-pb-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-900">Groups</h3>
          </div>
          <DataGrid
            dataSource={groups}
            showBorders={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
          >
            <Column dataField="displayName" caption="Group"/>
            <Column dataField="description" caption="Description"/>
            <Column dataField="memberCount" caption="Members" width={100}/>
            <Column dataField="isActive" caption="Status" width={100} cellRender={({ value }) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                value ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
              }`}>
                {value ? 'Active' : 'Inactive'}
              </span>
            )}/>
            <Column caption="Actions" width={220} cellRender={({ data }) => (
              <div className="tw-flex tw-space-x-2">
                <Button icon="fa-solid fa-users" hint="View Members" stylingMode="text" onClick={() => openMembersPopup(data)} />
                <Button icon="fa-solid fa-pen" hint="Edit Group" stylingMode="text" onClick={() => handleEditGroup(data)} />
              </div>
            )}/>
          </DataGrid>
        </div>
  </div>

      {/* Create Group Popup */}
      <Popup
        visible={showGroupPopup}
        onHiding={() => setShowGroupPopup(false)}
        dragEnabled={false}
  title={editingGroupId ? 'Edit Group' : 'Create New Group'}
        width={400}
        height='auto'
        showCloseButton={true}
      >
  <div className="tw-p-4 tw-space-y-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Name<span className="tw-text-red-500">*</span></label>
            <input
              type="text"
              className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
              value={groupFormData.name}
              onChange={e => setGroupFormData(f => ({ ...f, name: e.target.value }))}
              placeholder="Unique group key"
              maxLength={100}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Description</label>
            <textarea
              className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1 tw-h-20"
              value={groupFormData.description}
              onChange={e => setGroupFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe purpose"
              maxLength={500}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Site (optional)</label>
            <select
              className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
              value={groupFormData.siteId}
              onChange={e => setGroupFormData(f => ({ ...f, siteId: e.target.value }))}
            >
              <option value="">-- None --</option>
              {siteOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Allowed Delivery Methods</label>
            <div className="tw-grid tw-grid-cols-2 tw-gap-2">
              {['Email','Sms','Push','Webhook'].map(m => {
                const checked = groupFormData.allowedDeliveryMethods.includes(m);
                return (
                  <label key={m} className="tw-flex tw-items-center tw-space-x-2 tw-text-xs tw-bg-gray-50 tw-rounded tw-px-2 tw-py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setGroupFormData(f => ({
                        ...f,
                        allowedDeliveryMethods: checked ? f.allowedDeliveryMethods.filter(x => x !== m) : [...f.allowedDeliveryMethods, m]
                      }))}
                    />
                    <span>{m}</span>
                  </label>
                );
              })}
            </div>
            <div className="tw-flex tw-space-x-2 tw-mt-2">
              <Button text="Apply Role Defaults" onClick={() => setGroupFormData(f => ({ ...f, allowedDeliveryMethods: computeRoleDefaults() }))} disabled={!selectedUsers.length} />
              <Button text="Clear" onClick={() => setGroupFormData(f => ({ ...f, allowedDeliveryMethods: [] }))} />
            </div>
          </div>
          <div>
            <label className="tw-inline-flex tw-items-center tw-space-x-2 tw-text-sm">
              <input
                type="checkbox"
                checked={groupFormData.isActive}
                onChange={e => setGroupFormData(f => ({ ...f, isActive: e.target.checked }))}
              />
              <span>Active</span>
            </label>
          </div>
          <div>
            <label className="tw-inline-flex tw-items-center tw-space-x-2 tw-text-sm">
              <input
                type="checkbox"
                checked={groupFormData.includeSelectedUsers}
                onChange={e => setGroupFormData(f => ({ ...f, includeSelectedUsers: e.target.checked }))}
              />
              <span>Include currently selected users ({selectedUsers.length}) as members</span>
            </label>
          </div>
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-2">
            <Button text="Cancel" onClick={() => { setShowGroupPopup(false); setEditingGroupId(null); }} />
            <Button text={loading ? 'Saving...' : (editingGroupId ? 'Update Group' : 'Create Group')} type="default" onClick={handleSaveGroup} disabled={loading} />
          </div>
        </div>
      </Popup>

      {/* Group Members Popup */}
      <Popup
        visible={showMembersPopup}
        onHiding={() => setShowMembersPopup(false)}
        dragEnabled={false}
        title={selectedGroup ? `Members of ${selectedGroup.displayName}` : 'Group Members'}
        width={600}
        height={500}
        showCloseButton={true}
      >
        <div className="tw-p-4 tw-space-y-4">
          <div className="tw-flex tw-items-end tw-space-x-3">
            <SelectBox
              label="Member Type"
              dataSource={[{ id: 'User', name: 'User' }, { id: 'Role', name: 'Role' }]}
              valueExpr="id"
              displayExpr="name"
              value={addMemberForm.memberType}
              onValueChanged={(e) => setAddMemberForm(prev => ({ ...prev, memberType: e.value }))}
              width={180}
            />
            <TextBox
              label="Member Identifier"
              value={addMemberForm.memberId}
              onValueChanged={(e) => setAddMemberForm(prev => ({ ...prev, memberId: e.value }))}
              placeholder={addMemberForm.memberType === 'Role' ? 'Role name or id' : 'User id'}
              width={260}
              labelMode='outlined'
            />
            <Button text="Add" type="default" onClick={addMember} disabled={membersLoading || !selectedGroup} />
          </div>

          <div className="tw-border tw-border-gray-200 tw-rounded">
            <DataGrid
              dataSource={members}
              height={320}
              width='auto'
              loadPanel={{ enabled: membersLoading }}
              rowAlternationEnabled={true}
              columnAutoWidth={true}
            >
              <Column dataField="memberType" caption="Type" width={80} />
              <Column dataField="name" caption="Name / Identifier" width={180} />
              <Column dataField="email" caption="Email" width={200} />
              <Column dataField="memberId" caption="User Id" width={220} visible={false} />
              <Column caption="Actions" width={90} cellRender={({ data }) => (
                <Button icon="fa-solid fa-trash" hint="Remove" stylingMode="text" onClick={() => removeMember(data)} />
              )} />
            </DataGrid>
          </div>
        </div>
      </Popup>

  {/* Create User Popup */}
      <Popup
        visible={showCreateUserPopup}
        onHiding={() => setShowCreateUserPopup(false)}
        dragEnabled={false}
        title="Create User"
        width={480}
        height={520}
        showCloseButton={true}
      >
        <div className="tw-p-4 tw-space-y-4">
          <div className="tw-grid tw-grid-cols-1 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Email</label>
              <input type="email" className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={newUserForm.email} onChange={e => handleNewUserFieldChange('email', e.target.value)} />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Username</label>
              <input type="text" className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={newUserForm.username} onChange={e => handleNewUserFieldChange('username', e.target.value)} />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Password</label>
              <input
                type="password"
                className={`tw-w-full tw-border tw-rounded tw-px-2 tw-py-1 ${passwordErrors.length ? 'tw-border-red-500' : ''}`}
                value={newUserForm.password}
                onChange={e => handleNewUserFieldChange('password', e.target.value)}
                placeholder="Enter strong password"
              />
              {passwordErrors.length > 0 && (
                <ul className="tw-mt-1 tw-text-xs tw-text-red-600 tw-list-disc tw-ml-5">
                  {passwordErrors.map((pe,i) => <li key={i}>{pe}</li>)}
                </ul>
              )}
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Confirm Password</label>
              <input
                type="password"
                className={`tw-w-full tw-border tw-rounded tw-px-2 tw-py-1 ${newUserForm.confirmPassword && newUserForm.confirmPassword !== newUserForm.password ? 'tw-border-red-500' : ''}`}
                value={newUserForm.confirmPassword}
                onChange={e => handleNewUserFieldChange('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
              />
              {newUserForm.confirmPassword && newUserForm.confirmPassword !== newUserForm.password && (
                <p className="tw-mt-1 tw-text-xs tw-text-red-600">Passwords do not match.</p>
              )}
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Role</label>
              <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={newUserForm.roleName} onChange={e => handleNewUserFieldChange('roleName', e.target.value)}>
                <option value="">-- None --</option>
                { (rolesList.length ? rolesList : fallbackRoles).map(r => <option key={r} value={r}>{r}</option>) }
              </select>
            </div>
          </div>
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-4 tw-border-t">
            <Button text="Cancel" onClick={() => setShowCreateUserPopup(false)} />
            <Button text={creatingUser ? 'Creating...' : 'Create User'} type="default" onClick={submitCreateUser} disabled={creatingUser} />
          </div>
        </div>
      </Popup>
    </div>
  </div>
</div>
  );
};

export default RecipientManagement;
