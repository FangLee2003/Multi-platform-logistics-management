import { useCallback, forwardRef, useImperativeHandle } from 'react';
import MonthlyRevenueChart from '../../components/MonthlyRevenueChart';

// Interface cho metrics data
export interface MetricsData {
  todayOrders: {
    count: number;
    changePercent: number;
    trend: 'increase' | 'decrease' | 'stable';
  };
  activeVehicles: {
    active: number;
    total: number;
    percentage: number;
    ratio: string;
  };
  revenueData: {
    amount: string;
    changePercent: number;
    trend: 'increase' | 'decrease' | 'stable';
  };
  performanceData: {
    percentage: number;
    changePercent: number;
    trend: 'increase' | 'decrease' | 'stable';
  };
  lastUpdated: Date | null;
}

// Interface cho props
interface OperationsOverviewProps {
  metricsData: MetricsData;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

// Interface cho ref methods (similar to AdminDashboard)
export interface OperationsOverviewRef {
  updateMetrics: () => void;
}

const OperationsOverview = forwardRef<OperationsOverviewRef, OperationsOverviewProps>(
  ({ metricsData, isLoading, onRefresh }, ref) => {

  // Expose methods cho parent component (similar to AdminDashboard)
  useImperativeHandle(ref, () => ({
    updateMetrics: onRefresh
  }), [onRefresh]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">Đơn hàng hôm nay</h3>
            <span className="text-2xl">📦</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">{metricsData.todayOrders.count}</p>
              <p className={`text-sm mt-2 ${
                metricsData.todayOrders.trend === 'increase' ? 'text-green-600' : 
                metricsData.todayOrders.trend === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metricsData.todayOrders.changePercent > 0 ? '+' : ''}{metricsData.todayOrders.changePercent}% so với hôm qua
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">Xe đang hoạt động</h3>
            <span className="text-2xl">🚛</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">{metricsData.activeVehicles.ratio}</p>
              <p className="text-gray-600 text-sm mt-2">{metricsData.activeVehicles.percentage}% tổng số xe</p>
            </>
          )}
        </div>
        
        <div className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">Doanh thu hôm nay</h3>
            <span className="text-2xl">💰</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">{metricsData.revenueData.amount}</p>
              <p className={`text-sm mt-2 ${
                metricsData.revenueData.trend === 'increase' ? 'text-green-600' : 
                metricsData.revenueData.trend === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metricsData.revenueData.trend === 'increase' ? '+' : 
                 metricsData.revenueData.trend === 'decrease' ? '-' : ''}
                {metricsData.revenueData.changePercent.toFixed(1)}% so với hôm qua
              </p>
            </>
          )}
        </div>
        
        <div className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">Hiệu suất TB</h3>
            <span className="text-2xl">⚡</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-800">{metricsData.performanceData.percentage}%</p>
              <p className={`text-sm mt-2 ${
                metricsData.performanceData.trend === 'increase' ? 'text-green-600' : 
                metricsData.performanceData.trend === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metricsData.performanceData.trend === 'increase' ? '+' : 
                 metricsData.performanceData.trend === 'decrease' ? '-' : ''}
                {metricsData.performanceData.changePercent.toFixed(1)}% so với tuần trước
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Monthly Revenue Chart - full width */}
      <div className="w-full">
        <MonthlyRevenueChart />
      </div>

      {/* Fleet Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      </div>
    </div>
  );
});

OperationsOverview.displayName = 'OperationsOverview';

export default OperationsOverview;
