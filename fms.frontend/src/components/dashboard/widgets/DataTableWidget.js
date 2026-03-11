/**
 * File: DataTableWidget.js
 * Purpose: Renders business-friendly dashboard tables with search, sorting, summary chips, and pagination.
 * Dependencies: React, PropTypes, DataTableWidget.scss
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - normalizeIncomingData(): Normalizes array and object table payloads into a single shape.
 * - normalizeColumn(): Applies business labels, inferred types, and visibility rules to table columns.
 * - DataTableWidget(): Displays compact issue-friendly tables with Fluent-inspired styling.
 */
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './DataTableWidget.scss';

const TECHNICAL_FIELDS = new Set(['rowIndex', 'rowNumber']);

const DEFAULT_CONFIG = {
  title: 'Data Table',
  pageSize: 8,
  showPagination: true,
  showSearch: true,
  showRowNumbers: false,
  columns: [],
  actions: []
};

const prettifyFieldName = (field) => {
  if (!field) {
    return '';
  }

  return field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const inferColumnType = (value) => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'datetime';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  }

  if (value instanceof Date) return 'datetime';
  return 'text';
};

const normalizeIncomingData = (data) => {
  if (Array.isArray(data)) {
    return { rows: data, columns: [], summary: null, total: data.length, lastUpdated: null };
  }

  if (data && typeof data === 'object') {
    return {
      rows: Array.isArray(data.rows) ? data.rows : [],
      columns: Array.isArray(data.columns) ? data.columns : [],
      summary: data.summary || null,
      total: typeof data.total === 'number' ? data.total : null,
      lastUpdated: data.lastUpdated || data.timestamp || data.metadata?.lastUpdated || null
    };
  }

  return { rows: [], columns: [], summary: null, total: 0, lastUpdated: null };
};

const normalizeColumn = (column, sampleRow) => {
  const normalized = typeof column === 'string' ? { field: column } : { ...column };
  const field = normalized.field || normalized.name || normalized.key;
  const sampleValue = field ? sampleRow?.[field] : undefined;

  return {
    field,
    title: normalized.title || normalized.caption || prettifyFieldName(field),
    type: normalized.type || inferColumnType(sampleValue),
    sortable: normalized.sortable !== false,
    hidden: normalized.hidden === true || TECHNICAL_FIELDS.has(field),
    isPrimary: normalized.isPrimary === true,
    width: normalized.width || 'auto'
  };
};

const isDateLikeValue = (value) => value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));

const compareValues = (left, right, type) => {
  if (left === right) return 0;
  if (left === null || left === undefined || left === '') return 1;
  if (right === null || right === undefined || right === '') return -1;
  if (type === 'number') return Number(left) - Number(right);
  if (type === 'date' || type === 'datetime' || isDateLikeValue(left) || isDateLikeValue(right)) {
    return new Date(left).getTime() - new Date(right).getTime();
  }
  if (typeof left === 'boolean' || typeof right === 'boolean') return Number(Boolean(left)) - Number(Boolean(right));
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
};

const getBadgeTone = (field, value) => {
  const normalizedField = (field || '').toLowerCase();
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (normalizedField === 'status') {
    if (normalizedValue.includes('closed')) return 'success';
    if (normalizedValue.includes('progress')) return 'info';
    if (normalizedValue.includes('open')) return 'warning';
  }

  if (normalizedField === 'priority') {
    if (normalizedValue.includes('critical')) return 'critical';
    if (normalizedValue.includes('high')) return 'danger';
    if (normalizedValue.includes('medium')) return 'warning';
    if (normalizedValue.includes('low')) return 'neutral';
  }

  if (normalizedField === 'overdue') {
    return value ? 'danger' : 'success';
  }

  return 'neutral';
};

const formatDateValue = (value, includeTime = false) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return includeTime
    ? parsed.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : parsed.toLocaleDateString([], { dateStyle: 'medium' });
};

