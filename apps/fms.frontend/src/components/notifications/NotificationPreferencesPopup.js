/**
 * File: NotificationPreferencesPopup.js
 * Purpose: Notification preferences editor rendered in a right-side slide panel
 * Dependencies: react, react-redux, devextreme-react, notificationPreferencesApi, SlidePanel
 * Last Modified: 2026-03-05
 *
 * Key Components:
 * - NotificationPreferencesPopup: Loads, edits, and saves per-category notification preferences
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from 'react-redux';
import { Button, LoadPanel } from "devextreme-react";
import { confirm } from "devextreme/ui/dialog";
import notificationPreferencesApi from "../../dataservice/notificationPreferencesApi";
import notify from 'devextreme/ui/notify';
import SlidePanel from "../ui/SlidePanel";
import "./NotificationPreferencesPopup.scss";

// Hook to detect mobile viewport
const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
};

/**
 * NotificationPreferencesPopup - A popup version of user notification preferences
 * Shown when user clicks the cog icon in the NotificationCenter bell popup
 */
const NotificationPreferencesPopup = ({ visible, onHiding }) => {
  const [preferences, setPreferences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const isMobile = useIsMobile();

  const user = useSelector((state) => state.auth?.user);
  const userId = (user && (user.id || user.Id)) || localStorage.getItem('userId') || '';
  const isMountedRef = useRef(false);

  // Default preference template
  const createDefaultPreference = useCallback((category) => ({
    id: null,
    userId: userId,
    notificationCategoryId: category.id,
    deliveryMethods: ["System"],
    isEnabled: true,
    priority: "Medium",
    quietHoursStart: null,
    quietHoursEnd: null,
    maxNotificationsPerHour: 0,
    maxNotificationsPerDay: 0,
    requireAcknowledgment: false,
    createdBy: userId
  }), [userId]);

  // Load initial data
  const loadData = useCallback(async (opts = { silent: false }) => {
    const { silent } = opts;
    if (!silent) {
      setInitialLoading(true);
    }
    try {
      const [categoriesResult, preferencesResult] = await Promise.all([
        notificationPreferencesApi.getNotificationCategories(),
        notificationPreferencesApi.getCurrentUserPreferences()
      ]);

      if (categoriesResult.isSuccess) {
        setCategories(categoriesResult.data);

        const existingPreferences = preferencesResult.isSuccess ? preferencesResult.data : [];
        const preferencesMap = new Map(
          existingPreferences.map(pref => [pref.notificationCategoryId ?? pref.notificationCategory, {
            ...pref,
            notificationCategoryId: pref.notificationCategoryId ?? pref.notificationCategory
          }])
        );

        const completePreferences = categoriesResult.data.map(category => {
          const existing = preferencesMap.get(category.id);
          if (existing) {
            return {
              ...existing,
              deliveryMethods: typeof existing.deliveryMethods === 'string'
                ? existing.deliveryMethods.split(',').map(m => m.trim()).filter(Boolean)
                : existing.deliveryMethods || ["System"]
            };
          } else {
            return createDefaultPreference(category);
          }
        });

        setPreferences(completePreferences);
      } else {
        console.error("Failed to load categories:", categoriesResult.message);
        setCategories([]);
        setPreferences([]);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      setCategories([]);
      setPreferences([]);
    } finally {
      if (!silent) setInitialLoading(false);
    }
  }, [createDefaultPreference]);

  useEffect(() => {
    isMountedRef.current = true;
    if (visible) {
      loadData();
    }
    return () => { isMountedRef.current = false; };
  }, [visible, loadData]);

  // Handle preference change
  const handlePreferenceChange = useCallback((categoryId, field, value) => {
    setPreferences(prev =>
      prev.map(pref =>
        (pref.notificationCategoryId === categoryId)
          ? { ...pref, [field]: value }
          : pref
      )
    );
    setHasChanges(true);
  }, []);

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const preferencesToSave = preferences.map(pref => ({
        id: pref.id,
        notificationCategoryId: pref.notificationCategoryId,
        deliveryMethods: Array.isArray(pref.deliveryMethods) ? pref.deliveryMethods : (pref.deliveryMethods ? String(pref.deliveryMethods).split(',') : ["System"]),
        isEnabled: pref.isEnabled,
        priority: pref.priority,
        quietHoursStart: pref.quietHoursStart,
        quietHoursEnd: pref.quietHoursEnd,
        maxNotificationsPerHour: pref.maxNotificationsPerHour,
        maxNotificationsPerDay: pref.maxNotificationsPerDay,
        requireAcknowledgment: pref.requireAcknowledgment
      }));

      const effectiveUserId = userId || 'unknown-user';
      const result = await notificationPreferencesApi.bulkUpdatePreferences(effectiveUserId, preferencesToSave);

      if (result.isSuccess) {
        if (!isMountedRef.current) return;
        setHasChanges(false);
        const backendMsg = result?.data?.message || result?.message;
        notify(backendMsg || 'Notification preferences saved', 'success', 3000);
        setTimeout(async () => {
          if (!isMountedRef.current) return;
          await loadData({ silent: true });
        }, 0);
      } else {
        console.error("Failed to save preferences:", result.message);
        notify('Failed to save preferences', 'error', 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      notify('Error saving preferences', 'error', 3000);
    } finally {
      setSaving(false);
    }
  };

  // Reset preferences
  const handleReset = async () => {
    const result = await confirm("Are you sure you want to reset all preferences to default values?", "Reset Preferences");
    if (result) {
      await loadData();
      setHasChanges(false);
    }
  };

  // Delivery method options
  const deliveryMethodOptions = [
    { id: "System", name: "System", icon: "fa-light fa-bell" },
    { id: "Email", name: "Email", icon: "fa-light fa-envelope" },
    { id: "SMS", name: "SMS", icon: "fa-light fa-message-sms" },
    { id: "Push", name: "Push", icon: "fa-light fa-mobile" }
  ];

  // Priority options
  const priorityOptions = [
    { id: "Low", name: "Low", color: "tw-bg-gray-100 tw-text-gray-600" },
    { id: "Medium", name: "Medium", color: "tw-bg-yellow-100 tw-text-yellow-700" },
    { id: "High", name: "High", color: "tw-bg-orange-100 tw-text-orange-700" },
    { id: "Critical", name: "Critical", color: "tw-bg-red-100 tw-text-red-700" }
  ];

  const renderContent = () => {
    if (initialLoading) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
          <LoadPanel visible={true} message="Loading preferences..." />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-64 tw-text-gray-500 dark:tw-text-gray-300">
          <i className="fa-light fa-inbox-empty tw-text-4xl tw-mb-4"></i>
          <p>No notification categories available</p>
        </div>
      );
    }

    return (
      <div className="preferences-popup-content">
        <div className="preferences-table-container">
          {isMobile ? (
            /* Mobile: card layout */
            <div className="preferences-card-list">
              {categories.map(category => {
                const pref = preferences.find(p => p.notificationCategoryId === category.id) || createDefaultPreference(category);
                return (
                  <div key={category.id} className="preferences-card">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className={`${category.iconClass || 'fa-light fa-bell'} tw-text-blue-500`}></i>
                        <span className="tw-font-medium tw-text-sm">{category.name}</span>
                      </div>
                      <label className="tw-flex tw-items-center tw-gap-1.5 tw-cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.isEnabled}
                          onChange={(e) => handlePreferenceChange(category.id, 'isEnabled', e.target.checked)}
                          className="tw-w-4 tw-h-4 tw-cursor-pointer"
                        />
                        <span className="tw-text-xs tw-text-gray-500">Enabled</span>
                      </label>
                    </div>
                    <div className="tw-flex tw-gap-1.5 tw-flex-wrap tw-mb-2">
                      {deliveryMethodOptions.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            const current = pref.deliveryMethods || [];
                            const updated = current.includes(method.id)
                              ? current.filter(m => m !== method.id)
                              : [...current, method.id];
                            handlePreferenceChange(category.id, 'deliveryMethods', updated.length > 0 ? updated : ["System"]);
                          }}
                          className={`tw-px-2 tw-py-1 tw-text-xs tw-rounded tw-border tw-transition-colors ${(pref.deliveryMethods || []).includes(method.id)
                            ? 'tw-bg-blue-100 dark:tw-bg-blue-900/30 tw-border-blue-300 dark:tw-border-blue-700 tw-text-blue-700 dark:tw-text-blue-300'
                            : 'tw-bg-gray-50 dark:tw-bg-gray-800 tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-500 dark:tw-text-gray-300'
                            }`}
                        >
                          <i className={`${method.icon} tw-mr-1`}></i>
                          {method.name}
                        </button>
                      ))}
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <span className="tw-text-xs tw-text-gray-500 dark:tw-text-gray-300">Priority:</span>
                      <select
                        value={pref.priority}
                        onChange={(e) => handlePreferenceChange(category.id, 'priority', e.target.value)}
                        className="tw-px-2 tw-py-1 tw-text-xs tw-rounded tw-border tw-border-gray-300 dark:tw-border-gray-700 tw-bg-white dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-gray-100 tw-flex-1"
                      >
                        {priorityOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: table layout */
            <table className="preferences-table">
              <thead>
                <tr>
                  <th className="tw-text-left tw-w-48">Category</th>
                  <th className="tw-text-center tw-w-20">Enabled</th>
                  <th className="tw-text-left tw-w-40">Delivery Methods</th>
                  <th className="tw-text-left tw-w-28">Priority</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => {
                  const pref = preferences.find(p => p.notificationCategoryId === category.id) || createDefaultPreference(category);
                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <i className={`${category.iconClass || 'fa-light fa-bell'} tw-text-blue-500`}></i>
                          <span className="tw-font-medium">{category.name}</span>
                        </div>
                      </td>
                      <td className="tw-text-center">
                        <input
                          type="checkbox"
                          checked={pref.isEnabled}
                          onChange={(e) => handlePreferenceChange(category.id, 'isEnabled', e.target.checked)}
                          className="tw-w-4 tw-h-4 tw-cursor-pointer"
                        />
                      </td>
                      <td>
                        <div className="tw-flex tw-gap-1 tw-flex-wrap">
                          {deliveryMethodOptions.map(method => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                const current = pref.deliveryMethods || [];
                                const updated = current.includes(method.id)
                                  ? current.filter(m => m !== method.id)
                                  : [...current, method.id];
                                handlePreferenceChange(category.id, 'deliveryMethods', updated.length > 0 ? updated : ["System"]);
                              }}
                              className={`tw-px-2 tw-py-1 tw-text-xs tw-rounded tw-border tw-transition-colors ${(pref.deliveryMethods || []).includes(method.id)
                                ? 'tw-bg-blue-100 dark:tw-bg-blue-900/30 tw-border-blue-300 dark:tw-border-blue-700 tw-text-blue-700 dark:tw-text-blue-300'
                                : 'tw-bg-gray-50 dark:tw-bg-gray-800 tw-border-gray-200 dark:tw-border-gray-700 tw-text-gray-500 dark:tw-text-gray-300 hover:tw-bg-gray-100 dark:hover:tw-bg-gray-700'
                                }`}
                              title={method.name}
                            >
                              <i className={`${method.icon} tw-mr-1`}></i>
                              {method.name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <select
                          value={pref.priority}
                          onChange={(e) => handlePreferenceChange(category.id, 'priority', e.target.value)}
                          className="tw-px-2 tw-py-1 tw-text-sm tw-rounded tw-border tw-border-gray-300 dark:tw-border-gray-700 tw-bg-white dark:tw-bg-gray-900 tw-text-gray-900 dark:tw-text-gray-100"
                        >
                          {priorityOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <SlidePanel
      open={visible}
      onClose={onHiding}
      title="My Notification Preferences"
      width={isMobile ? '100%' : 780}
      panelClassName="notification-preferences-slide-panel"
      headerActions={(
        <>
          <i className="fa-light fa-user-cog notification-preferences-slide-panel__title-icon"></i>
          <Button
            text="Reset"
            stylingMode="outlined"
            type="normal"
            onClick={handleReset}
            disabled={saving}
            elementAttr={{ class: 'notification-preferences-slide-panel__btn notification-preferences-slide-panel__btn--reset' }}
          />
          <Button
            text={saving ? 'Saving...' : 'Save'}
            stylingMode="contained"
            type="default"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            elementAttr={{ class: 'notification-preferences-slide-panel__btn notification-preferences-slide-panel__btn--save' }}
          />
        </>
      )}
    >
      <div className="notification-preferences-panel tw-h-full tw-flex tw-flex-col">
        <div className="tw-flex-1 tw-overflow-auto tw-p-4">
          {renderContent()}
        </div>

        {hasChanges && (
          <div className="notification-preferences-panel__unsaved tw-px-4 tw-py-2 tw-border-t">
            <div className="tw-flex tw-items-center tw-gap-1 tw-text-sm">
              <i className="fa-light fa-circle-info"></i>
              <span>You have unsaved changes</span>
            </div>
          </div>
        )}
      </div>
      <LoadPanel visible={saving} message="Saving preferences..." />
    </SlidePanel>
  );
};

export default NotificationPreferencesPopup;
