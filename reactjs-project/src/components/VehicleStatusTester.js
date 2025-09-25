import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
const VehicleStatusTester = ({ onStatusChange }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const updateVehicleStatus = async (vehicleId, statusId, statusName) => {
        setIsLoading(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/vehicles/${vehicleId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ statusId })
            });
            if (response.ok) {
                // Check if response has content before parsing JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    setMessage(`✅ Xe ${vehicleId} đã chuyển thành ${statusName}`);
                }
                else {
                    setMessage(`✅ Xe ${vehicleId} đã chuyển thành ${statusName} (no JSON response)`);
                }
                onStatusChange?.();
            }
            else {
                // Handle error response
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await response.json();
                        errorMessage = error.error || error.message || errorMessage;
                    }
                    else {
                        const textError = await response.text();
                        errorMessage = textError || errorMessage;
                    }
                }
                catch (parseError) {
                    console.warn('Could not parse error response:', parseError);
                }
                setMessage(`❌ Lỗi: ${errorMessage}`);
            }
        }
        catch (error) {
            console.error('Error updating vehicle status:', error);
            setMessage(`❌ Lỗi kết nối: ${error}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "\uD83E\uDDEA Test SSE Realtime" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Nh\u1EA5n c\u00E1c n\u00FAt b\u00EAn d\u01B0\u1EDBi \u0111\u1EC3 thay \u0111\u1ED5i status xe v\u00E0 xem s\u1ED1 li\u1EC7u c\u1EADp nh\u1EADt realtime (kh\u00F4ng c\u1EA7n reload trang)" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-700 mb-2", children: "Xe ID: 1" }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => updateVehicleStatus(1, 18, 'ĐANG SỬ DỤNG'), disabled: isLoading, className: "w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50", children: "Set \u0110ANG S\u1EEC D\u1EE4NG (18)" }), _jsx("button", { onClick: () => updateVehicleStatus(1, 17, 'SẴN SÀNG'), disabled: isLoading, className: "w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50", children: "Set S\u1EB4N S\u00C0NG (17)" })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-700 mb-2", children: "Xe ID: 2" }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => updateVehicleStatus(2, 18, 'ĐANG SỬ DỤNG'), disabled: isLoading, className: "w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50", children: "Set \u0110ANG S\u1EEC D\u1EE4NG (18)" }), _jsx("button", { onClick: () => updateVehicleStatus(2, 17, 'SẴN SÀNG'), disabled: isLoading, className: "w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50", children: "Set S\u1EB4N S\u00C0NG (17)" })] })] })] }), isLoading && (_jsx("div", { className: "text-center py-2", children: _jsx("span", { className: "text-blue-600", children: "\u23F3 \u0110ang c\u1EADp nh\u1EADt..." }) })), message && (_jsx("div", { className: "mt-4 p-3 rounded-md bg-gray-50 border", children: _jsx("p", { className: "text-sm", children: message }) }))] }));
};
export default VehicleStatusTester;
