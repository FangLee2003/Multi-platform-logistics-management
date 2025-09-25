// API endpoints và các interface để tương tác với backend
export const API_BASE_URL = 'http://localhost:8080/api';
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
    getOverviewStats: async () => {
        const response = await fetch(`${API_BASE_URL}/operations/overview`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch overview stats');
        return response.json();
    },
    // Vehicles
    getVehicles: async () => {
        const response = await fetch(`${API_BASE_URL}/operations/vehicles`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch vehicles');
        return response.json();
    },
    updateVehicleStatus: async (vehicleId, status) => {
        const response = await fetch(`${API_BASE_URL}/operations/vehicles/${vehicleId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        if (!response.ok)
            throw new Error('Failed to update vehicle status');
        return response.json();
    },
    // Orders
    getOrders: async (params) => {
        const queryParams = new URLSearchParams(params);
        const response = await fetch(`${API_BASE_URL}/operations/orders?${queryParams}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch orders');
        return response.json();
    },
    assignOrder: async (orderId, vehicleId, driverId) => {
        const response = await fetch(`${API_BASE_URL}/operations/orders/${orderId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ vehicleId, driverId }),
        });
        if (!response.ok)
            throw new Error('Failed to assign order');
        return response.json();
    },
    // Staff management
    getStaff: async (department) => {
        const queryParams = department ? `?department=${department}` : '';
        const response = await fetch(`${API_BASE_URL}/operations/staff${queryParams}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch staff');
        return response.json();
    },
    updateStaffStatus: async (staffId, status) => {
        const response = await fetch(`${API_BASE_URL}/operations/staff/${staffId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        if (!response.ok)
            throw new Error('Failed to update staff status');
        return response.json();
    },
    // Performance Analytics
    getPerformanceMetrics: async (timeRange) => {
        const response = await fetch(`${API_BASE_URL}/operations/performance?range=${timeRange}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch performance metrics');
        return response.json();
    },
    // System Monitoring
    getSystemMetrics: async () => {
        const response = await fetch(`${API_BASE_URL}/operations/system/metrics`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch system metrics');
        return response.json();
    },
    getAlerts: async (acknowledged) => {
        const queryParams = acknowledged !== undefined ? `?acknowledged=${acknowledged}` : '';
        const response = await fetch(`${API_BASE_URL}/operations/alerts${queryParams}`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch alerts');
        return response.json();
    },
    acknowledgeAlert: async (alertId) => {
        const response = await fetch(`${API_BASE_URL}/operations/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to acknowledge alert');
        return response.json();
    },
    // Reports
    generateReport: async (type, params) => {
        const response = await fetch(`${API_BASE_URL}/operations/reports/${type}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(params),
        });
        if (!response.ok)
            throw new Error('Failed to generate report');
        return response.json();
    },
    // Maintenance requests count
    getMaintenanceRequestsCount: async () => {
        const response = await fetch(`${API_BASE_URL}/operations/maintenance-requests/count`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch maintenance requests count');
        return response.json();
    },
    // Get orders for operations dashboard with pagination and status filter
    getOrdersForOperations: async (page = 0, size = 10, statusFilter) => {
        let url = `${API_BASE_URL}/operations/orders?page=${page}&size=${size}`;
        if (statusFilter && statusFilter !== 'Tất cả') {
            url += `&status=${encodeURIComponent(statusFilter)}`;
        }
        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });
        if (!response.ok)
            throw new Error('Failed to fetch orders');
        return response.json();
    },
};
