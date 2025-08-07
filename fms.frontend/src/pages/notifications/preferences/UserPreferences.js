import React, { useState, useEffect, useCallback } from "react";
import { Button, LoadPanel } from "devextreme-react";
import { confirm } from "devextreme/ui/dialog";
import notificationPreferencesApi from "../../../api/notificationPreferencesApi";
import NotificationCategoryCard from "./NotificationCategoryCard";
import "./UserPreferences.scss";

const UserPreferences = () => {
  // Get current user ID from localStorage or context
  const getCurrentUserId = () => {
    // This would typically come from your authentication context
    return localStorage.getItem("userId") || "current-user";
  };

  const [userId] = useState(getCurrentUserId());
  const [preferences, setPreferences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  // Default preference template
  const createDefaultPreference = useCallback((category) => ({
    id: null,
    userId: userId,
    notificationCategory: category.id,
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
  const loadData = useCallback(async () => {
    setLoading(true);
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
          existingPreferences.map(pref => [pref.notificationCategory, pref])
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
      setLoading(false);
    }
  }, [createDefaultPreference]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle preference updates
  const handlePreferenceChange = useCallback((categoryId, field, value) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.notificationCategory === categoryId
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
        result.errors.forEach(error => {
          const key = `${preference.notificationCategory}_general`;
          validationErrors[key] = error;
          isValid = false;
        });
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
        ...pref,
        deliveryMethods: Array.isArray(pref.deliveryMethods)
          ? pref.deliveryMethods.join(',')
          : pref.deliveryMethods,
        updatedBy: userId
      }));

      const result = await notificationPreferencesApi.bulkUpdatePreferences(userId, preferencesToSave);

      if (result.isSuccess) {
        setHasChanges(false);
        console.log("Preferences saved successfully");

        // Reload data to get updated IDs for new preferences
        await loadData();
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

  if (loading) {
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
            <i className="fa-light fa-inbox-empty tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
            <p className="tw-text-gray-500">No notification categories available</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map(category => {
              const preference = preferences.find(p => p.notificationCategory === category.id);
              const categoryErrors = Object.keys(errors)
                .filter(key => key.startsWith(`${category.id}_`))
                .map(key => errors[key]);

              return (
                <NotificationCategoryCard
                  key={category.id}
                  category={category}
                  preference={preference}
                  errors={categoryErrors}
                  onChange={handlePreferenceChange}
                />
              );
            })}
          </div>
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
              text="Save Preferences"
              stylingMode="contained"
              type="default"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="save-button"
            >
              {saving && <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>}
              Save Preferences
            </Button>
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
