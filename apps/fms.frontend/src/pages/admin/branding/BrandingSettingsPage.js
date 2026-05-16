/**
 * File:          BrandingSettingsPage.js
 * Purpose:       Client admin settings page for tenant logo and accent colours.
 * Dependencies:  React, Redux, axiosInstance, applyBrandingToCssVars, SCSS
 * Last Modified: 2026-05-16
 *
 * Key Functions:
 * - BrandingSettingsPage(): Loads, previews, validates, and saves tenant branding.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import { usePermissions } from "../../../hooks/usePermissions";
import { SET_TENANT_BRANDING } from "../../../redux/actions/types";
import { applyBrandingToCssVars } from "../../../utils/applyBranding";
import "./BrandingSettingsPage.scss";

const MANAGE_BRANDING = "_Manage_Branding";
const DEFAULT_PRIMARY = "#0078d4";
const DEFAULT_SECONDARY = "#605e5c";

const emptyBranding = {
  logoUrl: "",
  primaryColor: "",
  secondaryColor: "",
};

const toInputValue = (value) => value || "";
const toPayloadValue = (value) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isHexColor = (value) =>
  !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

const isHttpUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toSixDigitHex = (value, fallback) => {
  const candidate = value?.trim() || fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(candidate)) return candidate;
  if (/^#[0-9a-fA-F]{3}$/.test(candidate)) {
    const [, r, g, b] = candidate;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
};

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return data?.message || data?.Message || error?.message || fallback;
};

const normalizeResponse = (response) => {
  const payload = response?.data;
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "Success" in payload || "isSuccess" in payload || "IsSuccess" in payload)
  ) {
    return {
      isSuccess: payload.isSuccess ?? payload.IsSuccess ?? payload.success ?? payload.Success ?? false,
      message: payload.message ?? payload.Message ?? "",
      data: payload.data ?? payload.Data ?? null,
    };
  }

  return { isSuccess: true, message: "", data: payload ?? null };
};

const normalizeBranding = (data = {}) => ({
  logoUrl: data.logoUrl || data.LogoUrl || null,
  primaryColor: data.primaryColor || data.PrimaryColor || null,
  secondaryColor: data.secondaryColor || data.SecondaryColor || null,
});

const getTenantBranding = async () => {
  const response = normalizeResponse(await axiosInstance.get("/v1/tenant/branding"));
  return { ...response, data: normalizeBranding(response.data) };
};

const updateTenantBranding = async (branding) => {
  const response = normalizeResponse(await axiosInstance.patch("/v1/tenant/branding", branding));
  return { ...response, data: normalizeBranding(response.data) };
};

const BrandingSettingsPage = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(MANAGE_BRANDING);
  const currentBranding = useSelector((state) => state.tenantContext?.branding) || emptyBranding;
  const savedBrandingRef = useRef({
    logoUrl: currentBranding.logoUrl || null,
    primaryColor: currentBranding.primaryColor || null,
    secondaryColor: currentBranding.secondaryColor || null,
  });

  const [form, setForm] = useState({
    logoUrl: toInputValue(currentBranding.logoUrl),
    primaryColor: toInputValue(currentBranding.primaryColor),
    secondaryColor: toInputValue(currentBranding.secondaryColor),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);

  const previewBranding = useMemo(
    () => ({
      logoUrl: toPayloadValue(form.logoUrl),
      primaryColor: toPayloadValue(form.primaryColor),
      secondaryColor: toPayloadValue(form.secondaryColor),
    }),
    [form]
  );

  const validationErrors = useMemo(() => {
    const errors = [];
    if (form.logoUrl.trim().length > 512) {
      errors.push("Logo URL cannot exceed 512 characters.");
    }
    if (!isHttpUrl(form.logoUrl.trim())) {
      errors.push("Logo URL must be an absolute http or https URL.");
    }
    if (!isHexColor(form.primaryColor)) {
      errors.push("Primary colour must be a hex value like #0078d4.");
    }
    if (!isHexColor(form.secondaryColor)) {
      errors.push("Secondary colour must be a hex value like #605e5c.");
    }
    return errors;
  }, [form]);

  const applyLoadedBranding = (branding) => {
    const normalized = {
      logoUrl: branding.logoUrl || null,
      primaryColor: branding.primaryColor || null,
      secondaryColor: branding.secondaryColor || null,
    };

    savedBrandingRef.current = normalized;
    setForm({
      logoUrl: toInputValue(normalized.logoUrl),
      primaryColor: toInputValue(normalized.primaryColor),
      secondaryColor: toInputValue(normalized.secondaryColor),
    });
    dispatch({ type: SET_TENANT_BRANDING, payload: normalized });
    applyBrandingToCssVars(normalized);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await getTenantBranding();
        if (mounted && response.isSuccess) {
          applyLoadedBranding(response.data);
        }
      } catch (error) {
        if (mounted) {
          notify(getErrorMessage(error, "Failed to load branding settings."), "error", 3000);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
      applyBrandingToCssVars(savedBrandingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [form.logoUrl]);

  useEffect(() => {
    applyBrandingToCssVars(previewBranding);
  }, [previewBranding]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    const saved = savedBrandingRef.current;
    setForm({
      logoUrl: toInputValue(saved.logoUrl),
      primaryColor: toInputValue(saved.primaryColor),
      secondaryColor: toInputValue(saved.secondaryColor),
    });
    applyBrandingToCssVars(saved);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!canManage || validationErrors.length > 0) return;

    setSaving(true);
    try {
      const response = await updateTenantBranding(previewBranding);
      if (!response.isSuccess) {
        notify(response.message || "Failed to update branding settings.", "error", 3000);
        return;
      }

      applyLoadedBranding(response.data);
      notify("Branding settings updated.", "success", 2500);
    } catch (error) {
      notify(getErrorMessage(error, "Failed to update branding settings."), "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="branding-settings-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-palette m365-page-header__icon" />
          <h2 className="m365-page-header__title">Branding settings</h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--ghost" type="button" onClick={resetForm} disabled={loading || saving}>
            <i className="fa-light fa-arrow-rotate-left" />
            Reset
          </button>
          <button
            className="m365-btn m365-btn--primary"
            type="submit"
            form="branding-settings-form"
            disabled={!canManage || loading || saving || validationErrors.length > 0}
          >
            <i className="fa-light fa-floppy-disk" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {!canManage && (
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-lock m365-info-banner__icon" />
          <span className="m365-info-banner__text">You do not have permission to manage branding.</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{validationErrors[0]}</span>
        </div>
      )}

      <div className="branding-settings-page__layout">
        <section className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-image m365-section-group__icon" />
            <h3 className="m365-section-group__title">Brand assets</h3>
          </div>
          <form id="branding-settings-form" className="m365-section-group__body" onSubmit={save}>
            <label className="m365-field">
              Logo URL
              <input
                className="m365-input"
                value={form.logoUrl}
                onChange={(event) => updateForm("logoUrl", event.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                disabled={!canManage || loading || saving}
              />
            </label>

            <div className="branding-settings-page__colour-grid">
              <label className="m365-field">
                Primary colour
                <span className="branding-settings-page__colour-control">
                  <input
                    className="branding-settings-page__swatch"
                    type="color"
                    value={toSixDigitHex(form.primaryColor, DEFAULT_PRIMARY)}
                    onChange={(event) => updateForm("primaryColor", event.target.value)}
                    disabled={!canManage || loading || saving}
                    aria-label="Primary colour picker"
                  />
                  <input
                    className="m365-input"
                    value={form.primaryColor}
                    onChange={(event) => updateForm("primaryColor", event.target.value)}
                    placeholder={DEFAULT_PRIMARY}
                    disabled={!canManage || loading || saving}
                  />
                </span>
              </label>

              <label className="m365-field">
                Secondary colour
                <span className="branding-settings-page__colour-control">
                  <input
                    className="branding-settings-page__swatch"
                    type="color"
                    value={toSixDigitHex(form.secondaryColor, DEFAULT_SECONDARY)}
                    onChange={(event) => updateForm("secondaryColor", event.target.value)}
                    disabled={!canManage || loading || saving}
                    aria-label="Secondary colour picker"
                  />
                  <input
                    className="m365-input"
                    value={form.secondaryColor}
                    onChange={(event) => updateForm("secondaryColor", event.target.value)}
                    placeholder={DEFAULT_SECONDARY}
                    disabled={!canManage || loading || saving}
                  />
                </span>
              </label>
            </div>
          </form>
        </section>

        <section className="m365-section-group">
          <div className="m365-section-group__header">
            <i className="fa-light fa-display m365-section-group__icon" />
            <h3 className="m365-section-group__title">Preview</h3>
          </div>
          <div className="m365-section-group__body">
            <div className="branding-settings-page__preview">
              <div className="branding-settings-page__preview-topbar">
                <div className="branding-settings-page__preview-logo">
                  {previewBranding.logoUrl && !logoPreviewFailed ? (
                    <img
                      src={previewBranding.logoUrl}
                      alt="Tenant logo preview"
                      onError={() => setLogoPreviewFailed(true)}
                    />
                  ) : (
                    <i className="fa-light fa-gas-pump" />
                  )}
                </div>
                <span className="branding-settings-page__preview-title">Fleet operations</span>
              </div>
              <div className="branding-settings-page__preview-body">
                <button className="branding-settings-page__preview-primary" type="button">
                  Primary action
                </button>
                <span className="branding-settings-page__preview-chip">Secondary accent</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BrandingSettingsPage;
