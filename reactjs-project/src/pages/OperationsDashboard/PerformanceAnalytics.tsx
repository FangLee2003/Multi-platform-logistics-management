import { useState, useEffect } from 'react';
import GlassCard from '../../components/GlassCard';
import PerformanceStatCards from './PerformanceStatCards';
import RecentOrdersTable from './RecentOrdersTable';
import GlassButton from '../../components/GlassButton';
import { operationsAPI} from '../../services/operationsAPI';
import type { Order } from '../../types/dashboard';

interface PerformanceMetrics {
  deliverySuccessRate: number;
  avgDeliveryTime: number;
  costPerKm: number;
  customerSatisfaction: number;
  onTimeDeliveryRate: number;
  fuelEfficiency: number;
  target: {
    deliverySuccessRate: number;
    avgDeliveryTime: number;
    costPerKm: number;
    customerSatisfaction: number;
  };
}

export default function PerformanceAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState('delivery');
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trạng thái filter (khớp với backend status mapping)
  const [selectedStatus, setSelectedStatus] = useState<string>('Tất cả');
  const statusOptions = [
    'Tất cả',
    'Chờ xử lý',      // Pending (ID: 1)
    'Đang xử lý',     // Processing (ID: 4)
    'Đang giao',      // Shipped (ID: 5)
    'Hoàn thành',     // Completed (ID: 2)
    'Đã hủy',         // Cancelled (ID: 3)
  ];

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(0); // 0-based for API
  const [ordersPerPage] = useState(50); // Tăng lên 50 để lấy nhiều dữ liệu hơn
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPerformanceData = async (page: number = 0) => {
    try {
      setLoading(true);
      
      // Get paginated orders from API
      const ordersResponse = await operationsAPI.getOrdersForOperations(page, ordersPerPage);
      setRecentOrders(ordersResponse.content);
      setTotalPages(ordersResponse.totalPages);
      setTotalElements(ordersResponse.totalElements);
      setCurrentPage(page);
      
      // For now, still use fallback metrics data since we haven't implemented the metrics API yet
      setMetrics({
        deliverySuccessRate: 94.5,
        avgDeliveryTime: 28,
        costPerKm: 12500,
        customerSatisfaction: 4.6,
        onTimeDeliveryRate: 87.3,
        fuelEfficiency: 8.5,
        target: {
          deliverySuccessRate: 95,
          avgDeliveryTime: 30,
          costPerKm: 13000,
          customerSatisfaction: 4.5,
        }
      });
      
      setError('');
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
      setError('Không thể tải dữ liệu hiệu suất.');
      // Don't set any fallback data - keep empty arrays/null values
      setMetrics(null);
      setRecentOrders([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    fetchPerformanceData(newPage);
  };

  useEffect(() => {
    fetchPerformanceData(0); // Start from page 0
  }, [timeRange]); // fetchPerformanceData is stable, no need to add

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center h-64">
        <div className="text-gray-800 text-lg">Đang tải dữ liệu hiệu suất...</div>
      </GlassCard>
    );
  }

  const performanceData = metrics ? [
    { 
      metric: 'Tỷ lệ giao hàng thành công', 
      current: metrics.deliverySuccessRate, 
      target: metrics.target.deliverySuccessRate, 
      trend: Number((metrics.deliverySuccessRate - metrics.target.deliverySuccessRate).toFixed(1))
    },
    { 
      metric: 'Thời gian giao hàng trung bình', 
      current: metrics.avgDeliveryTime, 
      target: metrics.target.avgDeliveryTime, 
      trend: Number((metrics.target.avgDeliveryTime - metrics.avgDeliveryTime).toFixed(1))
    },
    { 
      metric: 'Chi phí vận chuyển/km', 
      current: metrics.costPerKm, 
      target: metrics.target.costPerKm, 
      trend: Number((((metrics.target.costPerKm - metrics.costPerKm) / metrics.target.costPerKm) * 100).toFixed(1))
    },
    { 
      metric: 'Mức độ hài lòng KH', 
      current: metrics.customerSatisfaction, 
      target: metrics.target.customerSatisfaction, 
      trend: Number((((metrics.customerSatisfaction - metrics.target.customerSatisfaction) / metrics.target.customerSatisfaction) * 100).toFixed(1))
    },
  ] : [];

  return (
    <GlassCard className="space-y-6">
      {error && (
        <div className="bg-yellow-500/30 border border-yellow-400/50 text-yellow-800 p-4 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Phân tích hiệu suất</h2>
        <div className="flex gap-2">
          {[
            { key: 'delivery', label: 'Giao hàng' },
            { key: 'cost', label: 'Chi phí' },
            { key: 'time', label: 'Thời gian' },
            { key: 'quality', label: 'Chất lượng' }
          ].map((metric) => (
            <GlassButton
              key={metric.key}
              size="sm"
              variant={selectedMetric === metric.key ? 'primary' : 'secondary'}
              onClick={() => setSelectedMetric(metric.key)}
            >
              {metric.label}
            </GlassButton>
          ))}
          {['24h', '7d', '30d'].map((range) => (
            <GlassButton
              key={range}
              size="sm"
              variant={timeRange === range ? 'primary' : 'secondary'}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </GlassButton>
          ))}
        </div>
      </div>

  <PerformanceStatCards performanceData={performanceData} />

  {/* Filter trạng thái */}
  <div className="flex flex-wrap gap-2 mb-2">
    {statusOptions.map((status) => (
      <GlassButton
        key={status}
        size="sm"
        variant={selectedStatus === status ? 'primary' : 'secondary'}
        onClick={() => setSelectedStatus(status)}
      >
        {status}
      </GlassButton>
    ))}
  </div>

  {/* Bảng đơn hàng với filter trạng thái */}
  <RecentOrdersTable
    orders={selectedStatus === 'Tất cả' ? recentOrders : recentOrders.filter(o => o.status === selectedStatus)}
    onRefresh={() => fetchPerformanceData(currentPage)}
    loading={loading}
  />
  
  {/* Pagination Controls */}
  {totalPages > 1 && (
    <div className="flex justify-center items-center mt-6 space-x-2">
      <button
        onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
        disabled={currentPage === 0}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Trước
      </button>
      
      <div className="flex space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNumber = Math.max(0, currentPage - 2) + i;
          if (pageNumber >= totalPages) return null;
          
          return (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === pageNumber
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNumber + 1}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages - 1))}
        disabled={currentPage === totalPages - 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sau
      </button>
      
      <span className="text-sm text-gray-700 ml-4">
        Trang {currentPage + 1} / {totalPages} ({totalElements} đơn hàng)
      </span>
    </div>
  )}
    </GlassCard>
  );
}
