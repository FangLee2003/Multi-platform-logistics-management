import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MdManageAccounts } from "react-icons/md";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { AiOutlineSetting, AiOutlineSafetyCertificate } from "react-icons/ai";
import { FiActivity, FiBarChart2, FiHome, FiUsers } from "react-icons/fi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { useTranslation } from 'react-i18next';
import logo from "../assets/logo.png";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_MENUS = {
    dispatcher: [
        { key: "orders", label: "Orders", icon: _jsx(MdManageAccounts, {}) },
        { key: "resources", label: "Resources", icon: _jsx(RiShieldKeyholeLine, {}) },
        { key: "assignment", label: "Assignment", icon: _jsx(AiOutlineSetting, {}) },
    ],
    operations: [
        { key: "overview", label: "Overview", icon: _jsx(FiHome, {}) },
        { key: "performance", label: "Performance", icon: _jsx(FiBarChart2, {}) },
        { key: "monitoring", label: "Monitoring", icon: _jsx(FiActivity, {}) },
        { key: "staff", label: "Staff", icon: _jsx(FiUsers, {}) },
    ],
    fleet: [
        { key: "vehicles", label: "Vehicle Management", icon: _jsx(MdManageAccounts, {}) },
        { key: "maintenance", label: "Vehicle Maintenance", icon: _jsx(AiOutlineSetting, {}) },
        { key: "schedule", label: "Maintenance Schedule", icon: _jsx(FiActivity, {}) },
    ],
    admin: [
        { key: "users", label: "User Management", icon: _jsx(MdManageAccounts, {}) },
        { key: "roles", label: "Role Permissions", icon: _jsx(RiShieldKeyholeLine, {}) },
        { key: "settings", label: "System Settings", icon: _jsx(AiOutlineSetting, {}) },
        { key: "logs", label: "Audit Logs", icon: _jsx(FiActivity, {}) },
    ],
};
function getMenu(role, t) {
    const MENUS = {
        dispatcher: [
            { key: "orders", label: t('dashboard.dispatcher.tabs.orders'), icon: _jsx(MdManageAccounts, {}) },
            { key: "resources", label: t('dashboard.dispatcher.tabs.resources'), icon: _jsx(RiShieldKeyholeLine, {}) },
            { key: "assignment", label: t('dashboard.dispatcher.tabs.assignment'), icon: _jsx(AiOutlineSetting, {}) },
        ],
        operations: [
            { key: "overview", label: t('dashboard.operations.tabs.overview', 'Overview'), icon: _jsx(FiHome, {}) },
            { key: "performance", label: t('dashboard.operations.tabs.performance', 'Performance'), icon: _jsx(FiBarChart2, {}) },
            { key: "monitoring", label: t('dashboard.operations.tabs.monitoring', 'Monitoring'), icon: _jsx(FiActivity, {}) },
            { key: "staff", label: t('dashboard.operations.tabs.staff', 'Staff'), icon: _jsx(FiUsers, {}) },
        ],
        fleet: [
            { key: "vehicles", label: t('dashboard.fleet.tabs.vehicles', 'Vehicle Management'), icon: _jsx(MdManageAccounts, {}) },
            { key: "maintenance", label: t('dashboard.fleet.tabs.maintenance', 'Vehicle Maintenance'), icon: _jsx(AiOutlineSetting, {}) },
            { key: "schedule", label: t('dashboard.fleet.tabs.schedule', 'Maintenance Schedule'), icon: _jsx(FiActivity, {}) },
        ],
        admin: [
            { key: "users", label: t('dashboard.admin.tabs.users', 'User Management'), icon: _jsx(MdManageAccounts, {}) },
            { key: "roles", label: t('dashboard.admin.tabs.roles', 'Role Permissions'), icon: _jsx(RiShieldKeyholeLine, {}) },
            { key: "settings", label: t('dashboard.admin.tabs.settings', 'System Settings'), icon: _jsx(AiOutlineSetting, {}) },
            { key: "logs", label: t('dashboard.admin.tabs.logs', 'Audit Logs'), icon: _jsx(FiActivity, {}) },
        ],
    };
    return MENUS[role];
}
export default function Sidebar({ activeTab, onTabChange, role, }) {
    const { t } = useTranslation();
    const MENU = getMenu(role, t);
    return (_jsxs("aside", { className: "group ml-3 flex-shrink-0 w-20 hover:w-64 transition-all duration-300 bg-white/20 backdrop-blur-lg border-r border-white/30 text-gray-800 flex flex-col py-6 px-4 overflow-hidden h-screen sticky top-0", children: [_jsxs("div", { className: "mb-5 flex items-center -mt-3 -ml-4 gap-1", children: [_jsx("div", { className: "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ", children: _jsx("img", { src: logo, alt: "Logo", className: "w-12 h-12 rounded-full object-cover" }) }), _jsx("span", { className: "hidden group-hover:inline-block font-bold text-lg tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden text-gray-700", style: { maxWidth: "200px" }, children: "Fast Route" })] }), _jsx("nav", { className: "flex-1 flex flex-col gap-4", children: MENU.map((item) => (_jsxs("button", { className: `flex -ml-3 items-center gap-3 font-semibold transition-all duration-300 rounded-xl p-4 ${activeTab === item.key
                        ? "text-blue-600 bg-white/40 backdrop-blur-sm border border-white/50 shadow-lg"
                        : "hover:text-blue-600 hover:bg-white/20 backdrop-blur-sm"}`, onClick: () => onTabChange(item.key), children: [_jsx("span", { className: "text-2xl flex-shrink-0", children: item.icon }), _jsx("span", { className: "hidden group-hover:inline transition-all duration-300 whitespace-nowrap overflow-hidden", style: { maxWidth: "160px" }, children: item.label })] }, item.key))) })] }));
}
