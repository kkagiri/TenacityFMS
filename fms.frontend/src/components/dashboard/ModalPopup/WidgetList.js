/**
 * File: WidgetList.js
 * Purpose: Render the dashboard widget management list with category grouping, shared-state visibility, and M365-style actions.
 * Dependencies: React, DevExtreme LoadIndicator/Popup/Button, ShareWidgetModal, WidgetList.scss
 * Last Modified: 2026-03-07
 */
import React, { useState, useMemo } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import ShareWidgetModal from './ShareWidgetModal';
import './WidgetList.scss';

export default function WidgetList({
  widgets,
  loading,
  error,
  onEditWidget,
  onDeleteWidget,
  onToggleVisibility,
  onReorder,
  activeCategory,
  setActiveCategory
}) {
  const [dragState, setDragState] = useState({ widgetId: null, category: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, widget: null });
  const [shareModal, setShareModal] = useState({ visible: false, widget: null });

  const toDisplayText = (value, fallback = '') => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object') {
      if (typeof value.message === 'string' && value.message.trim()) {
        return value.message;
      }

      if (typeof value.displayName === 'string' && value.displayName.trim()) {
        return value.displayName;
      }

      if (typeof value.name === 'string' && value.name.trim()) {
        return value.name;
      }

      if (typeof value.label === 'string' && value.label.trim()) {
        return value.label;
      }

      if (typeof value.value === 'string' && value.value.trim()) {
        return value.value;
      }
    }

    return fallback;
  };

  const formatCategoryLabel = (value = '') => toDisplayText(value).replace(/_/g, ' ');

  const formatWidgetTypeLabel = (value = '') => toDisplayText(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  const formatDataSourceLabel = (value = '') => toDisplayText(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return widgets;
    return widgets.filter(w => (w.template?.category || w.category) === activeCategory);
  }, [widgets, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(w => {
      const cat = w.template?.category || w.category || 'uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(w);
    });
    // Sort each group by position (fallback to id)
    map.forEach((arr, key) => arr.sort((a, b) => (a.settings?.position ?? a.position ?? a.id) - (b.settings?.position ?? b.position ?? b.id)));
    return map;
  }, [filtered]);

  const listSummary = useMemo(() => {
    const sharedWithMeCount = widgets.filter(widget => widget.isShared).length;
    const sharedByMeCount = widgets.filter(widget => !widget.isShared && (widget.sharedWithCount || 0) > 0).length;

    return {
      total: widgets.length,
      sharedWithMeCount,
      sharedByMeCount
    };
  }, [widgets]);

  const startDrag = (e, widget, category) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ widgetId: widget.id, category });
  };

  const onDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, targetWidget, category) => {
    e.preventDefault();
    if (!dragState.widgetId || dragState.category !== category) return; // only within same category
    if (dragState.widgetId === targetWidget.id) return;

    const catWidgets = widgets.filter(w => (w.template?.category || w.category || 'uncategorized') === category);
    // Current ordering
    const ordered = [...catWidgets].sort((a, b) => (a.settings?.position ?? a.position ?? a.id) - (b.settings?.position ?? b.position ?? b.id));
    const draggedIndex = ordered.findIndex(w => w.id === dragState.widgetId);
    const targetIndex = ordered.findIndex(w => w.id === targetWidget.id);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const [dragged] = ordered.splice(draggedIndex, 1);
    ordered.splice(targetIndex, 0, dragged);

    // Reassign sequential positions
    const updated = ordered.map((w, idx) => ({
      ...w,
      position: idx,
      settings: { ...(w.settings || {}), position: idx }
    }));

    onReorder(category, updated);
    setDragState({ widgetId: null, category: null });
  };

  const cancelDrag = () => setDragState({ widgetId: null, category: null });

  const handleDeleteClick = (widget) => {
    setDeleteConfirm({ visible: true, widget });
  };

  const confirmDelete = () => {
    if (deleteConfirm.widget) {
      onDeleteWidget(deleteConfirm.widget.id);
    }
    setDeleteConfirm({ visible: false, widget: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ visible: false, widget: null });
  };

  const handleShareClick = (widget) => {
    setShareModal({ visible: true, widget });
  };

  const closeShareModal = () => {
    setShareModal({ visible: false, widget: null });
  };

  const renderCard = (widget, index, category) => {
    const isDragging = dragState.widgetId === widget.id;
    const isShared = widget.isShared || false;
    const canDelete = widget.canDelete !== false; // default true if not specified
    const canEdit = widget.canEdit !== false;
    const widgetName = toDisplayText(widget.customName)
      || toDisplayText(widget.template?.displayName)
      || 'Untitled widget';
    const metaItems = [
      widget.isCustomWidget ? 'Custom widget' : 'Template widget',
      widget.category ? formatCategoryLabel(widget.category) : null,
      widget.dataSource ? formatDataSourceLabel(widget.dataSource) : null
    ].filter(Boolean);

    const secondaryDetail = isShared
      ? `Shared by ${toDisplayText(widget.sharedFromUserName, 'another user')}${widget.sharedAt ? ` • received ${new Date(widget.sharedAt).toLocaleDateString()}` : ''}`
      : widget.sharedWithCount > 0
        ? `Shared with ${widget.sharedWithCount} user${widget.sharedWithCount === 1 ? '' : 's'}`
        : (widget.visualizationType ? formatWidgetTypeLabel(widget.visualizationType) : '');

    return (
      <div
        className={`widget-list-m365__row ${isDragging ? 'widget-list-m365__row--dragging' : ''}`}
        draggable
        onDragStart={(e) => startDrag(e, widget, category)}
        onDragOver={onDragOver}
        onDrop={(e) => handleDrop(e, widget, category)}
        onDragEnd={cancelDrag}
      >
        <div className="widget-list-m365__main">
          <div className="widget-list-m365__title-row">
            <span className="widget-list-m365__drag" aria-hidden="true">⋮⋮</span>
            <div className="widget-list-m365__name">{widgetName}</div>
          </div>

          <div className="widget-list-m365__meta">
            {metaItems.map(item => (
              <span
                key={`${widget.id}-${item}`}
                className="widget-list-m365__meta-item widget-list-m365__meta-item--soft"
              >
                {item}
              </span>
            ))}
          </div>

          {secondaryDetail && (
            <div className="widget-list-m365__subtext">{secondaryDetail}</div>
          )}
        </div>

        <div className="widget-list-m365__actions">
          <button
            type="button"
            className="widget-list-m365__action"
            onClick={() => onEditWidget(widget)}
            disabled={!canEdit}
          >
            Edit
          </button>

          {!isShared && (
            <button
              type="button"
              className="widget-list-m365__action"
              onClick={() => handleShareClick(widget)}
            >
              {widget.sharedWithCount > 0 ? 'Manage share' : 'Share'}
            </button>
          )}

          <button
            type="button"
            className="widget-list-m365__action widget-list-m365__action--danger"
            onClick={() => handleDeleteClick(widget)}
            disabled={!canDelete}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="widget-list-m365__loading tw-flex tw-items-center tw-justify-center tw-gap-3">
        <LoadIndicator width={32} height={32} />
        <span>Loading widgets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-list-m365__error">
        Error loading widgets: {toDisplayText(error, 'Unknown error')}
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="widget-list-m365__empty tw-text-center">
        <h3 className="widget-list-m365__empty-title">No widgets created yet</h3>
        <p className="widget-list-m365__empty-copy">Use Add Widget to create your first dashboard widget.</p>
      </div>
    );
  }

  return (
    <div className="widget-list-m365 tw-space-y-5">
      <div className="widget-list-m365__overview">
        <span className="widget-list-m365__overview-pill">Total {listSummary.total}</span>
        {listSummary.sharedWithMeCount > 0 && (
          <span className="widget-list-m365__overview-pill">Shared with me {listSummary.sharedWithMeCount}</span>
        )}
        {listSummary.sharedByMeCount > 0 && (
          <span className="widget-list-m365__overview-pill">Shared by me {listSummary.sharedByMeCount}</span>
        )}
      </div>

      {/* Groups */}
      {Array.from(grouped.entries()).map(([cat, list]) => (
        <div key={cat} className="widget-list-m365__group tw-space-y-3">
          <div className="widget-list-m365__group-header">
            <h4 className="widget-list-m365__group-title">{formatCategoryLabel(cat)}</h4>
            <span className="widget-list-m365__group-count">{list.length}</span>
          </div>

          <div className="widget-list-m365__rows">
            {list.map((widget, idx) => renderCard(widget, idx, cat))}
          </div>
        </div>
      ))}

      {/* Delete Confirmation Popup */}
      <Popup
        visible={deleteConfirm.visible}
        onHiding={cancelDelete}
        title="Confirm Delete"
        width={400}
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-5">
          <p className="widget-list-m365__confirm-copy">
            Are you sure you want to delete "{toDisplayText(deleteConfirm.widget?.customName) || toDisplayText(deleteConfirm.widget?.template?.displayName) || 'this widget'}"?
          </p>
          <div className="widget-list-m365__confirm-actions">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              onClick={cancelDelete}
            />
            <Button
              text="Delete"
              type="danger"
              stylingMode="contained"
              onClick={confirmDelete}
            />
          </div>
        </div>
      </Popup>

      {/* Share Widget Modal */}
      {shareModal.visible && shareModal.widget && (
        <ShareWidgetModal
          visible={shareModal.visible}
          onHiding={closeShareModal}
          widgetInstanceId={shareModal.widget.id}
          widgetName={toDisplayText(shareModal.widget.customName) || toDisplayText(shareModal.widget.template?.displayName) || 'Widget'}
        />
      )}
    </div>
  );
}
