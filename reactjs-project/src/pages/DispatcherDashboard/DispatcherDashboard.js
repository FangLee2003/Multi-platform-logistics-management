import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import OrderOverview from "./OrderOverview";
import OrderList from "./OrderList";
import OrderAssignment from "./OrderAssignment";
import Sidebar, {} from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import MapboxTrackingMap from "./MapboxTrackingMap";
import MapErrorBoundary from '../../components/MapErrorBoundary';
import VehicleList from "./VehicleList";
import DriverList from "./DriverList";
import { DispatcherProvider } from "../../contexts/DispatcherContext";
// Nút reload trang không logout
function ReloadButton() {
    return (_jsx("button", { onClick: () => window.location.reload(), className: "ml-2 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600", title: "T\u1EA3i l\u1EA1i trang (kh\u00F4ng \u0111\u0103ng xu\u1EA5t)", children: "\uD83D\uDD04 T\u1EA3i l\u1EA1i trang" }));
}
export default function DispatcherDashboard({ user, onLogout, }) {
    const { t } = useTranslation();
    // Thêm "assignment" vào state tab
    const [tab, setTab] = useState("orders");
    return (_jsx(DispatcherProvider, { children: _jsxs("div", { className: "min-h-screen flex bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100", children: [_jsx(Sidebar, { activeTab: tab, onTabChange: tab => setTab(tab), role: "dispatcher" }), _jsxs("div", { className: " flex-1 flex flex-col", children: [_jsx(Navbar, { user: user, onLogout: onLogout, title: t('dashboard.dispatcher.title'), subtitle: t('dashboard.dispatcher.subtitle') }), _jsxs("main", { className: "flex-1 p-6", children: [_jsxs("div", { className: tab === "orders" ? "block" : "hidden", children: [_jsx(OrderOverview, {}), _jsxs("div", { className: "mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsx(OrderList, {}), _jsx(MapErrorBoundary, { children: _jsx(MapboxTrackingMap, {}) })] })] }), _jsx("div", { className: tab === "resources" ? "block" : "hidden", children: _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsx(VehicleList, {}), _jsx(DriverList, {})] }) }), _jsx("div", { className: tab === "assignment" ? "block" : "hidden", children: _jsx(OrderAssignment, {}) })] })] })] }) }));
}
