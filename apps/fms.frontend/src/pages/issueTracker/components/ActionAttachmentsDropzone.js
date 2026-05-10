/**
 * File:          ActionAttachmentsDropzone.js
 * Purpose:       Compact drag-and-drop uploader for per-action completion attachments.
 *                Routes uploads to the existing issue attachment endpoint with a category
 *                so Calibration / Installation / General files are grouped correctly.
 * Dependencies:  React, issueTrackerService.uploadAttachment
 * Last Modified: 2026-04-23
 *
 * Key Functions:
 * - handleFiles(files): validates and uploads each accepted file sequentially
 * - removeLocal(index): removes an entry from the local chip list (server copy stays)
 */
import React, { useCallback, useRef, useState } from 'react';
import issueTrackerService from '../../../services/issueTrackerService';
import './ActionAttachmentsDropzone.scss';

const DEFAULT_ACCEPT = 'image/*,application/pdf,.pdf,.xls,.xlsx,.csv';

function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function categoryIcon(category) {
    switch (category) {
        case 'Calibration': return 'fa-light fa-ruler-combined';
        case 'Installation': return 'fa-light fa-screwdriver-wrench';
        default: return 'fa-light fa-paperclip';
    }
}

function ActionAttachmentsDropzone({
    issueId,
    category = 'General',
    maxFiles = 10,
    maxSizeMB = 10,
    accept = DEFAULT_ACCEPT,
    disabled = false,
    onUploaded
}) {
    const inputRef = useRef(null);
    const [uploads, setUploads] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const openPicker = useCallback(() => {
        if (disabled || isUploading) return;
        inputRef.current?.click();
    }, [disabled, isUploading]);

    const handleFiles = useCallback(async (fileList) => {
        if (!issueId) {
            setError('Save the issue before adding attachments.');
            return;
        }
        const files = Array.from(fileList || []);
        if (!files.length) return;

        const maxBytes = maxSizeMB * 1024 * 1024;
        const accepted = [];
        for (const file of files) {
            if (uploads.length + accepted.length >= maxFiles) {
                setError(`You can upload up to ${maxFiles} files per action.`);
                break;
            }
            if (file.size > maxBytes) {
                setError(`"${file.name}" exceeds the ${maxSizeMB} MB limit.`);
                continue;
            }
            accepted.push(file);
        }

        if (!accepted.length) return;

        setIsUploading(true);
        for (const file of accepted) {
            const localEntry = {
                id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: file.name,
                size: file.size,
                status: 'uploading'
            };
            setUploads((prev) => [...prev, localEntry]);
            try {
                const result = await issueTrackerService.uploadAttachment(issueId, file, category);
                setUploads((prev) => prev.map((entry) => (
                    entry.id === localEntry.id
                        ? { ...entry, status: 'done', serverId: result?.id || result?.Id || null }
                        : entry
                )));
                setError('');
                if (typeof onUploaded === 'function') {
                    onUploaded(result);
                }
            } catch (uploadError) {
                const message = uploadError?.message || 'Upload failed';
                setUploads((prev) => prev.map((entry) => (
                    entry.id === localEntry.id
                        ? { ...entry, status: 'error', errorMessage: message }
                        : entry
                )));
                setError(message);
            }
        }
        setIsUploading(false);
    }, [issueId, category, maxFiles, maxSizeMB, onUploaded, uploads.length]);

    const onChange = useCallback((event) => {
        handleFiles(event.target.files);
        if (inputRef.current) inputRef.current.value = '';
    }, [handleFiles]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (disabled || isUploading) return;
        handleFiles(event.dataTransfer.files);
    }, [disabled, isUploading, handleFiles]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || isUploading) return;
        setIsDragging(true);
    }, [disabled, isUploading]);

    const onDragLeave = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    }, []);

    const removeLocal = useCallback((id) => {
        setUploads((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    return (
        <div className={`action-attachments ${disabled ? 'action-attachments--disabled' : ''}`}>
            <div className="action-attachments__header">
                <i className={`action-attachments__header-icon ${categoryIcon(category)}`}></i>
                <span className="action-attachments__header-title">Attachments</span>
                <span className="action-attachments__header-tag">{category}</span>
            </div>

            <button
                type="button"
                className={`action-attachments__dropzone ${isDragging ? 'action-attachments__dropzone--active' : ''}`}
                onClick={openPicker}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                disabled={disabled || isUploading}
            >
                <i className="fa-light fa-cloud-arrow-up action-attachments__dropzone-icon"></i>
                <span className="action-attachments__dropzone-title">
                    {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
                </span>
                <span className="action-attachments__dropzone-hint">
                    Up to {maxFiles} files, {maxSizeMB} MB each (images, PDF, Excel, CSV)
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={onChange}
                    className="action-attachments__input"
                />
            </button>

            {error && (
                <div className="action-attachments__error">
                    <i className="fa-light fa-triangle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {uploads.length > 0 && (
                <ul className="action-attachments__list">
                    {uploads.map((entry) => (
                        <li key={entry.id} className={`action-attachments__item action-attachments__item--${entry.status}`}>
                            <i className="fa-light fa-file action-attachments__item-icon"></i>
                            <span className="action-attachments__item-name" title={entry.name}>{entry.name}</span>
                            <span className="action-attachments__item-size">{formatSize(entry.size)}</span>
                            {entry.status === 'uploading' && (
                                <span className="action-attachments__item-status">Uploading...</span>
                            )}
                            {entry.status === 'done' && (
                                <span className="action-attachments__item-status action-attachments__item-status--ok">
                                    <i className="fa-light fa-check"></i> Uploaded
                                </span>
                            )}
                            {entry.status === 'error' && (
                                <span
                                    className="action-attachments__item-status action-attachments__item-status--error"
                                    title={entry.errorMessage}
                                >
                                    <i className="fa-light fa-circle-exclamation"></i> Failed
                                </span>
                            )}
                            <button
                                type="button"
                                className="action-attachments__item-remove"
                                onClick={() => removeLocal(entry.id)}
                                title="Remove from list"
                            >
                                <i className="fa-light fa-xmark"></i>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ActionAttachmentsDropzone;
