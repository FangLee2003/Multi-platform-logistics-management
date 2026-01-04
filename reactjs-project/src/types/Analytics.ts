export interface AnalyticsOverview {
  totalProducts?: number;
  backorderProducts?: number;
  nonBackorderProducts?: number;
  backorderRate?: number;
  backorderAverages?: Record<string, any>;
  nonBackorderAverages?: Record<string, any>;
  // Legacy fields for backward compatibility
  totalDistance?: number;
  totalDeliveries?: number;
  efficiencyScore?: number;
  avgCostPerKm?: number;
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
  correlations: CorrelationPoint[];
  potentialIssueDistribution?: CategoryDistribution[];
  deckRiskDistribution?: CategoryDistribution[];
  oeConstraintDistribution?: CategoryDistribution[];
  ppapRiskDistribution?: CategoryDistribution[];
  leadTimeDistribution?: CategoryDistribution[];
  inventoryLevelDistribution?: CategoryDistribution[];
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  description: string;
  insights: string[];
}

export interface BackorderPrediction {
  sku: string;
  productName: string;
  currentStock: number;
  backorderProbability: number;
  recommendedQty: number;
  priority: string;
  leadTime?: number;
  forecast3Month?: number;
  minBank?: number;
  inTransitQty?: number;
  piecesPastDue?: number;
  sales3Month?: number;
  perf6MonthAvg?: number;
  stopAutoBuy?: string;
  revStop?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


