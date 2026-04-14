/**
 * File:          vehicleDocumentOcrApi.js
 * Purpose:       API client for vehicle document OCR extraction and bulk upload endpoints.
 * Dependencies:  axiosInstance
 * Last Modified: 2025-07-14
 *
 * Key Functions:
 * - extractDocumentData(): Single file OCR extraction
 * - bulkExtractDocumentData(): Multi-file OCR extraction
 * - bulkSaveDocuments(): Save verified bulk documents
 */
import axiosInstance from "../api/axiosInstance";

/**
 * Extract OCR data from a single document file.
 * @param {File} file - The PDF or image file to extract data from.
 * @returns {Promise} API response with DocumentOcrResultDto
 */
export const extractDocumentData = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post("/vehicledocuments/ocr/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

/**
 * Extract OCR data from multiple document files (bulk upload).
 * @param {File[]} files - Array of PDF or image files.
 * @returns {Promise} API response with List<BulkDocumentUploadItemDto>
 */
export const bulkExtractDocumentData = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await axiosInstance.post("/vehicledocuments/ocr/bulk-extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

/**
 * Save verified bulk documents after user review.
 * @param {Object} saveData - BulkDocumentSaveDto with documents array.
 * @returns {Promise} API response with BulkDocumentSaveResultDto
 */
export const bulkSaveDocuments = async (saveData) => {
    const response = await axiosInstance.post("/vehicledocuments/ocr/bulk-save", saveData);
    return response.data;
};
