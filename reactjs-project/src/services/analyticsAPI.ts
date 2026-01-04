import axios from 'axios';
import {
  AnalyticsOverview,
  CorrelationAnalysis,
  FeatureImportance,
  BackorderPrediction,
  ApiResponse
} from '../types/Analytics';

const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const analyticsAPI = {
  getAnalyticsOverview: async (): Promise<AnalyticsOverview> => {
    try {
      const response = await axios.get<AnalyticsOverview>(
        `${API_BASE_URL}/analytics/overview`,
        {
          headers: getAuthHeaders(),
          timeout: 10000 // 10 second timeout
        }
      );
      // Backend trả trực tiếp object, không wrap trong data
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching analytics overview:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: `${API_BASE_URL}/analytics/overview`
      });
      // Return empty fallback data with correct format
      return {
        totalProducts: 0,
        backorderProducts: 0,
        nonBackorderProducts: 0,
        backorderRate: 0,
        totalDistance: 0,
        totalDeliveries: 0,
        efficiencyScore: 0,
        avgCostPerKm: 0
      };
    }
  },

  getCorrelationAnalysis: async (): Promise<CorrelationAnalysis> => {
    try {
      const response = await axios.get<CorrelationAnalysis>(
        `${API_BASE_URL}/analytics/correlation`,
        {
          headers: getAuthHeaders(),
          timeout: 10000
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching correlation analysis:', {
        status: error.response?.status,
        message: error.message
      });
      return { correlations: [] };
    }
  },

  getFeatureImportance: async (): Promise<FeatureImportance[]> => {
    try {
      const response = await axios.get<FeatureImportance[]>(
        `${API_BASE_URL}/analytics/feature-importance`,
        {
          headers: getAuthHeaders(),
          timeout: 10000
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching feature importance:', {
        status: error.response?.status,
        message: error.message
      });
      return [];
    }
  },

  getBackorderPredictions: async (limit: number = 20): Promise<BackorderPrediction[]> => {
    try {
      const response = await axios.get<BackorderPrediction[]>(
        `${API_BASE_URL}/analytics/backorder-predictions`,
        {
          headers: getAuthHeaders(),
          params: { limit },
          timeout: 10000
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching backorder predictions:', {
        status: error.response?.status,
        message: error.message
      });
      return [];
    }
  },
};

export default analyticsAPI;
