import { useState, useEffect } from 'react';
import GlassCard from '../../components/GlassCard';
import StatCard from '../../components/StatCard';
import DataTable, { TableRow, TableCell } from '../../components/DataTable';
import GlassButton from '../../components/GlassButton';
import { operationsAPI } from '../../services/operationsAPI';
import type { Vehicle } from '../../types/dashboard';
import { fetchVehicleStats } from '../../services/VehicleListAPI';
import { OperationsMetricsService } from '../../services/operationsMetricsService';

export default function ResourceMonitoring() {
  const [timeFilter, setTimeFilter] = useState('24h');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleMetrics, setVehicleMetrics] = useState({
    active: 0,
    total: 0,
    percentage: 0,
    ratio: '0/0'
  });
  const [maintenanceRequestsCount, setMaintenanceRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles(timeFilter);
    fetchMaintenanceRequestsCount();
  }, [timeFilter]);

  // Thêm function để fetch maintenance requests count
  const fetchMaintenanceRequestsCount = async () => {
    try {
      const result = await operationsAPI.getMaintenanceRequestsCount();
      setMaintenanceRequestsCount(result.count);
      console.log('📊 Maintenance requests count:', result.count);
    } catch (error) {
      console.warn('Không thể lấy số yêu cầu bảo trì:', error);
      setMaintenanceRequestsCount(0);
    }
  };

  // Thêm tham số filter thời gian
  const fetchVehicles = async (filter: string = '24h') => {
    try {
      setLoading(true);
      
      // Luôn lấy tổng số xe từ database trước
      let totalVehiclesFromDB = 0;
      try {
        // Nếu backend hỗ trợ filter thời gian, truyền filter vào đây
        const { totalRecords } = await fetchVehicleStats(/* filter */);
        totalVehiclesFromDB = totalRecords;
        console.log('📊 Total vehicles from database:', totalVehiclesFromDB, 'with filter:', filter);
      } catch (error) {
        console.warn('Không thể lấy tổng số xe từ database:', error);
      }
      
      // Lấy vehicle metrics từ OperationsMetricsService (giống như trang overview)
      try {
        // Nếu backend hỗ trợ filter thời gian, truyền filter vào đây
        const metrics = await OperationsMetricsService.getActiveVehiclesRatio(/* filter */);
        console.log('📊 Vehicle metrics from OperationsMetricsService:', metrics, 'with filter:', filter);
        // Sử dụng total từ database nếu có, nếu không thì dùng từ metrics
        const correctedMetrics = {
          ...metrics,
          total: totalVehiclesFromDB > 0 ? totalVehiclesFromDB : metrics.total,
          percentage: totalVehiclesFromDB > 0 && metrics.active > 0 
            ? Math.round((metrics.active / totalVehiclesFromDB) * 100) 
            : metrics.percentage,
          ratio: totalVehiclesFromDB > 0 
            ? `${metrics.active}/${totalVehiclesFromDB}` 
            : metrics.ratio
        };
        setVehicleMetrics(correctedMetrics);
        console.log('📊 Corrected vehicle metrics:', correctedMetrics);
      } catch (error) {
        console.warn('Không thể lấy vehicle metrics từ OperationsMetricsService:', error);
        // Fallback: sử dụng tổng số từ database
        setVehicleMetrics({
          active: 0,
          total: totalVehiclesFromDB,
          percentage: 0,
          ratio: `0/${totalVehiclesFromDB}`
        });
      }
      
      // Lấy danh sách xe để hiển thị trong table
      try {
        console.log('📋 Fetching vehicles from operations API...');
        const data = await operationsAPI.getVehicles();
        console.log('📋 Received vehicles data:', data);
        
        // Transform data để đảm bảo compatibility với component  
        const transformedVehicles: Vehicle[] = data.map((vehicle) => ({
          id: String(vehicle.id || ''),
          name: String(vehicle.name || ''),
          type: vehicle.type as 'TRUCK' | 'VAN' | 'MOTORCYCLE',
          status: vehicle.status as 'ACTIVE' | 'MAINTENANCE' | 'IDLE' | 'OUT_OF_SERVICE',
          statusDisplay: String(vehicle.statusDisplay || vehicle.status || ''),
          statusCode: vehicle.statusCode || '',
          statusDescription: vehicle.statusDescription || '',
          created_at: vehicle.created_at || '',
          fuel: Number(vehicle.fuel) || 0,
          location: vehicle.location || { lat: 0, lng: 0, address: 'Chưa xác định' },
          mileage: Number(vehicle.mileage) || 0,
          lastMaintenance: String(vehicle.lastMaintenance || ''),
          nextMaintenance: String(vehicle.nextMaintenance || ''),
          driver: vehicle.driver || undefined
        }));
        
        setVehicles(transformedVehicles);
        console.log('📋 Transformed vehicles:', transformedVehicles);
      } catch (error) {
        console.error('❌ Failed to fetch vehicles from API:', error);
        setError('Không thể tải dữ liệu xe từ server');
        setVehicles([]); // Clear vehicles instead of using mock data
      }
      
      setError('');
    } catch (globalError) {
      setError('Không thể tải dữ liệu xe. Vui lòng thử lại sau.');
      console.error('Global error in fetchVehicles:', globalError);
      
      // Clear all data on global error
      setVehicleMetrics({
        active: 0,  
        total: 0,
        percentage: 0,
        ratio: '0/0'
      });
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600';
      case 'MAINTENANCE': return 'text-yellow-600';
      case 'IDLE': return 'text-blue-600';
      case 'OUT_OF_SERVICE': return 'text-red-600';
      default: return 'text-gray-800';
    }
  };

  const getStatusText = (status: Vehicle['status']) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'IDLE': return 'Nghỉ';
      case 'OUT_OF_SERVICE': return 'Hỏng hóc';
      default: return status;
    }
  };


  const getTypeText = (type: Vehicle['type']) => {
    switch (type) {
      case 'TRUCK': return 'Xe tải';
      case 'VAN': return 'Xe van';
      case 'MOTORCYCLE': return 'Xe máy';
      default: return type;
    }
  };

  // Calculate stats from vehicleMetrics (sử dụng dữ liệu từ OperationsMetricsService giống như trang overview)
  const totalVehicles = vehicleMetrics.total;
  const activeVehicles = vehicleMetrics.active;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center h-64">
        <div className="text-gray-800 text-lg">Đang tải dữ liệu...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-6">
      {error && (
        <div className="bg-yellow-500/30 border border-yellow-400/50 text-yellow-800 p-4 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Giám sát tài nguyên</h2>
        <div className="flex gap-2">
          {['24h', '7d', '1m'].map((period) => (
            <GlassButton
              key={period}
              size="sm"
              variant={timeFilter === period ? 'primary' : 'secondary'}
              onClick={() => setTimeFilter(period)}
            >
              {period === '1m' ? '1 tháng' : period}
            </GlassButton>
          ))}
          <GlassButton size="sm" variant="secondary" onClick={() => {
            fetchVehicles(timeFilter);
            fetchMaintenanceRequestsCount();
          }}>
            🔄 Làm mới
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Tổng xe"
          value={totalVehicles.toString()}
          icon="🚛"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Đang hoạt động"
          value={activeVehicles.toString()}
          icon="✅"
          subtitle={`${vehicleMetrics.percentage}% tổng số`}
        />
        <StatCard
          title="Đang bảo trì"
          value={maintenanceVehicles.toString()}
          icon="🔧"
          subtitle={`${totalVehicles > 0 ? Math.round((maintenanceVehicles / totalVehicles) * 100) : 0}% tổng số`}
        />
        <StatCard
          title="Yêu cầu bảo trì"
          value={maintenanceRequestsCount.toString()}
          icon="🔧"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Chi tiết tài nguyên</h3>
  <DataTable headers={['Tên xe', 'Loại', 'Tài xế', 'Trạng thái', 'Ngày tạo']}>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="font-medium">{vehicle.name}</div>
                <div className="text-gray-600 text-xs">ID: {vehicle.id}</div>
              </TableCell>
              <TableCell>{getTypeText(vehicle.type)}</TableCell>
              <TableCell>
                {vehicle.driver ? (
                  <div>
                    <div className="font-medium">{vehicle.driver.name}</div>
                    <div className="text-gray-600 text-xs">{vehicle.driver.phone}</div>
                  </div>
                ) : (
                  <span className="text-gray-600">Chưa phân công</span>
                )}
              </TableCell>
              <TableCell>
                <span className={`font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.statusDisplay || getStatusText(vehicle.status)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-gray-700">{vehicle.created_at}</span>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </GlassCard>
  );
}
