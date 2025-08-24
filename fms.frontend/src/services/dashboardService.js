import axiosInstance from '../api/axiosInstance';

/**
 * Dashboard Service
 * Handles API calls to backend dashboard customization endpoints
 * Endpoints implemented server-side:
 *  GET /api/dashboard/preferences         -> current user's preferences
 *  POST /api/dashboard/preferences        -> save/update current user's preferences
 *  GET /api/dashboard/ticker-configs      -> filtered ticker templates (query: onlyEnabled=true|false)
 */
class DashboardService {
  /**
   * Fetch current user's dashboard preferences
   * @returns {Promise<object>} FMSResponseMessage<UserDashboardPreferenceDto>
   */
  async getPreferences() {
    const response = await axiosInstance.get('/dashboard/preferences');
    return response.data;
  }

  /**
   * Save (create/update) current user's dashboard preferences
   * @param {object} payload { preferencesJson: string, version?: string }
   * @returns {Promise<object>} FMSResponseMessage<UserDashboardPreferenceDto>
   */
  async savePreferences(payload) {
    const response = await axiosInstance.post('/dashboard/preferences', payload);
    return response.data;
  }

  /**
   * Get ticker templates visible to the current user.
   * Role/permission filtering done on backend.
   * @param {boolean} onlyEnabled filter to only enabled templates (default true)
   * @returns {Promise<object>} FMSResponseMessage<DashboardTickerTemplateDto[]>
   */
  async getTickerTemplates(onlyEnabled = true) {
    const response = await axiosInstance.get('/dashboard/ticker-configs', { params: { onlyEnabled } });
    return response.data;
  }

  /**
   * Convenience helper: returns a simple array of enabled ticker types (strings)
   */
  async getEnabledTickerTypes() {
    const res = await this.getTickerTemplates(true);
    if (!res?.success || !Array.isArray(res.data)) return [];
    return res.data.map(t => t.tickerType);
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
