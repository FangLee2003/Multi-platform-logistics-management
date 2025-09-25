import type { Vehicle, Staff } from "../types/dashboard";
export declare const API_BASE_URL = "http://localhost:8080/api";
interface OperationsSummary {
    todayOrders: number;
    activeVehicles: number;
    totalStaff: number;
    revenue: number;
}
interface Order {
    id: string;
    orderCode: string;
    description: string;
    totalAmount: string;
    status: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    assignedVehicle: string;
    assignedDriver: string;
    createdAt: string;
    updatedAt: string;
}
interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
}
interface PerformanceMetrics {
    deliverySuccessRate: number;
    averageDeliveryTime: number;
    vehicleUtilization: number;
    customerSatisfaction: number;
}
interface SystemMetrics {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
}
interface Alert {
    id: string;
    type: string;
    message: string;
    acknowledged: boolean;
    timestamp: string;
}
interface Report {
    id: string;
    type: string;
    status: string;
    downloadUrl?: string;
}
export declare const getAuthHeaders: () => {
    Authorization: string;
    'Content-Type': string;
};
export declare const operationsAPI: {
    getOverviewStats: () => Promise<OperationsSummary>;
    getVehicles: () => Promise<Vehicle[]>;
    updateVehicleStatus: (vehicleId: string, status: Vehicle["status"]) => Promise<Vehicle>;
    getOrders: (params?: {
        status?: string;
        priority?: string;
        limit?: number;
    }) => Promise<Order[]>;
    assignOrder: (orderId: string, vehicleId: string, driverId: string) => Promise<Order>;
    getStaff: (department?: string) => Promise<Staff[]>;
    updateStaffStatus: (staffId: string, status: Staff["status"]) => Promise<Staff>;
    getPerformanceMetrics: (timeRange: string) => Promise<PerformanceMetrics>;
    getSystemMetrics: () => Promise<SystemMetrics>;
    getAlerts: (acknowledged?: boolean) => Promise<Alert[]>;
    acknowledgeAlert: (alertId: string) => Promise<Alert>;
    generateReport: (type: string, params: Record<string, unknown>) => Promise<Report>;
    getMaintenanceRequestsCount: () => Promise<{
        count: number;
        message: string;
    }>;
    getOrdersForOperations: (page?: number, size?: number, statusFilter?: string) => Promise<PaginatedResponse<Order>>;
};
export {};
