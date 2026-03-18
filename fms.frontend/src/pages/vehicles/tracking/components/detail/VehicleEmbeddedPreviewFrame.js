/**
 * File: VehicleEmbeddedPreviewFrame.js
 * Purpose: Shared compact preview shell and grid preset for embedded vehicle application tabs.
 * Dependencies: React, DevExtreme DateBox, DevExtreme DataGrid
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - VehicleEmbeddedPreviewFrame(): Standardized toolbar, filter row, ticker cards, and preview note
 * - VehicleEmbeddedPreviewGrid(): Standardized 5-row preview grid used by tracking detail applications
 */
import React from 'react';
import DateBox from 'devextreme-react/date-box';
import DataGrid, {
  Column,
  LoadPanel,
  Scrolling,
} from 'devextreme-react/data-grid';
import './VehicleEmbeddedPreviewFrame.scss';

export const VehicleEmbeddedPreviewFrame = ({
  actions = [],
  children,
  dateFrom,
  dateTo,
  description,
  onApply,
  onDateFromChange,
  onDateToChange,
  onReset,
  previewNote = 'Showing the latest 5 items in this preview. Open the full vehicle details page for complete history.',
  stats = [],
  title,
}) => (
  <div className="vehicle-embedded-preview">
    <section className="vehicle-embedded-preview__toolbar">
      <div className="vehicle-embedded-preview__toolbar-copy">
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>

      <div className="vehicle-embedded-preview__toolbar-actions">
        {actions.map((action) => (
          <button
            key={`${title}-${action.label}`}
            type="button"
            className={`vehicle-embedded-preview__action${action.variant === 'primary' ? ' vehicle-embedded-preview__action--primary' : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon ? <i className={action.icon}></i> : null}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </section>

    {dateFrom !== undefined ? (
      <section className="vehicle-embedded-preview__filters">
        <label className="vehicle-embedded-preview__field">
          <span>From</span>
          <DateBox
            type="date"
            value={dateFrom}
            displayFormat="dd/MM/yyyy"
            onValueChanged={(event) => onDateFromChange?.(event.value)}
            width={150}
            stylingMode="outlined"
          />
        </label>

        <label className="vehicle-embedded-preview__field">
          <span>To</span>
          <DateBox
            type="date"
            value={dateTo}
            displayFormat="dd/MM/yyyy"
            onValueChanged={(event) => onDateToChange?.(event.value)}
            width={150}
            stylingMode="outlined"
          />
        </label>

        <div className="vehicle-embedded-preview__filter-actions">
          <button type="button" className="vehicle-embedded-preview__action vehicle-embedded-preview__action--primary" onClick={onApply}>
            <i className="fa-light fa-filter"></i>
            <span>Apply</span>
          </button>
          <button type="button" className="vehicle-embedded-preview__action" onClick={onReset}>
            <i className="fa-light fa-rotate-left"></i>
            <span>Reset</span>
          </button>
        </div>
      </section>
    ) : null}

    {stats.length > 0 ? (
      <section className="vehicle-embedded-preview__stats">
        {stats.map((item) => (
          <article key={`${title}-${item.label}`} className="vehicle-embedded-preview__stat">
            <span className="vehicle-embedded-preview__stat-label">{item.label}</span>
            <strong className="vehicle-embedded-preview__stat-value">{item.value}</strong>
            {item.hint ? <span className="vehicle-embedded-preview__stat-hint">{item.hint}</span> : null}
          </article>
        ))}
      </section>
    ) : null}

    <div className="vehicle-embedded-preview__body">{children}</div>
    <div className="vehicle-embedded-preview__note">{previewNote}</div>
  </div>
);

export const VehicleEmbeddedPreviewGrid = ({
  columns = [],
  data = [],
  emptyText = 'No records found for the selected period.',
  keyExpr = 'rowKey',
  loading = false,
  onRowClick,
}) => (
  <div className="vehicle-embedded-preview__grid">
    <DataGrid
      dataSource={data}
      keyExpr={keyExpr}
      showBorders={false}
      showColumnLines={false}
      showRowLines={true}
      hoverStateEnabled={true}
      columnAutoWidth={true}
      noDataText={loading ? 'Loading records...' : emptyText}
      onRowClick={onRowClick}
    >
      <LoadPanel enabled={true} showIndicator={loading} />
      <Scrolling mode="standard" showScrollbar="always" />
      {columns.map((column) => (
        <Column key={column.name || column.dataField || column.caption} {...column} />
      ))}
    </DataGrid>
  </div>
);
