import React, { useMemo } from 'react';
import { CheckBox, SelectBox, NumberBox } from 'devextreme-react';
import notificationPreferencesApi from '../../../dataservice/notificationPreferencesApi';

const deliveryMethodsMeta = notificationPreferencesApi.getDeliveryMethods();
const priorityLevels = notificationPreferencesApi.getPriorityLevels();

export default function PreferencesTable({ preferences = [], categories = [], onChange, errors = {} }) {
  // Memoize category lookup map for stability
  const categoryMap = useMemo(() => {
    const m = new Map();
    categories.forEach(c => m.set(c.id, c));
    return m;
  }, [categories]);

  const getCategory = id => categoryMap.get(id);

  const handleDeliveryToggle = (pref, methodId, checked) => {
    const current = Array.isArray(pref.deliveryMethods) ? pref.deliveryMethods : [];
    const updated = checked ? [...new Set([...current, methodId])] : current.filter(m => m !== methodId);
  onChange(pref.notificationCategoryId, 'deliveryMethods', updated);
  };

  return (
    <div className="preferences-table-wrapper">
      <table className="preferences-table">
        <thead>
          <tr>
            <th style={{minWidth:180}}>Category</th>
            <th>Enabled</th>
            <th>Delivery</th>
            <th>Priority</th>
            <th>Quiet Hours</th>
            <th>Limits (Hr/Day)</th>
            <th>Ack</th>
            <th>Errors</th>
          </tr>
        </thead>
        <tbody>
          {preferences.filter(p => p && p.notificationCategoryId !== undefined && p.notificationCategoryId !== null)
            .sort((a,b) => (a.notificationCategoryId > b.notificationCategoryId ? 1 : -1))
            .map(pref => {
            const cat = getCategory(pref.notificationCategoryId) || { name: pref.notificationCategoryId };
            const rowErrors = Object.keys(errors)
              .filter(k => k.startsWith(`${pref.notificationCategoryId}_`))
              .map(k => errors[k]);
            return (
              <tr key={pref.notificationCategoryId} className={!pref.isEnabled ? 'disabled-row' : ''}>
                <td>
                  <div className="cat-name">{cat.name}</div>
                  {cat.description && <div className="cat-desc">{cat.description}</div>}
                </td>
                <td className="center">
                  <span className="dx-wrapper">
                    <CheckBox
                      value={!!pref.isEnabled}
                      onValueChanged={e => onChange(pref.notificationCategoryId, 'isEnabled', e.value)}
                    />
                  </span>
                </td>
                <td>
                  <div className="delivery-method-badges">
                    {deliveryMethodsMeta.map(dm => {
                      const active = pref.deliveryMethods?.includes(dm.id);
                      return (
                        <button
                          key={dm.id}
                          type="button"
                          className={`delivery-badge ${active ? 'active' : ''}`}
                          onClick={() => handleDeliveryToggle(pref, dm.id, !active)}
                          disabled={!pref.isEnabled}
                          title={dm.name}
                        >
                          <i className={`${dm.icon}`}></i> {dm.id}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <span className="dx-wrapper">
                    <SelectBox
                      items={priorityLevels}
                      displayExpr="name"
                      valueExpr="id"
                      value={pref.priority || 'Medium'}
                      onValueChanged={e => onChange(pref.notificationCategoryId, 'priority', e.value)}
                      disabled={!pref.isEnabled}
                    />
                  </span>
                </td>
                <td>
                  <div className="quiet-inline">
                    <input
                      type="time"
                      value={pref.quietHoursStart?.substring(0,5) || ''}
                      onChange={e => onChange(pref.notificationCategoryId, 'quietHoursStart', e.target.value ? `${e.target.value}:00` : null)}
                      disabled={!pref.isEnabled}
                    />
                    <span className="dash">-</span>
                    <input
                      type="time"
                      value={pref.quietHoursEnd?.substring(0,5) || ''}
                      onChange={e => onChange(pref.notificationCategoryId, 'quietHoursEnd', e.target.value ? `${e.target.value}:00` : null)}
                      disabled={!pref.isEnabled}
                    />
                  </div>
                </td>
                <td>
                  <div className="limits-inline">
                    <span className="dx-wrapper">
                      <NumberBox
                        value={pref.maxNotificationsPerHour ?? 0}
                        onValueChanged={e => onChange(pref.notificationCategoryId, 'maxNotificationsPerHour', e.value || 0)}
                        min={0}
                        disabled={!pref.isEnabled}
                        width={70}
                        showSpinButtons
                      />
                    </span>
                    <span className="dx-wrapper">
                      <NumberBox
                        value={pref.maxNotificationsPerDay ?? 0}
                        onValueChanged={e => onChange(pref.notificationCategoryId, 'maxNotificationsPerDay', e.value || 0)}
                        min={0}
                        disabled={!pref.isEnabled}
                        width={70}
                        showSpinButtons
                      />
                    </span>
                  </div>
                </td>
                <td className="center">
                  <span className="dx-wrapper">
                    <CheckBox
                      value={!!pref.requireAcknowledgment}
                      onValueChanged={e => onChange(pref.notificationCategoryId, 'requireAcknowledgment', e.value)}
                      disabled={!pref.isEnabled}
                    />
                  </span>
                </td>
                <td>
                  {rowErrors.length > 0 && (
                    <ul className="row-errors">
                      {rowErrors.map((er,i) => <li key={i}>{er}</li>)}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
          {(!preferences || preferences.length === 0) && (
        <div className="empty-hint">No preferences available.</div>
      )}
    </div>
  );
}
