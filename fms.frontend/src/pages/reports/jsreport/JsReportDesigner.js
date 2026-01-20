/**
 * File: JsReportDesigner.js
 * Purpose: Monaco Editor-based report template designer
 * Dependencies: React, Monaco Editor, reportingService
 * Last Modified: 2026-01-19
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import './JsReportDesigner.scss';

// Sample data for preview
const SAMPLE_DATA = {
  reportTitle: 'Sample Report',
  generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  generatedBy: 'Admin User',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-19',
  reportId: 'RPT-SAMPLE-001',
  filters: {
    siteName: 'Main Depot',
    tankName: null,
    vehicleName: null,
    fuelGrade: null
  },
  summary: {
    totalTransactions: 25,
    totalVolume: '4,567.50',
    totalAmount: '6,851.25',
    uniqueVehicles: 12,
    avgVolumePerTransaction: '182.70',
    currency: '$'
  },
  transactions: [
    {
      rowNumber: 1,
      dateTime: '2026-01-15 09:15:23',
      dateTimeStart: '2026-01-15 09:12:10',
      ptsName: 'PTS-001',
      pump: 1,
      nozzle: 1,
      transaction: '10045',
      vehicleName: 'Toyota Hilux - Fleet 01',
      vehicleNumberPlate: 'ABC-1234',
      tankName: 'Tank A - Diesel',
      isTransferMode: false,
      fuelGradeName: 'Diesel',
      volume: '85.50',
      price: '1.45',
      amount: '123.98',
      odometer: '45,230',
      employeeName: 'John Smith',
      tag: 'RFID-001'
    },
    {
      rowNumber: 2,
      dateTime: '2026-01-15 10:30:15',
      dateTimeStart: '2026-01-15 10:28:00',
      ptsName: 'PTS-001',
      pump: 2,
      nozzle: 1,
      transaction: '10046',
      vehicleName: 'Ford Ranger - Fleet 02',
      vehicleNumberPlate: 'XYZ-5678',
      tankName: 'Tank B - Petrol',
      isTransferMode: false,
      fuelGradeName: 'Petrol 95',
      volume: '62.30',
      price: '1.65',
      amount: '102.80',
      odometer: '32,150',
      employeeName: 'Jane Doe',
      tag: 'RFID-002'
    }
  ],
  fuelGradeBreakdown: [
    { fuelGradeName: 'Diesel', transactionCount: 18, totalVolume: '3,245.80', totalAmount: '4,706.41', percentage: '71.1' },
    { fuelGradeName: 'Petrol 95', transactionCount: 7, totalVolume: '1,321.70', totalAmount: '2,144.84', percentage: '28.9' }
  ]
};

// Handlebars helpers reference
const HANDLEBARS_HELPERS = [
  { name: '{{#if condition}}...{{/if}}', description: 'Conditional block' },
  { name: '{{#each array}}...{{/each}}', description: 'Loop through array' },
  { name: '{{#unless condition}}...{{/unless}}', description: 'Negative conditional' },
  { name: '{{variable}}', description: 'Output variable' },
  { name: '{{@index}}', description: 'Current loop index (0-based)' },
  { name: '{{@first}}', description: 'True if first iteration' },
  { name: '{{@last}}', description: 'True if last iteration' }
];

const JsReportDesigner = () => {
  const { templateName } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const iframeRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(templateName || '');
  const [templateContent, setTemplateContent] = useState('');
  const [sampleData, setSampleData] = useState(JSON.stringify(SAMPLE_DATA, null, 2));
  const [previewHtml, setPreviewHtml] = useState('');
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Load templates list
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load selected template content
  useEffect(() => {
    if (selectedTemplate && !isNewTemplate) {
      loadTemplateContent(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await reportingService.getJsReportTemplates();
      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      notify({ message: 'Error loading templates', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateContent = async (name) => {
    setLoading(true);
    try {
      const result = await reportingService.getJsReportTemplate(name);
      if (result.success && result.data) {
        setTemplateContent(result.data.content || '');
      }
    } catch (error) {
      notify({ message: 'Error loading template content', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const name = isNewTemplate ? newTemplateName : selectedTemplate;
    if (!name) {
      notify({ message: 'Please enter a template name', type: 'warning' });
      return;
    }

    if (!templateContent) {
      notify({ message: 'Template content is empty', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const result = await reportingService.saveJsReportTemplate(name, templateContent);
      if (result.success) {
        notify({ message: `Template "${name}" saved successfully`, type: 'success' });
        setIsNewTemplate(false);
        setSelectedTemplate(name);
        await loadTemplates();
      } else {
        notify({ message: result.error || 'Error saving template', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error saving template', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!templateContent) {
      notify({ message: 'Template content is empty', type: 'warning' });
      return;
    }

    try {
      // Parse sample data
      let data;
      try {
        data = JSON.parse(sampleData);
      } catch (e) {
        notify({ message: 'Invalid JSON in sample data', type: 'error' });
        return;
      }

      // Use inline preview
      const result = await reportingService.previewJsReport(
        isNewTemplate ? 'inline-preview' : selectedTemplate,
        data
      );

      if (result.success) {
        setPreviewHtml(result.html);
        // Update iframe
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          doc.open();
          doc.write(result.html);
          doc.close();
        }
      } else {
        notify({ message: result.error || 'Error generating preview', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error generating preview', type: 'error' });
    }
  };

  const handleNewTemplate = () => {
    setIsNewTemplate(true);
    setSelectedTemplate('');
    setNewTemplateName('');
    setTemplateContent(getDefaultTemplate());
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    if (!window.confirm(`Are you sure you want to delete template "${selectedTemplate}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await reportingService.deleteJsReportTemplate(selectedTemplate);
      if (result.success) {
        notify({ message: 'Template deleted', type: 'success' });
        setSelectedTemplate('');
        setTemplateContent('');
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

  const handleDownloadPdf = async () => {
    if (!selectedTemplate) {
      notify({ message: 'Please select or save a template first', type: 'warning' });
      return;
    }

    try {
      const data = JSON.parse(sampleData);
      const result = await reportingService.renderJsReportPdf(selectedTemplate, data);
      if (result.success) {
        reportingService.downloadReportFile(result.blob, result.fileName);
      } else {
        notify({ message: result.error || 'Error generating PDF', type: 'error' });
      }
    } catch (error) {
      notify({ message: 'Error generating PDF', type: 'error' });
    }
  };

  const getDefaultTemplate = () => {
    return `<!DOCTYPE html>
<html>
<head>
    <title>{{reportTitle}}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #007bff; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #343a40; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{reportTitle}}</h1>
        <p>Generated: {{generatedAt}}</p>
    </div>

    <p>This is a sample report template. Customize it as needed.</p>

    {{#if transactions}}
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date/Time</th>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {{#each transactions}}
            <tr>
                <td>{{rowNumber}}</td>
                <td>{{dateTime}}</td>
                <td>{{vehicleName}}</td>
                <td>{{amount}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <div class="footer">
        <p>Report ID: {{reportId}}</p>
    </div>
</body>
</html>`;
  };

  const insertHelper = (helper) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits('', [{
        range: selection,
        text: helper.name,
        forceMoveMarkers: true
      }]);
      editor.focus();
    }
  };

  return (
    <div className="jsreport-designer">
      <LoadPanel visible={loading || saving} />

      {/* Toolbar */}
      <div className="designer-toolbar">
        <div className="toolbar-left">
          {isNewTemplate ? (
            <TextBox
              value={newTemplateName}
              onValueChanged={(e) => setNewTemplateName(e.value)}
              placeholder="Enter template name..."
              width={250}
            />
          ) : (
            <SelectBox
              value={selectedTemplate}
              dataSource={templates}
              onValueChanged={(e) => setSelectedTemplate(e.value)}
              placeholder="Select template..."
              width={250}
              searchEnabled={true}
            />
          )}
          <Button
            icon="fa-light fa-plus"
            text="New"
            onClick={handleNewTemplate}
            type="default"
          />
        </div>
        <div className="toolbar-right">
          <Button
            icon="fa-light fa-question-circle"
            text="Help"
            onClick={() => setShowHelpPopup(true)}
            stylingMode="text"
          />
          <Button
            icon="fa-light fa-eye"
            text="Preview"
            onClick={handlePreview}
            type="default"
          />
          <Button
            icon="fa-light fa-file-pdf"
            text="PDF"
            onClick={handleDownloadPdf}
            disabled={!selectedTemplate && !isNewTemplate}
            type="default"
          />
          <Button
            icon="fa-light fa-save"
            text="Save"
            onClick={handleSave}
            type="success"
            disabled={saving}
          />
          <Button
            icon="fa-light fa-trash"
            text="Delete"
            onClick={handleDelete}
            type="danger"
            disabled={!selectedTemplate || isNewTemplate}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="designer-content">
        {/* Left Panel - Editor */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>Template (HTML + Handlebars)</span>
          </div>
          <Editor
            height="100%"
            language="html"
            theme="vs-dark"
            value={templateContent}
            onChange={(value) => setTemplateContent(value)}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true
            }}
          />
        </div>

        {/* Right Panel - Preview & Data */}
        <div className="preview-panel">
          <div className="panel-section preview-section">
            <div className="panel-header">
              <span>Preview</span>
              <Button
                icon="fa-light fa-refresh"
                onClick={handlePreview}
                hint="Refresh Preview"
                stylingMode="text"
              />
            </div>
            <iframe
              ref={iframeRef}
              title="Report Preview"
              className="preview-iframe"
            />
          </div>

          <div className="panel-section data-section">
            <div className="panel-header">
              <span>Sample Data (JSON)</span>
            </div>
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={sampleData}
              onChange={(value) => setSampleData(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </div>
        </div>
      </div>

      {/* Help Popup */}
      <Popup
        visible={showHelpPopup}
        onHiding={() => setShowHelpPopup(false)}
        title="Handlebars Template Helpers"
        width={500}
        height={400}
        showCloseButton={true}
      >
        <div className="help-content">
          <p>Use these Handlebars helpers in your template:</p>
          <table className="help-table">
            <thead>
              <tr>
                <th>Syntax</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {HANDLEBARS_HELPERS.map((helper, index) => (
                <tr key={index}>
                  <td><code>{helper.name}</code></td>
                  <td>{helper.description}</td>
                  <td>
                    <Button
                      text="Insert"
                      stylingMode="text"
                      onClick={() => {
                        insertHelper(helper);
                        setShowHelpPopup(false);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Popup>
    </div>
  );
};

export default JsReportDesigner;
