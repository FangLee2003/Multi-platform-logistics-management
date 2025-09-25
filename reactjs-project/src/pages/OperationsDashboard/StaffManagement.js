import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../../components/GlassCard';
import StatCard from '../../components/StatCard';
import DataTable, { TableRow, TableCell } from '../../components/DataTable';
import GlassButton from '../../components/GlassButton';
import { operationsAPI } from '../../services/operationsAPI';
import { FaChartLine, FaUmbrellaBeach, FaUsers } from 'react-icons/fa6';
import { MdWorkHistory } from 'react-icons/md';
export default function StaffManagement() {
    const { t } = useTranslation();
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const fetchStaff = async () => {
        try {
            setLoading(true);
            const department = selectedDepartment === 'all' ? undefined : selectedDepartment;
            const data = await operationsAPI.getStaff(department);
            setStaff(data);
            setError('');
        }
        catch {
            setError('Unable to load staff data. Using sample data.');
            // Fallback data
            setStaff([
                {
                    id: '1',
                    name: 'Nguyễn Văn A',
                    email: 'nguyenvana@company.com',
                    phone: '0912345678',
                    role: 'DRIVER',
                    status: 'ACTIVE',
                    department: 'Transportation',
                    shiftStart: '06:00',
                    shiftEnd: '14:00',
                    performanceScore: 92,
                    totalDeliveries: 245,
                    onTimeDeliveries: 225
                },
                {
                    id: '3',
                    name: 'Lê Văn C',
                    email: 'levanc@company.com',
                    phone: '0123456789',
                    role: 'DRIVER',
                    status: 'ACTIVE',
                    department: 'Transportation',
                    shiftStart: '08:00',
                    shiftEnd: '16:00',
                    performanceScore: 95,
                    totalDeliveries: 312,
                    onTimeDeliveries: 298
                },
                {
                    id: '5',
                    name: 'Hoàng Văn E',
                    email: 'hoangvane@company.com',
                    phone: '0789123456',
                    role: 'DISPATCHER',
                    status: 'ACTIVE',
                    department: 'Dispatch',
                    shiftStart: '08:00',
                    shiftEnd: '17:00',
                    performanceScore: 90,
                    totalDeliveries: 0,
                    onTimeDeliveries: 0
                },
                {
                    id: '6',
                    name: 'Đặng Văn F',
                    email: 'dangvanf@company.com',
                    phone: '0456123789',
                    role: 'FLEET',
                    status: 'ACTIVE',
                    department: 'Maintenance',
                    shiftStart: '07:00',
                    shiftEnd: '15:00',
                    performanceScore: 88,
                    totalDeliveries: 0,
                    onTimeDeliveries: 0
                },
            ]);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const department = selectedDepartment === 'all' ? undefined : selectedDepartment;
                const data = await operationsAPI.getStaff(department);
                setStaff(data);
                setError('');
            }
            catch {
                setError('Unable to load staff data. Using sample data.');
                // Fallback data
                setStaff([
                    {
                        id: '1',
                        name: 'Nguyễn Văn A',
                        email: 'nguyenvana@company.com',
                        phone: '0912345678',
                        role: 'DRIVER',
                        status: 'ACTIVE',
                        department: 'Transportation',
                        shiftStart: '06:00',
                        shiftEnd: '14:00',
                        performanceScore: 92,
                        totalDeliveries: 245,
                        onTimeDeliveries: 225
                    },
                    {
                        id: '3',
                        name: 'Lê Văn C',
                        email: 'levanc@company.com',
                        phone: '0123456789',
                        role: 'DRIVER',
                        status: 'ACTIVE',
                        department: 'Transportation',
                        shiftStart: '08:00',
                        shiftEnd: '16:00',
                        performanceScore: 95,
                        totalDeliveries: 312,
                        onTimeDeliveries: 298
                    },
                    {
                        id: '5',
                        name: 'Hoàng Văn E',
                        email: 'hoangvane@company.com',
                        phone: '0789123456',
                        role: 'DISPATCHER',
                        status: 'ACTIVE',
                        department: 'Dispatch',
                        shiftStart: '08:00',
                        shiftEnd: '17:00',
                        performanceScore: 90,
                        totalDeliveries: 0,
                        onTimeDeliveries: 0
                    },
                    {
                        id: '6',
                        name: 'Đặng Văn F',
                        email: 'dangvanf@company.com',
                        phone: '0456123789',
                        role: 'FLEET',
                        status: 'ACTIVE',
                        department: 'Maintenance',
                        shiftStart: '07:00',
                        shiftEnd: '15:00',
                        performanceScore: 88,
                        totalDeliveries: 0,
                        onTimeDeliveries: 0
                    },
                ]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDepartment]);
    const departments = [
        { key: 'all', label: t('common.all') },
        { key: 'Vận chuyển', label: t('dashboard.operations.staff.departments.transportation', 'Transportation') },
        { key: 'Điều phối', label: t('dashboard.operations.staff.departments.dispatch', 'Dispatch') },
        { key: 'Bảo trì', label: t('dashboard.operations.staff.departments.maintenance', 'Maintenance') },
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'text-green-400';
            case 'ON_LEAVE': return 'text-yellow-400';
            case 'SICK_LEAVE': return 'text-orange-400';
            case 'TERMINATED': return 'text-red-400';
            default: return 'text-white';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE': return t('dashboard.operations.staff.status.working', 'Working');
            case 'ON_LEAVE': return t('dashboard.operations.staff.status.onLeave', 'On Leave');
            case 'SICK_LEAVE': return t('dashboard.operations.staff.status.sickLeave', 'Sick Leave');
            case 'TERMINATED': return t('dashboard.operations.staff.status.terminated', 'Terminated');
            default: return status;
        }
    };
    const getRoleText = (role) => {
        switch (role) {
            case 'DRIVER': return t('dashboard.operations.staff.roles.driver', 'Driver');
            case 'DISPATCHER': return t('dashboard.operations.staff.roles.dispatcher', 'Dispatcher');
            case 'FLEET': return t('dashboard.operations.staff.roles.fleetManager', 'Fleet Manager');
            default: return role;
        }
    };
    const getDepartmentText = (department) => {
        switch (department) {
            case 'Vận chuyển': return t('dashboard.operations.staff.departments.transportation', 'Transportation');
            case 'Điều phối': return t('dashboard.operations.staff.departments.dispatch', 'Dispatch');
            case 'Bảo trì': return t('dashboard.operations.staff.departments.maintenance', 'Maintenance');
            default: return department;
        }
    };
    const getPerformanceColor = (performance) => {
        if (performance >= 90)
            return 'text-green-400';
        if (performance >= 75)
            return 'text-yellow-400';
        return 'text-red-400';
    };
    const filteredStaff = selectedDepartment === 'all'
        ? staff
        : staff.filter(s => s.department === selectedDepartment);
    // Calculate stats
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.status === 'ACTIVE').length;
    const onLeaveStaff = staff.filter(s => s.status === 'ON_LEAVE' || s.status === 'SICK_LEAVE').length;
    const avgPerformance = staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + s.performanceScore, 0) / staff.length) : 0;
    if (loading) {
        return (_jsx(GlassCard, { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-gray-800 text-lg", children: "Loading staff data..." }) }));
    }
    return (_jsxs(GlassCard, { className: "space-y-6", children: [error && (_jsxs("div", { className: "bg-yellow-500/30 border border-yellow-400/50 text-yellow-800 p-4 rounded-lg", children: ["\u26A0\uFE0F ", error] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-800", children: t('dashboard.operations.tabs.staff') }), _jsxs("div", { className: "flex gap-2", children: [departments.map((dept) => (_jsx(GlassButton, { size: "sm", variant: selectedDepartment === dept.key ? 'primary' : 'secondary', onClick: () => setSelectedDepartment(dept.key), children: dept.label }, dept.key))), _jsxs(GlassButton, { size: "sm", variant: "secondary", onClick: fetchStaff, children: ["\uD83D\uDD04 ", t('common.refresh')] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(StatCard, { title: t('dashboard.operations.staff.metrics.totalStaff', 'Total Staff'), value: totalStaff.toString(), icon: _jsx(FaUsers, { size: 24, color: "#4B5563" }) }), _jsx(StatCard, { title: t('dashboard.operations.staff.metrics.working', 'Working'), value: activeStaff.toString(), icon: _jsx(MdWorkHistory, { size: 24, color: "#10b981" }) }), _jsx(StatCard, { title: t('dashboard.operations.staff.metrics.onLeave', 'On Leave'), value: onLeaveStaff.toString(), icon: _jsx(FaUmbrellaBeach, { size: 24, color: "#f59e0b" }) }), _jsx(StatCard, { title: t('dashboard.operations.staff.metrics.avgPerformance', 'Avg Performance'), value: `${avgPerformance}%`, icon: _jsx(FaChartLine, { size: 24, color: "#4f46e5" }), trend: { value: 2.3, isPositive: true } })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("h3", { className: "text-lg font-medium", children: [t('dashboard.operations.staff.staffList', 'Staff List'), selectedDepartment !== 'all' && (_jsxs("span", { className: "text-gray-600 text-base ml-2", children: ["- ", departments.find(d => d.key === selectedDepartment)?.label] }))] }) }), _jsx(DataTable, { headers: [
                            t('dashboard.operations.staff.headers.name', 'Name'),
                            t('dashboard.operations.staff.headers.role', 'Role'),
                            t('dashboard.operations.staff.headers.department', 'Department'),
                            t('dashboard.operations.staff.headers.status', 'Status'),
                            t('dashboard.operations.staff.headers.contact', 'Contact')
                        ], children: filteredStaff.map((person) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: person.name }), _jsxs("div", { className: "text-gray-600 text-xs", children: ["ID: ", person.id] })] }), _jsx(TableCell, { children: getRoleText(person.role) }), _jsx(TableCell, { children: getDepartmentText(person.department) }), _jsx(TableCell, { children: _jsx("span", { className: `font-medium ${getStatusColor(person.status)}`, children: getStatusText(person.status) }) }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm", children: [_jsx("div", { children: person.phone }), _jsx("div", { className: "text-gray-600 text-xs", children: person.email })] }) })] }, person.id))) })] })] }));
}
