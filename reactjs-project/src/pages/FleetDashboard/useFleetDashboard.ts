import { useState, useCallback, useMemo, useEffect } from "react";
import type { Vehicle as UIVehicle } from "./VehicleTable";
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
type VehicleStatus = "Hoạt động" | "Bảo trì" | "Cần bảo trì";


interface FleetStats {
  total: number;
  active: number;
  maintenance: number;
  needMaintenance: number;
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
          id: typeof v.id === "string" ? parseInt(v.id as string) : v.id as number,
          licensePlate: v.licensePlate || "",
          type: v.vehicleType || "",
          brand: v.brand || "",
          model: v.model || "",
          capacityWeightKg: v.capacityWeightKg ?? undefined,
          capacityVolumeM3: v.capacityVolumeM3 ?? undefined,
          status:
            typeof v.status === "object" && v.status !== null
              ? v.status.name === "ACTIVE"
                ? "Hoạt động"
                : v.status.name === "MAINTENANCE"
                ? "Bảo trì"
                : v.status.name === "NEED_MAINTENANCE"
                ? "Cần bảo trì"
                : "Hoạt động"
              : v.status === "ACTIVE"
              ? "Hoạt động"
              : v.status === "MAINTENANCE"
              ? "Bảo trì"
              : v.status === "NEED_MAINTENANCE"
              ? "Cần bảo trì"
              : "Hoạt động",
          lastMaintenance: v.lastMaintenance || "",
          nextMaintenance: v.nextMaintenance || "",
          driver:
            v.currentDriver && (v.currentDriver.fullName || v.currentDriver.username || v.currentDriver.email)
              ? v.currentDriver.fullName || v.currentDriver.username || v.currentDriver.email || ""
              : "",
          mileage: v.mileage ?? 0,
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
    active: vehicles.filter(v => v.status === "Hoạt động").length,
    maintenance: vehicles.filter(v => v.status === "Bảo trì").length,
    needMaintenance: vehicles.filter(v => v.status === "Cần bảo trì").length,
  }), [vehicles]);

  // Filtered vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchTerm === "" || 
  vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
  vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase());
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
          id: typeof newVehicle.id === "string" ? parseInt(newVehicle.id as string) : newVehicle.id as number,
          licensePlate: newVehicle.licensePlate || "",
          type: newVehicle.vehicleType || "",
          brand: newVehicle.brand || "",
          model: newVehicle.model || "",
          capacityWeightKg: newVehicle.capacityWeightKg ?? undefined,
          capacityVolumeM3: newVehicle.capacityVolumeM3 ?? undefined,
          status:
            typeof newVehicle.status === "object" && newVehicle.status !== null
              ? newVehicle.status.name === "ACTIVE"
                ? "Hoạt động"
                : newVehicle.status.name === "MAINTENANCE"
                ? "Bảo trì"
                : newVehicle.status.name === "NEED_MAINTENANCE"
                ? "Cần bảo trì"
                : "Hoạt động"
              : newVehicle.status === "ACTIVE"
              ? "Hoạt động"
              : newVehicle.status === "MAINTENANCE"
              ? "Bảo trì"
              : newVehicle.status === "NEED_MAINTENANCE"
              ? "Cần bảo trì"
              : "Hoạt động",
          lastMaintenance: newVehicle.lastMaintenance || "",
          nextMaintenance: newVehicle.nextMaintenance || "",
          driver:
            newVehicle.currentDriver && (newVehicle.currentDriver.fullName || newVehicle.currentDriver.username || newVehicle.currentDriver.email)
              ? newVehicle.currentDriver.fullName || newVehicle.currentDriver.username || newVehicle.currentDriver.email || ""
              : "",
          mileage: newVehicle.mileage ?? 0,
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
  };
};

// Export types for use in component
export type { FleetTab, VehicleStatus, FleetStats };
