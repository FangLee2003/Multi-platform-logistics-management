export interface AnalyticsOverview {
  totalDistance: number;
  totalDeliveries: number;
  efficiencyScore: number;
  avgCostPerKm: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  backorderCount: number;
  backorderRate?: number;
}

export interface CorrelationPoint {
  x: string;
  y: string;
  value: number;
}

export interface CorrelationAnalysis {
  correlations?: CorrelationPoint[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  featureName?: string; // Alias for compatibility
  description?: string;
  insights?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}





