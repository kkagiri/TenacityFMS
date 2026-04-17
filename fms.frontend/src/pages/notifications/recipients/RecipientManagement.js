/**
 * File: RecipientManagement.js
 * Purpose: Manage notification recipient groups and memberships with M365 tab-based layout.
 * Dependencies: DevExtreme DataGrid, SelectBox, Redux, SlidePanel, CreateUserPanel
 * Last Modified: 2026-04-13
 *
 * Key Functions:
 * - RecipientManagement(): Recipient and group administration experience
 */
import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { SelectBox } from 'devextreme-react/select-box';
import { useSearchParams } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import notificationGroupsApi from '../../../dataservice/notificationGroupsApi';
import SlidePanel from '../../../components/ui/SlidePanel';
import CreateUserPanel from '../../user/components/CreateUserPanel';
import './RecipientManagement.scss';

const WARNING_LETTER_GROUP_ROLES = ['siteRepresentatives', 'signatureCc'];

const WARNING_LETTER_GROUP_CONFIG = {
  siteRepresentatives: {
    legacyName: 'Warning Letter Site Representatives',
    suffix: 'Site Representatives',
    description: 'Primary signature recipients for warning letters at the selected site.',
    shortLabel: 'Rep'
  },
  signatureCc: {
    legacyName: 'Warning Letter Signature CC',
    suffix: 'Signature CC',
    description: 'Additional CC recipients for warning-letter signature requests at the selected site.',
    shortLabel: 'CC'
  }
};

const buildWarningLetterGroupName = (siteName, role) => {
  const normalizedSiteName = siteName?.trim() || 'Site';
  return `${normalizedSiteName} ${WARNING_LETTER_GROUP_CONFIG[role].suffix}`;
};

const getWarningLetterGroupRole = (group) => {
  const displayName = (group?.displayName || '').trim();
  const description = (group?.description || '').trim();

  return WARNING_LETTER_GROUP_ROLES.find(role => {
    const config = WARNING_LETTER_GROUP_CONFIG[role];
    return description === config.description
      || displayName === config.legacyName
      || displayName.endsWith(` ${config.suffix}`);
  }) || null;
};

const getWarningLetterGroupTitle = (siteName, role) => buildWarningLetterGroupName(siteName, role);

const mapGroupToViewModel = (group) => ({
  id: group.id,
  name: group.name || group.id || group.groupName,
  displayName: group.name || group.displayName || group.groupName || `Group #${group.id}`,
  description: group.description,
  memberCount: group.memberCount ?? group.members?.length ?? 0,
  isActive: group.isActive === true || group.isActive !== false,
  siteId: group.siteId ?? group.siteID ?? null,
  siteName: group.siteName || group.site?.name || ''
});

const TABS = [
  { key: 'groups', label: 'Groups', icon: 'fa-light fa-layer-group' },
  { key: 'warning-letter', label: 'Warning Letter Groups', icon: 'fa-light fa-triangle-exclamation' }
];

