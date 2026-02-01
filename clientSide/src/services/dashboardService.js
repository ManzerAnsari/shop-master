import api from '../lib/axios';

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (range = 'week') => {
    const response = await api.get(`/dashboard/stats?range=${range}`);
    return response.data;
  },
};

export default dashboardService;
