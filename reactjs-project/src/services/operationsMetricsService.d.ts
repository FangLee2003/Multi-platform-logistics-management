/**
 * Service để tính toán metrics cho Operations Dashboard
 */
export declare class OperationsMetricsService {
    private static lastResults;
    private static updateCallbacks;
    private static pollingInterval;
    /**
     * Register callback để update UI khi có thay đổi (similar to AdminDashboard)
     */
    static registerUpdateCallback(callback: () => void): void;
    /**
     * Unregister callback
     */
    static unregisterUpdateCallback(callback: () => void): void;
    /**
     * Trigger tất cả callbacks (similar to AdminDashboard)
     */
    static triggerUpdateCallbacks(): void;
    /**
     * Force refresh cache - gọi khi có thay đổi data (similar to AdminDashboard)
     */
    static forceRefresh(): void;
    /**
     * Start polling để detect new orders từ external sources (như NextJS)
     */
    static startPolling(intervalMs?: number): void;
    /**
     * Stop polling
     */
    static stopPolling(): void;
    /**
     * Kiểm tra xem có nên fetch dữ liệu mới không (để tránh spam API)
     */
    private static shouldFetch;
    /**
     * Tính số đơn hàng hôm nay và so sánh với hôm qua (sử dụng API tối ưu)
     */
    static getTodayOrdersCount(forceRefresh?: boolean): Promise<{
        count: number;
        changePercent: number;
        trend: 'increase' | 'decrease' | 'stable';
    }>;
    /**
     * Tính số xe đang hoạt động
     */
    static getActiveVehiclesRatio(): Promise<{
        active: number;
        total: number;
        percentage: number;
        ratio: string;
    }>;
    /**
     * Tính doanh thu hôm nay từ bảng deliveries
     */
    static getTodayRevenue(): Promise<{
        amount: string;
        changePercent: number;
        trend: 'increase' | 'decrease' | 'stable';
    }>;
    /**
     * Lấy số đơn hàng hoàn thành hôm nay
     */
    static getCompletedOrders(): Promise<{
        count: number;
        changePercent: number;
        trend: 'increase' | 'decrease' | 'stable';
    }>;
    /**
     * Tính hiệu suất trung bình dựa trên completion rate từ API tối ưu
     */
    static getAveragePerformance(): Promise<{
        percentage: number;
        changePercent: number;
        trend: 'increase' | 'decrease' | 'stable';
    }>;
    /**
     * Lấy doanh thu theo tháng trong 12 tháng gần nhất
     */
    static getMonthlyRevenue(): Promise<{
        monthlyRevenue: Array<{
            year: number;
            month: number;
            revenue: number;
        }>;
        totalRevenue: number;
        averageRevenue: number;
        growthPercent: number;
    }>;
}
export default OperationsMetricsService;
