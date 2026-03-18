/**
 * File: CategoryGroupedWidgetRenderer.utils.js
 * Purpose: Shared grouping, ordering, and display helpers for the real-time dashboard widget renderer.
 * Dependencies: none
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - buildGroupedWidgets(): Groups widgets using the active grouping mode.
 * - getOrderedGroupKeys(): Applies saved group ordering to rendered groups.
 * - parseWidgetFilters(): Extracts compact filter labels from widget configuration.
 */

export const UNGROUPED_WIDGETS_KEY = '__all_widgets__';

export const GROUP_BY_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'widgetType', label: 'Widget type' },
  { value: 'none', label: 'None' }
];

export const SIZE_OPTIONS = [
  { key: 'small', label: '1/4 Width', cols: 3, icon: '▌' },
  { key: 'medium', label: '1/2 Width', cols: 6, icon: '▌▌' },
  { key: 'large', label: '3/4 Width', cols: 9, icon: '▌▌▌' },
  { key: 'full', label: 'Full Width', cols: 12, icon: '▌▌▌▌' }
];

export const getDefaultWidgetHeight = (widget) => {
  const widgetType = (widget?.widgetType || widget?.templateType || widget?.template?.widgetType || '').toLowerCase();
  return (widgetType.includes('big_stat') || widgetType.includes('stat') || widgetType === 'bigstat') ? 2 : 3;
};

const toDisplayLabel = (value) => String(value || '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

export const getWidgetGroupKey = (widget, groupBy = 'category') => {
  if (groupBy === 'none') {
    return UNGROUPED_WIDGETS_KEY;
  }

  if (groupBy === 'widgetType') {
    return widget?.widgetType || widget?.templateType || widget?.template?.widgetType || 'other_widgets';
  }

  return widget?.template?.category || widget?.category || 'uncategorized';
};

export const getGroupDisplayName = (groupKey, groupBy = 'category') => {
  if (groupBy === 'none' || groupKey === UNGROUPED_WIDGETS_KEY) {
    return 'All widgets';
  }

  return toDisplayLabel(groupKey);
};

export const getSavedGroupOrder = (groupBy = 'category', layoutSettings = {}, categoryOrder = []) => {
  if (groupBy === 'category') {
    return Array.isArray(categoryOrder) ? categoryOrder : [];
  }

  const savedGroupOrders = layoutSettings?.groupOrders || {};
  return Array.isArray(savedGroupOrders[groupBy]) ? savedGroupOrders[groupBy] : [];
};

export const getOrderedGroupKeys = (groupedWidgets = {}, activeGroupOrder = []) => {
  const allGroupKeys = Object.keys(groupedWidgets);

  if (allGroupKeys.length === 0) {
    return [];
  }

  if (allGroupKeys.length === 1 && allGroupKeys[0] === UNGROUPED_WIDGETS_KEY) {
    return allGroupKeys;
  }

  if (!Array.isArray(activeGroupOrder) || activeGroupOrder.length === 0) {
    return [...allGroupKeys].sort((left, right) => left.localeCompare(right));
  }

  const orderedGroupKeys = [];
  const remainingGroupKeys = [...allGroupKeys];

  activeGroupOrder.forEach(groupKey => {
    const index = remainingGroupKeys.indexOf(groupKey);
    if (index !== -1) {
      orderedGroupKeys.push(remainingGroupKeys.splice(index, 1)[0]);
    }
  });

  orderedGroupKeys.push(...remainingGroupKeys.sort((left, right) => left.localeCompare(right)));
  return orderedGroupKeys;
};

export const buildGroupedWidgets = (widgets = [], groupBy = 'category', widgetOrder = {}) => {
  const groups = {};

  widgets.forEach(widget => {
    const groupKey = getWidgetGroupKey(widget, groupBy);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(widget);
  });

  Object.keys(groups).forEach(groupKey => {
    const savedOrder = widgetOrder[groupKey];
    if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
      return;
    }

    const orderedWidgets = [];
    const remainingWidgets = [...groups[groupKey]];

    savedOrder.forEach(widgetId => {
      const widgetIndex = remainingWidgets.findIndex(widget => String(widget.instanceId || widget.id) === String(widgetId));
      if (widgetIndex !== -1) {
        orderedWidgets.push(remainingWidgets.splice(widgetIndex, 1)[0]);
      }
    });

    orderedWidgets.push(...remainingWidgets);
    groups[groupKey] = orderedWidgets;
  });

  return groups;
};

export const parseWidgetFilters = (configurationJson, liveData) => {
  try {
    const config = JSON.parse(configurationJson || '{}');
    const filters = [];

    const configDatePreset = (config.settings && config.settings.datePreset) || config.datePreset;
    const period = liveData?.timeRange || config.timeRange || configDatePreset;
    const mode = liveData?.mode || config.mode;

    if (period) {
      filters.push(`Period: ${period}`);
    }

    if (mode) {
      filters.push(`Mode: ${mode}`);
    }

    if (config.visualizationType && config.visualizationType !== 'default') {
      filters.push(`View: ${config.visualizationType}`);
    }

    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value && value !== null && value !== '') {
          filters.push(`${key}: ${value}`);
        }
      });
    }

    const siteIds = config?.settings?.siteIds;
    if (Array.isArray(siteIds)) {
      filters.push(siteIds.length > 0 ? `Sites: ${siteIds.length} selected` : 'Sites: all');
    } else {
      filters.push('Sites: all');
    }

    return filters;
  } catch {
    return [];
  }
};
