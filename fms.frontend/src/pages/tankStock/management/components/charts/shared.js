// Shared utilities for chart components

export const parseTimestamp = (item) => new Date(item.timestamp || item.recordedDateTime);

export const groupByTime = (data, mode = 'hourly') => {
  if (mode === 'none') return (data || []).map(d => ({ ...d }));
  const groups = new Map();
  (data || []).forEach(item => {
    const date = parseTimestamp(item);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const h = date.getHours();
    const key = mode === 'hourly' ? `${y}-${m}-${d}-${h}` : `${y}-${m}-${d}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...item, timestamp: date });
  });
  return Array.from(groups.values()).map(items => {
    // sort by time inside the bucket
    items.sort((a, b) => a.timestamp - b.timestamp);
    // filter to valid numeric volumes
    const numericItems = items.filter(i => Number.isFinite(Number(i.newVolume)));
    const vols = numericItems.map(i => Number(i.newVolume));
    if (vols.length === 0) return null;
    const firstValid = numericItems[0];
    const lastValid = numericItems[numericItems.length - 1];
    const bucketDate = items[0].timestamp;
    const bucketTs = mode === 'hourly'
      ? new Date(bucketDate.getFullYear(), bucketDate.getMonth(), bucketDate.getDate(), bucketDate.getHours())
      : new Date(bucketDate.getFullYear(), bucketDate.getMonth(), bucketDate.getDate());
    return {
      ...firstValid,
      timestamp: bucketTs,
      open: Number(firstValid.newVolume),
      high: Math.max(...vols),
      low: Math.min(...vols),
      close: Number(lastValid.newVolume),
      volume: items.reduce((s, i) => s + Math.abs(Number(i.volumeChange) || 0), 0),
      transactions: items.length,
      items
    };
  }).filter(Boolean);
};

export const colorForIndex = (idx, palette) => palette[idx % palette.length];

export const siteColor = (siteId) => colorForIndex(siteId, ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899']);
export const tankColor = (tankId) => colorForIndex(tankId, ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b']);
export const typeColor = (reason) => ({
  0: '#10b981',
  1: '#ef4444',
  2: '#3b82f6',
  3: '#f59e0b',
  4: '#8b5cf6',
  5: '#ec4899',
  6: '#dc2626',
  7: '#059669'
}[reason] || '#6b7280');

export const typeName = (reason) => ({
  0: 'Opening Stock',
  1: 'Closing Stock',
  2: 'Delivery',
  3: 'Transfer In',
  4: 'Transfer Out',
  5: 'Adjustment',
  6: 'Dispensing',
  7: 'Manual Refill'
}[reason] || 'Unknown');
