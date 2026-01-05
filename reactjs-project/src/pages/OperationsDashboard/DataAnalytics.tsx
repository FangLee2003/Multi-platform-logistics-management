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
import GlassCard from '../../components/GlassCard';
import {
  AnalyticsOverview,
  CorrelationAnalysis,
  FeatureImportance,
  CategoryDistribution,
  BackorderPrediction,
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
  const [backorderPredictions, setBackorderPredictions] = useState<BackorderPrediction[]>([]);
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

      const [overviewData, correlationData, featuresData, predictionsData] = await Promise.all([
        analyticsAPI.getAnalyticsOverview(),
        analyticsAPI.getCorrelationAnalysis(),
        analyticsAPI.getFeatureImportance(),
        analyticsAPI.getBackorderPredictions(20),
      ]);

      console.log('✅ Analytics data loaded:', { overviewData, correlationData, featuresData, predictionsData });

      setOverview(overviewData);
      setCorrelation(correlationData);
      setFeatureImportance(featuresData);
      setBackorderPredictions(predictionsData);

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
      nonBackorderCount: item.count - item.backorderCount,
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
    <GlassCard className="space-y-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Data Analytics - QNN Backorder Prediction
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Comprehensive analysis of product features for backorder prediction using AI/ML
          </p>
        </div>

        {/* Action Summary Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Total Products</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {overview.totalProducts?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Backorder Rate</h3>
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {overview.backorderRate?.toFixed(2) || '0'}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">High Priority Items</h3>
              <p className="text-2xl md:text-3xl font-bold text-red-600">
                {Math.floor(overview.backorderProducts * 0.3)?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Cần nhập ngay</p>
            </div>
            <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500 hover:shadow-md transition-shadow">
              <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">Predicted Safe Stock</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {overview.nonBackorderProducts?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Đủ tồn kho</p>
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
          {/* Row 1: Backorder Prediction List */}
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Backorder Prediction - Products Need Action</h3>
                  <p className="text-xs text-gray-600 mt-1">Danh sách sản phẩm được dự đoán sẽ thiếu hàng - cần nhập thêm</p>
                </div>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {backorderPredictions.length} items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left p-3 font-semibold text-gray-700 whitespace-nowrap">SKU</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">In Transit</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Past Due</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Rec. Qty</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Sales 3M</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Perf 6M</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Priority</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Flags</th>
                      <th className="text-center p-3 font-semibold text-gray-700 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backorderPredictions.length > 0 ? (
                      backorderPredictions.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                          <td className="p-2 font-mono text-xs text-gray-700">{item.sku}</td>
                          
                          {/* In Transit */}
                          <td className="p-2 text-center">
                            {item.inTransitQty && item.inTransitQty > 0 ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                                {Math.round(item.inTransitQty)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          
                          {/* Pieces Past Due */}
                          <td className="p-2 text-center">
                            {item.piecesPastDue && item.piecesPastDue > 0 ? (
                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold">
                                {Math.round(item.piecesPastDue)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          
                          {/* Recommended Qty */}
                          <td className="p-2 text-center">
                            <span className="text-green-600 font-bold text-sm">{item.recommendedQty}</span>
                          </td>
                          
                          {/* Sales 3 Month */}
                          <td className="p-2 text-center">
                            <span className="text-gray-600 text-xs">{Math.round(item.sales3Month || 0)}</span>
                          </td>
                          
                          {/* Perf 6 Month Avg */}
                          <td className="p-2 text-center">
                            {item.perf6MonthAvg !== undefined && item.perf6MonthAvg !== null && item.perf6MonthAvg !== -99 ? (
                              <span className={`text-xs font-semibold ${
                                item.perf6MonthAvg >= 0.9 ? 'text-green-600' :
                                item.perf6MonthAvg >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {(item.perf6MonthAvg * 100).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          
                          {/* Priority */}
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                              item.priority === 'High' ? 'bg-red-100 text-red-800' : 
                              item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                          
                          {/* Flags */}
                          <td className="p-2 text-center">
                            <div className="flex flex-col gap-0.5">
                              {item.stopAutoBuy === 'Yes' && (
                                <span className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-[10px] font-semibold">
                                  STOP
                                </span>
                              )}
                              {item.revStop === 'Yes' && (
                                <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-[10px] font-semibold">
                                  REV
                                </span>
                              )}
                              {item.stopAutoBuy !== 'Yes' && item.revStop !== 'Yes' && (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          
                          {/* Action */}
                          <td className="p-2 text-center">
                            <button 
                              className="bg-blue-500/90 hover:bg-blue-600 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm hover:shadow-md whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                              disabled={item.stopAutoBuy === 'Yes' || item.revStop === 'Yes'}
                              title={item.stopAutoBuy === 'Yes' || item.revStop === 'Yes' ? 'Cannot order - blocked by flags' : 'Place order'}
                            >
                              {item.stopAutoBuy === 'Yes' || item.revStop === 'Yes' ? 'Blocked' : 'Order'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-gray-500">
                          No backorder predictions available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Row 2: Feature Categories + Top 6 Insight Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Feature Categories */}
              <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Feature Categories
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Phân loại features theo nhóm (Inventory, Sales, Supply Chain, Risk).
                </p>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                    data={categoryData}
                    margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11 }}
                      angle={-15}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}
                      formatter={(value: any) => `${(Number(value) * 100).toFixed(1)}%`}
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

              {/* Top 5 Feature Insight Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 gap-2.5 content-start" style={{ maxHeight: '460px' }}>
                {sortedFeatures.slice(0, 6).map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow flex-1"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-gray-800 text-xs leading-tight">{truncateLabel(feature.featureName, 20)}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ml-1">
                        {(feature.importance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">{truncateLabel(feature.description, 80)}</p>
                  </div>
                ))}
              </div>
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
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Potential Issue (Vấn đề tiềm ẩn)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={calculateBackorderRate(correlation.potentialIssueDistribution || [])}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Backorder') return [value, 'Backorder'];
                            if (name === 'Non-Backorder') return [value, 'Không Backorder'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="nonBackorderCount" stackId="a" fill="#10b981" name="Non-Backorder" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="backorderCount" stackId="a" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Deck Risk */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Deck Risk (Rủi ro kho/bến)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={calculateBackorderRate(correlation.deckRiskDistribution || [])}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Backorder') return [value, 'Backorder'];
                            if (name === 'Non-Backorder') return [value, 'Không Backorder'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="nonBackorderCount" stackId="a" fill="#10b981" name="Non-Backorder" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="backorderCount" stackId="a" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* OE Constraint */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">OE Constraint (Ràng buộc OE)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={calculateBackorderRate(correlation.oeConstraintDistribution || [])}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Backorder') return [value, 'Backorder'];
                            if (name === 'Non-Backorder') return [value, 'Không Backorder'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="nonBackorderCount" stackId="a" fill="#10b981" name="Non-Backorder" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="backorderCount" stackId="a" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* PPAP Risk */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">PPAP Risk (Rủi ro PPAP)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={calculateBackorderRate(correlation.ppapRiskDistribution || [])}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Backorder') return [value, 'Backorder'];
                            if (name === 'Non-Backorder') return [value, 'Không Backorder'];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="nonBackorderCount" stackId="a" fill="#10b981" name="Non-Backorder" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="backorderCount" stackId="a" fill="#ef4444" name="Backorder" radius={[4, 4, 0, 0]} />
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
    </GlassCard>
  );
}
