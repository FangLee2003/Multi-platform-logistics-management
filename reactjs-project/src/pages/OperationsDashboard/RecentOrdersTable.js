import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import DataTable, { TableRow, TableCell } from '../../components/DataTable';
// Trả về class màu cho status tiếng Việt từ backend
function getStatusColor(status) {
    switch (status) {
        case 'Hoàn thành':
            return 'text-green-600';
        case 'Đã giao':
            return 'text-green-700';
        case 'Đang giao':
            return 'text-blue-600';
        case 'Chờ xử lý':
            return 'text-orange-500';
        case 'Đang xử lý':
            return 'text-purple-500';
        case 'Đã hủy':
            return 'text-red-600';
        case 'Chưa xác định':
            return 'text-gray-400';
        default:
            return 'text-gray-800';
    }
}
function getStatusText(status) {
    // Convert Vietnamese status from backend to English for display
    switch (status) {
        case 'Hoàn thành': return 'Completed';
        case 'Đã giao': return 'Delivered';
        case 'Đang giao': return 'Shipping';
        case 'Chờ xử lý': return 'Pending';
        case 'Đang xử lý': return 'Processing';
        case 'Đã hủy': return 'Cancelled';
        case 'Chưa xác định': return 'Unknown';
        default: return status;
    }
}
function formatDateTime(dateString) {
    if (!dateString) {
        return {
            date: '--',
            time: '--'
        };
    }
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    };
}
export default function RecentOrdersTable({ orders }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center", children: _jsx("h3", { className: "text-lg font-medium", children: t('dashboard.operations.performance.recentOrders', 'Recent Orders') }) }), _jsx("div", { className: "overflow-x-auto", children: _jsx(DataTable, { headers: [
                        t('dashboard.operations.performance.headers.orderId', 'Order ID'),
                        t('dashboard.operations.performance.headers.customer', 'Customer'),
                        t('dashboard.operations.performance.headers.route', 'Route'),
                        t('dashboard.operations.performance.headers.createdTime', 'Created Time'),
                        t('dashboard.operations.performance.headers.status', 'Status')
                    ], className: "min-w-full", children: orders.map((order) => {
                        const createdTime = formatDateTime(order.createdAt);
                        return (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: order.id }), _jsx("div", { className: "text-gray-600 text-xs", children: order.orderCode || `DH${order.id}` })] }), _jsxs(TableCell, { children: [_jsx("div", { className: "font-medium truncate max-w-32 sm:max-w-none", children: order.customerName }), _jsx("div", { className: "text-gray-600 text-xs", children: order.customerPhone })] }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm max-w-32 sm:max-w-64 break-words", children: [order.pickupAddress, " \u2192 ", order.deliveryAddress] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-blue-900", children: createdTime.date }), _jsx("div", { className: "text-blue-600 text-xs", children: createdTime.time })] }) }), _jsx(TableCell, { children: _jsx("span", { className: `font-medium ${getStatusColor(order.status)}`, children: getStatusText(order.status) }) })] }, order.id));
                    }) }) })] }));
}
