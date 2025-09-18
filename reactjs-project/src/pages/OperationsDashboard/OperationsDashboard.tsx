import { useState, useRef, useEffect, useCallback } from 'react';
import type { User } from "../../types/User";
import Sidebar, { type OperationsTab } from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ResourceMonitoring from './ResourceMonitoring';
import PerformanceAnalytics from './PerformanceAnalytics';
import StaffManagement from './StaffManagement';
import OperationsOverview, { type OperationsOverviewRef, type MetricsData } from './OperationsOverview';
import OperationsMetricsService from '../../services/operationsMetricsService';

interface OperationsDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function OperationsDashboard({ user, onLogout }: OperationsDashboardProps) {
  const [tab, setTab] = useState<OperationsTab>("overview");
  const [previousTab, setPreviousTab] = useState<OperationsTab>("overview");
  
  // Cache metrics data ở parent level (similar to AdminDashboard)
  const [metricsData, setMetricsData] = useState<MetricsData>({
    todayOrders: {
      count: 127,
      changePercent: 8.2,
      trend: 'increase'
    },
    activeVehicles: {
      active: 18,
      total: 24,
      percentage: 75,
      ratio: '18/24'
    },
    revenueData: {
      amount: '0 VND',
      changePercent: 0,
      trend: 'stable'
    },
    performanceData: {
      percentage: 0,
      changePercent: 0,
      trend: 'stable'
    },
    lastUpdated: null
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  
  // Ref để gọi update metrics từ OperationsOverview (similar to AdminDashboard) 
  const operationsOverviewRef = useRef<OperationsOverviewRef | null>(null);

  // Function để update metrics (similar to AdminDashboard's handleUserCountUpdate)
  const handleMetricsUpdate = useCallback(async () => {
    try {
      setIsLoadingMetrics(true);
      console.log("Updating metrics data...");
      const [todayOrdersResult, activeVehiclesResult, revenueResult, performanceResult] = await Promise.all([
        OperationsMetricsService.getTodayOrdersCount(true), // Force refresh
        OperationsMetricsService.getActiveVehiclesRatio(),
        OperationsMetricsService.getTodayRevenue(),
        OperationsMetricsService.getAveragePerformance()
      ]);
      
      const newMetricsData: MetricsData = {
        todayOrders: todayOrdersResult,
        activeVehicles: activeVehiclesResult,
        revenueData: revenueResult,
        performanceData: performanceResult,
        lastUpdated: new Date()
      };
      
      setMetricsData(newMetricsData);
      console.log("Metrics updated:", todayOrdersResult.count, "orders,", activeVehiclesResult.ratio, "vehicles,", revenueResult.amount, "revenue,", performanceResult.percentage + "% performance");
    } catch (error) {
      console.error('Error updating metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // SSE removed - using manual refresh only

  // Auto-refresh khi chuyển về tab overview
  useEffect(() => {
    if (tab === "overview" && previousTab !== "overview") {
      console.log("Switched to overview tab, refreshing data...");
      handleMetricsUpdate();
    }
    setPreviousTab(tab);
  }, [tab, previousTab, handleMetricsUpdate]);

  // Initial fetch khi dashboard mount (similar to AdminDashboard)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingMetrics(true);
        await handleMetricsUpdate();
      } catch (error) {
        console.error('Failed to fetch initial metrics:', error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    // Register callback để auto-update khi có thay đổi (similar to AdminDashboard)
    OperationsMetricsService.registerUpdateCallback(handleMetricsUpdate);

    // Disable frequent polling to reduce load - chỉ dùng manual refresh
    // OperationsMetricsService.startPolling(10000); // Commented out to reduce API calls

    // Initial fetch only - no auto-refresh (theo AdminDashboard pattern)
    fetchInitialData();

    // Cleanup callback và polling khi unmount
    return () => {
      OperationsMetricsService.unregisterUpdateCallback(handleMetricsUpdate);
      OperationsMetricsService.stopPolling();
    };
  }, [handleMetricsUpdate]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      <Sidebar<OperationsTab>
        activeTab={tab}
        onTabChange={tab => setTab(tab as OperationsTab)}
        role="operations"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Navbar 
          user={user}
          onLogout={onLogout}
          title="Operations Manager Dashboard"
          subtitle=""
        />
        <main className="flex-1 p-6">
          {tab === "overview" && (
            <OperationsOverview 
              ref={operationsOverviewRef}
              metricsData={metricsData}
              isLoading={isLoadingMetrics}
              onRefresh={handleMetricsUpdate}
            />
          )}
          {tab === "monitoring" && <ResourceMonitoring />}
          {tab === "performance" && <PerformanceAnalytics />}
          {tab === "staff" && <StaffManagement />}
        </main>
      </div>
    </div>
  );
}
