import { useState, useCallback, useMemo, useEffect } from "react";
import type { Vehicle as UIVehicle } from "../../types/Operations";
import * as VehicleListAPI from "../../services/VehicleListAPI";
import type { Vehicle as APIVehicle } from "../../types/Operations";

// Pagination type
interface Pagination {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

type FleetTab = "vehicles" | "maintenance" | "schedule";
type VehicleStatus = "AVAILABLE" | "MAINTENANCE" | "IN_USE";

// Helper function to convert status to display text
const getStatusDisplay = (status: VehicleStatus): string => {
  switch (status) {
    case "AVAILABLE": return "Hoạt động";
    case "MAINTENANCE": return "Bảo trì";
    case "IN_USE": return "Đang sử dụng";
    default: return "Hoạt động";
  }
};

// Helper function to get status filter display
const getStatusFilterDisplay = (status: VehicleStatus | "all"): string => {
  if (status === "all") return "Tất cả";
  return getStatusDisplay(status);
};

interface FleetStats {
  total: number;
  active: number;
  maintenance: number;
  inUse: number;
}



export const useFleetDashboard = () => {
  // State management
  const [tab, setTab] = useState<FleetTab>("vehicles");
  const [vehicles, setVehicles] = useState<UIVehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UIVehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: 5,
    total: 0,
    totalPages: 1,
  });

  // Fetch vehicles with pagination
  const fetchVehiclesWithPagination = useCallback((page: number, size: number) => {
    setIsLoading(true);
    setError(null);
    VehicleListAPI.fetchVehiclesRaw(page, size)
      .then(({ data, total }) => {
        const mapped: UIVehicle[] = data.map((v: APIVehicle) => ({
          ...v,
          id: typeof v.id === "string" ? parseInt(v.id as string) : v.id as number,
          type: v.vehicleType as UIVehicle["type"],
          status:
            typeof v.status === "object" && v.status !== null && typeof (v.status as any).name === "string"
              ? (v.status as any).name as UIVehicle["status"]
              : (typeof v.status === "string" ? v.status as UIVehicle["status"] : "AVAILABLE"),
          driver: v.currentDriver || v.driver || undefined,
        }));
        setVehicles(mapped);
        setPagination(prev => ({
          ...prev,
          page,
          size,
          total,
          totalPages: Math.ceil(total / size) || 1,
        }));
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Không thể tải danh sách xe: " + err.message);
        setIsLoading(false);
      });

    // Lắng nghe sự kiện cập nhật trạng thái xe từ form bảo trì
    if (typeof window !== 'undefined' && window.addEventListener) {
      const handler = (e: any) => {
        if (e?.detail?.vehicleId && e?.detail?.status) {
          setVehicles(prev => prev.map(v => v.id === e.detail.vehicleId ? { ...v, status: "MAINTENANCE" } : v));
        }
      };
      window.addEventListener('vehicleStatusChanged', handler);
      // Cleanup listener khi unmount
      return () => window.removeEventListener('vehicleStatusChanged', handler);
    }
  }, []);

  // Fetch on mount and when page/size changes
  useEffect(() => {
    fetchVehiclesWithPagination(pagination.page, pagination.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.size]);

  // Handler to change page
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Handler to change page size
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({ ...prev, size: newSize, page: 1 }));
  }, []);

  // Memoized stats calculation
  const fleetStats = useMemo<FleetStats>(() => ({
    total: vehicles.length,
    active: vehicles.filter(v => v.status === "AVAILABLE").length,
    maintenance: vehicles.filter(v => v.status === "MAINTENANCE").length,
    inUse: vehicles.filter(v => v.status === "IN_USE").length,
  }), [vehicles]);

  // Filtered vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchTerm === "" || 
        (vehicle.licensePlate && vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.driver && typeof vehicle.driver === 'object' && 'name' in vehicle.driver && 
         vehicle.driver.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  // Add vehicle handler (call API)
  const handleAddVehicle = useCallback(
    async (data: Pick<UIVehicle, "licensePlate" | "type" | "capacityWeightKg" | "capacityVolumeM3">) => {
      setIsLoading(true);
      setError(null);
      try {
        // Map UI form data to API format
        const apiData: any = {
          licensePlate: data.licensePlate,
          vehicleType: data.type,
          capacityWeightKg: data.capacityWeightKg,
          capacityVolumeM3: data.capacityVolumeM3,
        };
        const newVehicle: APIVehicle = await VehicleListAPI.addVehicle(apiData);
        // Map API vehicle to UI format
        const mapped: UIVehicle = {
          ...newVehicle,
          id: typeof newVehicle.id === "string" ? parseInt(newVehicle.id as string) : newVehicle.id as number,
          type: newVehicle.vehicleType as UIVehicle["type"],
          status:
            typeof newVehicle.status === "object" && newVehicle.status !== null && typeof (newVehicle.status as any).name === "string"
              ? (newVehicle.status as any).name as UIVehicle["status"]
              : (typeof newVehicle.status === "string" ? newVehicle.status as UIVehicle["status"] : "AVAILABLE"),
          driver: newVehicle.driver || undefined,
        };
        setVehicles(prev => [...prev, mapped]);
        setShowAddForm(false);
      } catch (err: any) {
        setError("Không thể thêm phương tiện: " + err.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle tab changes
  const handleTabChange = useCallback((newTab: string) => {
    setTab(newTab as FleetTab);
  }, []);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Handle status filter
  const handleStatusFilter = useCallback((status: VehicleStatus | "all") => {
    setStatusFilter(status);
  }, []);

  // Handle delete vehicle
  const handleDeleteVehicle = useCallback(async (vehicleId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phương tiện này?")) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await VehicleListAPI.deleteVehicle(vehicleId);
      // Remove vehicle from local state
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      // Update pagination if needed
      const newTotal = pagination.total - 1;
      const newTotalPages = Math.ceil(newTotal / pagination.size) || 1;
      if (pagination.page > newTotalPages) {
        setPagination(prev => ({
          ...prev,
          page: newTotalPages,
          total: newTotal,
          totalPages: newTotalPages
        }));
      } else {
        setPagination(prev => ({
          ...prev,
          total: newTotal,
          totalPages: newTotalPages
        }));
      }
    } catch (err: any) {
      setError("Không thể xóa phương tiện: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination]);

  // Handle edit vehicle
  const handleEditVehicle = useCallback((vehicle: UIVehicle) => {
    setEditingVehicle(vehicle);
    setShowEditForm(true);
    setShowAddForm(false); // Đóng form thêm nếu đang mở
  }, []);

  // Handle update vehicle
  const handleUpdateVehicle = useCallback(async (vehicleId: number, updatedData: Partial<UIVehicle>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Map UI data to API format
      const apiData: any = {
        licensePlate: updatedData.licensePlate,
        vehicleType: updatedData.type,
        capacityWeightKg: updatedData.capacityWeightKg,
        capacityVolumeM3: updatedData.capacityVolumeM3,
      };
      
      await VehicleListAPI.editVehicle(vehicleId, apiData);
      
      // Update vehicle in local state
      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, ...updatedData } : v
      ));
      
      // Close edit form
      setShowEditForm(false);
      setEditingVehicle(null);
    } catch (err: any) {
      setError("Không thể cập nhật phương tiện: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setShowEditForm(false);
    setEditingVehicle(null);
  }, []);

  // Handle refresh vehicles (to be called after maintenance operations)
  const refreshVehicles = useCallback(() => {
    fetchVehiclesWithPagination(pagination.page, pagination.size);
  }, [fetchVehiclesWithPagination, pagination.page, pagination.size]);

  return {
    // State
    tab,
    vehicles,
    searchTerm,
    statusFilter,
    isLoading,
    showAddForm,
    setShowAddForm,
    showEditForm,
    editingVehicle,
    error,
    pagination,

    // Computed values
    fleetStats,
    filteredVehicles,

    // Handlers
    handleAddVehicle,
    handleTabChange,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
    handlePageSizeChange,
    handleDeleteVehicle,
    handleEditVehicle,
    handleUpdateVehicle,
    handleCancelEdit,
    refreshVehicles, // Add this new handler
  };
};

// Export types for use in component
export type { FleetTab, VehicleStatus, FleetStats };