const DataTableWidget = ({
  widgetId,
  widget = null,
  config = {},
  data = null,
  onRefresh,
  onConfigChange,
  onConfigure,
  isEditing = false,
  isEditMode = false,
  title,
  hideHeader = false,
  isLoading = false,
  error = null
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedPayload = useMemo(() => normalizeIncomingData(data), [data]);

  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...(widget || {}),
    ...(config || {}),
    title: title || config?.title || widget?.title || widget?.name || DEFAULT_CONFIG.title,
    columns: config?.columns || widget?.columns || DEFAULT_CONFIG.columns,
    actions: config?.actions || DEFAULT_CONFIG.actions
  }), [widget, config, title]);

  const { processedData, columns } = useMemo(() => {
    const rows = normalizedPayload.rows;
    if (!rows.length) return { processedData: [], columns: [] };

    const sampleRow = rows[0] || {};
    let detectedColumns = mergedConfig.columns;
    if (!detectedColumns.length && normalizedPayload.columns.length) detectedColumns = normalizedPayload.columns;
    if (!detectedColumns.length) detectedColumns = Object.keys(sampleRow).map((field) => ({ field }));

    const visibleColumns = detectedColumns
      .map((column) => normalizeColumn(column, sampleRow))
      .filter((column) => column.field && !column.hidden);

    let filtered = rows;
    if (searchTerm) {
      const loweredTerm = searchTerm.toLowerCase();
      filtered = rows.filter((row) =>
        visibleColumns.some((column) => String(row[column.field] ?? '').toLowerCase().includes(loweredTerm))
      );
    }

    if (sortColumn) {
      const activeColumn = visibleColumns.find((column) => column.field === sortColumn);
      filtered = [...filtered].sort((a, b) => {
        const comparison = compareValues(a[sortColumn], b[sortColumn], activeColumn?.type);
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return { processedData: filtered, columns: visibleColumns };
  }, [normalizedPayload, mergedConfig.columns, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / mergedConfig.pageSize));
  const startIndex = (currentPage - 1) * mergedConfig.pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + mergedConfig.pageSize);
  const effectiveError = refreshError || error;
  const showEditingState = isEditing || isEditMode;
  const configureHandler = onConfigure || onConfigChange;

  const summaryEntries = useMemo(() => {
    if (!normalizedPayload.summary || typeof normalizedPayload.summary !== 'object') return [];

    return Object.entries(normalizedPayload.summary)
      .filter(([, value]) => typeof value === 'number')
      .map(([key, value]) => ({ key, label: prettifyFieldName(key), value }))
      .slice(0, 5);
  }, [normalizedPayload.summary]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setRefreshError(null);

    try {
      await onRefresh();
      setCurrentPage(1);
      setSearchTerm('');
      setSortColumn(null);
      setSortDirection('asc');
    } catch (refreshException) {
      setRefreshError('Failed to refresh table data');
      console.error('Data table widget refresh error:', refreshException);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (!column.sortable) return;

    if (sortColumn === column.field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.field);
      setSortDirection('asc');
    }

    setCurrentPage(1);
  };

  const renderCellValue = (value, column) => {
    if (value === null || value === undefined || value === '') return '—';

    switch (column.type) {
      case 'badge':
        return <span className={`data-table-widget__badge data-table-widget__badge--${getBadgeTone(column.field, value)}`}>{String(value)}</span>;
      case 'number':
        return Number(value).toLocaleString();
      case 'date':
        return formatDateValue(value, false);
      case 'datetime':
        return formatDateValue(value, true);
      case 'boolean':
        return <span className={`data-table-widget__badge data-table-widget__badge--${getBadgeTone(column.field, value)}`}>{value ? 'Yes' : 'No'}</span>;
      default:
        return String(value);
    }
  };

  const getSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sortColumn !== column.field) return <i className="fa-light fa-arrow-up-arrow-down" />;
    return <i className={`fa-light ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`} />;
  };

  if ((loading || isLoading) && !normalizedPayload.rows.length) {
    return (
      <div className="data-table-widget">
        {!hideHeader && (
          <div className="data-table-widget__header">
            <div>
              <h3 className="data-table-widget__title">{mergedConfig.title}</h3>
            </div>
          </div>
        )}
        <div className="data-table-widget__content">
          <div className="data-table-widget__empty-state">
            <div className="data-table-widget__loading-spinner" />
            <span>Loading table data…</span>
          </div>
        </div>
      </div>
    );
  }

  if (effectiveError && !normalizedPayload.rows.length) {
    return (
      <div className="data-table-widget">
        {!hideHeader && (
          <div className="data-table-widget__header">
            <h3 className="data-table-widget__title">{mergedConfig.title}</h3>
            <div className="data-table-widget__actions">
              {onRefresh && (
                <button className="data-table-widget__icon-button" onClick={handleRefresh} title="Retry">
                  <i className="fa-light fa-rotate-right" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="data-table-widget__content">
          <div className="data-table-widget__error-state">
            <i className="fa-light fa-circle-exclamation" />
            <span>{typeof effectiveError === 'string' ? effectiveError : effectiveError?.message || 'Unable to load table data.'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-widget" data-widget-id={widgetId}>
      {!hideHeader && (
        <div className="data-table-widget__header">
          <div>
            <h3 className="data-table-widget__title">{mergedConfig.title}</h3>
            <p className="data-table-widget__subtitle">
              {searchTerm
                ? `${processedData.length} matching ${processedData.length === 1 ? 'issue' : 'issues'}`
                : `${normalizedPayload.total ?? processedData.length} issue records in scope`}
            </p>
          </div>
          <div className="data-table-widget__actions">
            {onRefresh && (
              <button
                className="data-table-widget__icon-button"
                onClick={handleRefresh}
                disabled={loading || isLoading}
                title="Refresh"
              >
                <i className={`fa-light fa-rotate-right ${loading || isLoading ? 'fa-spin' : ''}`} />
              </button>
            )}
            {configureHandler && (
              <button className="data-table-widget__icon-button" onClick={configureHandler} title="Configure">
                <i className="fa-light fa-sliders" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="data-table-widget__content">
        <div className="data-table-widget__toolbar">
          {mergedConfig.showSearch && (
            <label className="data-table-widget__search">
              <i className="fa-light fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search issues, sites, priorities…"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="data-table-widget__search-input"
              />
            </label>
          )}

          <div className="data-table-widget__toolbar-meta">
            <span>{processedData.length} shown</span>
            {normalizedPayload.lastUpdated && <span>Updated {formatDateValue(normalizedPayload.lastUpdated, true)}</span>}
          </div>
        </div>

        {summaryEntries.length > 0 && (
          <div className="data-table-widget__summary-chips">
            {summaryEntries.map((item) => (
              <div key={item.key} className="data-table-widget__summary-chip">
                <span className="data-table-widget__summary-label">{item.label}</span>
                <span className="data-table-widget__summary-value">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!processedData.length ? (
          <div className="data-table-widget__empty-state">
            <i className="fa-light fa-table-list" />
            <span>No issue data matched the current filters.</span>
          </div>
        ) : (
          <>
            <div className="data-table-widget__table-wrapper">
              <table className="data-table-widget__table">
                <thead>
                  <tr>
                    {mergedConfig.showRowNumbers && <th className="data-table-widget__row-number-header">#</th>}
                    {columns.map((column) => (
                      <th
                        key={column.field}
                        className={`data-table-widget__column-header ${column.sortable ? 'is-sortable' : ''}`}
                        onClick={() => handleSort(column)}
                        style={{ width: column.width }}
                      >
                        <div className="data-table-widget__header-content">
                          <span>{column.title}</span>
                          {getSortIcon(column)}
                        </div>
                      </th>
                    ))}
                    {mergedConfig.actions.length > 0 && <th className="data-table-widget__actions-header">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={`${row.issueNumber || row.id || index}-${index}`} className="data-table-widget__row">
                      {mergedConfig.showRowNumbers && <td className="data-table-widget__row-number">{startIndex + index + 1}</td>}
                      {columns.map((column) => (
                        <td key={column.field} className={`data-table-widget__cell ${column.isPrimary ? 'is-primary' : ''}`}>
                          {renderCellValue(row[column.field], column)}
                        </td>
                      ))}
                      {mergedConfig.actions.length > 0 && (
                        <td className="data-table-widget__actions-cell">
                          {mergedConfig.actions.map((action, actionIndex) => (
                            <button
                              key={`${action.title || 'action'}-${actionIndex}`}
                              className="data-table-widget__row-action"
                              onClick={() => action.handler?.(row)}
                              title={action.title}
                            >
                              <i className={action.iconClassName || 'fa-light fa-arrow-up-right-from-square'} />
                            </button>
                          ))}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mergedConfig.showPagination && totalPages > 1 && (
              <div className="data-table-widget__pagination">
                <div className="data-table-widget__pagination-info">
                  Showing {startIndex + 1}-{Math.min(startIndex + mergedConfig.pageSize, processedData.length)} of {processedData.length}
                </div>
                <div className="data-table-widget__pagination-controls">
                  <button
                    className="data-table-widget__page-button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="data-table-widget__page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          className={`data-table-widget__page-number ${currentPage === pageNumber ? 'is-active' : ''}`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </span>
                  <button
                    className="data-table-widget__page-button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {effectiveError && normalizedPayload.rows.length > 0 && (
          <div className="data-table-widget__inline-warning">
            <i className="fa-light fa-circle-exclamation" />
            <span>{typeof effectiveError === 'string' ? effectiveError : effectiveError?.message || 'Some table data may be stale.'}</span>
          </div>
        )}

        {showEditingState && (
          <div className="data-table-widget__config-preview">
            <span>Rows: {processedData.length}</span>
            <span>Columns: {columns.length}</span>
            <span>Page size: {mergedConfig.pageSize}</span>
          </div>
        )}
      </div>
    </div>
  );
};

DataTableWidget.propTypes = {
  widgetId: PropTypes.string,
  widget: PropTypes.object,
  config: PropTypes.object,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onRefresh: PropTypes.func,
  onConfigChange: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool,
  isEditMode: PropTypes.bool,
  title: PropTypes.string,
  hideHeader: PropTypes.bool,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};

export default DataTableWidget;

