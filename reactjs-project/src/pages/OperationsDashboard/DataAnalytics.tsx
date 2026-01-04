import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import analyticsAPI from '../../services/analyticsAPI';
import {
  AnalyticsOverview,
  CorrelationAnalysis,
  FeatureImportance,
  CategoryDistribution,
} from '../../types/Analytics';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Helper functions for data transformation
const calculateParetoData = (features: FeatureImportance[]) => {
  const sorted = [...features].sort((a, b) => b.importance - a.importance);
  const totalImportance = sorted.reduce((sum, f) => sum + f.importance, 0);
  
  let cumulative = 0;
  return sorted.map((feature) => {
    cumulative += feature.importance;
    return {
      ...feature,
      cumulativePercentage: (cumulative / totalImportance) * 100,
    };
  });
};

const createImportanceDistribution = (features: FeatureImportance[]) => {
  const buckets = [
    { range: '0-20%', min: 0, max: 0.2, count: 0, features: [] as string[] },
    { range: '20-40%', min: 0.2, max: 0.4, count: 0, features: [] as string[] },
    { range: '40-60%', min: 0.4, max: 0.6, count: 0, features: [] as string[] },
    { range: '60-80%', min: 0.6, max: 0.8, count: 0, features: [] as string[] },
    { range: '80-100%', min: 0.8, max: 1.0, count: 0, features: [] as string[] },
  ];
  
  features.forEach((feature) => {
    const bucket = buckets.find(b => feature.importance >= b.min && feature.importance < b.max) 
      || buckets[buckets.length - 1];
    bucket.count++;
    bucket.features.push(feature.featureName);
  });
  
  return buckets;
};

const categorizeFeatures = (features: FeatureImportance[]) => {
  const categories: Record<string, { count: number; totalImportance: number; features: string[] }> = {
    'Inventory': { count: 0, totalImportance: 0, features: [] },
    'Sales & Forecast': { count: 0, totalImportance: 0, features: [] },
    'Supply Chain': { count: 0, totalImportance: 0, features: [] },
    'Risk Factors': { count: 0, totalImportance: 0, features: [] },
    'Other': { count: 0, totalImportance: 0, features: [] },
  };
  
  features.forEach((feature) => {
    const name = feature.featureName?.toLowerCase() || '';
    if (name.includes('inventory') || name.includes('stock') || name.includes('min_bank')) {
      categories['Inventory'].count++;
      categories['Inventory'].totalImportance += feature.importance;
      categories['Inventory'].features.push(feature.featureName);
    } else if (name.includes('sales') || name.includes('forecast')) {
      categories['Sales & Forecast'].count++;
      categories['Sales & Forecast'].totalImportance += feature.importance;
      categories['Sales & Forecast'].features.push(feature.featureName);
    } else if (name.includes('lead') || name.includes('transit') || name.includes('pieces')) {
      categories['Supply Chain'].count++;
      categories['Supply Chain'].totalImportance += feature.importance;
      categories['Supply Chain'].features.push(feature.featureName);
    } else if (name.includes('risk') || name.includes('stop') || name.includes('rev_stop')) {
      categories['Risk Factors'].count++;
      categories['Risk Factors'].totalImportance += feature.importance;
      categories['Risk Factors'].features.push(feature.featureName);
    } else {
      categories['Other'].count++;
      categories['Other'].totalImportance += feature.importance;
      categories['Other'].features.push(feature.featureName);
    }
  });
  
  return Object.entries(categories)
    .filter(([_, data]) => data.count > 0)
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgImportance: data.totalImportance / data.count,
      totalImportance: data.totalImportance,
      features: data.features,
    }))
    .sort((a, b) => b.totalImportance - a.totalImportance);
};

const truncateLabel = (label: string, maxLength: number = 25): string => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
};

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const label = truncateLabel(payload.value, 30);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{payload.value}</title>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#666"
        fontSize={11}
      >
        {label}
      </text>
    </g>
  );
};

