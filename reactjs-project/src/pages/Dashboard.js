import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import AdminDashboard from "./AdminDashboard/AdminDashboard";
import DispatcherDashboard from "./DispatcherDashboard/DispatcherDashboard";
import FleetDashboard from "./FleetDashboard/FleetDashboard";
import DriverDashboard from "./DriverDashboard/DriverDashboard";
import OperationsDashboard from "./OperationsDashboard/OperationsDashboard";
export default function Dashboard({ user: userProp, onLogout, }) {
    const { t } = useTranslation();
    // Lấy user từ localStorage nếu chưa truyền qua props
    const [user, setUser] = useState(userProp || JSON.parse(localStorage.getItem("user") || "null"));
    const [protectedData, setProtectedData] = useState(null);
    const [error, setError] = useState("");
    // Ví dụ fetch API protected khi vào dashboard
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token)
            return;
        fetch("http://localhost:8080/api/protected/profile", {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
            if (!res.ok)
                throw new Error(t('dashboard.errors.noPermission'));
            return res.json();
        })
            .then(setProtectedData)
            .catch((err) => setError(err.message));
    }, []);
    // Phân quyền giao diện theo role
    if (!user) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsxs("div", { className: "bg-white/30 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-800 mb-2", children: ["\u26A0\uFE0F ", t('dashboard.errors.notLoggedIn')] }), _jsx("div", { className: "text-gray-600", children: t('dashboard.errors.needLogin') })] }) }));
    }
    if (user.role === "ADMIN")
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsx(AdminDashboard, { user: user, onLogout: onLogout }) }));
    if (user.role === "DISPATCHER")
        return (_jsx("div", { className: "min-h-screen", children: _jsx(DispatcherDashboard, { user: user, onLogout: onLogout }) }));
    if (user.role === "FLEET")
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsx(FleetDashboard, { user: user, onLogout: onLogout }) }));
    if (user.role === "DRIVER")
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsx(DriverDashboard, { user: user, onLogout: onLogout }) }));
    if (user.role === "OPERATIONS")
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsx(OperationsDashboard, { user: user, onLogout: onLogout }) }));
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: _jsxs("div", { className: "bg-white/30 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-gray-800 mb-2", children: ["\u274C ", t('dashboard.errors.invalidRole')] }), _jsx("div", { className: "text-gray-600", children: t('dashboard.errors.cannotDetermineAccess') })] }) }));
}
