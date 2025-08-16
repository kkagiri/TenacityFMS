import React, { useEffect, useState } from 'react';
import alarmHandlerApi from '../../../dataservice/alarmHandlerApi';
import notify from 'devextreme/ui/notify';

/**
 * TriggerCreate - Create a category-based trigger (AlarmHandler) for a notification policy
 * Props:
 *   policyId: int (required)
 *   categoryId: int (required)
 *   onCreated: function (optional)
 */
const TriggerCreate = ({ policyId, categoryId, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [handlerTypes, setHandlerTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState({});
  const [cooldownMinutes, setCooldownMinutes] = useState('');
  const [maxPerDay, setMaxPerDay] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [scope, setScope] = useState({ siteId: '', tankId: '', deviceId: '' });

  // Load available handler types/fields for category
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await alarmHandlerApi.getHandlerTypes(categoryId);
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          const mapped = res.data.map(t => ({
            type: t.type || t.Type,
            label: t.label || t.Label,
            description: t.description || t.Description,
            fields: (t.fields || t.Fields || []).map(f => ({
              name: f.name || f.Name,
              label: f.label || f.Label,
              type: (f.fieldType || f.FieldType || 'string').toLowerCase(),
              unit: f.unit || f.Unit,
              required: f.required ?? f.Required ?? false,
              defaultValue: f.defaultValue !== undefined ? f.defaultValue : f.DefaultValue,
              options: f.options || f.Options || []
            }))
          }));
          setHandlerTypes(mapped);
        } else {
          notify('Failed to load trigger metadata', 'error', 4000);
        }
      } catch (e) {
        notify(`Error loading trigger metadata: ${e.message}`, 'error', 4000);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categoryId]);

  // When type changes, set fields
  useEffect(() => {
    const typeObj = handlerTypes.find(t => t.type === selectedType);
    if (!typeObj) {
      setFields([]);
      setForm({});
      return;
    }
    setFields(typeObj.fields);
    // seed defaults
    const defaults = {};
    typeObj.fields.forEach(f => {
      if (f.defaultValue !== undefined && f.defaultValue !== null) {
        defaults[f.name] = f.defaultValue;
      }
    });
    setForm(defaults);
  }, [selectedType, handlerTypes]);

  const handleFieldChange = (name, value, fieldMeta) => {
    let v = value;
    if (fieldMeta?.type === 'number') {
      v = value === '' ? '' : Number(value);
      if (!Number.isFinite(v)) v = '';
    }
    if (fieldMeta?.type === 'boolean') {
      v = !!value;
    }
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const handleCreate = async () => {
    if (!selectedType) {
      notify('Select a trigger type', 'error', 3000);
      return;
    }
    // Validate required fields
    for (const f of fields) {
      const val = form[f.name];
      if (f.required && (val === undefined || val === '' || val === null)) {
        notify(`${f.label} is required`, 'error', 3000);
        return;
      }
      if (f.type === 'number' && val !== '' && val !== undefined && val !== null && !Number.isFinite(Number(val))) {
        notify(`${f.label} must be a valid number`, 'error', 3000);
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        policyId,
        type: selectedType,
        config: form,
        cooldownMinutes: cooldownMinutes === '' ? undefined : Number(cooldownMinutes),
        maxNotificationsPerDay: maxPerDay === '' ? undefined : Number(maxPerDay),
        siteId: scope.siteId ? Number(scope.siteId) : undefined,
        tankId: scope.tankId ? Number(scope.tankId) : undefined,
        deviceId: scope.deviceId ? Number(scope.deviceId) : undefined
      };
      const res = await alarmHandlerApi.createAlarmHandler(payload);
      if (res && res.success !== false) {
        notify('Trigger created', 'success', 3000);
        // reset selections
        setSelectedType('');
        setCooldownMinutes('');
        setMaxPerDay('');
        setScope({ siteId: '', tankId: '', deviceId: '' });
        if (onCreated) onCreated();
      } else {
        throw new Error(res?.message || 'Failed to create trigger');
      }
    } catch (e) {
      notify(`Error creating trigger: ${e.message}`, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trigger-create-form tw-bg-white tw-border tw-rounded tw-p-4 tw-mt-4">
      <h3 className="tw-text-lg tw-font-medium tw-text-gray-800 tw-mb-3">Add Trigger</h3>
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Trigger Type</label>
        <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={selectedType} disabled={loading} onChange={e => setSelectedType(e.target.value)}>
          <option value="">{loading ? 'Loading...' : 'Select type'}</option>
          {handlerTypes.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
        {selectedType && (handlerTypes.find(t => t.type === selectedType)?.description) && (
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">{handlerTypes.find(t => t.type === selectedType)?.description}</p>
        )}
      </div>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
        <div>
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Site Id (scope)</label>
          <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={scope.siteId} onChange={e => setScope(s => ({ ...s, siteId: e.target.value }))} />
        </div>
        <div>
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Tank Id (scope)</label>
          <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={scope.tankId} onChange={e => setScope(s => ({ ...s, tankId: e.target.value }))} />
        </div>
        <div>
          <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Device Id (scope)</label>
          <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={scope.deviceId} onChange={e => setScope(s => ({ ...s, deviceId: e.target.value }))} />
        </div>
      </div>
      {fields.length > 0 && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-4">
          {fields.map(f => {
            const val = form[f.name] ?? (f.type === 'boolean' ? false : '');
            if (f.type === 'boolean') {
              return (
                <div key={f.name} className="tw-flex tw-items-center tw-gap-2">
                  <input
                    type="checkbox"
                    className="tw-h-4 tw-w-4"
                    checked={!!val}
                    onChange={e => handleFieldChange(f.name, e.target.checked, f)}
                  />
                  <label className="tw-text-sm tw-font-medium tw-text-gray-700">{f.label}{f.required ? ' *' : ''}</label>
                </div>
              );
            }
            if (f.type === 'select' && Array.isArray(f.options)) {
              return (
                <div key={f.name}>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">{f.label}{f.required ? ' *' : ''}</label>
                  <select
                    className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                    value={val}
                    onChange={e => handleFieldChange(f.name, e.target.value, f)}
                  >
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
                  </select>
                </div>
              );
            }
            return (
              <div key={f.name}>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">{f.label}{f.required ? ' *' : ''}</label>
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                  value={val}
                  onChange={e => handleFieldChange(f.name, e.target.value, f)}
                  placeholder={f.unit ? `e.g. 10${f.unit}` : ''}
                />
              </div>
            );
          })}
        </div>
      )}
      <div className="tw-mb-4">
        <button type="button" className="tw-text-xs tw-text-blue-600 hover:tw-underline" onClick={() => setAdvancedOpen(o => !o)}>
          {advancedOpen ? 'Hide' : 'Show'} advanced settings
        </button>
        {advancedOpen && (
          <div className="tw-mt-2 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Cooldown (minutes)</label>
              <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" type="number" value={cooldownMinutes} onChange={e => setCooldownMinutes(e.target.value)} />
            </div>
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Max / Day</label>
              <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" type="number" value={maxPerDay} onChange={e => setMaxPerDay(e.target.value)} />
            </div>
          </div>
        )}
      </div>
      <button className="tw-bg-blue-600 tw-text-white tw-rounded tw-px-3 tw-py-1" onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Trigger'}
      </button>
    </div>
  );
};

export default TriggerCreate;
