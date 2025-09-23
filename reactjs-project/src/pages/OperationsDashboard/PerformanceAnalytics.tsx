import { useState, useEffect, useCallback } from 'react';
import GlassCard from '../../components/GlassCard';
import PerformanceStatCards from './PerformanceStatCards';
import RecentOrdersTable from './RecentOrdersTable';
import GlassButton from '../../components/GlassButton';
import { operationsAPI} from '../../services/operationsAPI';
import type { Order } from '../../types/dashboard';

const ITEMS_PER_PAGE = 10;

interface PerformanceMetrics {
  deliverySuccessRate: number;
  avgDeliveryTime: number;
  costPerKm: number;
  totalDistanceKm: number;
  onTimeDeliveryRate: number;
  fuelEfficiency: number;
  target: {
    deliverySuccessRate: number;
    avgDeliveryTime: number;
    costPerKm: number;
  };
}

export default function PerformanceAnalytics() {
  // Hàm làm mới dữ liệu hiệu suất và đơn hàng
  const handleRefresh = async () => {
    setLoading(true);
    setOrdersLoading(true);
    await Promise.all([
      fetchMetricsData(),
      fetchOrdersData(0, selectedStatus)
    ]);
    setLoading(false);
    setOrdersLoading(false);
    setCurrentPage(0);
  };
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchMetricsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call real API endpoint for performance metrics
      const response = await fetch('http://localhost:8080/api/operations/performance-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setError('');
      
      console.log('📊 Performance metrics from API:', data);
      
    } catch (error) {
      console.error('Failed to fetch metrics data:', error);
      
      // Fallback to sample data if API fails
      setMetrics({
        deliverySuccessRate: 94.5,
        avgDeliveryTime: 45, // 45 minutes
        costPerKm: 12500,
        totalDistanceKm: 2500, // 2500 km total transported
        onTimeDeliveryRate: 87.3,
        fuelEfficiency: 8.5,
        target: {
          deliverySuccessRate: 95,
          avgDeliveryTime: 60, // 60 minutes target
          costPerKm: 13000,
        }
      });
      setError('Đang sử dụng dữ liệu mẫu do lỗi kết nối API.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch orders data separately
  const fetchOrdersData = useCallback(async (page: number, status?: string) => {
    try {
      setOrdersLoading(true);
      const ordersResponse = await operationsAPI.getOrdersForOperations(page, ITEMS_PER_PAGE, status);
      
      setRecentOrders(ordersResponse.content);
      setTotalPages(ordersResponse.totalPages);
      setTotalElements(ordersResponse.totalElements);
    } catch (err) {
      setError('Lỗi khi tải danh sách đơn hàng');
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Function to handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchOrdersData(newPage, selectedStatus);
  }, [selectedStatus, fetchOrdersData]);

  // Function to handle status filter change
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setCurrentPage(0); // Reset to first page when filter changes
    fetchOrdersData(0, status); // Fetch with new filter
  }, [fetchOrdersData]);

  useEffect(() => {
    // Fetch metrics data on initial load and when timeRange changes
    fetchMetricsData();
  }, [fetchMetricsData]);

  useEffect(() => {
    // Fetch orders data when selectedStatus changes
    fetchOrdersData(0, selectedStatus);
    setCurrentPage(0); // Reset page when status changes
  }, [selectedStatus, fetchOrdersData]);

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
      trend: Number((((metrics.costPerKm - metrics.target.costPerKm) / metrics.target.costPerKm) * 100).toFixed(1))
    },
    { 
      metric: 'Tổng số km đã vận chuyển', 
      current: metrics.totalDistanceKm, 
      target: 0, // No target for total distance as it's cumulative
      trend: 0 // No trend for total distance as it's cumulative
    },
  ] : [];

  return (
  <GlassCard className="space-y-6">
      {error && (
        <div className="bg-yellow-500/30 border border-yellow-400/50 text-yellow-800 p-4 rounded-lg">
          ⚠️ {error}
        </div>
      )}


      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Phân tích hiệu suất</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <GlassButton
                key={status}
                size="sm"
                variant={selectedStatus === status ? 'primary' : 'secondary'}
                onClick={() => handleStatusChange(status)}
              >
                {status}
              </GlassButton>
            ))}
          </div>
          <GlassButton onClick={handleRefresh} size="sm" variant="primary" className="whitespace-nowrap self-start sm:self-auto" disabled={loading || ordersLoading}>
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4.93 19.07a10 10 0 1 0 0-14.14M4 4v5h5"/></svg>
              Làm mới
            </span>
          </GlassButton>
        </div>
      </div>

      <PerformanceStatCards performanceData={performanceData} />

  {/* Bảng đơn hàng - không cần filter nữa vì đã filter ở backend */}
  <RecentOrdersTable
    orders={recentOrders}
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
