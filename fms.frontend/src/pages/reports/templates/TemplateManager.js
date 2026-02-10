/**
 * File: TemplateManager.js
 * Purpose: CRUD management for JSReport Handlebars templates. Lists, creates,
 *          edits, deletes, and previews report templates.
 * Dependencies: React, DevExtreme DataGrid, reportingService
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - TemplateManager: Full template management page with grid + create/delete popups
 *
 * Note: Consolidated from jsreport/JsReportTemplateManager.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataGrid, { Column, Paging, SearchPanel, Toolbar, Item } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Popup } from 'devextreme-react/popup';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import './TemplateManager.scss';

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <title>{{reportTitle}}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #007bff; margin: 0 0 5px 0; }
        .header .meta { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #343a40; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e9ecef; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{reportTitle}}</h1>
        <div class="meta">Generated: {{generatedAt}} | By: {{generatedBy}}</div>
    </div>

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
        <p>FMS Reporting System — JSReport Engine</p>
    </div>
</body>
</html>`;

const TemplateManager = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateDescription, setNewTemplateDescription] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const result = await reportingService.getJsReportTemplates();
            if (result.success) {
                const list = (result.data || []).map((name, idx) => ({
                    id: idx + 1,
                    name,
                    modifiedAt: null,
                }));
                setTemplates(list);
            }
        } catch (err) {
            notify({ message: 'Failed to load templates', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleCreate = useCallback(async () => {
        if (!newTemplateName.trim()) {
            notify({ message: 'Template name is required', type: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const result = await reportingService.saveJsReportTemplate(
                newTemplateName.trim(),
                DEFAULT_TEMPLATE
            );
            if (result.success) {
                notify({ message: 'Template created', type: 'success' });
                setShowCreatePopup(false);
                setNewTemplateName('');
                setNewTemplateDescription('');
                await loadTemplates();
                navigate(`/reports/templates/designer/${newTemplateName.trim()}`);
            } else {
                notify({ message: result.error || 'Failed to create template', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to create template', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [newTemplateName, loadTemplates, navigate]);

    const handleDelete = useCallback(async () => {
        if (!deleteTarget) return;
        setLoading(true);
        try {
            const result = await reportingService.deleteJsReportTemplate(deleteTarget.name);
            if (result.success) {
                notify({ message: 'Template deleted', type: 'success' });
                setShowDeletePopup(false);
                setDeleteTarget(null);
                await loadTemplates();
            } else {
                notify({ message: result.error || 'Failed to delete', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to delete template', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [deleteTarget, loadTemplates]);

    const renderActions = useCallback(
        (cellInfo) => (
            <div className="tw-flex tw-gap-2">
                <Button
                    icon="fa-light fa-edit"
                    hint="Edit in Designer"
                    stylingMode="text"
                    onClick={() => navigate(`/reports/templates/designer/${cellInfo.data.name}`)}
                />
                <Button
                    icon="fa-light fa-eye"
                    hint="Preview"
                    stylingMode="text"
                    onClick={() => navigate(`/reports/engine?template=${cellInfo.data.name}`)}
                />
                <Button
                    icon="fa-light fa-trash"
                    hint="Delete"
                    stylingMode="text"
                    onClick={() => {
                        setDeleteTarget(cellInfo.data);
                        setShowDeletePopup(true);
                    }}
                />
            </div>
        ),
        [navigate]
    );

    return (
        <div className="template-manager">
            <LoadPanel visible={loading} />

            <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                        <i className="fa-light fa-file-code tw-mr-2 tw-text-blue-600"></i>
                        Template Manager
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Create and manage Handlebars report templates for JSReport
                    </p>
                </div>
                <Button
                    icon="fa-light fa-plus"
                    text="New Template"
                    type="default"
                    onClick={() => setShowCreatePopup(true)}
                />
            </div>

            <DataGrid
                dataSource={templates}
                showBorders={true}
                columnAutoWidth={true}
                rowAlternationEnabled={true}
                keyExpr="id"
            >
                <SearchPanel visible={true} width={250} placeholder="Search templates..." />
                <Paging defaultPageSize={20} />

                <Column dataField="name" caption="Template Name" />
                <Column caption="Actions" width={150} cellRender={renderActions} alignment="center" />
            </DataGrid>

            {/* Create Popup */}
            <Popup
                visible={showCreatePopup}
                onHiding={() => setShowCreatePopup(false)}
                title="Create New Template"
                width={450}
                height="auto"
                showCloseButton={true}
            >
                <div className="tw-p-4">
                    <div className="tw-mb-4">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            Template Name <span className="tw-text-red-500">*</span>
                        </label>
                        <TextBox
                            value={newTemplateName}
                            onValueChanged={(e) => setNewTemplateName(e.value)}
                            placeholder="e.g. vehicle-consumption-report"
                        />
                    </div>
                    <div className="tw-mb-4">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            Description
                        </label>
                        <TextArea
                            value={newTemplateDescription}
                            onValueChanged={(e) => setNewTemplateDescription(e.value)}
                            placeholder="Optional description..."
                            height={80}
                        />
                    </div>
                    <div className="tw-flex tw-justify-end tw-gap-2">
                        <Button text="Cancel" stylingMode="outlined" onClick={() => setShowCreatePopup(false)} />
                        <Button text="Create & Edit" type="default" onClick={handleCreate} />
                    </div>
                </div>
            </Popup>

            {/* Delete Confirmation */}
            <Popup
                visible={showDeletePopup}
                onHiding={() => setShowDeletePopup(false)}
                title="Delete Template"
                width={400}
                height="auto"
                showCloseButton={true}
            >
                <div className="tw-p-4">
                    <p className="tw-text-gray-700">
                        Are you sure you want to delete template{' '}
                        <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                        <Button text="Cancel" stylingMode="outlined" onClick={() => setShowDeletePopup(false)} />
                        <Button text="Delete" type="danger" onClick={handleDelete} />
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default TemplateManager;
