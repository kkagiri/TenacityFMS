/**
 * File: JsReportTemplateManager.js
 * Purpose: Template management - list, create, edit, delete templates
 * Dependencies: React, DevExtreme, reportingService
 * Last Modified: 2026-01-19
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, Column, Paging, SearchPanel, Toolbar, Item } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Popup } from 'devextreme-react/popup';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import './JsReportTemplateManager.scss';

// Default template for new reports
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <title>{{reportTitle}}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #007bff; margin: 0 0 5px 0; }
        .header .meta { color: #666; font-size: 14px; }
        .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; min-width: 150px; flex: 1; }
        .card h3 { margin: 0; font-size: 14px; opacity: 0.9; }
        .card .value { font-size: 28px; font-weight: bold; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #343a40; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e9ecef; }
        tr:nth-child(even) { background: #f8f9fa; }
        tr:hover { background: #e3f2fd; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{reportTitle}}</h1>
        <div class="meta">
            <span>Generated: {{generatedAt}}</span> |
            <span>By: {{generatedBy}}</span>
        </div>
    </div>

    {{#if summary}}
    <div class="summary-cards">
        <div class="card">
            <h3>Total Records</h3>
            <div class="value">{{summary.totalRecords}}</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);">
            <h3>Total Amount</h3>
            <div class="value">{{summary.currency}}{{summary.totalAmount}}</div>
        </div>
    </div>
    {{/if}}

    {{#if data}}
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {{#each data}}
            <tr>
                <td>{{@index}}</td>
                <td>{{date}}</td>
                <td>{{description}}</td>
                <td>{{amount}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <div class="footer">
        <p>Report ID: {{reportId}} | FMS Reporting System</p>
    </div>
</body>
</html>`;

const JsReportTemplateManager = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTemplateName, setPreviewTemplateName] = useState('');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await reportingService.getJsReportTemplates();
      if (result.success) {
        // Convert to array of objects for DataGrid
        const templateList = (result.data || []).map((name, index) => ({
          id: index + 1,
          name: name,
          type: name.includes('transaction') ? 'Transaction' :
                name.includes('summary') ? 'Summary' :
                name.includes('vehicle') ? 'Vehicle' : 'General'
        }));
        setTemplates(templateList);
      }
    } catch (error) {
      notify({ message: 'Error loading templates', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTemplateName.trim()) {
      notify({ message: 'Please enter a template name', type: 'warning' });
      return;
    }

    // Validate name (alphanumeric, hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(newTemplateName)) {
      notify({ message: 'Template name can only contain letters, numbers, and hyphens', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const result = await reportingService.saveJsReportTemplate(newTemplateName, DEFAULT_TEMPLATE);
      if (result.success) {
        notify({ message: `Template "${newTemplateName}" created`, type: 'success' });
        setShowCreatePopup(false);
        setNewTemplateName('');
        // Navigate to designer
        navigate(`/reports/designer/${newTemplateName}`);
      } else {
        notify({ message: result.error || 'Error creating template', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error creating template', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    setLoading(true);
    try {
      const result = await reportingService.deleteJsReportTemplate(templateToDelete);
      if (result.success) {
        notify({ message: `Template "${templateToDelete}" deleted`, type: 'success' });
        setShowDeletePopup(false);
        setTemplateToDelete(null);
        await loadTemplates();
      } else {
        notify({ message: result.error || 'Error deleting template', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error deleting template', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (templateName) => {
    navigate(`/reports/designer/${templateName}`);
  };

  const handlePreview = async (templateName) => {
    setLoading(true);
    try {
      const result = await reportingService.getJsReportTemplate(templateName);
      if (result.success && result.data) {
        setPreviewContent(result.data.content || '');
        setPreviewTemplateName(templateName);
        setShowPreviewPopup(true);
      } else {
        notify({ message: 'Error loading template content', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error loading template', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (templateName) => {
    const newName = `${templateName}-copy`;

    setLoading(true);
    try {
      // Get existing template content
      const getResult = await reportingService.getJsReportTemplate(templateName);
      if (!getResult.success || !getResult.data) {
        notify({ message: 'Error loading template content', type: 'error' });
        return;
      }

      // Save with new name
      const saveResult = await reportingService.saveJsReportTemplate(newName, getResult.data.content);
      if (saveResult.success) {
        notify({ message: `Template duplicated as "${newName}"`, type: 'success' });
        await loadTemplates();
      } else {
        notify({ message: saveResult.error || 'Error duplicating template', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error duplicating template', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (templateName) => {
    navigate(`/reports/viewer?template=${templateName}`);
  };

  const renderActions = (cellData) => {
    const templateName = cellData.data.name;
    return (
      <div className="action-buttons">
        <Button
          icon="fa-light fa-edit"
          hint="Edit Template"
          onClick={() => handleEdit(templateName)}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-eye"
          hint="Preview Content"
          onClick={() => handlePreview(templateName)}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-play"
          hint="View Report"
          onClick={() => handleViewReport(templateName)}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-copy"
          hint="Duplicate"
          onClick={() => handleDuplicate(templateName)}
          stylingMode="text"
        />
        <Button
          icon="fa-light fa-trash"
          hint="Delete"
          onClick={() => {
            setTemplateToDelete(templateName);
            setShowDeletePopup(true);
          }}
          stylingMode="text"
          type="danger"
        />
      </div>
    );
  };

  return (
    <div className="jsreport-template-manager">
      <LoadPanel visible={loading} />

      {/* Header */}
      <div className="manager-header">
        <div className="header-left">
          <i className="fa-light fa-file-code tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
          <div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Report Templates</h2>
            <p className="tw-text-sm tw-text-gray-500">Manage JsReport Handlebars templates</p>
          </div>
        </div>
        <div className="header-right">
          <Button
            icon="fa-light fa-refresh"
            text="Refresh"
            onClick={loadTemplates}
            stylingMode="text"
          />
          <Button
            icon="fa-light fa-plus"
            text="New Template"
            type="default"
            onClick={() => setShowCreatePopup(true)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="manager-content">
        <DataGrid
          dataSource={templates}
          keyExpr="name"
          showBorders={false}
          showRowLines={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          wordWrapEnabled={true}
          height="100%"
        >
          <SearchPanel visible={true} width={250} placeholder="Search templates..." />
          <Paging defaultPageSize={20} />

          <Toolbar>
            <Item location="before">
              <span className="tw-text-gray-600 tw-font-medium">
                {templates.length} template(s)
              </span>
            </Item>
          </Toolbar>

          <Column
            dataField="name"
            caption="Template Name"
            sortOrder="asc"
            cellRender={(data) => (
              <div className="template-name-cell">
                <i className="fa-light fa-file-code tw-text-blue-500 tw-mr-2"></i>
                <span
                  className="tw-cursor-pointer tw-text-blue-600 hover:tw-underline"
                  onClick={() => handleEdit(data.data.name)}
                >
                  {data.data.name}
                </span>
              </div>
            )}
          />
          <Column
            dataField="type"
            caption="Type"
            width={150}
            cellRender={(data) => (
              <span className={`type-badge type-${data.data.type.toLowerCase()}`}>
                {data.data.type}
              </span>
            )}
          />
          <Column
            caption="Actions"
            width={250}
            cellRender={renderActions}
            alignment="center"
          />
        </DataGrid>
      </div>

      {/* Create Template Popup */}
      <Popup
        visible={showCreatePopup}
        onHiding={() => {
          setShowCreatePopup(false);
          setNewTemplateName('');
        }}
        title="Create New Template"
        width={450}
        height={220}
        showCloseButton={true}
      >
        <div className="create-popup-content">
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Template Name
            </label>
            <TextBox
              value={newTemplateName}
              onValueChanged={(e) => setNewTemplateName(e.value)}
              placeholder="e.g., daily-fuel-report"
              width="100%"
              onEnterKey={handleCreate}
            />
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
            <Button
              text="Cancel"
              onClick={() => setShowCreatePopup(false)}
              stylingMode="text"
            />
            <Button
              text="Create & Edit"
              type="success"
              onClick={handleCreate}
            />
          </div>
        </div>
      </Popup>

      {/* Delete Confirmation Popup */}
      <Popup
        visible={showDeletePopup}
        onHiding={() => {
          setShowDeletePopup(false);
          setTemplateToDelete(null);
        }}
        title="Confirm Delete"
        width={400}
        height={180}
        showCloseButton={true}
      >
        <div className="delete-popup-content">
          <p className="tw-text-gray-700">
            Are you sure you want to delete the template
            <strong className="tw-text-red-600"> "{templateToDelete}"</strong>?
          </p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            This action cannot be undone.
          </p>
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
            <Button
              text="Cancel"
              onClick={() => setShowDeletePopup(false)}
              stylingMode="text"
            />
            <Button
              text="Delete"
              type="danger"
              onClick={handleDelete}
            />
          </div>
        </div>
      </Popup>

      {/* Preview Popup */}
      <Popup
        visible={showPreviewPopup}
        onHiding={() => {
          setShowPreviewPopup(false);
          setPreviewContent('');
        }}
        title={`Template: ${previewTemplateName}`}
        width="80%"
        height="80%"
        showCloseButton={true}
      >
        <div className="preview-popup-content">
          <pre className="template-preview">{previewContent}</pre>
        </div>
      </Popup>
    </div>
  );
};

export default JsReportTemplateManager;
