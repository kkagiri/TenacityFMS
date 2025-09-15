import React, { useState, useMemo, useCallback } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import CheckBox from 'devextreme-react/check-box';
import Popup from 'devextreme-react/popup';

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

  const renderCard = (widget, index, category) => {
    const isDragging = dragState.widgetId === widget.id;
    return (
      <div
        key={widget.id}
        className={`tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-3 tw-transition-all ${isDragging ? 'tw-opacity-50 tw-ring-2 tw-ring-blue-400' : ''}`}
        draggable
        onDragStart={(e) => startDrag(e, widget, category)}
        onDragOver={onDragOver}
        onDrop={(e) => handleDrop(e, widget, category)}
        onDragEnd={cancelDrag}
      >
        {/* Responsive layout: Stacked on mobile, inline on desktop */}
        <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3">
          {/* Left section: Drag handle + Position + Checkbox + Widget info */}
          <div className="tw-flex tw-items-center tw-gap-3 tw-flex-1 tw-min-w-0">
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-cursor-move tw-text-gray-400 hover:tw-text-gray-600 tw-flex-shrink-0">
              <i className="fa-solid fa-grip-vertical"></i>
              <span className="tw-text-[10px] tw-font-semibold tw-bg-gray-100 tw-text-gray-600 tw-rounded tw-px-1">#{index + 1}</span>
            </div>
            <CheckBox
              value={widget.isVisible}
              onValueChanged={(e) => onToggleVisibility(widget)}
              text=""
              className="tw-flex-shrink-0"
            />
            <div className="tw-flex-1 tw-min-w-0">
              <div className="tw-font-medium tw-text-gray-900 tw-truncate">{widget.customName || widget.template?.displayName}</div>
              <div className="tw-text-xs tw-text-gray-500 tw-flex tw-gap-2">
                <span className="tw-truncate">{widget.metric || 'N/A'}</span>
                <span className="tw-text-gray-300">|</span>
                <span className="tw-truncate">{widget.siteIds?.length > 0 ? `${widget.siteIds.length} site(s)` : 'All sites'}</span>
              </div>
            </div>
          </div>

          {/* Right section: Action buttons - Stack on mobile, inline on desktop */}
          <div className="tw-flex tw-gap-1 tw-flex-shrink-0 tw-justify-start sm:tw-justify-end">
            <Button
              text="Edit"
              icon="fa-solid fa-edit"
              type="normal"
              stylingMode="text"
              height={28}
              onClick={() => onEditWidget(widget)}
              className="tw-text-blue-600 hover:tw-bg-blue-50"
            />
            <Button
              text="Test"
              icon="fa-solid fa-flask"
              type="normal"
              stylingMode="text"
              height={28}
              onClick={() => console.log('Test widget config', widget.id)}
              className="tw-text-indigo-600 hover:tw-bg-indigo-50"
            />
            <Button
              text="Delete"
              icon="fa-solid fa-trash"
              type="normal"
              stylingMode="text"
              height={28}
              onClick={() => handleDeleteClick(widget)}
              className="tw-text-red-600 hover:tw-bg-red-50"
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
    </div>
  );
}
