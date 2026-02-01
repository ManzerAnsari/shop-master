import api from "../lib/axios";

export const aiInsightsService = {
  /**
   * Get AI-powered insights
   * @returns {Promise<Object>} AI insights and recommendations
   */
  getInsights: async () => {
    const response = await api.get("/ai-insights");
    return response.data;
  },
};

export default aiInsightsService;
