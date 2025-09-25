import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../../components/GlassCard';
import StatCard from '../../components/StatCard';
import DataTable, { TableRow, TableCell } from '../../components/DataTable';
import GlassButton from '../../components/GlassButton';
import { operationsAPI } from '../../services/operationsAPI';
import { fetchVehicleStats } from '../../services/VehicleListAPI';
import { OperationsMetricsService } from '../../services/operationsMetricsService';
import { Truck } from 'lucide-react';
import { FaRegPlayCircle } from 'react-icons/fa';
import { LiaClipboardListSolid } from 'react-icons/lia';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
export default function ResourceMonitoring() {
    const { t } = useTranslation();
    const [timeFilter, setTimeFilter] = useState('24h');
    const [vehicles, setVehicles] = useState([]);
    const [vehicleMetrics, setVehicleMetrics] = useState({
        active: 0,
        total: 0,
        percentage: 0,
        ratio: '0/0'
    });
    const [maintenanceRequestsCount, setMaintenanceRequestsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Show 5 vehicles per page
    useEffect(() => {
        fetchVehicles(timeFilter);
        fetchMaintenanceRequestsCount();
    }, [timeFilter]);
    // Test translation keys on component mount
    useEffect(() => {
        console.log('🧪 Testing translation keys on ResourceMonitoring mount:');
        console.log('dashboard.fleet.status.available:', t('dashboard.fleet.status.available'));
        console.log('dashboard.fleet.status.inUse:', t('dashboard.fleet.status.inUse'));
        console.log('dashboard.fleet.status.underMaintenance:', t('dashboard.fleet.status.underMaintenance'));
        console.log('dashboard.fleet.notAssigned:', t('dashboard.fleet.notAssigned'));
        console.log('Testing correct keys:');
        console.log('dashboard.fleet.status.available:', t('dashboard.fleet.status.available'));
        console.log('dashboard.fleet.status.inUse:', t('dashboard.fleet.status.inUse'));
        console.log('dashboard.fleet.status.underMaintenance:', t('dashboard.fleet.status.underMaintenance'));
        console.log('dashboard.fleet.notAssigned:', t('dashboard.fleet.notAssigned'));
    }, [t]);
    // Reset to first page when vehicles data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [vehicles.length]);
    // Thêm function để fetch maintenance requests count
    const fetchMaintenanceRequestsCount = async () => {
        try {
            const result = await operationsAPI.getMaintenanceRequestsCount();
            setMaintenanceRequestsCount(result.count);
            console.log('📊 Maintenance requests count:', result.count);
        }
        catch (error) {
            console.warn('Unable to get maintenance requests count:', error);
            setMaintenanceRequestsCount(0);
        }
    };
    // Thêm tham số filter thời gian
    const fetchVehicles = async (filter = '24h') => {
        try {
            setLoading(true);
            // Luôn lấy tổng số xe từ database trước
            let totalVehiclesFromDB = 0;
            try {
                // Nếu backend hỗ trợ filter thời gian, truyền filter vào đây
                const { totalRecords } = await fetchVehicleStats( /* filter */);
                totalVehiclesFromDB = totalRecords;
                console.log('📊 Total vehicles from database:', totalVehiclesFromDB, 'with filter:', filter);
            }
            catch (error) {
                console.warn('Unable to get total vehicles from database:', error);
            }
            // Lấy vehicle metrics từ OperationsMetricsService (giống như trang overview)
            try {
                // Nếu backend hỗ trợ filter thời gian, truyền filter vào đây
                const metrics = await OperationsMetricsService.getActiveVehiclesRatio( /* filter */);
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
            }
            catch (error) {
                console.warn('Unable to get vehicle metrics from OperationsMetricsService:', error);
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
                const transformedVehicles = data.map((vehicle) => ({
                    id: String(vehicle.id || ''),
                    name: String(vehicle.name || ''),
                    type: vehicle.type,
                    status: vehicle.status,
                    statusDisplay: String(vehicle.statusDisplay || vehicle.status || ''),
                    statusCode: vehicle.statusCode || '',
                    statusDescription: vehicle.statusDescription || '',
                    created_at: vehicle.created_at || '',
                    fuel: Number(vehicle.fuel) || 0,
                    location: vehicle.location || { lat: 0, lng: 0, address: 'Not specified' },
                    mileage: Number(vehicle.mileage) || 0,
                    lastMaintenance: String(vehicle.lastMaintenance || ''),
                    nextMaintenance: String(vehicle.nextMaintenance || ''),
                    driver: vehicle.driver || undefined
                }));
                setVehicles(transformedVehicles);
                console.log('📋 Transformed vehicles:', transformedVehicles);
            }
            catch (error) {
                console.error('❌ Failed to fetch vehicles from API:', error);
                setError('Unable to load vehicle data from server');
                setVehicles([]); // Clear vehicles instead of using mock data
            }
            setError('');
        }
        catch (globalError) {
            setError('Unable to load vehicle data. Please try again later.');
            console.error('Global error in fetchVehicles:', globalError);
            // Clear all data on global error
            setVehicleMetrics({
                active: 0,
                total: 0,
                percentage: 0,
                ratio: '0/0'
            });
            setVehicles([]);
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        // Handle English status codes
        switch (status) {
            case 'AVAILABLE': return 'text-green-600';
            case 'IN_USE': return 'text-blue-600';
            case 'MAINTENANCE': return 'text-yellow-600';
            case 'MAINTENANCE_PENDING': return 'text-orange-600';
        }
        // Handle Vietnamese status display names from backend
        switch (status) {
            case 'Sẵn sàng': return 'text-green-600';
            case 'Đang sử dụng': return 'text-blue-600';
            case 'Bảo trì': return 'text-yellow-600';
            case 'Đang bảo trì': return 'text-yellow-600';
            case 'Chờ bảo trì': return 'text-orange-600';
            default: return 'text-gray-800';
        }
    };
    const getStatusText = (status) => {
        console.log('🔍 ResourceMonitoring - getStatusText input:', status, 'type:', typeof status);
        if (!status) {
            console.log('❌ ResourceMonitoring - Empty status, returning unknown');
            return t('common.unknown');
        }
        // Handle cases where backend returns translation keys (shouldn't happen but let's handle it)
        if (typeof status === 'string' && status.includes('dashboard.fleet.status.')) {
            console.log('🎯 ResourceMonitoring - Found dashboard.fleet.status translation key:', status);
            const result = t(status);
            console.log('🎯 Translation result:', result);
            return result;
        }
        // Also handle fleet.status keys
        if (typeof status === 'string' && status.includes('fleet.status.')) {
            console.log('🎯 ResourceMonitoring - Found fleet.status translation key:', status);
            const result = t(status);
            console.log('🎯 Translation result:', result);
            return result;
        }
        // Convert to uppercase for consistency
        const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
        // Handle English status codes
        switch (normalizedStatus) {
            case 'AVAILABLE':
            case 'SẴN SÀNG':
                return t('dashboard.fleet.status.available');
            case 'IN_USE':
            case 'INUSE':
            case 'IN USE':
            case 'ĐANG SỬ DỤNG':
                return t('dashboard.fleet.status.inUse');
            case 'MAINTENANCE':
            case 'UNDER_MAINTENANCE':
            case 'UNDERMAINTENANCE':
            case 'BẢO TRÌ':
            case 'ĐANG BẢO TRÌ':
                return t('dashboard.fleet.status.underMaintenance');
            case 'MAINTENANCE_PENDING':
            case 'MAINTENANCEPENDING':
            case 'NEED_MAINTENANCE':
            case 'CHỜ BẢO TRÌ':
                return t('dashboard.fleet.status.needMaintenance');
            default:
                console.log('ResourceMonitoring - No match for status:', status, 'normalized:', normalizedStatus);
                // Last resort: if it looks like a translation key, try to translate it
                if (typeof status === 'string' && (status.includes('status.') || status.includes('fleet.'))) {
                    console.log('ResourceMonitoring - Attempting to translate as key:', status);
                    try {
                        const translated = t(status);
                        if (translated !== status) {
                            return translated;
                        }
                    }
                    catch (e) {
                        console.log('ResourceMonitoring - Translation failed:', e);
                    }
                }
                return String(status);
        }
    };
    const getTypeText = (type) => {
        console.log('ResourceMonitoring - getTypeText input:', type);
        // Handle cases where backend returns translation keys
        if (typeof type === 'string' && type.startsWith('fleet.vehicleTypes.')) {
            console.log('ResourceMonitoring - Found translation key in type, using t() directly');
            return t(type);
        }
        switch (type) {
            case 'TRUCK': return t('fleet.vehicleTypes.truck');
            case 'VAN': return t('fleet.vehicleTypes.van');
            case 'MOTORCYCLE': return t('fleet.vehicleTypes.motorcycle');
            case 'CAR': return t('fleet.vehicleTypes.car');
            default:
                console.log('ResourceMonitoring - No match for type:', type, 'returning as-is');
                return type;
        }
    };
    // Calculate stats from vehicleMetrics (sử dụng dữ liệu từ OperationsMetricsService giống như trang overview)
    const totalVehicles = vehicleMetrics.total;
    const activeVehicles = vehicleMetrics.active;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;
    // Pagination calculations
    const totalPages = Math.ceil(vehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Get paginated vehicles
    const getPaginatedVehicles = () => {
        return vehicles.slice(startIndex, endIndex);
    };
    if (loading) {
        return (_jsx(GlassCard, { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-gray-800 text-lg", children: [t('common.loading'), "..."] }) }));
    }
    return (_jsxs(GlassCard, { className: "space-y-6", children: [error && (_jsxs("div", { className: "bg-yellow-500/30 border border-yellow-400/50 text-yellow-800 p-4 rounded-lg", children: ["\u26A0\uFE0F ", error] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-800", children: t('dashboard.operations.tabs.monitoring') }), _jsxs("div", { className: "flex gap-2", children: [['24h', '7d', '1m'].map((period) => (_jsx(GlassButton, { size: "sm", variant: timeFilter === period ? 'primary' : 'secondary', onClick: () => setTimeFilter(period), children: period === '1m' ? '1 month' : period }, period))), _jsxs(GlassButton, { size: "sm", variant: "secondary", onClick: () => {
                                    fetchVehicles(timeFilter);
                                    fetchMaintenanceRequestsCount();
                                }, children: ["\uD83D\uDD04 ", t('common.refresh')] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(StatCard, { title: t('dashboard.operations.monitoring.totalVehicles', 'Total Vehicles'), value: totalVehicles.toString(), icon: _jsx(Truck, { size: 24, color: "#f59e0b" }), trend: { value: 8.2, isPositive: true } }), _jsx(StatCard, { title: "Active", value: activeVehicles.toString(), icon: _jsx(FaRegPlayCircle, { size: 24, color: "#10b981" }), subtitle: `${vehicleMetrics.percentage}% of total` }), _jsx(StatCard, { title: "In Maintenance", value: maintenanceVehicles.toString(), icon: _jsx(HiOutlineWrenchScrewdriver, { size: 24, color: "#6B7280" }), subtitle: `${totalVehicles > 0 ? Math.round((maintenanceVehicles / totalVehicles) * 100) : 0}% of total` }), _jsx(StatCard, { title: t('dashboard.operations.monitoring.maintenanceRequests', 'Maintenance Requests'), value: maintenanceRequestsCount.toString(), icon: _jsx(LiaClipboardListSolid, { size: 24, color: "#3B82F6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-800", children: t('dashboard.operations.monitoring.resourceDetails', 'Resource Details') }), _jsx(DataTable, { headers: [t('dashboard.operations.monitoring.headers.vehicleName', 'Vehicle Name'), t('dashboard.operations.monitoring.headers.type', 'Type'), t('dashboard.operations.monitoring.headers.driver', 'Driver'), t('dashboard.operations.monitoring.headers.status', 'Status'), t('dashboard.operations.monitoring.headers.createdDate', 'Created Date')], children: getPaginatedVehicles().map((vehicle) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: vehicle.name }), _jsxs("div", { className: "text-gray-600 text-xs", children: ["ID: ", vehicle.id] })] }), _jsx(TableCell, { children: getTypeText(vehicle.type) }), _jsx(TableCell, { children: vehicle.driver ? (_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: vehicle.driver.name }), _jsx("div", { className: "text-gray-600 text-xs", children: vehicle.driver.phone })] })) : (_jsx("span", { className: "text-gray-600", children: (() => {
                                            // Handle case where backend might return translation keys for notAssigned
                                            const driverText = vehicle.driver || 'dashboard.fleet.notAssigned';
                                            if (typeof driverText === 'string' && driverText.includes('dashboard.fleet.notAssigned')) {
                                                return t('dashboard.fleet.notAssigned');
                                            }
                                            return t('dashboard.fleet.notAssigned');
                                        })() })) }), _jsx(TableCell, { children: _jsx("span", { className: `font-medium ${getStatusColor(vehicle.statusDisplay || vehicle.status)}`, children: (() => {
                                            const status = vehicle.statusDisplay || vehicle.status;
                                            console.log('Table rendering - raw status:', status);
                                            const result = getStatusText(status);
                                            console.log('Table rendering - translated status:', result);
                                            return result;
                                        })() }) }), _jsx(TableCell, { children: _jsx("span", { className: "text-xs text-gray-700", children: vehicle.created_at }) })] }, vehicle.id))) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between mt-6 pt-4 border-t border-gray-200/30", children: [_jsx("div", { className: "text-sm text-gray-600 font-medium", children: t('dashboard.operations.monitoring.pagination.showing', 'Showing {{start}}-{{end}} of {{total}} vehicles', {
                                    start: startIndex + 1,
                                    end: Math.min(endIndex, vehicles.length),
                                    total: vehicles.length
                                }) }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(GlassButton, { size: "sm", variant: "secondary", onClick: () => setCurrentPage(prev => Math.max(prev - 1, 1)), disabled: currentPage === 1, className: `px-3 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'}`, children: ["\u2190 ", t('common.previous', 'Previous')] }), _jsx("div", { className: "flex items-center gap-1 mx-2", children: Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let page;
                                            if (totalPages <= 5) {
                                                page = i + 1;
                                            }
                                            else if (currentPage <= 3) {
                                                page = i + 1;
                                            }
                                            else if (currentPage >= totalPages - 2) {
                                                page = totalPages - 4 + i;
                                            }
                                            else {
                                                page = currentPage - 2 + i;
                                            }
                                            return (_jsx(GlassButton, { size: "sm", variant: currentPage === page ? 'primary' : 'secondary', onClick: () => setCurrentPage(page), className: `min-w-[36px] h-9 ${currentPage === page
                                                    ? 'bg-blue-500/80 text-white font-semibold ring-2 ring-blue-400/50'
                                                    : 'hover:bg-white/20'}`, children: page }, page));
                                        }) }), _jsxs(GlassButton, { size: "sm", variant: "secondary", onClick: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages, className: `px-3 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'}`, children: [t('common.next', 'Next'), " \u2192"] })] })] }))] })] }));
}
