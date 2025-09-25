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
        count: number;
        changePercent: number;
        trend: 'increase' | 'decrease' | 'stable';
    };
    lastUpdated: Date | null;
}
interface OperationsOverviewProps {
    metricsData: MetricsData;
    isLoading: boolean;
    onRefresh: () => Promise<void>;
}
export interface OperationsOverviewRef {
    updateMetrics: () => void;
}
declare const OperationsOverview: import("react").ForwardRefExoticComponent<OperationsOverviewProps & import("react").RefAttributes<OperationsOverviewRef>>;
export default OperationsOverview;
