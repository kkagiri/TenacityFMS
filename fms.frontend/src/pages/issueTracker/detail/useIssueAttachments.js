/**
 * File: useIssueAttachments.js
 * Purpose: Custom hook for issue attachment CRUD (load, upload, delete, download)
 * Dependencies: React, issueTrackerService, file-saver, devextreme notify
 * Last Modified: 2026-02-23
 *
 * Key Exports:
 * - useIssueAttachments(id, issue, refreshActivityStream): attachment state + handlers
 */
import { useState, useCallback, useEffect } from 'react';
import notify from 'devextreme/ui/notify';
import { saveAs } from 'file-saver';
import issueTrackerService from '../../../services/issueTrackerService';

const useIssueAttachments = (id, issue, refreshActivityStream) => {
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);

  const loadAttachments = useCallback(async () => {
    if (!id) return;
    setAttachmentsLoading(true);
    try {
      const data = await issueTrackerService.getAttachments(id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (issue) loadAttachments();
  }, [issue, loadAttachments]);

  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await issueTrackerService.uploadAttachment(id, files[i], uploadCategory);
      }
      notify({ message: `${files.length} file(s) uploaded successfully.`, type: 'success', displayTime: 2500 });
      await loadAttachments();
      refreshActivityStream();
    } catch (err) {
      notify({ message: err?.message || 'Failed to upload file(s).', type: 'error', displayTime: 3000 });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }, [id, uploadCategory, loadAttachments, refreshActivityStream]);

  const handleDeleteAttachment = useCallback(async (attachmentId, fileName) => {
    if (!window.confirm(`Delete attachment "${fileName}"?`)) return;
    try {
      await issueTrackerService.deleteAttachment(id, attachmentId);
      notify({ message: 'Attachment deleted.', type: 'success', displayTime: 2000 });
      await loadAttachments();
      refreshActivityStream();
    } catch (err) {
      notify({ message: 'Failed to delete attachment.', type: 'error', displayTime: 3000 });
    }
  }, [id, loadAttachments, refreshActivityStream]);

  const handleDownloadAttachment = useCallback(async (attachment) => {
    if (!attachment?.id) return;
    try {
      setDownloadingAttachmentId(attachment.id);
      const result = await issueTrackerService.downloadAttachment(id, attachment.id);
      const fileName = result?.fileName || attachment.fileName || `attachment-${attachment.id}`;
      saveAs(result.blob, fileName);
    } catch (err) {
      notify({ message: err?.message || 'Failed to download attachment.', type: 'error', displayTime: 3000 });
    } finally {
      setDownloadingAttachmentId(null);
    }
  }, [id]);

  return {
    attachments,
    attachmentsLoading,
    uploadCategory,
    setUploadCategory,
    isUploading,
    downloadingAttachmentId,
    handleFileUpload,
    handleDeleteAttachment,
    handleDownloadAttachment
  };
};

export default useIssueAttachments;
