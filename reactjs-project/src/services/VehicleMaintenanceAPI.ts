export interface CreateVehicleMaintenanceRequest {
  vehicle: { id: number };
  maintenanceDate: string;
  nextDueDate?: string;
  maintenanceType?: string;
  description: string;
  cost?: number;
  status?: { id: number };
  notes?: string;
}

export async function createVehicleMaintenance(data: CreateVehicleMaintenanceRequest) {
  const response = await axios.post<VehicleMaintenance>(
    '/api/vehicle-maintenance',
    data
  );
  return response.data;
}
import axios from 'axios';

export interface VehicleMaintenance {
  id: number;
  vehicle: {
    id: number;
    licensePlate: string;
    [key: string]: any;
  };
  maintenanceDate: string;
  nextDueDate: string;
  maintenanceType: string;
  description: string;
  cost: number;
  status: {
    id: number;
    name: string;
    [key: string]: any;
  };
  createdAt: string;
  createdBy: any;
  updatedAt: string;
  notes: string;
}

export async function fetchVehicleMaintenanceHistory(): Promise<VehicleMaintenance[]> {
  const response = await axios.get<VehicleMaintenance[]>('/api/vehicle-maintenance');
  return response.data;
}
