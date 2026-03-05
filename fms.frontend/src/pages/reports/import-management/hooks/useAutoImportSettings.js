/**
 * File: useAutoImportSettings.js
 * Purpose: Custom hook for managing fuel auto-import settings with per-profile configuration.
 *          Each scan path (profile) has independent schedule, batch, retry, and notification settings.
 * Dependencies: react, importManagementApi
 * Last Modified: 2026-03-03
 *
 * Key Exports:
 * - useAutoImportSettings(): Returns settings, loading, saving, error, profile actions
 */

import { useState, useEffect, useCallback } from "react";
import {
    getAutoImportSettings,
    updateAutoImportSettings,
} from "../../../../api/importManagementApi";

/** Factory to create a blank profile with sensible defaults */
const createEmptyProfile = (id = null) => ({
    id: id || `profile-${Date.now()}`,
    name: "",
    scanPath: "",
    enabled: true,
    intervalMinutes: 0,
    scheduleTime: "",
    batchSize: 50,
    includeRetries: true,
    notificationsEnabled: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
});

const EMPTY_SETTINGS = {
    enabled: true,
    profiles: [],
};

const useAutoImportSettings = () => {
    const [settings, setSettings] = useState(EMPTY_SETTINGS);
    const [draft, setDraft] = useState(EMPTY_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // ── Fetch settings ──
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAutoImportSettings();
            if (response?.isSuccess && response.data) {
                const data = {
                    enabled: response.data.enabled ?? true,
                    profiles: response.data.profiles ?? [],
                };
                setSettings(data);
                setDraft(data);
                setIsDirty(false);
            } else {
                setError(response?.message || "Failed to load settings");
            }
        } catch (err) {
            console.error("Error fetching auto-import settings:", err);
            setError(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // ── Update top-level field (e.g. "enabled") ──
    const updateField = useCallback((field, value) => {
        setDraft((prev) => {
            const updated = { ...prev, [field]: value };
            setIsDirty(true);
            return updated;
        });
        setSaveMessage(null);
    }, []);

    // ── Profile management ──
    const addProfile = useCallback(() => {
        setDraft((prev) => ({
            ...prev,
            profiles: [...prev.profiles, createEmptyProfile()],
        }));
        setIsDirty(true);
        setSaveMessage(null);
    }, []);

    const removeProfile = useCallback((profileId) => {
        setDraft((prev) => ({
            ...prev,
            profiles: prev.profiles.filter((p) => p.id !== profileId),
        }));
        setIsDirty(true);
        setSaveMessage(null);
    }, []);

    const updateProfileField = useCallback((profileId, field, value) => {
        setDraft((prev) => ({
            ...prev,
            profiles: prev.profiles.map((p) =>
                p.id === profileId ? { ...p, [field]: value } : p
            ),
        }));
        setIsDirty(true);
        setSaveMessage(null);
    }, []);

    // ── Save settings ──
    const saveSettings = useCallback(async () => {
        setSaving(true);
        setError(null);
        setSaveMessage(null);
        try {
            // Filter out profiles with empty scan paths
            const payload = {
                ...draft,
                profiles: draft.profiles.filter(
                    (p) => p.scanPath && p.scanPath.trim() !== ""
                ),
            };
            const response = await updateAutoImportSettings(payload);
            if (response?.isSuccess) {
                setSettings(payload);
                setDraft(payload);
                setIsDirty(false);
                setSaveMessage("Settings saved successfully");
                return { success: true };
            }
            setError(response?.message || "Failed to save settings");
            return { success: false, message: response?.message };
        } catch (err) {
            console.error("Error saving auto-import settings:", err);
            setError(err.message || "Network error");
            return { success: false, message: err.message };
        } finally {
            setSaving(false);
        }
    }, [draft]);

    // ── Discard changes ──
    const discardChanges = useCallback(() => {
        setDraft(settings);
        setIsDirty(false);
        setSaveMessage(null);
        setError(null);
    }, [settings]);

    return {
        settings: draft,
        loading,
        saving,
        error,
        saveMessage,
        isDirty,
        updateField,
        addProfile,
        removeProfile,
        updateProfileField,
        saveSettings,
        discardChanges,
        refreshSettings: fetchSettings,
    };
};

export default useAutoImportSettings;
