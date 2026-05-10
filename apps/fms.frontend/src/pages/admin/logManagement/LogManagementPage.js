/**
 * File: LogManagementPage.js
 * Purpose: Office 365 Admin-style log management page for browsing and downloading system logs.
 * Dependencies: React, logManagementService, LogManagementPage.scss
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - LogManagementPage: Command bar, KPI cards, category tabs, and log file table.
 */
import React, { useState, useEffect, useMemo } from 'react';

import logManagementService from '../../../services/logManagementService';
import './LogManagementPage.scss';

const LogManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState('webclient');
  const [selectedCategory, setSelectedCategory] = useState('app');
  const [logFiles, setLogFiles] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [retention, setRetention] = useState(null);
  const [cleanupSettings, setCleanupSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    retentionDays: 30,
    autoCleanupEnabled: true,
    cleanupHour: 2
  });
  const [alert, setAlert] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: 'modifiedDate', direction: 'desc' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadLogFiles(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    const targetCategories = selectedService === 'pts'
      ? categories.filter((item) => item.name.startsWith('pts-'))
      : categories.filter((item) => !item.name.startsWith('pts-'));

    if (!targetCategories.length) {
      return;
    }

    const existsInService = targetCategories.some((item) => item.name === selectedCategory);
    if (!existsInService) {
      setSelectedCategory(targetCategories[0].name);
    }
  }, [selectedService, categories, selectedCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, statsData, retentionData, cleanupSettingsData] = await Promise.all([
        logManagementService.getLogCategories(),
        logManagementService.getLogStatistics(),
        logManagementService.getLogRetention(),
        logManagementService.getCleanupSettings()
      ]);

      setCategories(categoriesData);
      setStatistics(statsData);
      setRetention(retentionData);
      setCleanupSettings(cleanupSettingsData);
      setSettingsForm({
        retentionDays: cleanupSettingsData?.retentionDays ?? retentionData?.retentionDays ?? 30,
        autoCleanupEnabled: cleanupSettingsData?.autoCleanupEnabled ?? true,
        cleanupHour: cleanupSettingsData?.cleanupHour ?? 2
      });

      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].name);
      }
    } catch (error) {
      console.error('Error loading log management data:', error);
      showAlert('danger', 'Failed to load log management data');
    } finally {
      setLoading(false);
    }
  };

  const loadLogFiles = async (category) => {
    try {
      setLoading(true);
      const files = await logManagementService.getLogFiles(category);
      setLogFiles(files);
    } catch (error) {
      console.error(`Error loading log files for ${category}:`, error);
      showAlert('danger', `Failed to load log files for ${category}`);
      setLogFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (category, fileName) => {
    try {
      await logManagementService.downloadLogFile(category, fileName);
      showAlert('success', `Downloaded ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      showAlert('danger', 'Failed to download log file');
    }
  };

  const handleDownloadAll = async (category) => {
    try {
      await logManagementService.downloadAllLogs(category);
      showAlert('success', `Downloaded all ${category} logs as ZIP`);
    } catch (error) {
      console.error('Error downloading all logs:', error);
      showAlert('danger', 'Failed to download logs');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`This will delete all log files older than ${settingsForm.retentionDays || retention?.retentionDays} days. Continue?`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const result = await logManagementService.triggerLogCleanup();

      if (result.success) {
        showAlert('success', result.message);
        // Reload data
        await loadInitialData();
        if (selectedCategory) {
          await loadLogFiles(selectedCategory);
        }
      } else {
        showAlert('warning', result.message);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      showAlert('danger', 'Failed to cleanup logs');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadInitialData();
    if (selectedCategory) {
      await loadLogFiles(selectedCategory);
    }
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    const retentionDays = Number(settingsForm.retentionDays);
    const cleanupHour = Number(settingsForm.cleanupHour);

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      showAlert('warning', 'Retention days must be between 1 and 365');
      return;
    }

    if (!Number.isInteger(cleanupHour) || cleanupHour < 0 || cleanupHour > 23) {
      showAlert('warning', 'Cleanup hour must be between 0 and 23');
      return;
    }

    try {
      setSettingsSaving(true);
      const updated = await logManagementService.updateCleanupSettings({
        retentionDays,
        autoCleanupEnabled: !!settingsForm.autoCleanupEnabled,
        cleanupHour
      });

      setCleanupSettings(updated);
      setRetention((prev) => ({
        ...prev,
        retentionDays: updated.retentionDays
      }));

      showAlert('success', 'Log cleanup settings saved successfully');
    } catch (error) {
      console.error('Error saving cleanup settings:', error);
      showAlert('danger', 'Failed to save cleanup settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const showAlert = (variant, message) => {
    setAlert({ variant, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getCategoryBadge = (category) => {
    const badges = {
      app: 'primary',
      errors: 'danger',
      audit: 'info',
      startup: 'secondary',
      gps: 'info',
      fuel: 'warning',
      signalr: 'primary',
      issues: 'danger',
      efcore: 'secondary',
      'pts-app': 'primary',
      'pts-errors': 'danger',
      'pts-startup': 'secondary',
      'pts-device-raw': 'warning',
      'pts-commands': 'info',
      'pts-transactions': 'primary',
      'pts-connections': 'secondary'
    };
    return badges[category] || 'secondary';
  };

  const getCategoryLabel = (category) => {
    if (!category) {
      return category;
    }

    if (category.startsWith('pts-')) {
      return category.replace('pts-', '');
    }

    return category;
  };

  const handleSort = (field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }

      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return 'fa-light fa-sort';
    }

    return sortConfig.direction === 'asc'
      ? 'fa-light fa-sort-up'
      : 'fa-light fa-sort-down';
  };

  const sortedLogFiles = useMemo(() => {
    const files = [...logFiles];

    files.sort((left, right) => {
      let result = 0;

      if (sortConfig.field === 'fileName') {
        result = (left.fileName || '').localeCompare(right.fileName || '', undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      } else if (sortConfig.field === 'sizeBytes') {
        result = (left.sizeBytes || 0) - (right.sizeBytes || 0);
      } else if (sortConfig.field === 'modifiedDate') {
        result = new Date(left.modifiedDate).getTime() - new Date(right.modifiedDate).getTime();
      }

      return sortConfig.direction === 'asc' ? result : -result;
    });

    return files;
  }, [logFiles, sortConfig]);

  return (
    <div className="log-management-page m365-logs-page">
      <section className="m365-logs-page__header">
        <div>
          <h2 className="m365-logs-page__title">
            <i className="fa-light fa-folder"></i>
            Log Management
          </h2>
          <p className="m365-logs-page__subtitle">
            Download, view, and manage system log files
          </p>
        </div>
        <div className="m365-logs-page__commands">
          <button
            type="button"
            className="m365-btn m365-btn--secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className={`fa-light fa-arrows-rotate ${loading ? 'spin' : ''}`}></i>
            Refresh
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--danger"
            onClick={handleCleanup}
            disabled={cleanupLoading || !retention}
          >
            {cleanupLoading ? (
              <>
                <span className="m365-inline-spinner"></span>
                Cleaning...
              </>
            ) : (
              <>
                <i className="fa-light fa-trash"></i>
                Run Cleanup
              </>
            )}
          </button>
        </div>
      </section>

      {alert && (
        <div className={`m365-alert m365-alert--${alert.variant}`} role="alert">
          <span>{alert.message}</span>
          <button type="button" className="m365-alert__close" onClick={() => setAlert(null)}>
            <i className="fa-light fa-xmark"></i>
          </button>
        </div>
      )}

      {statistics && (
        <section className="m365-kpi-grid">
          <article className="m365-kpi-card">
            <div className="m365-kpi-card__label">Total Files</div>
            <div className="m365-kpi-card__value">{statistics.totalFiles}</div>
          </article>
          <article className="m365-kpi-card">
            <div className="m365-kpi-card__label">Total Size</div>
            <div className="m365-kpi-card__value">{statistics.totalSizeMB.toFixed(2)} MB</div>
          </article>
          <article className="m365-kpi-card">
            <div className="m365-kpi-card__label">Retention Period</div>
            <div className="m365-kpi-card__value">{retention?.retentionDays || 30} days</div>
          </article>
          <article className="m365-kpi-card">
            <div className="m365-kpi-card__label">Categories</div>
            <div className="m365-kpi-card__value">{categories.length}</div>
          </article>
        </section>
      )}

      <section className="m365-inline-section m365-inline-section--settings">
        <header className="m365-inline-section__header m365-inline-section__header--split">
          <h3>
            <i className="fa-light fa-gear"></i>
            Cleanup Settings
          </h3>
          <button
            type="button"
            className="m365-btn m365-btn--secondary"
            onClick={handleSaveSettings}
            disabled={settingsSaving}
          >
            {settingsSaving ? (
              <>
                <span className="m365-inline-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-light fa-floppy-disk"></i>
                Save Settings
              </>
            )}
          </button>
        </header>
        <div className="m365-inline-section__body m365-inline-section__body--settings">
          <label className="m365-setting-item">
            <span className="m365-setting-item__label">Retention Days</span>
            <input
              type="number"
              min="1"
              max="365"
              value={settingsForm.retentionDays}
              onChange={(event) => handleSettingsChange('retentionDays', event.target.value)}
              className="m365-input"
            />
          </label>

          <label className="m365-setting-item m365-setting-item--checkbox">
            <input
              type="checkbox"
              checked={!!settingsForm.autoCleanupEnabled}
              onChange={(event) => handleSettingsChange('autoCleanupEnabled', event.target.checked)}
            />
            <span className="m365-setting-item__label">Enable Daily Auto Cleanup</span>
          </label>

          <label className="m365-setting-item">
            <span className="m365-setting-item__label">Cleanup Hour (24h)</span>
            <select
              value={settingsForm.cleanupHour}
              onChange={(event) => handleSettingsChange('cleanupHour', event.target.value)}
              className="m365-input"
            >
              {Array.from({ length: 24 }, (_, hour) => (
                <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>
              ))}
            </select>
          </label>

          <div className="m365-setting-note">
            {cleanupSettings?.autoCleanupEnabled && cleanupSettings?.nextScheduledRun
              ? `Next auto cleanup: ${formatDate(cleanupSettings.nextScheduledRun)}`
              : 'Auto cleanup is currently disabled'}
          </div>
        </div>
      </section>

      {statistics && statistics.categories && (
        <section className="m365-inline-section m365-inline-section--storage">
          <header className="m365-inline-section__header">
            <h3>
              <i className="fa-light fa-chart-column"></i>
              Storage by Category
            </h3>
          </header>
          <div className="m365-inline-section__body m365-inline-section__body--storage">
            {statistics.categories.map((cat) => {
              const percent = statistics.totalSizeBytes > 0
                ? (cat.totalSizeBytes / statistics.totalSizeBytes) * 100
                : 0;

              return (
                <div key={cat.category} className="m365-storage-row">
                  <div className="m365-storage-row__meta">
                    <span className={`m365-badge m365-badge--${getCategoryBadge(cat.category)}`}>
                      {cat.category}
                    </span>
                    <span className="m365-storage-row__count">{cat.fileCount} files</span>
                    <span className="m365-storage-row__size">{cat.totalSizeMB.toFixed(2)} MB</span>
                  </div>
                  <div className="m365-progress">
                    <div className={`m365-progress__bar m365-progress__bar--${getCategoryBadge(cat.category)}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="m365-inline-section m365-inline-section--logs">
        <header className="m365-inline-section__header m365-inline-section__header--split">
          <h3>
            <i className="fa-light fa-file-lines"></i>
            Log Files
          </h3>
          {selectedCategory && (
            <button
              type="button"
              className="m365-btn m365-btn--secondary"
              onClick={() => handleDownloadAll(selectedCategory)}
            >
              <i className="fa-light fa-download"></i>
              Download All as ZIP
            </button>
          )}
        </header>

        <div className="m365-inline-section__body">
          <div className="m365-tabs" role="tablist" aria-label="Log categories">
            <button
              type="button"
              className={`m365-tab ${selectedService === 'webclient' ? 'is-active' : ''}`}
              onClick={() => setSelectedService('webclient')}
              role="tab"
              aria-selected={selectedService === 'webclient'}
            >
              <span className="m365-service-label">WebClient</span>
            </button>
            <button
              type="button"
              className={`m365-tab ${selectedService === 'pts' ? 'is-active' : ''}`}
              onClick={() => setSelectedService('pts')}
              role="tab"
              aria-selected={selectedService === 'pts'}
            >
              <span className="m365-service-label">PTS Windows Service</span>
            </button>
          </div>

          <div className="m365-tabs m365-tabs--categories" role="tablist" aria-label="Log categories list">
            {categories
              .filter((cat) => selectedService === 'pts'
                ? cat.name.startsWith('pts-')
                : !cat.name.startsWith('pts-'))
              .map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`m365-tab ${selectedCategory === cat.name ? 'is-active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
                role="tab"
                aria-selected={selectedCategory === cat.name}
              >
                <span className={`m365-badge m365-badge--${getCategoryBadge(cat.name)}`}>{getCategoryLabel(cat.name)}</span>
                <span className="m365-tab__count">({cat.fileCount})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="m365-state-box">
              <span className="m365-spinner"></span>
              <p>Loading log files...</p>
            </div>
          ) : logFiles.length === 0 ? (
            <div className="m365-state-box m365-state-box--empty">
              <i className="fa-light fa-folder-open"></i>
              <p>No log files found for {selectedCategory}</p>
            </div>
          ) : (
            <div className="m365-table-wrap">
              <table className="m365-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="m365-sort-btn" onClick={() => handleSort('fileName')}>
                        File Name
                        <i className={getSortIcon('fileName')}></i>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="m365-sort-btn" onClick={() => handleSort('sizeBytes')}>
                        Size
                        <i className={getSortIcon('sizeBytes')}></i>
                      </button>
                    </th>
                    <th>
                      <button type="button" className="m365-sort-btn" onClick={() => handleSort('modifiedDate')}>
                        Modified
                        <i className={getSortIcon('modifiedDate')}></i>
                      </button>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogFiles.map((file) => (
                    <tr key={file.fileName}>
                      <td className="m365-file-cell">
                        <i className="fa-light fa-file"></i>
                        <span>{file.fileName}</span>
                      </td>
                      <td>{formatFileSize(file.sizeBytes)}</td>
                      <td>{formatDate(file.modifiedDate)}</td>
                      <td>
                        <button
                          type="button"
                          className="m365-btn m365-btn--secondary m365-btn--sm"
                          onClick={() => handleDownloadFile(file.category, file.fileName)}
                        >
                          <i className="fa-light fa-download"></i>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LogManagementPage;
