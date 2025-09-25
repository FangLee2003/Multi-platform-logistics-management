/**
 * Global Update Service để handle real-time updates giữa các components
 * Similar to AdminDashboard pattern nhưng global scope
 */
export declare class GlobalUpdateService {
    private static instance;
    private updateCallbacks;
    static getInstance(): GlobalUpdateService;
    /**
     * Register callback cho specific event type
     */
    registerCallback(eventType: string, callback: () => void): void;
    /**
     * Unregister callback
     */
    unregisterCallback(eventType: string, callback: () => void): void;
    /**
     * Trigger tất cả callbacks cho event type
     */
    triggerUpdate(eventType: string, data?: unknown): void;
    /**
     * Trigger khi có đơn hàng mới
     */
    static triggerOrderUpdate(): void;
    /**
     * Trigger khi có vehicle update
     */
    static triggerVehicleUpdate(): void;
    /**
     * Register để listen order updates
     */
    static onOrderUpdate(callback: () => void): void;
    /**
     * Register để listen vehicle updates
     */
    static onVehicleUpdate(callback: () => void): void;
    /**
     * Cleanup callbacks
     */
    static cleanup(eventType: string, callback: () => void): void;
}
export default GlobalUpdateService;
