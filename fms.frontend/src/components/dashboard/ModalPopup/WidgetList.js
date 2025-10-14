import React, { useState, useMemo, useCallback } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import CheckBox from 'devextreme-react/check-box';
import Popup from 'devextreme-react/popup';
import ShareWidgetModal from './ShareWidgetModal';

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
    return (
      <div

      >
        {/* Responsive layout: Stacked on mobile, inline on desktop */}
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3">
          {/* Left section: Drag handle + Position + Checkbox + Widget info */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-flex-1 tw-min-w-0">


            <div className="tw-flex-1 tw-min-w-0">
              <div className="tw-font-medium tw-text-gray-900 tw-truncate">{widget.customName || widget.template?.displayName}</div>
              <div className="tw-text-xs tw-text-gray-500 tw-flex tw-gap-2">
              </div>
            </div>
          </div>

          {/* Right section: Action buttons - Stack on mobile, inline on desktop */}
          <div className="tw-flex tw-gap-1 tw-flex-shrink-0 tw-justify-start sm:tw-justify-end">
            {/* Shared indicator */}
            {isShared && (
              <div className="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-text-xs tw-text-blue-700 tw-mr-1">
                <i className="fa-light fa-share-nodes"></i>
                <span>Shared</span>
              </div>
            )}

            <Button
              text="Edit"
              icon="fa-solid fa-edit"
              type="normal"
              stylingMode="text"
              height={28}
              onClick={() => onEditWidget(widget)}
              className="tw-text-blue-600 hover:tw-bg-blue-50"
            />

            {/* Share button - only show for original widgets (not shared) */}
            {!isShared && (
              <Button
                text="Share"
                icon="fa-solid fa-share"
                type="normal"
                stylingMode="text"
                height={28}
                onClick={() => handleShareClick(widget)}
                className="tw-text-green-600 hover:tw-bg-green-50"
                hint="Share this widget with other users"
              />
            )}

            {/* Delete button - disabled for shared widgets */}
            <Button
              text="Delete"
              icon="fa-solid fa-trash"
              type="normal"
              stylingMode="text"
              height={28}
              onClick={() => handleDeleteClick(widget)}
              disabled={!canDelete}
              className={canDelete ? "tw-text-red-600 hover:tw-bg-red-50" : "tw-text-gray-400 tw-cursor-not-allowed"}
              hint={canDelete ? "Delete this widget" : "Cannot delete shared widgets"}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
        <LoadIndicator width={32} height={32} />
        <span className="tw-ml-3 tw-text-gray-600">Loading widgets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-700 tw-p-4 tw-rounded-md">
        <i className="fa-solid fa-exclamation-triangle tw-mr-2"></i>
        Error loading widgets: {error}
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="tw-text-center tw-py-12 tw-bg-gray-50 tw-rounded-lg tw-border-2 tw-border-dashed tw-border-gray-300">
        <i className="fa-solid fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No widgets created yet</h3>
        <p className="tw-text-gray-600 tw-mb-4">Use Add Widget to create your first dashboard widget</p>
      </div>
    );
  }

  return (
    <div className="tw-space-y-6">
      {/* Groups */}
      {Array.from(grouped.entries()).map(([cat, list]) => (
        <div key={cat} className="tw-space-y-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-uppercase">{cat.replace(/_/g,' ')}</h4>
            <span className="tw-text-[10px] tw-bg-gray-100 tw-text-gray-500 tw-rounded-full tw-px-2 tw-py-0.5">{list.length}</span>
          </div>
          <div className="tw-space-y-2">
            {list.map((w, idx) => renderCard(w, idx, cat))}
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
        <div className="tw-p-4">
          <p className="tw-text-gray-700 tw-mb-4">
            Are you sure you want to delete "{deleteConfirm.widget?.customName || deleteConfirm.widget?.template?.displayName}"?
          </p>
          <div className="tw-flex tw-justify-end tw-gap-3">
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
          widgetName={shareModal.widget.customName || shareModal.widget.template?.displayName || 'Widget'}
        />
      )}
    </div>
  );
}
