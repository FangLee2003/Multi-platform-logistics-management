import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { fetchVehicleMaintenanceHistory } from "../../services/VehicleMaintenanceAPI";
// Mapping status name sang màu sắc (sẽ được moved vào component)
// TODO: Map vehicleId sang biển số xe nếu cần (cần API hoặc dữ liệu xe)
export default function MaintenanceHistory() {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Status mapping with translation
    const getStatusMap = (status) => {
        switch (status) {
            case "Completed":
                return { label: t('dashboard.fleet.maintenanceStatus.completed', 'Completed'), color: "bg-green-100 text-green-700" };
            case "In Progress":
                return { label: t('dashboard.fleet.maintenanceStatus.inProgress', 'In Progress'), color: "bg-yellow-100 text-yellow-700" };
            case "Pending":
                return { label: t('dashboard.fleet.maintenanceStatus.pending', 'Pending'), color: "bg-orange-100 text-orange-700" };
            default:
                return { label: status || t('common.unknown'), color: "bg-gray-100 text-gray-700" };
        }
    };
    useEffect(() => {
        setLoading(true);
        fetchVehicleMaintenanceHistory()
            .then(setData)
            .catch(() => setError(t('dashboard.fleet.errors.loadMaintenanceHistory', 'Cannot load maintenance data.')))
            .finally(() => setLoading(false));
    }, [t]);
    return (_jsxs("div", { className: "bg-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl", children: [_jsx("div", { className: "text-xl font-bold mb-2", children: t('dashboard.fleet.maintenanceHistory', 'Maintenance History') }), loading && _jsx("div", { children: t('common.loading') }), error && _jsx("div", { className: "text-red-500", children: error }), _jsx("div", { className: "flex flex-col gap-4", children: data.map((item) => (_jsx("div", { className: "bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-lg font-bold flex items-center gap-2", children: [item.vehicle?.licensePlate || `Xe #${item.vehicle?.id}`, _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${getStatusMap(item.status?.name).color}`, children: getStatusMap(item.status?.name).label })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 text-sm", children: [_jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.type', 'Type'), ":"] }), " ", item.maintenanceType, _jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.maintenanceContent', 'Maintenance Content'), ":"] }), " ", item.description] })] }), _jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.cost', 'Cost'), ":"] }), _jsxs("div", { className: "font-bold", children: [item.cost?.toLocaleString(), " VN\u0110"] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.maintenanceDate', 'Maintenance Date'), ":"] }), " ", item.maintenanceDate?.slice(0, 10)] }), _jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.nextMaintenanceDate', 'Next Maintenance Date'), ":"] }), " ", item.nextDueDate?.slice(0, 10)] })] }), _jsxs("div", { children: [_jsxs("span", { className: "font-semibold", children: [t('dashboard.fleet.notes', 'Notes'), ": "] }), _jsx("div", { children: item.notes || _jsx("span", { className: "italic text-gray-400", children: t('dashboard.fleet.noNotes', 'No notes') }) })] })] })] }) }, item.id))) })] }));
}