export default function DataAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationAnalysis | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, correlationData, featuresData] = await Promise.all([
        analyticsAPI.getAnalyticsOverview(),
        analyticsAPI.getCorrelationAnalysis(),
        analyticsAPI.getFeatureImportance(),
      ]);

      console.log('✅ Analytics data loaded:', { overviewData, correlationData, featuresData });
      
      setOverview(overviewData);
      setCorrelation(correlationData);
      setFeatureImportance(featuresData);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('❌ Error loading analytics data:', {
        error: errorMsg,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError(`Analytics temporarily unavailable: ${errorMsg}`);
      
      // Set empty fallback data to prevent crash
      setOverview({
        totalProducts: 0,
        backorderProducts: 0,
        nonBackorderProducts: 0,
        backorderRate: 0,
        totalDistance: 0,
        totalDeliveries: 0,
        efficiencyScore: 0,
        avgCostPerKm: 0
      });
      setCorrelation({ correlations: [] });
      setFeatureImportance([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateBackorderRate = (data: CategoryDistribution[]) => {
    return data.map(item => ({
      ...item,
      backorderRate: item.count > 0 ? (item.backorderCount / item.count) * 100 : 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-800 font-semibold">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Computed data - sort features by importance
  const sortedFeatures = [...featureImportance].sort((a, b) => b.importance - a.importance);
  const paretoData = calculateParetoData(featureImportance);
  const distributionData = createImportanceDistribution(featureImportance);
  const categoryData = categorizeFeatures(featureImportance);
  const dynamicChartHeight = Math.max(420, sortedFeatures.length * 28);
  
  // Filtered features for table
  const filteredFeatures = featureImportance
    .filter((f) => f.featureName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.importance - a.importance);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-[1680px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Data Analytics - QNN Backorder Prediction
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Comprehensive analysis of product features for backorder prediction using AI/ML
          </p>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Total Products</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">
                {overview.totalProducts?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Backorder Products</h3>
              <p className="text-2xl md:text-3xl font-bold text-red-600">
                {overview.backorderProducts?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Backorder Rate</h3>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">
                {overview.backorderRate?.toFixed(2) || '0'}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Non-Backorder</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {overview.nonBackorderProducts?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        )}

        {/* Feature Importance Section */}
        {featureImportance.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Feature Data Available</h3>
              <p className="text-gray-600 mb-4">
                Feature importance data is not available. Please check if the backend service is running and the database has data.
              </p>
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Retry Load Data
              </button>
            </div>
          </div>
        )}

        {featureImportance.length > 0 && (
          <>
            {/* Row 1: Bar Chart + Pareto Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              {/* Improved Horizontal Bar Chart */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  All Features by Importance ({sortedFeatures.length} features)
                </h3>
                <ResponsiveContainer width="100%" height={dynamicChartHeight}>
                  <BarChart
                    data={sortedFeatures}
                    layout="vertical"
                    margin={{ top: 10, right: 8, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      domain={[0, 1]} 
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      stroke="#6b7280"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      dataKey="featureName" 
                      type="category" 
                      tick={<CustomYAxisTick />}
                      width={190}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => value !== undefined ? [`${(value * 100).toFixed(2)}%`, 'Importance'] : ['N/A', 'Importance']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="importance" 
                      fill="#3b82f6" 
                      name="Importance Score"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pareto Chart */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Pareto Analysis - Cumulative Importance
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Shows cumulative importance. 80% and 90% thresholds identify critical features.
                </p>
                <ResponsiveContainer width="100%" height={Math.max(380, dynamicChartHeight - 40)}>
                  <ComposedChart
                    data={paretoData}
                    margin={{ top: 40, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="featureName" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => truncateLabel(value, 15)}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke="#3b82f6"
                      label={{ value: 'Importance', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#10b981"
                      domain={[0, 100]}
                      label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <p className="font-bold text-gray-800 mb-2 text-sm">{data.featureName}</p>
                              <p className="text-xs text-blue-600">
                                Importance: {(data.importance * 100).toFixed(2)}%
                              </p>
                              <p className="text-xs text-green-600">
                                Cumulative: {data.cumulativePercentage.toFixed(2)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="importance" 
                      fill="#3b82f6" 
                      name="Importance"
                      radius={[6, 6, 0, 0]}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cumulativePercentage" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Cumulative %"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <ReferenceLine 
                      yAxisId="right" 
                      y={80} 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{ value: '80%', position: 'right', fill: '#f59e0b', fontSize: 11 }}
                    />
                    <ReferenceLine 
                      yAxisId="right" 
                      y={90} 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{ value: '90%', position: 'right', fill: '#ef4444', fontSize: 11 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Distribution + Category Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              {/* Importance Distribution Histogram */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Importance Distribution
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Shows how importance scores are distributed across all {featureImportance.length} features.
                </p>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={distributionData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="range" 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Importance Range', position: 'insideBottom', offset: -10, style: { fontSize: 12 } }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Feature Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                              <p className="font-bold text-gray-800 mb-2 text-sm">{data.range}</p>
                              <p className="text-xs text-gray-600 mb-2">{data.count} features</p>
                              {data.features.length > 0 && (
                                <div className="text-xs text-gray-500 max-h-32 overflow-y-auto">
                                  <p className="font-semibold mb-1">Features:</p>
                                  <ul className="list-disc list-inside">
                                    {data.features.slice(0, 5).map((f: string, i: number) => (
                                      <li key={i}>{truncateLabel(f, 30)}</li>
                                    ))}
                                    {data.features.length > 5 && (
                                      <li>... and {data.features.length - 5} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8b5cf6" 
                      name="Feature Count"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Feature Categories
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Features grouped by category (Inventory, Sales, Supply Chain, Risk).
                </p>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 11 }}
                      label={{ value: '', position: 'insideBottom', offset: -10, style: { fontSize: 12 } }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Total Importance', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                              <p className="font-bold text-gray-800 mb-2 text-sm">{data.category}</p>
                              <p className="text-xs text-gray-600">Features: {data.count}</p>
                              <p className="text-xs text-gray-600">Total Importance: {(data.totalImportance * 100).toFixed(1)}%</p>
                              <p className="text-xs text-gray-600">Avg Importance: {(data.avgImportance * 100).toFixed(1)}%</p>
                              {data.features.length > 0 && (
                                <div className="text-xs text-gray-500 mt-2 max-h-32 overflow-y-auto">
                                  <p className="font-semibold mb-1">Features:</p>
                                  <ul className="list-disc list-inside">
                                    {data.features.slice(0, 5).map((f: string, i: number) => (
                                      <li key={i}>{truncateLabel(f, 25)}</li>
                                    ))}
                                    {data.features.length > 5 && (
                                      <li>... and {data.features.length - 5} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="totalImportance" 
                      fill="#ec4899" 
                      name="Total Importance"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3: Searchable Table */}
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 sm:mb-0">
                  Feature Importance Table ({featureImportance.length} features)
                </h3>
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold text-gray-700">Rank</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Feature Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Importance</th>
                      <th className="text-left p-3 font-semibold text-gray-700 hidden lg:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.length > 0 ? (
                      filteredFeatures.map((feature, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-3 text-gray-600 font-medium">{index + 1}</td>
                          <td className="p-3 font-semibold text-gray-800">{feature.featureName}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${feature.importance * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-700 min-w-[50px]">
                                {(feature.importance * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600 hidden lg:table-cell">
                            {feature.description}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">
                          No features found matching "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Row 4: Top Feature Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
              {sortedFeatures.slice(0, 6).map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{feature.featureName}</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
                  {feature.insights && feature.insights.length > 0 && (
                    <ul className="text-xs text-gray-500 space-y-1">
                      {feature.insights.slice(0, 2).map((insight, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2 text-blue-500">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Correlation Analysis */}
        {correlation && correlation.correlations && correlation.correlations.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Feature Correlation Matrix
              </h2>
              <div className="text-sm text-gray-600 mb-4">
                Correlation matrix showing relationships between delivery features.
              </div>
              {/* TODO: Add heatmap visualization for correlation matrix */}
              <div className="grid grid-cols-5 gap-2">
                {correlation.correlations.slice(0, 25).map((point, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded text-center text-xs"
                    style={{
                      backgroundColor: point.value > 0 
                        ? `rgba(34, 197, 94, ${Math.abs(point.value)})` 
                        : `rgba(239, 68, 68, ${Math.abs(point.value)})`
                    }}
                  >
                    {point.x} - {point.y}: {point.value.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Legacy Correlation Analysis - Only show when distribution data is available */}
        {correlation && 
         correlation.potentialIssueDistribution && 
         correlation.deckRiskDistribution && 
         correlation.oeConstraintDistribution && 
         correlation.ppapRiskDistribution && 
         correlation.leadTimeDistribution && 
         correlation.inventoryLevelDistribution && (
          <>
            {/* Risk Factors Analysis */}
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Risk Factors vs Backorder Rate
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Potential Issue */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Potential Issue</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={calculateBackorderRate(correlation.potentialIssueDistribution || [])}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="count" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="backorderCount" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Deck Risk */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Deck Risk</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={calculateBackorderRate(correlation.deckRiskDistribution || [])}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="count" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="backorderCount" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* OE Constraint */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">OE Constraint</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={calculateBackorderRate(correlation.oeConstraintDistribution || [])}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="count" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="backorderCount" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* PPAP Risk */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">PPAP Risk</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={calculateBackorderRate(correlation.ppapRiskDistribution || [])}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="count" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="backorderCount" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Lead Time and Inventory Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Lead Time Distribution */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Lead Time Impact
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={calculateBackorderRate(correlation.leadTimeDistribution || [])}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name="Total"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="backorderRate"
                      stroke="#ef4444"
                      name="Rate %"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Inventory Level Distribution */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Inventory Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={correlation.inventoryLevelDistribution as any[] || []}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry: any) => `${entry.category}: ${entry.count}`}
                      outerRadius={85}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      style={{ fontSize: '12px', fontWeight: 500 }}
                    >
                      {(correlation.inventoryLevelDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ fontSize: '12px' }}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart for Risk Assessment */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Risk Factor Radar
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={[
                      {
                        factor: 'Potential Issue',
                        backorderRate:
                          ((correlation.potentialIssueDistribution || []).reduce(
                            (sum: number, item: CategoryDistribution) => sum + item.backorderCount,
                            0
                          ) /
                            (correlation.potentialIssueDistribution || []).reduce(
                              (sum: number, item: CategoryDistribution) => sum + item.count,
                              0
                            )) *
                          100,
                      },
                      {
                        factor: 'Deck Risk',
                        backorderRate:
                          ((correlation.deckRiskDistribution || []).reduce(
                            (sum: number, item: CategoryDistribution) => sum + item.backorderCount,
                            0
                          ) /
                            (correlation.deckRiskDistribution || []).reduce(
                              (sum: number, item: CategoryDistribution) => sum + item.count,
                              0
                            )) *
                          100,
                      },
                      {
                        factor: 'OE Constraint',
                        backorderRate:
                          ((correlation.oeConstraintDistribution || []).reduce(
                            (sum: number, item: CategoryDistribution) => sum + item.backorderCount,
                            0
                          ) /
                            (correlation.oeConstraintDistribution || []).reduce(
                              (sum: number, item: CategoryDistribution) => sum + item.count,
                              0
                            )) *
                          100,
                      },
                      {
                        factor: 'PPAP Risk',
                        backorderRate:
                          ((correlation.ppapRiskDistribution || []).reduce(
                            (sum: number, item: CategoryDistribution) => sum + item.backorderCount,
                            0
                          ) /
                            (correlation.ppapRiskDistribution || []).reduce(
                              (sum: number, item: CategoryDistribution) => sum + item.count,
                              0
                            )) *
                          100,
                      },
                    ]}
                  >
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 50]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Rate %"
                      dataKey="backorderRate"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
