import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from 'react-redux';
import { Button, LoadPanel } from "devextreme-react";
import { confirm } from "devextreme/ui/dialog";
import notificationPreferencesApi from "../../../dataservice/notificationPreferencesApi";
import notify from 'devextreme/ui/notify';
import PreferencesTable from "./PreferencesTable";
import ErrorBoundary from "./ErrorBoundary";
import "./UserPreferences.scss";

const UserPreferences = () => {
  // Get current user ID from localStorage or context


  const [preferences, setPreferences] = useState([]);
  const [categories, setCategories] = useState([]);
  // Distinguish between initial page load (can show blocking panel) and subsequent silent refreshes
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});
  // NOTE: Previous attempt used a reloading flag to fully unmount/remount the table after save
  // to avoid a DevExtreme disposal race that threw NotFoundError (removeChild). That approach
  // itself can trigger the race when unmounting during synchronous DevExtreme layout work.
  // We now use a lightweight, deferred in-place data refresh instead of hard unmount.
  const user = useSelector((state) => state.auth?.user);

  // Resolve userId from redux user, falling back to localStorage placeholder
  const userId = (user && (user.id || user.Id)) || localStorage.getItem('userId') || '';

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
      // Load categories and user preferences in parallel
      const [categoriesResult, preferencesResult] = await Promise.all([
        notificationPreferencesApi.getNotificationCategories(),
        notificationPreferencesApi.getCurrentUserPreferences()
      ]);

      if (categoriesResult.isSuccess) {
        setCategories(categoriesResult.data);

        // Create preferences map for easier lookup
        const existingPreferences = preferencesResult.isSuccess ? preferencesResult.data : [];
        const preferencesMap = new Map(
          existingPreferences.map(pref => [pref.notificationCategoryId ?? pref.notificationCategory, {
            ...pref,
            notificationCategoryId: pref.notificationCategoryId ?? pref.notificationCategory
          }])
        );

        // Create complete preferences list with defaults for missing categories
        const completePreferences = categoriesResult.data.map(category => {
          const existing = preferencesMap.get(category.id);
          if (existing) {
            // Ensure deliveryMethods is an array
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

  // Track mounted state to avoid setState after unmount
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => { isMountedRef.current = false; };
  }, [loadData]);

  // Handle preference updates
  const handlePreferenceChange = useCallback((categoryId, field, value) => {
    setPreferences(prev =>
      prev.map(pref =>
        (pref.notificationCategoryId === categoryId)
          ? { ...pref, [field]: value }
          : pref
      )
    );
    setHasChanges(true);

    // Clear error for this field if it exists
    if (errors[`${categoryId}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${categoryId}_${field}`];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate all preferences
  const validatePreferences = () => {
    const validationErrors = {};
    let isValid = true;

    preferences.forEach(preference => {
      const result = notificationPreferencesApi.validatePreference(preference);
      if (!result.isValid) {
        // Filter out category required error if category id exists (auto-provisioned)
        const filteredErrors = result.errors.filter(e => !(e.includes('Notification category is required') && (preference.notificationCategoryId ?? preference.notificationCategory)));
        if (filteredErrors.length > 0) {
          filteredErrors.forEach(error => {
            const key = `${preference.notificationCategoryId}_general`;
            validationErrors[key] = error;
            isValid = false;
          });
        }
      }
    });

    setErrors(validationErrors);
    return isValid;
  };

  // Save preferences
  const handleSave = async () => {
    if (!validatePreferences()) {
      return;
    }

    setSaving(true);
    try {
      // Convert deliveryMethods arrays to comma-separated strings for backend
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
        // Try to surface created/updated counts if present in backend message
        notify(backendMsg || 'Notification preferences saved', 'success', 3000);
        console.log("Preferences saved successfully");
        // Defer reload to the next tick so DevExtreme event handlers finish before React diffs
        setTimeout(async () => {
          if (!isMountedRef.current) return;
          await loadData({ silent: true });
        }, 0); // next tick
      } else {
        console.error("Failed to save preferences:", result.message);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
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
      setErrors({});
    }
  };

  if (initialLoading) {
    return (
      <div className="user-preferences-container">
        <LoadPanel visible={true} message="Loading notification preferences..." />
      </div>
    );
  }

  return (
    <div className="user-preferences-container">
      <div className="preferences-header">
        <div className="header-content">
          <h2 className="preferences-title">
            <i className="fa-light fa-user-cog tw-mr-2"></i>
            My Notification Preferences
          </h2>
          <p className="preferences-subtitle">
            Customize how you receive notifications for different categories
          </p>
        </div>
      </div>

      <div className="preferences-content">
        {categories.length === 0 ? (
          <div className="no-categories">
            <i className="fa-light fa-inbox-empty tw-text-4xl tw-text-gray-400 dark:tw-text-gray-500 tw-mb-4"></i>
            <p className="tw-text-gray-500 dark:tw-text-gray-300">No notification categories available</p>
          </div>
        ) : (
          <ErrorBoundary onRetry={loadData}>
            <PreferencesTable
              preferences={preferences}
              categories={categories}
              onChange={handlePreferenceChange}
              errors={errors}
            />
          </ErrorBoundary>
        )}
      </div>

      <div className="preferences-footer">
        <div className="footer-buttons">
          <Button
            text="Reset to Defaults"
            stylingMode="outlined"
            type="normal"
            onClick={handleReset}
            disabled={saving}
            className="reset-button"
          />
          <div className="save-buttons">
            <Button
              text={saving ? 'Saving...' : 'Save Preferences'}
              stylingMode="contained"
              type="default"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="save-button"
            />
          </div>
        </div>

        {hasChanges && (
          <div className="changes-indicator">
            <i className="fa-light fa-circle-info tw-mr-1"></i>
            You have unsaved changes
          </div>
        )}
      </div>

      <LoadPanel visible={saving} message="Saving preferences..." />
    </div>
  );
};

export default UserPreferences;
