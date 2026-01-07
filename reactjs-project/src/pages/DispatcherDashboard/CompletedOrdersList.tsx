

import React, { useState, useEffect } from "react";
import type { Order } from "../../types/Order";

export default function CompletedOrdersList() {
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

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token") || "";
        // Fetch completed orders with pagination from backend
        const res = await fetch(`http://localhost:8080/api/orders/completed/paginated?page=${page}&size=${PAGE_SIZE}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Unable to load completed orders list.");
        const data = await res.json();
        setOrders(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalOrders(data.totalElements || (data.total || 0));
      } catch (err: any) {
        setError("Unable to load completed orders list.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompletedOrders();
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
      if (!res.ok) throw new Error("Unable to load delivery proofs.");
      const data = await res.json();
      setDeliveryProofs(data || []);
    } catch (err: any) {
      setProofsError("Unable to load delivery proofs.");
    } finally {
      setProofsLoading(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="border-l-4 border-green-600 pl-4">
            <h2 className="text-2xl font-bold text-gray-900">Completed Orders List</h2>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="text-gray-600 font-medium">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">An error occurred</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders</h3>
                <p className="text-gray-500">No completed orders found.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
            {orders.map((order: Order) => (
              <div key={order.id}>
                <div
                  className={`flex items-center justify-between rounded-xl border shadow-md px-6 py-4 cursor-pointer transition-all duration-150 hover:shadow-lg hover:border-blue-400 bg-white ${selectedOrderId === order.id ? "ring-2 ring-blue-400" : ""}`}
                  onClick={() => handleSelectOrder(order.id)}
                >
                  {/* Left: Order info */}
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-blue-700">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm
                        ${order.status?.name === 'Completed'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'}
                      `}>
                        {order.status?.name}
                      </span>
                      {order.status?.statusType && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm
                          ${order.status?.statusType === 'High'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : order.status?.statusType === 'Medium'
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-green-100 text-green-700 border-green-300'}
                        `}>
                          {order.status?.statusType}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <div>
                        <span className="font-semibold text-blue-700">Customer:</span>
                        <span className="text-blue-800"> {order.store?.storeName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-700">From:</span>
                        <span className="text-gray-700"> {order.store?.address}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-700">To:</span>
                        <span className="text-gray-700"> {order.address?.address}{order.address?.city ? ", " + order.address.city : ""}</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: Date & driver/vehicle */}
                  <div className="flex flex-col items-end min-w-[180px] gap-1">
                    <div className="text-base text-blue-900 font-bold">{order.createdAt?.slice(0, 10)}</div>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-500">Driver:</span> <span className="font-semibold text-blue-800">{order.vehicle?.currentDriver?.fullName || "Not assigned"}</span>
                      {order.vehicle?.licensePlate && (
                        <>
                          <span className="mx-1 text-gray-400">|</span>
                          <span className="font-semibold text-blue-800">Vehicle: {order.vehicle.licensePlate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Hiển thị minh chứng nếu là đơn hàng đang chọn */}
                {selectedOrderId === order.id && (
                  <div className="bg-gray-50 border-l-4 border-blue-400 mt-2 mb-4 p-4 rounded-xl">
                    <div className="font-bold text-blue-700 mb-2">Delivery Proof:</div>
                    {proofsLoading ? (
                      <div className="text-gray-500">Loading proof...</div>
                    ) : proofsError ? (
                      <div className="text-red-600">{proofsError}</div>
                    ) : deliveryProofs.length === 0 ? (
                      <div className="text-gray-500">No delivery proof yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {deliveryProofs.map((proof: any, idx: number) => (
                          <li key={proof.id || idx} className="flex items-center gap-3 p-2 bg-white rounded shadow">
                            <span className="font-semibold text-blue-800">{proof.proofType || proof.proofTypeDisplay}</span>
                            {proof.filePath && (
                              <a href={`http://localhost:8080${proof.filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Proof File</a>
                            )}
                            {proof.recipientName && (
                              <span className="ml-2 text-gray-700">Recipient: <span className="font-semibold">{proof.recipientName}</span></span>
                            )}
                            {proof.notes && (
                              <span className="ml-2 text-gray-500 italic">({proof.notes})</span>
                            )}
                            {proof.capturedAt && (
                              <span className="ml-2 text-gray-400 text-xs">{proof.capturedAt?.slice(0, 19).replace('T', ' ')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow disabled:opacity-50 transition-all duration-150 hover:bg-blue-200"
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              &lt; Previous
            </button>
            <span className="mx-2 text-blue-900 font-semibold text-base">Page {page} / {totalPages}</span>
            <button
              className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow disabled:opacity-50 transition-all duration-150 hover:bg-blue-200"
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next &gt;
            </button>
          </div>
          {/* Total orders and current page at bottom */}
          <div className="text-center mt-6 text-gray-600">
            Total {totalOrders} orders
            {totalPages > 1 && (
              <span className="ml-2">| Page {page} / {totalPages}</span>
            )}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}
