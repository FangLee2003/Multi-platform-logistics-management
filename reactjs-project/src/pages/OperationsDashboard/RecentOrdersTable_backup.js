import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    // Backend đã trả về status tiếng Việt, chỉ cần trả về như cũ
    return status;
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
        date: date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    };
}
export default function RecentOrdersTable({ orders }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center", children: _jsx("h3", { className: "text-lg font-medium", children: "\u0110\u01A1n h\u00E0ng g\u1EA7n \u0111\u00E2y" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsx(DataTable, { headers: ['Mã đơn', 'Khách hàng', 'Tuyến đường', 'Thời gian tạo', 'Trạng thái'], className: "min-w-full", children: orders.map((order) => {
                        const createdTime = formatDateTime(order.createdAt);
                        return (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: order.id }), _jsx("div", { className: "text-gray-600 text-xs", children: order.orderCode || `DH${order.id}` })] }), _jsxs(TableCell, { children: [_jsx("div", { className: "font-medium truncate max-w-32 sm:max-w-none", children: order.customerName }), _jsx("div", { className: "text-gray-600 text-xs", children: order.customerPhone })] }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm max-w-48 sm:max-w-none truncate", children: [order.pickupAddress, " \u2192 ", order.deliveryAddress] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-blue-900", children: createdTime.date }), _jsx("div", { className: "text-blue-600 text-xs", children: createdTime.time })] }) }), _jsx(TableCell, { children: _jsx("span", { className: `font-medium ${getStatusColor(order.status)}`, children: getStatusText(order.status) }) })] }, order.id));
                    }) }) })] }));
}
