// Common types for tracking system

export interface TrackingResult {
  code: string;
  status: string;
  from: string;
  to: string;
  estimatedDelivery: string;
  latitude?: number;
  longitude?: number;
  storeLatitude?: number;
  storeLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface TrackingMapData {
  latitude: number;
  longitude: number;
  from?: string;
  to?: string;
  storeLatitude?: number;
  storeLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface ChecklistStep {
  id: string;
  stepCode: string;
  stepName: string;
  completed: boolean;
  completedAt?: string;
  actor?: string;
  details?: string;
  status?: string;
}

export interface RealtimeTrackingData {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  location?: string;
  status?: string;
  driverName?: string;
  vehicleInfo?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'processing' 
  | 'shipping'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}