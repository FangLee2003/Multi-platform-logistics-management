import { useState, useEffect } from "react";
import OrderChecklistTimeline from "../../components/OrderChecklistTimeline";
import { fetchOrders, fetchOrderById, fetchNotCompletedOrders, type FetchNotCompletedOrdersResponse } from "../../services/orderAPI";
import { useDispatcherContext } from "../../contexts/DispatcherContext";
import type { Order } from "../../types/Order";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function OrderList() {
  const queryClient = useQueryClient();
  const { selectedOrder, setSelectedOrder } = useDispatcherContext();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [error, setError] = useState("");

  // Use React Query to fetch orders with pagination
  const {
    data: ordersResponse,
    isLoading: loading,
    error: fetchError,
    refetch
  } = useQuery<FetchNotCompletedOrdersResponse>({
    queryKey: ['ordersForList', 'not-completed', page],
    queryFn: async () => {
      const token = localStorage.getItem("token") || "";
      return await fetchNotCompletedOrders(page, PAGE_SIZE, token);
    },
    enabled: !isSearchMode,
    staleTime: 0, // Không cache - luôn fetch fresh data
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 1000, // Tự động refetch mỗi 5 giây
  });

  const paginatedOrders: Order[] = isSearchMode
    ? searchResults
    : (ordersResponse?.content || []).slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  const totalPages = isSearchMode ? 1 : (ordersResponse?.totalPages || 1);

  // Function to select order for route display
  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(order.id);
  };

  // Function to search order by ID
  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      const foundOrder = await fetchOrderById(searchId.trim(), token);
      if (foundOrder) {
        // Kiểm tra nếu đơn hàng đã completed thì không hiển thị
        const isCompleted = foundOrder.status?.name?.toLowerCase().includes('completed');
        if (isCompleted) {
          setSearchResults([]);
          setIsSearchMode(true);
          setPage(1);
          setError("Đơn hàng này đã hoàn thành và không hiển thị trong danh sách chưa hoàn thành.");
        } else {
          setSearchResults([foundOrder]);
          setIsSearchMode(true);
          setPage(1);
        }
      } else {
        setSearchResults([]);
        setIsSearchMode(true);
        setPage(1);
        setError('Failed to load orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchId.trim() === "") {
      setIsSearchMode(false);
      setSearchResults([]);
      setError("");
    }
  }, [searchId]);

  // Thêm useEffect để force refresh khi component được focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isSearchMode) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch, isSearchMode]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60">
      <div className="space-y-6">
        {/* Header and Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="border-l-4 border-blue-600 pl-4">
              <div className="text-2xl font-bold text-gray-900">Order Management</div>
              <div className="text-gray-600 text-sm mt-1">Manage and track all delivery orders</div>
              <div className="text-sm text-blue-600 mt-1">💡 {'Click on order to view route on map'}</div>
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder='Search by order ID, customer name, or address'
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm bg-white"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                disabled={loading || searching}
              />
              <button
                onClick={handleSearch}
                disabled={!searchId.trim() || loading || searching}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200 font-semibold text-sm"
              >
                {searching ? 'Loading' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {error || fetchError ? (
        <div className="text-center py-8 px-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold shadow flex items-center justify-center gap-2">
          {error || (fetchError as Error)?.message || 'No orders found'}
        </div>
      ) : (
        <div className="relative">
          {/* Order list */}
          <div className="flex flex-col gap-6">
            {paginatedOrders.map((order: Order) => (
              <div key={order.id} className="space-y-4">
                {/* Order Card */}
                <div
                  onClick={() => handleOrderClick(order)}
                  className={`rounded-2xl border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                    selectedOrder?.id === order.id 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 ring-2 ring-blue-300 shadow-blue-200/50' 
                      : 'bg-white/95 backdrop-blur-sm border-gray-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50'
                  }`}
                >
                  {/* Left: Order info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3 items-center mb-2">
                      <span className="font-bold text-xl text-blue-900 bg-blue-100 px-3 py-1 rounded-full shadow-sm">
                        #{order.id}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 shadow-md transition-all duration-200 hover:scale-105 ${
                        order.status?.name === 'Pending'
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-400 shadow-yellow-200/50'
                          : order.status?.name === 'Processing'
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-400 shadow-purple-200/50'
                          : order.status?.name === 'Shipping'
                          ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-400 shadow-blue-200/50'
                          : order.status?.name === 'Delivered'
                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-400 shadow-green-200/50'
                          : order.status?.name === 'Completed'
                          ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-400 shadow-emerald-200/50'
                          : order.status?.name === 'Cancelled'
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-400 shadow-red-200/50'
                          : order.status?.name === 'FAILED'
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-400 shadow-red-200/50'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-400 shadow-gray-200/50'
                      }`}>
                        {order.status?.name}
                      </span>
                      {order.status?.statusType && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 shadow-md ${
                          order.status?.statusType === 'High'
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-400 shadow-red-200/50'
                            : order.status?.statusType === 'Medium'
                            ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-400 shadow-orange-200/50'
                            : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-400 shadow-green-200/50'
                        }`}>
                          📊 {order.status?.statusType}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs">
                          🏪 Customer:
                        </span>
                        <span className="text-gray-800 font-medium">{order.store?.storeName}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs">
                          📍 From:
                        </span>
                        <span className="text-gray-700 flex-1">{order.store?.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md text-xs">
                          🎯 To:
                        </span>
                        <span className="text-gray-700 flex-1">
                          {order.address?.address}{order.address?.city ? ", " + order.address.city : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Date & driver/vehicle info */}
                  <div className="flex flex-col items-end min-w-[220px] gap-2 bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                    <div className="text-base text-blue-900 font-bold bg-blue-100 px-3 py-1 rounded-lg shadow-sm">
                      📅 {order.createdAt?.slice(0, 10)}
                    </div>
                    <div className="text-sm text-gray-700 text-right space-y-1 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-600 text-xs">👤 Driver:</span> 
                        <span className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded-md text-xs">
                          {order.vehicle?.currentDriver?.fullName || 'Not Assigned'}
                        </span>
                      </div>
                      {order.vehicle?.licensePlate && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-600 text-xs">🚛 Vehicle:</span>
                          <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md text-xs">
                            {order.vehicle.licensePlate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Checklist timeline - display when expanded */}
                {expandedOrderId === order.id && (
                  <div className="px-2">
                    <OrderChecklistTimeline orderId={order.id} orderStatus={order.status?.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-bold shadow-md disabled:opacity-50 transition-all duration-200 hover:from-blue-200 hover:to-blue-300 hover:scale-105"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              ← Previous
            </button>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
              <span className="text-blue-900 font-semibold text-base">
                {'Page'} {page} / {totalPages}
              </span>
            </div>
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 font-bold shadow-md disabled:opacity-50 transition-all duration-200 hover:from-blue-200 hover:to-blue-300 hover:scale-105"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next →
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}