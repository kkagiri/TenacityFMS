/**
 * File: reportingService.js
 * Purpose: Central reporting API client for DevExtreme and JsReport operations
 * Dependencies: axiosInstance
 * Last Modified: 2026-01-21
 *
 * Key Functions:
 * - generateReport(): Generate DevExtreme reports
 * - previewJsReport(): Render JsReport HTML previews
 * - renderJsReportPdf(): Render JsReport to PDF
 * - renderJsReportExcel(): Render JsReport to Excel
 * - scheduleReportEmail(): Schedule report delivery via notifications
 */
import axiosInstance from '../api/axiosInstance';

/**
 * Service for DevExtreme reporting features
 */
class ReportingService {
  /**
   * Get all available report definitions
   * @param {string} category - Optional category filter
   * @returns {Promise}
   */
  async getReportDefinitions(category = null) {
    try {
      const params = category ? { category } : {};
      const response = await axiosInstance.get('/Reporting/definitions', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting report definitions:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get a specific report definition by ID
   * @param {string} reportId - Report ID
   * @returns {Promise}
   */
  async getReportDefinition(reportId) {
    try {
      const response = await axiosInstance.get(`/Reporting/definitions/${reportId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting report definition:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Generate a report with specified filters
   * @param {Object} request - Report generation request
   * @param {string} request.reportId - Report ID
   * @param {Object} request.filters - Report filters
   * @param {string} request.exportFormat - Export format (json, excel, pdf, csv)
   * @param {boolean} request.includeCharts - Include charts in report
   * @returns {Promise}
   */
  async generateReport(request) {
    try {
      const response = await axiosInstance.post('/Reporting/generate', request, {
        responseType: request.exportFormat !== 'json' ? 'blob' : 'json'
      });

      if (request.exportFormat !== 'json') {
        // Handle file download
        const contentDisposition = response.headers['content-disposition'];
        let filename = `report_${Date.now()}.${request.exportFormat}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        return {
          success: true,
          fileContent: response.data,
          fileName: filename,
          contentType: response.headers['content-type']
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Download report file
   * @param {Blob} blob - File blob
   * @param {string} fileName - File name
   */
  downloadReportFile(blob, fileName) {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get report templates for current user
   * @param {string} reportId - Optional report ID filter
   * @param {boolean} includeShared - Include shared templates
   * @returns {Promise}
   */
  async getReportTemplates(reportId = null, includeShared = true) {
    try {
      const params = { includeShared };
      if (reportId) params.reportId = reportId;

      const response = await axiosInstance.get('/Reporting/templates', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting report templates:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Save a report template
   * @param {Object} template - Template data
   * @returns {Promise}
   */
  async saveReportTemplate(template) {
    try {
      const response = await axiosInstance.post('/Reporting/templates', template);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving report template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete a report template
   * @param {string} templateId - Template ID
   * @returns {Promise}
   */
  async deleteReportTemplate(templateId) {
    try {
      const response = await axiosInstance.delete(`/Reporting/templates/${templateId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting report template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get available report categories
   * @returns {Promise}
   */
  async getReportCategories() {
    try {
      const response = await axiosInstance.get('/Reporting/categories');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting report categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Fetch data directly from a data source endpoint
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async fetchReportData(endpoint, params = {}) {
    try {
      const response = await axiosInstance.get(endpoint, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching report data:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Format report filters for API request
   * @param {Object} filters - Filter values
   * @returns {Object}
   */
  formatReportFilters(filters) {
    const formatted = { ...filters };

    // Convert date objects to ISO strings
    Object.keys(formatted).forEach(key => {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatted[key].toISOString();
      }
    });

    return formatted;
  }

  // =============================================
  // DevExtreme Report Storage Methods
  // =============================================

  /**
   * Get all DevExtreme report items from database
   * @param {string} category - Optional category filter
   * @returns {Promise}
   */
  async getDevExtremeReports(category = null) {
    try {
      const params = category ? { category } : {};
      const response = await axiosInstance.get('/Reports', { params });
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error getting DevExtreme reports:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get all unique categories for DevExtreme reports
   * @returns {Promise}
   */
  async getDevExtremeReportCategories() {
    try {
      const response = await axiosInstance.get('/Reports/categories');
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error getting DevExtreme report categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get a specific DevExtreme report by ID
   * @param {number} id - Report ID
   * @returns {Promise}
   */
  async getDevExtremeReport(id) {
    try {
      const response = await axiosInstance.get(`/Reports/${id}`);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error getting DevExtreme report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a new DevExtreme report
   * @param {Object} report - Report data (name, displayName, layoutData)
   * @returns {Promise}
   */
  async createDevExtremeReport(report) {
    try {
      const response = await axiosInstance.post('/Reports', report);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error creating DevExtreme report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update an existing DevExtreme report
   * @param {number} id - Report ID
   * @param {Object} report - Report data (displayName, layoutData)
   * @returns {Promise}
   */
  async updateDevExtremeReport(id, report) {
    try {
      const response = await axiosInstance.put(`/Reports/${id}`, report);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error updating DevExtreme report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete a DevExtreme report
   * @param {number} id - Report ID
   * @returns {Promise}
   */
  async deleteDevExtremeReport(id) {
    try {
      const response = await axiosInstance.delete(`/Reports/${id}`);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error deleting DevExtreme report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // =============================================
  // JsReport Template Methods
  // =============================================

  /**
   * Get all JsReport templates
   * @returns {Promise}
   */
  async getJsReportTemplates() {
    try {
      const response = await axiosInstance.get('/ReportGenerator/templates');
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error getting JsReport templates:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get a specific JsReport template content
   * @param {string} name - Template name
   * @returns {Promise}
   */
  async getJsReportTemplate(name) {
    try {
      const response = await axiosInstance.get(`/ReportGenerator/templates/${name}`);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error getting JsReport template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Save a JsReport template
   * @param {string} name - Template name
   * @param {string} content - HTML/Handlebars template content
   * @returns {Promise}
   */
  async saveJsReportTemplate(name, content) {
    try {
      const response = await axiosInstance.post('/ReportGenerator/templates', { name, content });
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data,
        message: response.data?.message
      };
    } catch (error) {
      console.error('Error saving JsReport template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete a JsReport template
   * @param {string} name - Template name
   * @returns {Promise}
   */
  async deleteJsReportTemplate(name) {
    try {
      const response = await axiosInstance.delete(`/ReportGenerator/templates/${name}`);
      return {
        success: response.data?.isSuccess ?? true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Error deleting JsReport template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Preview a JsReport template as HTML
   * @param {string} templateName - Template name
   * @param {Object} data - Data to render
   * @returns {Promise}
   */
  async previewJsReport(templateName, data) {
    try {
      const response = await axiosInstance.post(`/ReportGenerator/preview/${templateName}`, data, {
        responseType: 'text'
      });
      return {
        success: true,
        html: response.data
      };
    } catch (error) {
      console.error('Error previewing JsReport:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Render a JsReport template to PDF
   * @param {string} templateName - Template name
   * @param {Object} data - Data to render
   * @returns {Promise}
   */
  async renderJsReportPdf(templateName, data) {
    try {
      const response = await axiosInstance.post(`/ReportGenerator/render/pdf/${templateName}`, data, {
        responseType: 'blob'
      });
      return {
        success: true,
        blob: response.data,
        fileName: `${templateName}.pdf`
      };
    } catch (error) {
      console.error('Error rendering JsReport PDF:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Render a JsReport template to Excel
   * @param {string} templateName - Template name
   * @param {Object} data - Data to render
   * @returns {Promise}
   */
  async renderJsReportExcel(templateName, data) {
    try {
      const response = await axiosInstance.post(`/ReportGenerator/render/excel/${templateName}`, data, {
        responseType: 'blob'
      });
      return {
        success: true,
        blob: response.data,
        fileName: `${templateName}.xlsx`
      };
    } catch (error) {
      console.error('Error rendering JsReport Excel:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Schedule a report email via notification system
   * @param {Object} request - Notification creation request
   * @returns {Promise}
   */
  async scheduleReportEmail(request) {
    try {
      const response = await axiosInstance.post('/notifications', request);
      return {
        success: response.data?.success ?? true,
        data: response.data,
        message: response.data?.message
      };
    } catch (error) {
      console.error('Error scheduling report email:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Generate Pump Transaction Report
   * @param {Object} filters - Report filters
   * @returns {Promise}
   */
  async generatePumpTransactionReport(filters) {
    try {
      const response = await axiosInstance.post('/ReportGenerator/pump-transactions', filters, {
        responseType: 'blob'
      });

      const format = filters.format || 'pdf';
      const extension = format === 'excel' ? 'xlsx' : format;
      const contentType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : format === 'pdf' ? 'application/pdf' : 'text/html';

      return {
        success: true,
        blob: response.data,
        fileName: `PumpTransactions_${new Date().toISOString().split('T')[0]}.${extension}`,
        contentType
      };
    } catch (error) {
      console.error('Error generating pump transaction report:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new ReportingService();
