"use client";
import { useEffect, useState } from "react";

interface Address {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  postalCode?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  floorNumber?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderDetail {
  orderCode?: string | null;
  id: number;
  vehicle?: {
    id: number;
    licensePlate: string;
    model?: string | null;
    vehicleType?: string | null;
    currentDriver?: {
      id: number;
      username: string;
      fullName?: string;
      email?: string;
    };
  };
  address?: Address;
  description?: string | null;
  notes?: string | null;
  orderProfitPerOrder?: number;
  status?: {
    id: number;
    statusType: string;
    name: string;
    description?: string;
  };
  store?: {
    id: number;
    storeName: string;
    email?: string;
  };
  totalAmount?: number | null;
  createdBy?: {
    id: number;
    username: string;
    fullName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ProductItem {
  id: number;
  product: {
    name: string;
    weight?: number;
    volume?: number;
    fragile?: boolean;
  };
  quantity: number;
  shippingFee?: number;
  notes?: string;
}

interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
}

export default function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [orderItem, setOrderItem] = useState<OrderDetail | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
        const resOrder = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const orderData = await resOrder.json();
        setOrderItem(orderData as OrderDetail);

        const resProducts = await fetch(`http://localhost:8080/api/order-items/order/${orderId}/paged?page=0&size=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const productsData = await resProducts.json();
        setProducts((productsData.content || []) as ProductItem[]);
      } catch {
        setOrderItem(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) fetchData();
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.15)] flex items-center justify-center z-100">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-2 max-h-[80vh] overflow-y-auto shadow-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
        </div>
        {loading ? (
          <div className="min-h-[200px] flex items-center justify-center text-lg text-gray-500">Đang tải dữ liệu...</div>
        ) : !orderItem ? (
          <div className="min-h-[200px] flex items-center justify-center text-lg text-red-500">Không tìm thấy đơn hàng</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã đơn</label>
                <p className="text-gray-900">{orderItem.orderCode ?? orderItem.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                <p className="text-gray-900">{orderItem.createdBy?.fullName ?? orderItem.createdBy?.username ?? ""}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <p className="text-gray-900">{orderItem.status?.name ?? ""}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                <p className="text-gray-900">{orderItem.createdAt ? new Date(orderItem.createdAt).toLocaleString() : ""}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ giao hàng</label>
              <div className="text-gray-700 space-y-1">
                <p>{orderItem.address && typeof orderItem.address === "object" ? orderItem.address.address : ""}</p>
                {orderItem.address?.contactPhone && (
                  <p><span className="font-medium">SĐT:</span> {orderItem.address.contactPhone}</p>
                )}
                {orderItem.address?.contactEmail && (
                  <p><span className="font-medium">Email:</span> {orderItem.address.contactEmail}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lộ trình</label>
              <div className="text-gray-900">
                <p><strong>Từ:</strong> {orderItem.store?.storeName ?? ""}</p>
                <p><strong>Đến:</strong> {orderItem.address && typeof orderItem.address === "object" ? orderItem.address.address : ""}</p>
              </div>
            </div>
            {products && products.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                <table className="min-w-full text-sm mt-2">
                  <thead>
                    <tr>
                      <th className="text-left">Tên sản phẩm</th>
                      <th className="text-left">Số lượng</th>
                      <th className="text-left">Khối lượng</th>
                      <th className="text-left">Thể tích</th>
                      <th className="text-left">Hàng dễ vỡ</th>
                      <th className="text-left">Phí giao hàng</th>
                      <th className="text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(item => (
                      <tr key={item.id}>
                        <td>{item.product?.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.product?.weight !== undefined ? item.product.weight : ""}</td>
                        <td>{item.product?.volume !== undefined ? item.product.volume : ""}</td>
                        <td>{item.product?.fragile !== undefined ? (item.product.fragile ? "Có" : "Không") : ""}</td>
                        <td>{item.shippingFee ? Number(String(item.shippingFee).replace(/,/g, "")).toLocaleString() + " đ" : ""}</td>
                        <td>{item.notes || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {orderItem.totalAmount ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phí giao hàng</label>
                <p className="text-gray-900">{Number(orderItem.totalAmount).toLocaleString()} đ</p>
              </div>
            ) : null}
            {orderItem.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <p className="text-gray-900">{orderItem.description}</p>
              </div>
            )}
            {orderItem.vehicle && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Biển số - Loại xe</label>
                  <p className="text-gray-900">
                    {orderItem.vehicle.licensePlate}
                    {orderItem.vehicle.vehicleType ? ` - ${orderItem.vehicle.vehicleType}` : ""}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tài xế</label>
                  <p className="text-gray-900">
                    {orderItem.vehicle.currentDriver ? orderItem.vehicle.currentDriver.fullName || orderItem.vehicle.currentDriver.username : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
