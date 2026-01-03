

import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import type { Order } from "../../types/Order";
import OrderChecklistTimeline from "../../components/OrderChecklistTimeline";

export default function CompletedOrdersList() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  // State cho delivery proofs
  const [deliveryProofs, setDeliveryProofs] = useState<any[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [proofsError, setProofsError] = useState("");

  const fetchCompletedOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || "";
      // Gọi API lấy đơn hàng thành công có phân trang từ backend
      const res = await fetch(`http://localhost:8080/api/orders/completed/paginated?page=${page}&size=${PAGE_SIZE}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng đã giao thành công.");
      const data = await res.json();
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.totalElements || (data.total || 0));
    } catch (err: any) {
      setError("Không thể tải danh sách đơn hàng đã giao thành công.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, [page]);

  // Tự động refresh khi component được focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCompletedOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh mỗi 15 giây
    const interval = setInterval(() => {
      fetchCompletedOrders();
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [page]);

  // Khi chọn đơn hàng, gọi API lấy proofs
  const handleSelectOrder = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setProofsLoading(true);
    setProofsError("");
    setDeliveryProofs([]);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`http://localhost:8080/api/delivery-proofs/order/${orderId}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Không thể tải minh chứng giao hàng.");
      const data = await res.json();
      setDeliveryProofs(data || []);
    } catch (err: any) {
      setProofsError("Không thể tải minh chứng giao hàng.");
    } finally {
      setProofsLoading(false);
    }
  };

  return (
    <div className="p-8 w-full bg-gradient-to-br from-emerald-50/50 via-white/90 to-green-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text mb-2">
            {t('dashboard.dispatcher.completedOrders.title')}
          </h2>
          <p className="text-gray-600 font-medium">Quản lý và theo dõi các đơn hàng đã hoàn thành</p>
        </div>
        <button
          onClick={fetchCompletedOrders}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className={`transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}>🔄</span>
          Làm mới
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">{t('dashboard.dispatcher.completedOrders.loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <p className="text-red-700 font-semibold text-lg">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-lg font-medium">{t('dashboard.dispatcher.completedOrders.noOrders')}</p>
          <p className="text-gray-500 mt-2">Chưa có đơn hàng nào được hoàn thành</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {orders.map((order: Order) => (
              <div key={order.id} className="group">
                <div
                  className={`flex items-center justify-between border-2 shadow-lg px-8 py-6 cursor-pointer transition-all duration-300 bg-gradient-to-r from-white via-green-50/30 to-white hover:shadow-2xl hover:border-emerald-300 transform hover:scale-[1.02] ${
                    selectedOrderId === order.id 
                      ? "rounded-t-2xl border-emerald-400 shadow-emerald-200/50 border-b-emerald-200" 
                      : "rounded-2xl border-gray-200 hover:border-emerald-200"
                  }`}
                  onClick={() => handleSelectOrder(order.id)}
                >
                  {/* Left: Order info */}
                  <div className="flex flex-col gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text">#{order.id}</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-md transition-all duration-200 hover:scale-105
                        ${order.status?.name === 'Completed'
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 shadow-emerald-200/50'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 shadow-gray-200/50'}
                      `}>
                        ✅ {order.status?.name}
                      </span>
                      {order.status?.statusType && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 shadow-md transition-all duration-200
                          ${order.status?.statusType === 'High'
                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300'
                            : order.status?.statusType === 'Medium'
                            ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-300'
                            : 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300'}
                        `}>
                          🏷️ {order.status?.statusType}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                          🏪 {t('dashboard.dispatcher.completedOrders.customer')}:
                        </span>
                        <span className="text-emerald-800 font-semibold">{order.store?.storeName}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-2 whitespace-nowrap">
                          📍 {t('dashboard.dispatcher.completedOrders.from')}:
                        </span>
                        <span className="text-gray-700 font-medium">{order.store?.address}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 flex items-center gap-2 whitespace-nowrap">
                          🎯 {t('dashboard.dispatcher.completedOrders.to')}:
                        </span>
                        <span className="text-gray-700 font-medium">{order.address?.address}{order.address?.city ? ", " + order.address.city : ""}</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: Date & driver/vehicle */}
                  <div className="flex flex-col items-end min-w-[250px] gap-3 bg-gradient-to-br from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-lg">
                    <div className="text-lg font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text flex items-center gap-2">
                      📅 {order.createdAt?.slice(0, 10)}
                    </div>
                    <div className="text-sm text-gray-700 text-right space-y-2 w-full">
                      <div className="flex items-center justify-between gap-3 bg-white/80 rounded-lg px-3 py-2 border border-gray-200">
                        <span className="font-bold text-gray-600 text-xs flex items-center gap-1">
                          👤 {t('dashboard.dispatcher.completedOrders.driver')}:
                        </span> 
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md text-xs">
                          {order.vehicle?.currentDriver?.fullName || t('dashboard.dispatcher.completedOrders.notAssigned')}
                        </span>
                      </div>
                      {order.vehicle?.licensePlate && (
                        <div className="flex items-center justify-between gap-3 bg-white/80 rounded-lg px-3 py-2 border border-gray-200">
                          <span className="font-bold text-gray-600 text-xs flex items-center gap-1">
                            🚛 {t('dashboard.dispatcher.completedOrders.vehicle')}:
                          </span>
                          <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md text-xs">
                            {order.vehicle.licensePlate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Hiển thị timeline và minh chứng nếu là đơn hàng đang chọn */}
                {selectedOrderId === order.id && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-b-2xl border-2 border-t-0 border-emerald-200 shadow-xl -mt-2 animate-in slide-in-from-top duration-300">
                    {/* Checklist Timeline */}
                    <div className="px-6 py-6 border-b border-emerald-100">
                      <OrderChecklistTimeline orderId={order.id} orderStatus={order.status?.name} />
                    </div>
                    
                    {/* Delivery Proofs */}
                    <div className="px-6 py-6">
                      <div className="font-bold text-emerald-700 mb-4 text-lg flex items-center gap-2">
                        📋 {t('dashboard.dispatcher.completedOrders.deliveryProof')}:
                      </div>
                      {proofsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-600 font-medium">{t('dashboard.dispatcher.completedOrders.loadingProof')}</p>
                          </div>
                        </div>
                      ) : proofsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                          <div className="text-red-500 text-2xl mb-2">⚠️</div>
                          <p className="text-red-700 font-semibold">{proofsError}</p>
                        </div>
                      ) : deliveryProofs.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                          <div className="text-yellow-500 text-3xl mb-2">📄</div>
                          <p className="text-yellow-700 font-semibold">{t('dashboard.dispatcher.completedOrders.noProof')}</p>
                          <p className="text-yellow-600 text-sm mt-1">Chưa có minh chứng giao hàng</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliveryProofs.map((proof: any, idx: number) => (
                            <div key={proof.id || idx} className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-emerald-200">
                              <span className="font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                📸 {proof.proofType || proof.proofTypeDisplay}
                              </span>
                              {proof.filePath && (
                                <a 
                                  href={`http://localhost:8080${proof.filePath}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 underline font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  🔗 Tệp minh chứng
                                </a>
                              )}
                              {proof.recipientName && (
                                <span className="text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                  👤 Người nhận: <span className="font-semibold text-gray-800">{proof.recipientName}</span>
                                </span>
                              )}
                              {proof.notes && (
                                <span className="text-gray-600 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                  💭 {proof.notes}
                                </span>
                              )}
                              {proof.capturedAt && (
                                <span className="text-gray-500 text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                  ⏰ {proof.capturedAt?.slice(0, 19).replace('T', ' ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          <div className="flex flex-col items-center gap-6 mt-12">
            <div className="flex justify-center items-center gap-4">
              <button
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-700 font-bold shadow-lg disabled:opacity-50 transition-all duration-200 hover:from-emerald-200 hover:to-green-300 hover:scale-105 transform"
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                ← {t('dashboard.dispatcher.completedOrders.previous')}
              </button>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 border-2 border-emerald-200 shadow-lg">
                <span className="text-emerald-900 font-bold text-lg">
                  {t('dashboard.dispatcher.completedOrders.page')} {page} / {totalPages}
                </span>
              </div>
              <button
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-700 font-bold shadow-lg disabled:opacity-50 transition-all duration-200 hover:from-emerald-200 hover:to-green-300 hover:scale-105 transform"
                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                {t('dashboard.dispatcher.completedOrders.next')} →
              </button>
            </div>
            
            {/* Tổng số đơn hàng */}
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl px-8 py-4 border border-gray-200 shadow-lg">
              <div className="text-emerald-800 font-bold text-lg flex items-center justify-center gap-2">
                📊 {t('dashboard.dispatcher.completedOrders.total')} <span className="text-emerald-600">{totalOrders}</span> {t('dashboard.dispatcher.completedOrders.orders')}
              </div>
              {totalPages > 1 && (
                <div className="text-gray-600 mt-2 text-sm">
                  Trang {page} / {totalPages}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
