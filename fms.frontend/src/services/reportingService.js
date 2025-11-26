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
}

export default new ReportingService();
