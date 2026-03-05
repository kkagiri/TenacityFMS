/**
 * File: IssueTicketListPage.js
 * Purpose: Issue ticket list page with filtering, export, and row-level actions
 * Dependencies: React, react-router-dom, DevExtreme DataGrid, issueTrackerService
 * Last Modified: 2026-02-12
 *
 * Key Functions/Components:
 * - IssueTicketListPage: Displays issue tickets and navigates to detail/edit screens
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataGrid, {
  Column,
  Paging,
  Pager,
  HeaderFilter,
  SearchPanel,
  Toolbar,
  Item as ToolbarItem,
  Export,
  Selection,
  LoadPanel,
  Lookup,
  Sorting
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import saveAs from 'file-saver';
import issueTrackerService from '../../../services/issueTrackerService';
import { usePermissions } from '../../../hooks/usePermissions';
import './IssueTicketListPage.scss';

const IssueTicketListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dataGridRef = useRef(null);
  const { hasPermission } = usePermissions();
  const canDeleteIssue = hasPermission('_Delete_Issues');

  // State management
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [closeMonitorPopupVisible, setCloseMonitorPopupVisible] = useState(false);
  const [closeMonitorNotes, setCloseMonitorNotes] = useState('');
  const [closingInProgress, setClosingInProgress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    statuses: [],
    priorities: [],
    tags: [],
    vehicle: '',
    site: '',
    dateFrom: '',
    dateTo: '',
  });

  // External filter from navigation state (e.g. "View Vehicle Issue History" link)
  const externalFilter = location.state?.applyFilters || null;
  const externalFilterLabel = location.state?.filterLabel || '';

  const gridFilterValue = useMemo(() => {
    if (!externalFilter) return undefined;
    const filters = [];
    if (externalFilter.vehicleId) {
      filters.push(['vehicleId', '=', externalFilter.vehicleId]);
    }
    if (externalFilter.siteId) {
      filters.push(['siteId', '=', externalFilter.siteId]);
    }
    if (externalFilter.deviceId) {
      filters.push(['deviceId', '=', externalFilter.deviceId]);
    }
    if (filters.length === 0) return undefined;
    if (filters.length === 1) return filters[0];
    // Combine multiple filters with 'and'
    return filters.reduce((acc, f, i) => i === 0 ? f : [acc, 'and', f]);
  }, [externalFilter]);

  const handleClearExternalFilter = useCallback(() => {
    // Clear the location state and remove filter
    navigate(location.pathname, { replace: true, state: {} });
    // Clear the DataGrid filter
    if (dataGridRef.current?.instance) {
      dataGridRef.current.instance.clearFilter();
    }
  }, [navigate, location.pathname]);

  const humanizeElapsedMinutes = useCallback((minutesValue) => {
    const minutes = Number(minutesValue);
    if (!Number.isFinite(minutes) || minutes < 0) {
      return `${minutesValue} min ago`;
    }

    if (minutes < 60) {
      const roundedMinutes = Math.floor(minutes);
      return `${roundedMinutes} min ago`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
      const roundedHours = Math.floor(hours);
      return `${roundedHours} ${roundedHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    const days = hours / 24;
    if (days < 30) {
      const roundedDays = Math.floor(days);
      return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'} ago`;
    }

    const months = days / 30;
    if (months < 12) {
      const roundedMonths = Math.floor(months);
      return `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'} ago`;
    }

    const years = months / 12;
    const roundedYears = Math.floor(years);
    return `${roundedYears} ${roundedYears === 1 ? 'year' : 'years'} ago`;
  }, []);

  const parseLastSeenDetails = useCallback((description) => {
    if (!description || typeof description !== 'string') {
      return {
        lastSeenAtUtc: null,
        lastSeenMinutesAgo: null,
        lastSeenDisplay: ''
      };
    }

    const match = description.match(
      /Last seen:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})\s*UTC(?:\s*\(([\d.]+)\s*(?:min|mins|minute|minutes)\s+ago\))?/i
    );

    if (!match) {
      return {
        lastSeenAtUtc: null,
        lastSeenMinutesAgo: null,
        lastSeenDisplay: ''
      };
    }

    const utcText = match[1];
    const parsedUtcDate = new Date(`${utcText.replace(' ', 'T')}Z`);
    const isValidDate = !Number.isNaN(parsedUtcDate.getTime());

    let lastSeenMinutesAgo = null;
    if (match[2] !== undefined && match[2] !== null) {
      const parsedMinutes = Number(match[2]);
      if (Number.isFinite(parsedMinutes)) {
        lastSeenMinutesAgo = parsedMinutes;
      }
    }

    if (lastSeenMinutesAgo === null && isValidDate) {
      lastSeenMinutesAgo = Math.max(
        0,
        Math.floor((Date.now() - parsedUtcDate.getTime()) / (1000 * 60))
      );
    }

    return {
      lastSeenAtUtc: isValidDate ? parsedUtcDate : null,
      lastSeenMinutesAgo,
      lastSeenDisplay: lastSeenMinutesAgo !== null ? humanizeElapsedMinutes(lastSeenMinutesAgo) : ''
    };
  }, [humanizeElapsedMinutes]);

  const normalizeIssueRow = useCallback((issue) => {
    const assignedToName =
      issue.assignedToName ||
      issue.assignToUserName ||
      issue.assignTo ||
      '';

    const vehicleName =
      issue.vehicleName ||
      issue.vehicleHyoungNo ||
      issue.vehicleNumber ||
      issue.vehicleNo ||
      '';

    const rawDescription = issue.problemDescription || '';
    const categoryName = Array.isArray(issue.issueCategoryTagNames) && issue.issueCategoryTagNames.length > 0
      ? issue.issueCategoryTagNames.join(', ')
      : (issue.categoryName || '');
    const lastSeenDetails = parseLastSeenDetails(rawDescription);
    const problemDescription = rawDescription.replace(
      /(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\s+ago/gi,
      (match, minuteValue) => humanizeElapsedMinutes(minuteValue)
    );

    return {
      ...issue,
      assignedToName,
      vehicleName,
      categoryName,
      problemDescription,
      lastSeenAtUtc: lastSeenDetails.lastSeenAtUtc,
      lastSeenMinutesAgo: lastSeenDetails.lastSeenMinutesAgo,
      lastSeenDisplay: lastSeenDetails.lastSeenDisplay
    };
  }, [humanizeElapsedMinutes, parseLastSeenDetails]);

  const formatDateTime = (cellData) => {
    if (!cellData.value) return '';
    const date = new Date(cellData.value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Load data on component mount
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [issuesData, categoriesData, prioritiesData, statusesData] = await Promise.all([
        issueTrackerService.getIssues(),
        issueTrackerService.getIssueCategories(),
        issueTrackerService.getIssuePriorities(),
        issueTrackerService.getIssueStatuses()
      ]);

      const normalizedIssues = (issuesData || []).map(normalizeIssueRow);

      setIssues(normalizedIssues);
      setCategories(categoriesData || []);
      setPriorities(prioritiesData || []);
      setStatuses(statusesData || []);
      setTotalCount(normalizedIssues.length || 0);

    } catch (error) {
      console.error('Error loading initial data:', error);
      notify({
        message: 'Failed to load issue data. Please try again.',
        type: 'error',
        displayTime: 4000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } finally {
      setLoading(false);
    }
  }, [normalizeIssueRow]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRefresh = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRowClick = (e) => {
    const issueId = e.data.id;
    navigate(`/issue-tracker/details/${issueId}`);
  };

  const handleCreateNew = () => {
    navigate('/issue-tracker/create');
  };

  // ===== Close & Monitor =====
  const getSelectedIssues = useCallback(() => {
    if (!dataGridRef.current?.instance) return [];
    return dataGridRef.current.instance.getSelectedRowsData();
  }, []);

  const handleOpenCloseMonitor = useCallback(() => {
    const selected = getSelectedIssues();
    if (selected.length === 0) {
      notify({
        message: 'Please select at least one issue to close.',
        type: 'warning',
        displayTime: 3000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      return;
    }
    setCloseMonitorNotes('');
    setCloseMonitorPopupVisible(true);
  }, [getSelectedIssues]);

  const handleConfirmCloseMonitor = useCallback(async () => {
    const selected = getSelectedIssues();
    if (selected.length === 0) return;

    setClosingInProgress(true);
    let successCount = 0;
    let failCount = 0;

    const monitorNote = (closeMonitorNotes || '').trim();
    const notes = monitorNote
      ? `[Close & Monitor] ${monitorNote}. Vehicle will continue to be monitored for fuel activity.`
      : '[Close & Monitor] Issue closed. Vehicle will continue to be monitored — if fuel activity occurs while GPS is offline, a new issue will be created.';

    for (const issue of selected) {
      try {
        await issueTrackerService.closeIssue(issue.id, notes);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to close issue ${issue.id}:`, err);
      }
    }

    setClosingInProgress(false);
    setCloseMonitorPopupVisible(false);

    if (successCount > 0) {
      notify({
        message: `${successCount} issue(s) closed & set for monitoring.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
        type: failCount > 0 ? 'warning' : 'success',
        displayTime: 4000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      loadInitialData();
    }
  }, [getSelectedIssues, closeMonitorNotes, loadInitialData]);

  // ===== Delete Handlers =====
  const handleDeleteSingleIssue = useCallback(async (issueId) => {
    if (!canDeleteIssue || !issueId) return;
    if (!window.confirm(`Delete issue #${issueId}? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      await issueTrackerService.deleteIssue(issueId);
      loadInitialData();
    } catch (err) {
      console.error('Delete issue failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [canDeleteIssue, loadInitialData]);

  const handleBulkDelete = useCallback(async () => {
    if (!canDeleteIssue) return;
    const selected = getSelectedIssues();
    if (selected.length === 0) {
      notify({
        message: 'Please select at least one issue to delete.',
        type: 'warning',
        displayTime: 3000,
        position: { my: 'top center', at: 'top center', of: window, offset: '0 20' }
      });
      return;
    }

    if (!window.confirm(`Delete ${selected.length} selected issue(s)? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      const issueIds = selected.map((i) => i.id);
      await issueTrackerService.bulkDeleteIssues(issueIds);
      loadInitialData();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [canDeleteIssue, getSelectedIssues, loadInitialData]);

  const handleExport = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Issues');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'IssueTracker.xlsx');
      });
    });
    e.cancel = true;
  }, []);

  // Custom cell renderers
  const renderPriorityCell = (cellData) => {
    const priority = cellData.value;
    let colorClass = '';
    let icon = '';

    switch (priority) {
      case 'Critical':
        colorClass = 'tw-text-red-600 dark:tw-text-red-400 tw-font-semibold';
        icon = 'fa-light fa-exclamation-triangle';
        break;
      case 'High':
        colorClass = 'tw-text-orange-600 dark:tw-text-orange-400 tw-font-semibold';
        icon = 'fa-light fa-arrow-up';
        break;
      case 'Medium':
        colorClass = 'tw-text-yellow-600 dark:tw-text-yellow-400 tw-font-medium';
        icon = 'fa-light fa-minus';
        break;
      case 'Low':
        colorClass = 'tw-text-green-600 dark:tw-text-green-400';
        icon = 'fa-light fa-arrow-down';
        break;
      default:
        colorClass = 'tw-text-gray-600 dark:tw-text-gray-400';
        icon = 'fa-light fa-question';
    }

    return (
      <div className={`tw-flex tw-items-center ${colorClass}`}>
        <i className={`${icon} tw-mr-2`}></i>
        {priority || 'Not Set'}
      </div>
    );
  };

  const renderStatusCell = (cellData) => {
    const status = cellData.value;
    let colorClass = '';
    let bgClass = '';

    switch (status) {
      case 'Open':
        colorClass = 'tw-text-blue-700 dark:tw-text-blue-300';
        bgClass = 'tw-bg-blue-100 dark:tw-bg-blue-900/30';
        break;
      case 'In Progress':
        colorClass = 'tw-text-yellow-700 dark:tw-text-yellow-300';
        bgClass = 'tw-bg-yellow-100 dark:tw-bg-yellow-900/30';
        break;
      case 'Resolved':
        colorClass = 'tw-text-green-700 dark:tw-text-green-300';
        bgClass = 'tw-bg-green-100 dark:tw-bg-green-900/30';
        break;
      case 'Closed':
        colorClass = 'tw-text-gray-700 dark:tw-text-gray-300';
        bgClass = 'tw-bg-gray-100 dark:tw-bg-gray-700/40';
        break;
      case 'Complete':
        colorClass = 'tw-text-emerald-700 dark:tw-text-emerald-300';
        bgClass = 'tw-bg-emerald-100 dark:tw-bg-emerald-900/30';
        break;
      default:
        colorClass = 'tw-text-gray-600 dark:tw-text-gray-400';
        bgClass = 'tw-bg-gray-50 dark:tw-bg-gray-700/30';
    }

    return (
      <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-border tw-border-current/20 ${colorClass} ${bgClass}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const renderActionsCell = (cellData) => (
    <div className="tw-flex tw-gap-1">
      <Button
        icon="fa-light fa-eye"
        hint="View Details"
        stylingMode="text"
        onClick={(e) => {
          e.event.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      <Button
        icon="fa-light fa-edit"
        hint="Edit Issue"
        stylingMode="text"
        onClick={(e) => {
          e.event.stopPropagation();
          navigate(`/issue-tracker/details/${cellData.data.id}`);
        }}
      />
      {canDeleteIssue && (
        <Button
          icon="fa-light fa-trash"
          hint="Delete Issue"
          stylingMode="text"
          type="danger"
          disabled={isDeleting}
          onClick={(e) => {
            e.event.stopPropagation();
            handleDeleteSingleIssue(cellData.data.id);
          }}
        />
      )}
    </div>
  );

  const formatDate = (cellData) => {
    if (!cellData.value) return '';
    const date = new Date(cellData.value);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // ── Computed filter values ──────────────────────────────────
  const allTags = useMemo(() => {
    const tagSet = new Set();
    issues.forEach(issue => {
      if (Array.isArray(issue.issueCategoryTagNames) && issue.issueCategoryTagNames.length > 0) {
        issue.issueCategoryTagNames.forEach(t => { if (t) tagSet.add(t.trim()); });
      } else if (issue.categoryName) {
        issue.categoryName.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t));
      }
    });
    return [...tagSet].sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inTitle = (issue.problemTitle || '').toLowerCase().includes(q);
        const inDesc = (issue.problemDescription || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(issue.statusName)) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priorityName)) return false;
      if (filters.tags.length > 0) {
        const issueTags = Array.isArray(issue.issueCategoryTagNames) && issue.issueCategoryTagNames.length > 0
          ? issue.issueCategoryTagNames
          : (issue.categoryName || '').split(',').map(t => t.trim()).filter(Boolean);
        if (!filters.tags.some(t => issueTags.includes(t))) return false;
      }
      if (filters.vehicle && !(issue.vehicleName || '').toLowerCase().includes(filters.vehicle.toLowerCase())) return false;
      if (filters.site && !(issue.siteName || '').toLowerCase().includes(filters.site.toLowerCase())) return false;
      if (filters.dateFrom && issue.openDate && new Date(issue.openDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const toEnd = new Date(filters.dateTo);
        toEnd.setHours(23, 59, 59, 999);
        if (issue.openDate && new Date(issue.openDate) > toEnd) return false;
      }
      return true;
    });
  }, [issues, filters]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.search) c++;
    if (filters.statuses.length > 0) c++;
    if (filters.priorities.length > 0) c++;
    if (filters.tags.length > 0) c++;
    if (filters.vehicle) c++;
    if (filters.site) c++;
    if (filters.dateFrom || filters.dateTo) c++;
    return c;
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleMultiFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ search: '', statuses: [], priorities: [], tags: [], vehicle: '', site: '', dateFrom: '', dateTo: '' });
  }, []);

  if (loading) {
    return (
      <div className="itl__loading">
        <LoadIndicator visible={true} />
        <span>Loading issues…</span>
      </div>
    );
  }

  return (
    <div className="itl">
      {/* ── Command Bar ── */}
      <div className="itl__cmd">
        <div className="itl__cmd-info">
          <nav className="itl__breadcrumb">
            <span className="itl__bc-link" onClick={() => navigate('/issue-tracker')}>Issue Tracker</span>
            <i className="fa-light fa-chevron-right"></i>
            <span>All Issues</span>
          </nav>
          <div className="itl__cmd-title-row">
            <h1 className="itl__page-title">All Issues</h1>
            <span className="itl__count-badge">
              {activeFilterCount > 0 ? `${filteredIssues.length} of ${issues.length}` : issues.length}
            </span>
          </div>
        </div>
        <div className="itl__cmd-actions">
          <button
            className={`itl__cmd-btn${filterPanelOpen ? ' is-active' : ''}`}
            onClick={() => setFilterPanelOpen(p => !p)}
          >
            <i className="fa-light fa-sliders-h"></i>
            Filter
            {activeFilterCount > 0 && <span className="itl__filter-badge">{activeFilterCount}</span>}
          </button>
          <button className="itl__cmd-btn" onClick={handleRefresh}>
            <i className="fa-light fa-rotate"></i>
            Refresh
          </button>
          <button className="itl__cmd-btn itl__cmd-btn--primary" onClick={handleCreateNew}>
            <i className="fa-light fa-plus"></i>
            New Issue
          </button>
        </div>
      </div>

      {/* ── External Filter Banner ── */}
      {externalFilterLabel && (
        <div className="itl__ext-filter">
          <i className="fa-light fa-filter"></i>
          <span>Filtered by: <strong>{externalFilterLabel}</strong></span>
          <button className="itl__ext-filter-clear" onClick={handleClearExternalFilter}>
            <i className="fa-light fa-xmark"></i> Clear
          </button>
        </div>
      )}

      {/* ── Filter Side Panel ── */}
      {filterPanelOpen && <div className="itl__filter-overlay" onClick={() => setFilterPanelOpen(false)} />}
      <div className={`itl__filter-panel${filterPanelOpen ? ' is-open' : ''}`}>
        <div className="itl__fp-header">
          <h3 className="itl__fp-title"><i className="fa-light fa-sliders-h"></i> Filters</h3>
          <button className="itl__fp-close" onClick={() => setFilterPanelOpen(false)}>
            <i className="fa-light fa-xmark"></i>
          </button>
        </div>
        <div className="itl__fp-body">
          {/* Search */}
          <div className="itl__fp-section itl__fp-section--full">
            <label className="itl__fp-label">Search</label>
            <div className="itl__fp-search-wrap">
              <i className="fa-light fa-search"></i>
              <input
                type="text"
                className="itl__fp-search"
                placeholder="Search title or description\u2026"
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
              {filters.search && (
                <button className="itl__fp-clear-x" onClick={() => setFilter('search', '')}>
                  <i className="fa-light fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          <div className="itl__fp-row">
            {/* Status */}
            <div className="itl__fp-section">
              <label className="itl__fp-label">Status</label>
              <div className="itl__fp-pills">
                {statuses.map(s => {
                  const name = s.status || s.name || '';
                  return (
                    <button
                      key={s.id}
                      className={`itl__fp-pill${filters.statuses.includes(name) ? ' is-on' : ''}`}
                      onClick={() => toggleMultiFilter('statuses', name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Priority */}
            <div className="itl__fp-section">
              <label className="itl__fp-label">Priority</label>
              <div className="itl__fp-pills">
                {priorities.map(p => {
                  const name = p.name || '';
                  return (
                    <button
                      key={p.id}
                      className={`itl__fp-pill${filters.priorities.includes(name) ? ' is-on' : ''}`}
                      onClick={() => toggleMultiFilter('priorities', name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="itl__fp-section itl__fp-section--full">
              <label className="itl__fp-label">
                <i className="fa-light fa-tag"></i>
                Tags / Categories
              </label>
              <div className="itl__fp-pills itl__fp-pills--wrap">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`itl__fp-pill itl__fp-pill--tag${filters.tags.includes(tag) ? ' is-on' : ''}`}
                    onClick={() => toggleMultiFilter('tags', tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="itl__fp-row">
            <div className="itl__fp-section">
              <label className="itl__fp-label">Vehicle</label>
              <input type="text" className="itl__fp-input" placeholder="Search vehicle\u2026" value={filters.vehicle} onChange={e => setFilter('vehicle', e.target.value)} />
            </div>
            <div className="itl__fp-section">
              <label className="itl__fp-label">Site</label>
              <input type="text" className="itl__fp-input" placeholder="Search site\u2026" value={filters.site} onChange={e => setFilter('site', e.target.value)} />
            </div>
            <div className="itl__fp-section">
              <label className="itl__fp-label">Open Date From</label>
              <input type="date" className="itl__fp-input" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
            </div>
            <div className="itl__fp-section">
              <label className="itl__fp-label">Open Date To</label>
              <input type="date" className="itl__fp-input" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="itl__fp-footer">
          <span className="itl__fp-results">{filteredIssues.length} of {issues.length} issues</span>
          {activeFilterCount > 0 && (
            <button className="itl__fp-clear-btn" onClick={clearAllFilters}>
              <i className="fa-light fa-xmark"></i> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Pills ── */}
      {activeFilterCount > 0 && (
        <div className="itl__active-filters">
          {filters.statuses.map(s => (
            <span key={s} className="itl__af-pill">Status: {s}<button onClick={() => toggleMultiFilter('statuses', s)}><i className="fa-light fa-xmark"></i></button></span>
          ))}
          {filters.priorities.map(p => (
            <span key={p} className="itl__af-pill">Priority: {p}<button onClick={() => toggleMultiFilter('priorities', p)}><i className="fa-light fa-xmark"></i></button></span>
          ))}
          {filters.tags.map(t => (
            <span key={t} className="itl__af-pill itl__af-pill--tag"><i className="fa-light fa-tag"></i> {t}<button onClick={() => toggleMultiFilter('tags', t)}><i className="fa-light fa-xmark"></i></button></span>
          ))}
          {filters.search && (
            <span className="itl__af-pill">Search: &ldquo;{filters.search}&rdquo;<button onClick={() => setFilter('search', '')}><i className="fa-light fa-xmark"></i></button></span>
          )}
          {filters.vehicle && (
            <span className="itl__af-pill">Vehicle: {filters.vehicle}<button onClick={() => setFilter('vehicle', '')}><i className="fa-light fa-xmark"></i></button></span>
          )}
          {filters.site && (
            <span className="itl__af-pill">Site: {filters.site}<button onClick={() => setFilter('site', '')}><i className="fa-light fa-xmark"></i></button></span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="itl__af-pill">Date: {filters.dateFrom || '\u221e'} \u2013 {filters.dateTo || '\u221e'}<button onClick={() => { setFilter('dateFrom', ''); setFilter('dateTo', ''); }}><i className="fa-light fa-xmark"></i></button></span>
          )}
          <button className="itl__af-clear" onClick={clearAllFilters}>Clear all</button>
        </div>
      )}

      {/* ── Data Grid ── */}
      <div className="itl__grid-wrap">
        <DataGrid
          ref={dataGridRef}
          dataSource={filteredIssues}
          keyExpr="id"
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          onRowClick={handleRowClick}
          onExporting={handleExport}
          defaultFilterValue={gridFilterValue}
          height="calc(100vh - 200px)"
          className="itl__dx-grid"
        >
          <LoadPanel enabled={loading} />
          <Paging enabled={true} defaultPageSize={20} />
          <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} showInfo={true} />
          <HeaderFilter visible={true} />
          <SearchPanel visible={true} placeholder="Search in results\u2026" width={220} />
          <Sorting mode="multiple" />
          <Selection mode="multiple" />
          <Export enabled={true} allowExportSelectedData={true} />
          <Toolbar>
            <ToolbarItem name="searchPanel" location="before" />
            <ToolbarItem name="exportButton" locateInMenu="auto" />
            <ToolbarItem name="columnChooserButton" locateInMenu="auto" />
            <ToolbarItem
              location="before"
              locateInMenu="auto"
              widget="dxButton"
              options={{
                text: 'Close & Monitor',
                icon: 'fa-light fa-eye',
                type: 'normal',
                stylingMode: 'text',
                onClick: handleOpenCloseMonitor,
                hint: 'Close selected issues and continue monitoring vehicles',
                elementAttr: { class: 'itl__toolbar-btn' }
              }}
            />
            {canDeleteIssue && (
              <ToolbarItem
                location="before"
                locateInMenu="auto"
                widget="dxButton"
                options={{
                  text: isDeleting ? 'Deleting...' : 'Delete Selected',
                  icon: 'fa-light fa-trash',
                  type: 'danger',
                  stylingMode: 'text',
                  onClick: handleBulkDelete,
                  disabled: isDeleting,
                  elementAttr: { class: 'itl__toolbar-btn itl__toolbar-btn--danger' }
                }}
              />
            )}
          </Toolbar>

          {/* Columns */}
          <Column
            dataField="id"
            caption="ID"
            width={80}
            defaultSortOrder="desc"
            allowSorting={true}
          />

          <Column
            dataField="problemTitle"
            caption="Title"
            minWidth={200}
            allowSorting={true}
          />

          <Column
            dataField="problemDescription"
            caption="Description"
            minWidth={250}
            allowSorting={false}
          />



          <Column
            dataField="priorityName"
            caption="Priority"
            width={120}
            cellRender={renderPriorityCell}
            allowSorting={true}
          >
            <Lookup
              dataSource={priorities}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="statusName"
            caption="Status"
            width={120}
            cellRender={renderStatusCell}
            allowSorting={true}
          >
            <Lookup
              dataSource={statuses}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="categoryName"
            caption="Tags"
            width={150}
            allowSorting={true}
          >
            <Lookup
              dataSource={categories}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

          <Column
            dataField="assignedToName"
            caption="Assigned To"
            width={150}
            allowSorting={true}
          />

          <Column
            dataField="vehicleName"
            caption="Vehicle"
            width={120}
            allowSorting={true}
          />

          <Column
            dataField="siteName"
            caption="Site"
            width={120}
            allowSorting={true}
          />

          {/* Hidden columns for external filter support */}
          <Column dataField="vehicleId" visible={false} allowFiltering={true} />
          <Column dataField="siteId" visible={false} allowFiltering={true} />
          <Column dataField="deviceId" visible={false} allowFiltering={true} />

          <Column
            dataField="openDate"
            caption="Open Date"
            width={120}
            dataType="date"
            cellRender={formatDate}
            allowSorting={true}
          />

          <Column
            dataField="dueDate"
            caption="Due Date"
            width={120}
            dataType="date"
            cellRender={formatDate}
            allowSorting={true}
          />

          <Column
            caption="Actions"
            width={100}
            allowSorting={false}
            allowFiltering={false}
            cellRender={renderActionsCell}
          />
        </DataGrid>
      </div>

      {/* Close & Monitor Popup */}
      <Popup
        visible={closeMonitorPopupVisible}
        onHiding={() => setCloseMonitorPopupVisible(false)}
        title="Close & Monitor"
        showCloseButton={true}
        width={520}
        height="auto"
        maxHeight={420}
        dragEnabled={false}
      >
        <div className="tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3 tw-mb-4 tw-p-3 tw-bg-blue-50 dark:tw-bg-blue-900/20 tw-rounded-lg tw-border tw-border-blue-200 dark:tw-border-blue-800">
            <i className="fa-light fa-info-circle tw-text-blue-500 dark:tw-text-blue-400 tw-text-lg tw-mt-0.5"></i>
            <p className="tw-text-sm tw-text-blue-800 dark:tw-text-blue-300 tw-m-0">
              Closing these issues will mark them as complete. The system will <strong>continue monitoring</strong> the
              associated vehicles. If a vehicle has fuel activity (refill or pump transaction) while its GPS
              device is offline, a new issue will automatically be created for investigation.
            </p>
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 dark:tw-text-gray-300 tw-mb-1">
              Closing Notes <span className="tw-text-gray-400 dark:tw-text-gray-500">(optional)</span>
            </label>
            <TextArea
              value={closeMonitorNotes}
              onValueChanged={(e) => setCloseMonitorNotes(e.value)}
              placeholder="Add any notes about why these issues are being closed..."
              height={80}
              maxLength={500}
            />
          </div>

          <div className="tw-text-sm tw-text-gray-500 dark:tw-text-gray-400 tw-mb-4">
            <i className="fa-light fa-ticket tw-mr-1"></i>
            {getSelectedIssues().length} issue(s) selected
          </div>

          <div className="tw-flex tw-justify-end tw-gap-3">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setCloseMonitorPopupVisible(false)}
              disabled={closingInProgress}
            />
            <Button
              text={closingInProgress ? 'Closing...' : 'Close & Monitor'}
              type="default"
              stylingMode="contained"
              icon={closingInProgress ? '' : 'fa-light fa-check'}
              onClick={handleConfirmCloseMonitor}
              disabled={closingInProgress}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default IssueTicketListPage;
