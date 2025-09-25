/**
 * Debug utilities for tracking data consistency
 */
export interface TrackingDebugInfo {
    selectedOrderId?: number;
    deliveryId?: number;
    deliveryOrderId?: number;
    trackingId?: number;
    vehicleId?: number;
    isConsistent: boolean;
    issues: string[];
}
/**
 * Check consistency between selectedOrder, deliveryData, and trackingData
 */
export declare function checkTrackingDataConsistency(selectedOrder: any, deliveryData: any, trackingData: any): TrackingDebugInfo;
/**
 * Log tracking data consistency in a formatted way
 */
export declare function logTrackingConsistency(context: string, selectedOrder: any, deliveryData: any, trackingData: any): void;
/**
 * Get the correct order ID to display (always prefer selectedOrder.id)
 */
export declare function getDisplayOrderId(selectedOrder: any, deliveryData: any): string | number;
/**
 * Get the correct delivery ID to display
 */
export declare function getDisplayDeliveryId(deliveryData: any, fallbackDeliveryId: any): string | number;
