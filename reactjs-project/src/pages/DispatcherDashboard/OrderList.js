import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ...existing code...
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { fetchOrders, fetchOrderById } from "../../services/OrderAPI";
import { useDispatcherContext } from "../../contexts/DispatcherContext";
import { useQuery } from "@tanstack/react-query";
export default function OrderList() {
    const { t } = useTranslation();
    const { selectedOrder, setSelectedOrder } = useDispatcherContext();
    const [searchId, setSearchId] = useState("");
    const [searching, setSearching] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState("");
    // Sử dụng React Query để fetch orders với pagination
    const { data: ordersResponse, isLoading: loading, error: fetchError } = useQuery({
        queryKey: ['ordersForList', page, PAGE_SIZE],
        queryFn: async () => {
            const token = localStorage.getItem("token") || "";
            return await fetchOrders(page, PAGE_SIZE, token);
        },
        enabled: !isSearchMode, // Chỉ fetch khi không ở chế độ tìm kiếm
        staleTime: 30 * 1000, // Cache 30 giây
        refetchOnWindowFocus: true,
    });
    const orders = isSearchMode ? searchResults : (ordersResponse?.data || []);
    const totalPages = isSearchMode ? 1 : (ordersResponse?.totalPages || 1);
    // Hàm chọn đơn hàng để hiển thị route
    const handleOrderClick = (order) => {
        console.log('OrderList: Selected order:', order);
        console.log('OrderList: Vehicle info:', order.vehicle);
        console.log('OrderList: Vehicle ID:', order.vehicle?.id);
        console.log('OrderList: Current driver:', order.vehicle?.currentDriver);
        setSelectedOrder(order);
    };
    // Hàm tìm kiếm đơn hàng theo ID
    const handleSearch = async () => {
        if (!searchId.trim())
            return;
        setSearching(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || "";
            const foundOrder = await fetchOrderById(searchId.trim(), token);
            if (foundOrder) {
                setSearchResults([foundOrder]);
                setIsSearchMode(true);
                setPage(1);
            }
            else {
                setSearchResults([]);
                setIsSearchMode(true);
                setPage(1);
                setError(t('dashboard.dispatcher.orders.orderNotFound'));
            }
        }
        catch (err) {
            setError(t('dashboard.dispatcher.orders.searchError'));
        }
        finally {
            setSearching(false);
        }
    };
    // Khi xóa nội dung ô tìm kiếm, tự động trả lại danh sách đơn hàng mặc định
    useEffect(() => {
        if (searchId.trim() === "") {
            setIsSearchMode(false);
            setSearchResults([]);
            setError("");
        }
    }, [searchId]);
    // const handleRefresh = () => {
    //   fetchOrdersCallback();
    // };
    return (_jsxs("div", { className: "bg-gradient-to-br from-blue-50/80 via-white/90 to-blue-100/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/40 shadow-2xl max-w-full overflow-x-auto", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-3xl font-extrabold mb-2 text-blue-900 tracking-tight", children: t('dashboard.dispatcher.orders.title') }), _jsx("div", { className: "text-gray-500 text-base", children: t('dashboard.dispatcher.subtitle') }), _jsxs("div", { className: "text-sm text-blue-600 mt-1", children: ["\uD83D\uDCA1 ", t('dashboard.dispatcher.orders.clickToViewMap', 'Click on order to view route on map')] })] }), _jsxs("div", { className: "flex items-center gap-2 bg-white/80 border border-blue-100 rounded-xl px-3 py-2 shadow", children: [_jsx("input", { type: "text", placeholder: t('dashboard.dispatcher.orders.enterOrderId'), className: "px-2 py-1 rounded border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-base", value: searchId, onChange: e => setSearchId(e.target.value), onKeyDown: e => { if (e.key === 'Enter')
                                    handleSearch(); }, disabled: loading || searching }), _jsx("button", { onClick: handleSearch, disabled: !searchId.trim() || loading || searching, className: "px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded transition-colors duration-200 font-semibold", children: searching ? t('common.loading') : t('dashboard.dispatcher.orders.search') })] })] }), error || fetchError ? (_jsx("div", { className: "text-center py-8 px-4 bg-red-100/80 border border-red-200 rounded-xl text-red-700 font-semibold shadow flex items-center justify-center gap-2", children: error || fetchError?.message || t('common.error') })) : (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "flex flex-col gap-4", children: orders.map((order) => (_jsxs("div", { onClick: () => handleOrderClick(order), className: `rounded-2xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow hover:shadow-xl transition-all duration-200 cursor-pointer ${selectedOrder?.id === order.id
                                ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-300'
                                : 'bg-white/90 border-blue-100 hover:bg-blue-50/80'}`, children: [_jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-2", children: [_jsxs("div", { className: "flex flex-wrap gap-2 items-center mb-1", children: [_jsxs("span", { className: "font-extrabold text-lg text-blue-900", children: ["#", order.id] }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm
                      ${order.status?.name === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                        : order.status?.name === 'Processing'
                                                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                                                            : order.status?.name === 'Shipped'
                                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                                : order.status?.name === 'Delivered'
                                                                    ? 'bg-green-100 text-green-800 border-green-300'
                                                                    : order.status?.name === 'Completed'
                                                                        ? 'bg-green-100 text-green-800 border-green-300'
                                                                        : order.status?.name === 'Cancelled'
                                                                            ? 'bg-red-100 text-red-800 border-red-300'
                                                                            : order.status?.name === 'FAILED'
                                                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                                                : 'bg-gray-100 text-gray-700 border-gray-300'}
                    `, children: order.status?.name }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm
                      ${order.status?.statusType === 'High'
                                                        ? 'bg-red-100 text-red-700 border-red-300'
                                                        : order.status?.statusType === 'Medium'
                                                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                                                            : 'bg-green-100 text-green-700 border-green-300'}
                    `, children: order.status?.statusType })] }), _jsxs("div", { className: "text-sm text-gray-700", children: [_jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-blue-700", children: [t('dashboard.dispatcher.orders.customer'), ":"] }), _jsxs("span", { className: "text-blue-800", children: [" ", order.store?.storeName] })] }), _jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-blue-700", children: [t('common.from'), ":"] }), _jsxs("span", { className: "text-gray-700", children: [" ", order.store?.address] })] }), _jsxs("div", { children: [_jsxs("span", { className: "font-semibold text-blue-700", children: [t('common.to'), ":"] }), _jsxs("span", { className: "text-gray-700", children: [" ", order.address?.address, order.address?.city ? ", " + order.address.city : ""] })] })] })] }), _jsxs("div", { className: "flex flex-col items-end min-w-[180px] gap-1", children: [_jsx("div", { className: "text-base text-blue-900 font-bold", children: order.createdAt?.slice(0, 10) }), _jsxs("div", { className: "text-sm text-gray-700", children: [_jsxs("span", { className: "font-semibold text-gray-500", children: [t('dashboard.dispatcher.orders.driver'), ":"] }), " ", _jsx("span", { className: "font-semibold text-blue-800", children: order.vehicle?.currentDriver?.fullName || t('dashboard.dispatcher.orders.notAssigned') }), order.vehicle?.licensePlate && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-1 text-gray-400", children: "|" }), _jsxs("span", { className: "font-semibold text-blue-800", children: [t('dashboard.dispatcher.orders.vehicle'), ": ", order.vehicle.licensePlate] })] }))] })] })] }, order.id))) }), _jsxs("div", { className: "flex justify-center items-center gap-3 mt-8", children: [_jsxs("button", { className: "px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow disabled:opacity-50 transition-all duration-150 hover:bg-blue-200", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 || loading, children: ["< ", t('common.previous')] }), _jsxs("span", { className: "mx-2 text-blue-900 font-semibold text-base", children: [t('common.page', 'Page'), " ", page, " / ", totalPages] }), _jsxs("button", { className: "px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow disabled:opacity-50 transition-all duration-150 hover:bg-blue-200", onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages || loading, children: [t('common.next'), " >"] })] })] }))] }));
}
