import type { Vehicle, Staff } from "../types/dashboard";

// API endpoints và các interface để tương tác với backend
export const API_BASE_URL = 'http://localhost:8080/api';

// Missing types
interface OperationsSummary {
  todayOrders: number;
  activeVehicles: number;
  totalStaff: number;
  revenue: number;
}

interface Order {
  id: string;
  status: string;
  priority: string;
  customerId: string;
  vehicleId?: string;
  driverId?: string;
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

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// API functions
export const operationsAPI = {
  // Dashboard overview
  getOverviewStats: async (): Promise<OperationsSummary> => {
    const response = await fetch(`${API_BASE_URL}/operations/overview`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch overview stats');
    return response.json();
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await fetch(`${API_BASE_URL}/operations/vehicles`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch vehicles');
    return response.json();
  },

  updateVehicleStatus: async (vehicleId: string, status: Vehicle['status']): Promise<Vehicle> => {
    const response = await fetch(`${API_BASE_URL}/operations/vehicles/${vehicleId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update vehicle status');
    return response.json();
  },

  // Orders
  getOrders: async (params?: { status?: string; priority?: string; limit?: number }): Promise<Order[]> => {
    const queryParams = new URLSearchParams(params as Record<string, string>);
    const response = await fetch(`${API_BASE_URL}/operations/orders?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  assignOrder: async (orderId: string, vehicleId: string, driverId: string): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/operations/orders/${orderId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vehicleId, driverId }),
    });
    if (!response.ok) throw new Error('Failed to assign order');
    return response.json();
  },

  // Staff management
  getStaff: async (department?: string): Promise<Staff[]> => {
    const queryParams = department ? `?department=${department}` : '';
    const response = await fetch(`${API_BASE_URL}/operations/staff${queryParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
  },

  updateStaffStatus: async (staffId: string, status: Staff['status']): Promise<Staff> => {
    const response = await fetch(`${API_BASE_URL}/operations/staff/${staffId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update staff status');
    return response.json();
  },

  // Performance Analytics
  getPerformanceMetrics: async (timeRange: string): Promise<PerformanceMetrics> => {
    const response = await fetch(`${API_BASE_URL}/operations/performance?range=${timeRange}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch performance metrics');
    return response.json();
  },

  // System Monitoring
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    const response = await fetch(`${API_BASE_URL}/operations/system/metrics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch system metrics');
    return response.json();
  },

  getAlerts: async (acknowledged?: boolean): Promise<Alert[]> => {
    const queryParams = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
    const response = await fetch(`${API_BASE_URL}/operations/alerts${queryParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  },

  acknowledgeAlert: async (alertId: string): Promise<Alert> => {
    const response = await fetch(`${API_BASE_URL}/operations/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to acknowledge alert');
    return response.json();
  },

  // Reports
  generateReport: async (type: string, params: Record<string, unknown>): Promise<Report> => {
    const response = await fetch(`${API_BASE_URL}/operations/reports/${type}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  },
};