const RecipientManagement = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [addMemberForm, setAddMemberForm] = useState({ memberId: '' });
  const [showGroupPopup, setShowGroupPopup] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], isActive: true });
  const [siteOptions, setSiteOptions] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupSiteId, setSelectedGroupSiteId] = useState('');
  const [warningLetterSetupLoading, setWarningLetterSetupLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const dispatch = useDispatch();

  const fallbackRoles = ['Manager', 'Supervisor', 'Technician', 'Operator', 'Administrator'];
  const deepLinkSiteId = searchParams.get('siteId') || '';
  const deepLinkGroupName = searchParams.get('groupName') || '';
  const deepLinkWarningLetter = searchParams.get('warningLetter') === '1';
  const deepLinkAutoOpen = searchParams.get('autoOpen') === '1';

  const loadUsers = async () => {
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
      return norm;
    } catch {
      setUsers([]);
      notify('Failed to load users', 'error', 3000);
      return [];
    } finally {
      setUsersLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await notificationGroupsApi.getGroups(null);
      if (res.isSuccess) {
        setGroups((res.data || []).map(mapGroupToViewModel));
      } else {
        setGroups([]);
      }
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadUsers();
      await loadGroups();

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

  useEffect(() => {
    if (!deepLinkWarningLetter) return;
    setActiveTab('warning-letter');
    if (deepLinkSiteId) {
      setSelectedGroupSiteId(currentValue => (currentValue === deepLinkSiteId ? currentValue : deepLinkSiteId));
    }
    if (deepLinkGroupName) {
      setGroupSearch(currentValue => (currentValue === deepLinkGroupName ? currentValue : deepLinkGroupName));
    }
  }, [deepLinkGroupName, deepLinkSiteId, deepLinkWarningLetter]);

  const filteredGroups = groups.filter(group => {
    const normalizedSearch = groupSearch.trim().toLowerCase();
    const matchesSite = !selectedGroupSiteId || String(group.siteId) === String(selectedGroupSiteId);
    const matchesSearch = !normalizedSearch ||
      group.displayName?.toLowerCase().includes(normalizedSearch) ||
      group.description?.toLowerCase().includes(normalizedSearch) ||
      group.siteName?.toLowerCase().includes(normalizedSearch);
    return matchesSearch && matchesSite;
  });

  const allWarningLetterGroups = groups.filter(group => Boolean(getWarningLetterGroupRole(group)));

  const warningLetterSiteItems = useMemo(() => {
    const normalizedSearch = groupSearch.trim().toLowerCase();
    const siteMap = new Map();

    siteOptions.forEach(site => {
      siteMap.set(String(site.id), {
        siteId: String(site.id),
        siteName: site.name,
        groupsByRole: new Map(WARNING_LETTER_GROUP_ROLES.map(role => [role, []]))
      });
    });

    allWarningLetterGroups.forEach(group => {
      const siteId = String(group.siteId ?? '');
      if (!siteId) return;
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, {
          siteId,
          siteName: group.siteName || `Site ${siteId}`,
          groupsByRole: new Map(WARNING_LETTER_GROUP_ROLES.map(role => [role, []]))
        });
      }

      const siteEntry = siteMap.get(siteId);
      const role = getWarningLetterGroupRole(group);
      if (role) {
        siteEntry.groupsByRole.get(role)?.push(group);
      }
    });

    return Array.from(siteMap.values())
      .map(site => {
        const counts = WARNING_LETTER_GROUP_ROLES.map(role => site.groupsByRole.get(role)?.length || 0);
        const missingCount = counts.filter(count => count === 0).length;
        const duplicateCount = counts.reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
        const hasAllRequired = counts.every(count => count >= 1);
        const hasExactRequired = counts.every(count => count === 1);

        return {
          ...site,
          missingCount,
          duplicateCount,
          hasAllRequired,
          hasExactRequired,
          totalWarningLetterGroups: counts.reduce((sum, count) => sum + count, 0)
        };
      })
      .filter(site => {
        if (!normalizedSearch) return true;
        return (
          site.siteName.toLowerCase().includes(normalizedSearch) ||
          WARNING_LETTER_GROUP_ROLES.some(role => {
            const title = getWarningLetterGroupTitle(site.siteName, role).toLowerCase();
            return title.includes(normalizedSearch) && (site.groupsByRole.get(role)?.length || 0) > 0;
          })
        );
      })
      .sort((left, right) => left.siteName.localeCompare(right.siteName));
  }, [allWarningLetterGroups, groupSearch, siteOptions]);

  const selectedWarningLetterSite = useMemo(
    () => warningLetterSiteItems.find(site => String(site.siteId) === String(selectedGroupSiteId)) || null,
    [selectedGroupSiteId, warningLetterSiteItems]
  );

  const warningLetterGroups = selectedWarningLetterSite
    ? WARNING_LETTER_GROUP_ROLES.flatMap(role => selectedWarningLetterSite.groupsByRole.get(role) || [])
    : [];

  const memberUserOptions = useMemo(() => users.map(user => ({
    id: String(user.id),
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || String(user.id),
    email: user.email || '',
    role: user.role || ''
  })), [users]);

  const createUserRoleOptions = useMemo(
    () => (rolesList.length ? rolesList : fallbackRoles).map(roleName => ({ value: roleName, text: roleName })),
    [fallbackRoles, rolesList]
  );

  const refreshAndSetGroups = async (siteId = selectedGroupSiteId) => {
    await loadGroups();
  };

  const handleRefresh = async (silent = false) => {
    const latestUsers = await loadUsers();
    await refreshAndSetGroups(selectedGroupSiteId);
    if (selectedGroup) {
      await openMembersPopup(selectedGroup, latestUsers);
    }
    if (!silent) {
      notify('Recipient data refreshed.', 'success', 2000);
    }
  };

  const handleCreateSingleWarningLetterGroup = async (groupRole) => {
    const normalizedSiteId = selectedGroupSiteId ? parseInt(selectedGroupSiteId, 10) : null;
    if (!normalizedSiteId || Number.isNaN(normalizedSiteId)) {
      notify('Select a site first.', 'warning', 2500);
      return;
    }
    const siteName = siteOptions.find(site => String(site.id) === String(normalizedSiteId))?.name || selectedWarningLetterSite?.siteName || `Site ${normalizedSiteId}`;
    const groupName = buildWarningLetterGroupName(siteName, groupRole);
    try {
      setWarningLetterSetupLoading(true);
      const result = await notificationGroupsApi.createGroup({
        name: groupName,
        description: WARNING_LETTER_GROUP_CONFIG[groupRole].description,
        siteId: normalizedSiteId,
        isActive: true,
        allowedDeliveryMethods: ['Email']
      });
      if (!result.isSuccess) throw new Error(result.message || `Failed to create ${groupName}`);
      await refreshAndSetGroups(String(normalizedSiteId));
      notify(`${groupName} created for this site.`, 'success', 2500);
    } catch (error) {
      notify(error.message || `Failed to create ${groupName}.`, 'error', 3500);
    } finally {
      setWarningLetterSetupLoading(false);
    }
  };

  useEffect(() => {
    if (!deepLinkAutoOpen || !deepLinkGroupName || deepLinkHandled) return;
    const targetGroup = warningLetterGroups.find(group =>
      (group.displayName === deepLinkGroupName || getWarningLetterGroupTitle(selectedWarningLetterSite?.siteName || '', getWarningLetterGroupRole(group)).toLowerCase() === deepLinkGroupName.toLowerCase()) &&
      (!deepLinkSiteId || String(group.siteId) === String(deepLinkSiteId))
    );
    if (targetGroup) {
      setDeepLinkHandled(true);
      openMembersPopup(targetGroup);
      return;
    }
    if (groups.length > 0 && (!deepLinkSiteId || String(selectedGroupSiteId) === String(deepLinkSiteId))) {
      setDeepLinkHandled(true);
      notify(`Could not find ${deepLinkGroupName} for the selected site.`, 'warning', 4000);
    }
  }, [deepLinkAutoOpen, deepLinkGroupName, deepLinkHandled, deepLinkSiteId, warningLetterGroups, groups.length, selectedGroupSiteId]);

  useEffect(() => {
    if (activeTab !== 'warning-letter') return;
    if (!warningLetterSiteItems.length) return;

    const currentExists = warningLetterSiteItems.some(site => String(site.siteId) === String(selectedGroupSiteId));
    if (!selectedGroupSiteId || !currentExists) {
      setSelectedGroupSiteId(String(warningLetterSiteItems[0].siteId));
    }
  }, [activeTab, selectedGroupSiteId, warningLetterSiteItems]);

  const openMembersPopup = async (group, usersSource = users) => {
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
        const userMap = new Map(usersSource.map(u => [String(u.id), u]));
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
    } catch {
      setMembers([]);
      notify('Failed to load members', 'error', 3000);
    } finally {
      setMembersLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedGroup) return;
    if (!addMemberForm.memberId) {
      notify('Select a user first.', 'warning', 2500);
      return;
    }
    const alreadyExists = members.some(
      m => m.memberType === 'User' && String(m.memberId) === String(addMemberForm.memberId)
    );
    if (alreadyExists) {
      notify('This member is already in the group.', 'warning', 2500);
      return;
    }
    setMembersLoading(true);
    try {
      const payload = [{ memberType: 'User', memberId: addMemberForm.memberId }];
      const res = await notificationGroupsApi.addGroupMembers(selectedGroup.id, payload);
      if (res.isSuccess) {
        const r = res.data || {};
        const detailMsg = `Added ${r.added ?? r.Added ?? 0} / ${r.attempted ?? r.Attempted ?? payload.length}` +
          (r.duplicates || r.Duplicates ? `, duplicates: ${r.duplicates ?? r.Duplicates}` : '') +
          (r.invalid || r.Invalid ? `, invalid: ${r.invalid ?? r.Invalid}` : '');
        notify(res.message || detailMsg, 'success', 3500);
        await refreshAndSetGroups(selectedGroupSiteId);
        await openMembersPopup(selectedGroup);
        setAddMemberForm({ memberId: '' });
      } else {
        notify(res.message || 'Failed to add member', 'error', 3000);
      }
    } catch {
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
        await refreshAndSetGroups(selectedGroupSiteId);
      } else {
        notify(res.message || 'Failed to remove member', 'error', 3000);
      }
    } catch {
      notify('Failed to remove member', 'error', 3000);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroupId(null);
    setGroupFormData({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], isActive: true });
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
      isActive: g.isActive !== false
    });
    if (!siteOptions.length) dispatch(fetchSiteList());
    setShowGroupPopup(true);
  };

  const handleSaveGroup = async () => {
    setLoading(true);
    try {
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
      const basePayload = {
        name: groupFormData.name,
        description: groupFormData.description || null,
        siteId: groupFormData.siteId ? parseInt(groupFormData.siteId) : null,
        allowedDeliveryMethods: deliveryStr || null,
        isActive: groupFormData.isActive
      };
      let res;
      if (editingGroupId) {
        res = await notificationGroupsApi.updateGroup(editingGroupId, basePayload);
      } else {
        res = await notificationGroupsApi.createGroup(basePayload);
      }
      if (res.isSuccess) {
        notify(editingGroupId ? 'Group updated successfully!' : 'Group created successfully!', 'success', 3000);
        const reload = await notificationGroupsApi.getGroups();
        if (reload.isSuccess) {
          const uiGroups = (reload.data || []).map(g => ({
            id: g.id,
            name: g.name || g.id || g.groupName,
            displayName: g.name || g.displayName || g.groupName || `Group #${g.id}`,
            description: g.description,
            memberCount: g.memberCount ?? g.members?.length ?? 0,
            isActive: g.isActive !== false,
            siteId: g.siteId ?? g.siteID ?? null,
            siteName: g.siteName || g.site?.name || ''
          }));
          setGroups(uiGroups);
        }
        setShowGroupPopup(false);
        setGroupFormData({ name: '', description: '', siteId: '', allowedDeliveryMethods: [], isActive: true });
        setEditingGroupId(null);
      } else {
        notify(res.message || 'Failed to create group', 'error', 4000);
      }
    } catch {
      notify('Failed to save group.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  const clearDeepLinkFilters = () => {
    setDeepLinkHandled(false);
    setSearchParams({});
  };

  const closeGroupPanel = () => {
    setShowGroupPopup(false);
    setEditingGroupId(null);
  };

  const closeMembersPanel = () => {
    setShowMembersPopup(false);
    setSelectedGroup(null);
    setAddMemberForm({ memberId: '' });
  };

  const renderStatus = (data) => (
    <span className={`rm-status-pill ${data.value ? 'rm-status-pill--active' : 'rm-status-pill--inactive'}`}>
      {data.value ? 'Active' : 'Inactive'}
    </span>
  );

  const renderGroupActions = ({ data }) => (
    <div className="rm-row-actions">
      <button type="button" className="m365-icon-btn" title="View Members" onClick={() => openMembersPopup(data)}>
        <i className="fa-light fa-users"></i>
      </button>
      <button type="button" className="m365-icon-btn" title="Edit Group" onClick={() => handleEditGroup(data)}>
        <i className="fa-light fa-pen"></i>
      </button>
    </div>
  );

  const renderWarningLetterSlot = (groupRole) => {
    const matchedGroups = selectedWarningLetterSite?.groupsByRole.get(groupRole) || [];
    const primaryGroup = matchedGroups[0];
    const duplicateCount = matchedGroups.length > 1 ? matchedGroups.length - 1 : 0;
    const groupTitle = getWarningLetterGroupTitle(selectedWarningLetterSite?.siteName || '', groupRole);
    const groupDescription = WARNING_LETTER_GROUP_CONFIG[groupRole].description;

    return (
      <div key={groupRole} className={`rm-wl-group-card ${duplicateCount ? 'rm-wl-group-card--duplicate' : primaryGroup ? 'rm-wl-group-card--ready' : 'rm-wl-group-card--missing'}`}>
        <div className="rm-wl-group-card__header">
          <div>
            <h3 className="rm-wl-group-card__title">{groupTitle}</h3>
            <p className="rm-wl-group-card__description">{groupDescription}</p>
          </div>
          <span className={`rm-wl-group-card__status ${duplicateCount ? 'rm-wl-group-card__status--warning' : primaryGroup ? 'rm-wl-group-card__status--success' : 'rm-wl-group-card__status--muted'}`}>
            {duplicateCount ? `${matchedGroups.length} groups found` : primaryGroup ? 'Configured' : 'Missing'}
          </span>
        </div>

        {primaryGroup ? (
          <div className="rm-wl-group-card__body">
            <div className="rm-wl-group-card__meta">
              <span>{primaryGroup.memberCount} member{primaryGroup.memberCount !== 1 ? 's' : ''}</span>
              <span>{primaryGroup.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="rm-wl-group-card__actions">
              <button type="button" className="m365-btn m365-btn--primary" onClick={() => openMembersPopup(primaryGroup)}>
                <i className="fa-light fa-users"></i>
                Manage Members
              </button>
              <button type="button" className="m365-btn m365-btn--ghost" onClick={() => handleEditGroup(primaryGroup)}>
                <i className="fa-light fa-pen"></i>
                Edit Group
              </button>
            </div>
          </div>
        ) : (
          <div className="rm-wl-group-card__body">
            <p className="rm-wl-group-card__empty">This required group has not been created for the selected site.</p>
            <div className="rm-wl-group-card__actions">
              <button
                type="button"
                className="m365-btn m365-btn--primary"
                onClick={() => handleCreateSingleWarningLetterGroup(groupRole)}
                disabled={warningLetterSetupLoading}
              >
                <i className="fa-light fa-plus"></i>
                {warningLetterSetupLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        )}

        {duplicateCount > 0 && (
          <div className="rm-wl-group-card__duplicates">
            <p className="rm-wl-group-card__warning">Only one {groupTitle.toLowerCase()} group should exist per site. Review the duplicates below.</p>
            {matchedGroups.map(group => (
              <div key={group.id} className="rm-wl-group-card__duplicate-row">
                <span>{group.displayName} · {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                <div className="rm-wl-group-card__duplicate-actions">
                  <button type="button" className="m365-btn m365-btn--text" onClick={() => openMembersPopup(group)}>Members</button>
                  <button type="button" className="m365-btn m365-btn--text" onClick={() => handleEditGroup(group)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* Tab: Groups */
  const renderGroupsTab = () => (
    <div className="rm-tab-content">
      <div className="rm-toolbar">
        <div className="rm-toolbar__left">
          <div className="m365-search rm-toolbar__search">
            <i className="fa-light fa-magnifying-glass m365-search__icon" />
            <input
              type="text"
              className="m365-search__input"
              placeholder="Search groups..."
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
            />
          </div>
          <select className="m365-select rm-toolbar__site-filter" value={selectedGroupSiteId} onChange={e => setSelectedGroupSiteId(e.target.value)}>
            <option value="">All sites</option>
            {siteOptions.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
        <div className="rm-toolbar__right">
          <button type="button" className="m365-btn m365-btn--primary" onClick={handleCreateGroup}>
            <i className="fa-light fa-plus"></i>
            Create Group
          </button>
        </div>
      </div>
      <div className="rm-grid-wrap">
        <DataGrid
          dataSource={filteredGroups}
          showBorders={false}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
          height={520}
        >
          <Column dataField="displayName" caption="Group Name" />
          <Column dataField="siteName" caption="Site" width={180} />
          <Column dataField="description" caption="Description" />
          <Column dataField="memberCount" caption="Members" width={90} alignment="center" />
          <Column dataField="isActive" caption="Status" width={90} alignment="center" cellRender={renderStatus} />
          <Column caption="" width={100} cellRender={renderGroupActions} />
        </DataGrid>
      </div>
    </div>
  );

  /* Tab: Warning Letter Groups */
  const renderWarningLetterTab = () => (
    <div className="rm-tab-content">
      <div className="rm-wl-banner">
        <i className="fa-light fa-circle-info rm-wl-banner__icon"></i>
        <span className="rm-wl-banner__text">
          Each site should have exactly one site-specific representatives group and one site-specific signature CC group.
        </span>
      </div>
      <div className="rm-toolbar">
        <div className="rm-toolbar__left">
          <div className="m365-search rm-toolbar__search">
            <i className="fa-light fa-magnifying-glass m365-search__icon" />
            <input
              type="text"
              className="m365-search__input"
              placeholder="Search sites..."
              value={groupSearch}
              onChange={e => setGroupSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="rm-toolbar__right">
          {(groupSearch || selectedGroupSiteId) && (
            <button type="button" className="m365-btn m365-btn--text" onClick={() => { setGroupSearch(''); clearDeepLinkFilters(); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>
      {warningLetterSiteItems.length === 0 ? (
        <div className="rm-empty-state">
          <i className="fa-light fa-building rm-empty-state__icon"></i>
          <p className="rm-empty-state__text">No sites matched the current search.</p>
        </div>
      ) : (
        <div className="rm-wl-layout">
          <div className="rm-wl-sites">
            <div className="rm-wl-sites__header">
              <div>
                <h3 className="rm-wl-sites__title">Sites</h3>
                <p className="rm-wl-sites__subtitle">Each site must have 1 representative group and 1 signature CC group.</p>
              </div>
              <span className="rm-wl-sites__count">{warningLetterSiteItems.length}</span>
            </div>
            {warningLetterSiteItems.map(site => (
              <button
                key={site.siteId}
                type="button"
                className={`rm-wl-site-item ${String(site.siteId) === String(selectedGroupSiteId) ? 'rm-wl-site-item--active' : ''}`}
                onClick={() => setSelectedGroupSiteId(String(site.siteId))}
              >
                <div className="rm-wl-site-item__top">
                  <div className="rm-wl-site-item__identity">
                    <span className="rm-wl-site-item__name">{site.siteName}</span>
                    <span className="rm-wl-site-item__summary">{site.totalWarningLetterGroups} configured of 2 required</span>
                  </div>
                  <span className={`rm-wl-site-item__badge ${site.duplicateCount ? 'rm-wl-site-item__badge--warning' : site.hasExactRequired ? 'rm-wl-site-item__badge--success' : site.hasAllRequired ? 'rm-wl-site-item__badge--neutral' : 'rm-wl-site-item__badge--muted'}`}>
                    {site.duplicateCount ? 'Duplicates' : site.hasExactRequired ? 'Ready' : site.hasAllRequired ? 'Review' : `${site.missingCount} missing`}
                  </span>
                </div>
                <div className="rm-wl-site-item__requirements">
                  {WARNING_LETTER_GROUP_ROLES.map(role => {
                    const count = site.groupsByRole.get(role)?.length || 0;
                    const shortLabel = WARNING_LETTER_GROUP_CONFIG[role].shortLabel;

                    return (
                      <span
                        key={`${site.siteId}-${role}`}
                        className={`rm-wl-site-item__requirement ${count > 1 ? 'rm-wl-site-item__requirement--warning' : count === 1 ? 'rm-wl-site-item__requirement--success' : 'rm-wl-site-item__requirement--muted'}`}
                      >
                        <span className="rm-wl-site-item__requirement-label">{shortLabel}</span>
                        <span className="rm-wl-site-item__requirement-value">{count > 1 ? `${count}x` : count === 1 ? 'OK' : 'Missing'}</span>
                      </span>
                    );
                  })}
                </div>
                <div className="rm-wl-site-item__meta">
                  {site.duplicateCount > 0 ? <span>{site.duplicateCount} extra group{site.duplicateCount !== 1 ? 's' : ''}</span> : <span>No duplicates</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="rm-wl-detail">
            {selectedWarningLetterSite ? (
              <>
                <div className="rm-wl-detail__header">
                  <div>
                    <h3 className="rm-wl-detail__title">{selectedWarningLetterSite.siteName}</h3>
                    <p className="rm-wl-detail__subtitle">Manage the two required warning-letter groups for this site.</p>
                  </div>
                  <div className="rm-wl-detail__summary">
                    {selectedWarningLetterSite.duplicateCount > 0 ? 'Duplicates detected' : selectedWarningLetterSite.hasExactRequired ? 'Configuration complete' : `${selectedWarningLetterSite.missingCount} required group(s) missing`}
                  </div>
                </div>
                <div className="rm-wl-group-stack">
                  {WARNING_LETTER_GROUP_ROLES.map(renderWarningLetterSlot)}
                </div>
              </>
            ) : (
              <div className="rm-empty-state">
                <i className="fa-light fa-building rm-empty-state__icon"></i>
                <p className="rm-empty-state__text">Select a site from the list to manage its warning-letter groups.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="rm-page">
      {/* Page header */}
      <div className="rm-page-header">
        <div className="rm-page-header__left">
          <i className="fa-light fa-users-gear rm-page-header__icon"></i>
          <h2 className="rm-page-header__title">Recipient Management</h2>
          <span className="rm-page-header__count">{filteredGroups.length}</span>
        </div>
        <div className="rm-page-header__actions">
          <button type="button" className="m365-btn m365-btn--primary" onClick={() => setShowCreateUserPopup(true)}>
            <i className="fa-light fa-plus"></i>
            Create User
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={() => handleRefresh()}
            disabled={usersLoading || membersLoading || warningLetterSetupLoading}
          >
            <i className="fa-light fa-rotate-right"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="rm-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`rm-tab ${activeTab === tab.key ? 'rm-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
            {tab.key === 'groups' && <span className="rm-tab__badge rm-tab__badge--neutral">{filteredGroups.length}</span>}
            {tab.key === 'warning-letter' && warningLetterGroups.length > 0 && (
              <span className="rm-tab__badge rm-tab__badge--warning">{warningLetterGroups.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rm-body">
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'warning-letter' && renderWarningLetterTab()}
      </div>

      {/* Side panels */}
      <SlidePanel
        open={showGroupPopup}
        onClose={closeGroupPanel}
        title={editingGroupId ? 'Edit Group' : 'Create New Group'}
        width={480}
      >
        <div className="rm-panel">
          <div className="rm-panel__body">
            <div className="rm-panel__section">
              <h3 className="rm-panel__section-title">Group Details</h3>
              <div className="rm-panel__field">
                <label className="rm-panel__label">Name</label>
                <input
                  type="text"
                  className="m365-input"
                  value={groupFormData.name}
                  onChange={e => setGroupFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="Unique group key"
                  maxLength={100}
                />
              </div>
              <div className="rm-panel__field">
                <label className="rm-panel__label">Description</label>
                <textarea
                  className="m365-input rm-panel__textarea"
                  value={groupFormData.description}
                  onChange={e => setGroupFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the group purpose"
                  maxLength={500}
                />
              </div>
              <div className="rm-panel__field">
                <label className="rm-panel__label">Site</label>
                <select
                  className="m365-select"
                  value={groupFormData.siteId}
                  onChange={e => setGroupFormData(f => ({ ...f, siteId: e.target.value }))}
                >
                  <option value="">No site restriction</option>
                  {siteOptions.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </div>
            </div>

            <div className="rm-panel__section">
              <h3 className="rm-panel__section-title">Delivery Methods</h3>
              <div className="rm-panel__checkbox-grid">
                {['Email', 'Sms', 'Push', 'Webhook'].map(method => {
                  const checked = groupFormData.allowedDeliveryMethods.includes(method);
                  return (
                    <label key={method} className="rm-panel__method-chip">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setGroupFormData(f => ({
                          ...f,
                          allowedDeliveryMethods: checked
                            ? f.allowedDeliveryMethods.filter(item => item !== method)
                            : [...f.allowedDeliveryMethods, method]
                        }))}
                      />
                      <span>{method}</span>
                    </label>
                  );
                })}
              </div>
              <div className="rm-panel__inline-actions">
                <button
                  type="button"
                  className="m365-btn m365-btn--text"
                  onClick={() => setGroupFormData(f => ({ ...f, allowedDeliveryMethods: [] }))}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="rm-panel__section">
              <h3 className="rm-panel__section-title">Options</h3>
              <label className="m365-checkbox">
                <input type="checkbox" checked={groupFormData.isActive} onChange={e => setGroupFormData(f => ({ ...f, isActive: e.target.checked }))} />
                <span className="m365-checkbox__label">Active</span>
              </label>
            </div>
          </div>
          <div className="rm-panel__footer">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={closeGroupPanel}>Cancel</button>
            <button type="button" className="m365-btn m365-btn--primary" onClick={handleSaveGroup} disabled={loading}>
              {loading ? 'Saving...' : (editingGroupId ? 'Update Group' : 'Create Group')}
            </button>
          </div>
        </div>
      </SlidePanel>

      <SlidePanel
        open={showMembersPopup}
        onClose={closeMembersPanel}
        title={selectedGroup ? `Members - ${selectedGroup.displayName}` : 'Group Members'}
        width={720}
      >
        <div className="rm-panel">
          <div className="rm-panel__body">
            <div className="rm-panel__info-banner">
              <i className="fa-light fa-circle-info"></i>
              <span>Use the user picker below to add members directly to this group.</span>
            </div>
            <div className="rm-panel__member-bar">
              <div className="rm-panel__member-field rm-panel__member-field--entity">
                <label className="rm-panel__label">User</label>
                <SelectBox
                  dataSource={memberUserOptions}
                  valueExpr="id"
                  displayExpr={(item) => {
                    if (!item) return '';
                    return `${item.name}${item.email ? ` (${item.email})` : ''}`;
                  }}
                  value={addMemberForm.memberId}
                  onValueChanged={(e) => setAddMemberForm(prev => ({ ...prev, memberId: e.value || '' }))}
                  placeholder="Search and select a user"
                  width="100%"
                  searchEnabled={true}
                  searchExpr={['name', 'email', 'role']}
                  showClearButton={true}
                />
              </div>
              <div className="rm-panel__member-action">
                <button type="button" className="m365-btn m365-btn--primary" onClick={addMember} disabled={membersLoading || !selectedGroup}>
                  Add
                </button>
              </div>
            </div>
            <div className="rm-grid-wrap">
              <DataGrid
                dataSource={members}
                height={400}
                width="auto"
                showBorders={false}
                loadPanel={{ enabled: membersLoading }}
                rowAlternationEnabled={true}
                columnAutoWidth={true}
                hoverStateEnabled={true}
              >
                <Column caption="" width={60} alignment="center" fixed={true} fixedPosition="left" cellRender={({ data }) => (
                  <button type="button" className="m365-icon-btn m365-icon-btn--danger" title="Remove" onClick={() => removeMember(data)}>
                    <i className="fa-light fa-trash"></i>
                  </button>
                )} />
                <Column dataField="name" caption="Name / Identifier" />
                <Column dataField="email" caption="Email" width={220} />
                <Column dataField="memberId" caption="User Id" width={220} visible={false} />
              </DataGrid>
            </div>
          </div>
        </div>
      </SlidePanel>

      <CreateUserPanel
        visible={showCreateUserPopup}
        onHide={() => setShowCreateUserPopup(false)}
        onSuccess={async () => {
          await handleRefresh(true);
        }}
        roleOptions={createUserRoleOptions}
        departments={[]}
      />
    </div>
  );
};

export default RecipientManagement;