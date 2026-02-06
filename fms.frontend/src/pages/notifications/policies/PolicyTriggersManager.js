/**
 * File: PolicyTriggersManager.js
 * Purpose: Manage alarm-handler trigger CRUD for a notification policy.
 * Dependencies: react, devextreme notify, alarmHandlerApi, TriggerCreate.
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - PolicyTriggersManager(): Loads, displays, toggles, and deletes policy triggers.
 * - loadHandlers(): Fetches trigger handlers for a policy.
 */

import React, { useCallback, useEffect, useState } from 'react';
import notify from 'devextreme/ui/notify';
import alarmHandlerApi from '../../../dataservice/alarmHandlerApi';
import TriggerCreate from './TriggerCreate';

const parseJsonObject = value => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeHandler = raw => ({
  id: raw?.id ?? raw?.Id ?? null,
  name: raw?.name ?? raw?.Name ?? '',
  type: raw?.type ?? raw?.alarmType ?? raw?.AlarmType ?? '',
  priority: raw?.priority ?? raw?.Priority ?? 'Medium',
  isActive: raw?.isActive ?? raw?.IsActive ?? true,
  config: parseJsonObject(raw?.config ?? raw?.triggerConfig ?? raw?.TriggerConfig),
  cooldownMinutes: raw?.cooldownMinutes ?? raw?.CooldownMinutes ?? 0,
  maxNotificationsPerDay: raw?.maxNotificationsPerDay ?? raw?.MaxNotificationsPerDay ?? 0,
  siteId: raw?.siteId ?? raw?.SiteId ?? null,
  tankId: raw?.tankId ?? raw?.TankId ?? null,
  deviceId: raw?.deviceId ?? raw?.DeviceId ?? null,
  createdAt: raw?.createdAt ?? raw?.CreatedAt ?? null,
  modifiedAt: raw?.modifiedAt ?? raw?.ModifiedAt ?? null
});

const formatScope = handler => {
  const scopeParts = [];

  if (handler.siteId != null) {
    scopeParts.push(`Site ${handler.siteId}`);
  }
  if (handler.tankId != null) {
    scopeParts.push(`Tank ${handler.tankId}`);
  }
  if (handler.deviceId != null) {
    scopeParts.push(`Device ${handler.deviceId}`);
  }

  return scopeParts.length > 0 ? scopeParts.join(' | ') : 'Global';
};

const formatDate = value => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString();
};

const PolicyTriggersManager = ({ policyId, categoryId }) => {
  const [handlers, setHandlers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadHandlers = useCallback(async () => {
    if (!policyId) {
      setHandlers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await alarmHandlerApi.getAlarmHandlers(policyId);
      const rawList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setHandlers(rawList.map(normalizeHandler).filter(item => item.id != null));
    } catch (error) {
      notify(error?.message || 'Failed to load policy triggers', 'error', 3500);
      setHandlers([]);
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    loadHandlers();
  }, [loadHandlers]);

  const deleteHandler = async handlerId => {
    if (!handlerId) {
      return;
    }

    const confirmed = window.confirm('Delete this trigger configuration?');
    if (!confirmed) {
      return;
    }

    setActionId(handlerId);
    try {
      const response = await alarmHandlerApi.deleteAlarmHandler(handlerId);
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to delete trigger');
      }
      notify('Trigger deleted', 'success', 2500);
      await loadHandlers();
    } catch (error) {
      notify(error?.message || 'Failed to delete trigger', 'error', 3500);
    } finally {
      setActionId(null);
    }
  };

  const toggleHandlerActiveState = async handler => {
    if (!handler?.id) {
      return;
    }

    setActionId(handler.id);
    try {
      const payload = {
        isActive: !handler.isActive,
        priority: handler.priority,
        cooldownMinutes: handler.cooldownMinutes,
        maxNotificationsPerDay: handler.maxNotificationsPerDay,
        triggerConfig: handler.config
      };

      const response = await alarmHandlerApi.updateAlarmHandler(handler.id, payload);
      if (response?.success === false) {
        throw new Error(response?.message || 'Failed to update trigger');
      }

      notify(`Trigger ${payload.isActive ? 'enabled' : 'disabled'}`, 'success', 2500);
      await loadHandlers();
    } catch (error) {
      notify(error?.message || 'Failed to update trigger', 'error', 3500);
    } finally {
      setActionId(null);
    }
  };

  if (!policyId) {
    return (
      <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-gray-300 tw-bg-gray-50 tw-p-5 tw-text-sm tw-text-gray-600">
        Save the policy first, then add trigger rules.
      </div>
    );
  }

  return (
    <div className="tw-space-y-5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Policy Triggers</h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Trigger rules map alarm types to this policy and control cooldown, limits, and scope.
          </p>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-text-xs tw-font-medium tw-px-3 tw-py-1">
            {handlers.length} configured
          </span>
          <button
            type="button"
            className="tw-inline-flex tw-items-center tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 tw-text-sm tw-px-3 tw-py-1.5 hover:tw-bg-gray-50"
            disabled={loading}
            onClick={loadHandlers}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <TriggerCreate policyId={policyId} categoryId={categoryId} onCreated={loadHandlers} />

      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden">
        <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-200 tw-bg-gray-50">
          <h4 className="tw-font-medium tw-text-gray-800">Configured Triggers</h4>
        </div>

        {loading && (
          <div className="tw-p-4 tw-text-sm tw-text-gray-600">Loading triggers...</div>
        )}

        {!loading && handlers.length === 0 && (
          <div className="tw-p-4 tw-text-sm tw-text-gray-600">
            No trigger handlers configured for this policy yet.
          </div>
        )}

        {!loading && handlers.length > 0 && (
          <div className="tw-divide-y tw-divide-gray-200">
            {handlers.map(handler => (
              <div key={handler.id} className="tw-p-4 tw-space-y-3">
                <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                  <div>
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-font-medium tw-text-gray-900">{handler.type || 'UnknownType'}</span>
                      <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 ${
                        handler.isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
                      }`}>
                        {handler.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                      Scope: {formatScope(handler)} | Priority: {handler.priority || 'Medium'}
                    </div>
                  </div>

                  <div className="tw-flex tw-items-center tw-gap-2">
                    <button
                      type="button"
                      className="tw-text-xs tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-text-gray-700 tw-px-2 tw-py-1 hover:tw-bg-gray-50"
                      disabled={actionId === handler.id}
                      onClick={() => toggleHandlerActiveState(handler)}
                    >
                      {actionId === handler.id ? 'Saving...' : handler.isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      type="button"
                      className="tw-text-xs tw-rounded tw-border tw-border-red-300 tw-bg-white tw-text-red-700 tw-px-2 tw-py-1 hover:tw-bg-red-50"
                      disabled={actionId === handler.id}
                      onClick={() => deleteHandler(handler.id)}
                    >
                      {actionId === handler.id ? 'Working...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-2 tw-text-xs tw-text-gray-600">
                  <div>Cooldown: {handler.cooldownMinutes ?? 0} min</div>
                  <div>Max / Day: {handler.maxNotificationsPerDay ?? 0}</div>
                  <div>Created: {formatDate(handler.createdAt)}</div>
                  <div>Modified: {formatDate(handler.modifiedAt)}</div>
                </div>

                <div>
                  <div className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Trigger Config</div>
                  <pre className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded tw-p-2 tw-text-xs tw-text-gray-700 tw-overflow-x-auto">
                    {JSON.stringify(handler.config || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyTriggersManager;
