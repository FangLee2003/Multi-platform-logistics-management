export interface OrderStatus {
  name: string;
  statusType: string;
}

export interface Store {
  storeName: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Address {
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface Driver {
  id?: number;
  fullName: string;
}

export interface Vehicle {
  id: number;
  licensePlate?: string;
  currentDriver?: Driver;
}

export interface Order {
  id: number;
  createdAt: string;
  status?: OrderStatus;
  store?: Store;
  address?: Address;
  vehicle?: Vehicle;
  // Thêm các trường khác nếu cần
}


// Checklist/timeline cho đơn hàng
export interface TimelineStepDto {
  stepOrder: number;
  stepCode: string;
  stepName: string;
  description?: string;
  completed?: boolean;
  completedAt?: string | Date;
  actor?: {
    userId?: number;
    fullName?: string;
    role?: string;
    phone?: string;
  };
  details?: string;
  status?: string;
}
