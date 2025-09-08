import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './DataTableWidget.css';

/**
 * Data Table Widget Component
 * Displays tabular data with sorting, filtering, and pagination
 */
const DataTableWidget = ({
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Default configuration
  const defaultConfig = {
    title: 'Data Table',
    pageSize: 10,
    showPagination: true,
    showSearch: true,
    showRowNumbers: true,
    sortable: true,
    filterable: false,
    striped: true,
    bordered: true,
    compact: false,
    columns: [],
    actions: []
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Process table data and columns
  const { processedData, columns } = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { processedData: [], columns: [] };
    }

    // Auto-detect columns if not configured
    let detectedColumns = mergedConfig.columns;
    if (!detectedColumns.length && data.length > 0) {
      const firstRow = data[0];
      detectedColumns = Object.keys(firstRow).map(key => ({
        field: key,
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        sortable: true,
        width: 'auto',
        type: typeof firstRow[key] === 'number' ? 'number' : 'text'
      }));
    }

    // Filter data based on search term
    let filtered = data;
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort data
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return { processedData: filtered, columns: detectedColumns };
  }, [data, mergedConfig.columns, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / mergedConfig.pageSize);
  const startIndex = (currentPage - 1) * mergedConfig.pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + mergedConfig.pageSize);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
      setCurrentPage(1);
      setSearchTerm('');
      setSortColumn(null);
    } catch (err) {
      setError('Failed to refresh table data');
      console.error('Data table widget refresh error:', err);
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

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'number':
        return parseFloat(value).toLocaleString();
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${parseFloat(value).toFixed(1)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  const getSortIcon = (column) => {
    if (!column.sortable) return null;

    if (sortColumn !== column.field) {
      return <i className="fa-solid fa-refresh" />;
    }

    return (
      <i
        className={`fa-solid ${sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} sort-icon active`}
      />
    );
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="data-table-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading table data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="data-table-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
          <div className="widget-actions">
            <button className="widget-action-btn" onClick={handleRefresh} title="Retry">
              <i className="fa-solid fa-refresh" />
            </button>
          </div>
        </div>
        <div className="widget-content">
          <div className="error-state">
            <i className="fa-solid fa-exclamation-triangle" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-widget">
      <div className="widget-header">
        <h3>{mergedConfig.title}</h3>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            <i className="fa-solid fa-refresh" />
          </button>
          {onConfigure && (
            <button className="widget-action-btn" onClick={onConfigure} title="Configure">
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content">
        {mergedConfig.showSearch && (
          <div className="table-controls">
            <div className="search-box">
              <i className="fa-solid fa-refresh" />
              <input
                type="text"
                placeholder="Search table..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
            {mergedConfig.filterable && (
              <button className="filter-btn" title="Advanced Filter">
                <i className="fa-solid fa-refresh" />
              </button>
            )}
          </div>
        )}

        {!processedData.length ? (
          <div className="no-data-state">
            <i className="fa-solid fa-table" />
            <span>No data available</span>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table
                className={`data-table ${mergedConfig.striped ? 'striped' : ''} ${mergedConfig.bordered ? 'bordered' : ''} ${mergedConfig.compact ? 'compact' : ''}`}
              >
                <thead>
                  <tr>
                    {mergedConfig.showRowNumbers && (
                      <th className="row-number-header">#</th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.field}
                        className={`column-header ${column.sortable ? 'sortable' : ''}`}
                        onClick={() => handleSort(column)}
                        style={{ width: column.width }}
                      >
                        <div className="header-content">
                          <span className="header-title">{column.title}</span>
                          {getSortIcon(column)}
                        </div>
                      </th>
                    ))}
                    {mergedConfig.actions.length > 0 && (
                      <th className="actions-header">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} className="data-row">
                      {mergedConfig.showRowNumbers && (
                        <td className="row-number">
                          {startIndex + index + 1}
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.field} className="data-cell">
                          {formatCellValue(row[column.field], column)}
                        </td>
                      ))}
                      {mergedConfig.actions.length > 0 && (
                        <td className="actions-cell">
                          {mergedConfig.actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              className="action-btn"
                              onClick={() => action.handler(row)}
                              title={action.title}
                            >
                              <i className="fa-solid fa-refresh" />
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
              <div className="pagination">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + mergedConfig.pageSize, processedData.length)} of {processedData.length} entries
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </span>
                  <button
                    className="pagination-btn"
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

        <div className="widget-meta">
          {processedData.length !== data?.length && (
            <span>Filtered: {processedData.length} of {data?.length} records | </span>
          )}
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Rows: {processedData.length}</span>
          <span>Columns: {columns.length}</span>
          <span>Page size: {mergedConfig.pageSize}</span>
        </div>
      )}
    </div>
  );
};

DataTableWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool
};

export default DataTableWidget;

