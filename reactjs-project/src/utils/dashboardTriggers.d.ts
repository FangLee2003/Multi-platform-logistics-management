/**
 * Utilities để trigger updates từ anywhere in the app
 * Dùng khi có thao tác create/update/delete orders hoặc vehicles
 */
/**
 * Call này sau khi tạo đơn hàng mới thành công
 */
export declare const triggerOrderCreated: () => void;
/**
 * Call này sau khi cập nhật đơn hàng
 */
export declare const triggerOrderUpdated: () => void;
/**
 * Call này sau khi xóa đơn hàng
 */
export declare const triggerOrderDeleted: () => void;
/**
 * Call này sau khi cập nhật vehicle status
 */
export declare const triggerVehicleStatusUpdate: () => void;
/**
 * Call này sau khi assign driver cho vehicle
 */
export declare const triggerDriverAssigned: () => void;
/**
 * Generic trigger cho bất kỳ thay đổi nào affect metrics
 */
export declare const triggerDashboardRefresh: () => void;
declare const _default: {
    triggerOrderCreated: () => void;
    triggerOrderUpdated: () => void;
    triggerOrderDeleted: () => void;
    triggerVehicleStatusUpdate: () => void;
    triggerDriverAssigned: () => void;
    triggerDashboardRefresh: () => void;
};
export default _default;
