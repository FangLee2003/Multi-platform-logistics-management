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
  open: boolean;
  onClose: () => void;
  orderItem: {
    code: string;
    customer: string;
    status: string;
    date: string;
    address: string;
    from: string;
    to: string;
    note?: string;
    description?: string;
    assignedVehicle?: {
      licensePlate: string;
      vehicleType: string;
    };
    currentDriver?: {
      fullName?: string;
      username: string;
    };
  } | null;
  products?: ProductItem[];
  deliveryFee?: number;
  productsPage?: number;
  productsTotalPages?: number;
  onProductsPageChange?: (page: number) => void;
}

export default function OrderDetailModal({ open, onClose, orderItem, products, deliveryFee, productsPage = 0, productsTotalPages = 1, onProductsPageChange }: OrderDetailModalProps) {
  if (!open || !orderItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã đơn</label>
              <p className="text-gray-900">{orderItem.code}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
              <p className="text-gray-900">{orderItem.customer}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <p className="text-gray-900">{orderItem.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
              <p className="text-gray-900">{orderItem.date}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ giao hàng</label>
            <p className="text-gray-900">{orderItem.address}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lộ trình</label>
            <div className="text-gray-900">
              <p><strong>Từ:</strong> {orderItem.from}</p>
              <p><strong>Đến:</strong> {orderItem.to}</p>
            </div>
          </div>

          {/* Hiển thị danh sách sản phẩm */}
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
                      <td>{
                        item.shippingFee
                          ? Number(String(item.shippingFee).replace(/,/g, "")).toLocaleString() + " đ"
                          : ""
                      }</td>
                      <td>{item.notes || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Phân trang cho sản phẩm */}
              {productsTotalPages > 1 && onProductsPageChange && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => onProductsPageChange(productsPage - 1)}
                    disabled={productsPage === 0}
                    className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-700 font-semibold text-sm"
                  >
                    &lt; Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {productsPage + 1} / {productsTotalPages}
                  </span>
                  <button
                    onClick={() => onProductsPageChange(productsPage + 1)}
                    disabled={productsPage >= productsTotalPages - 1}
                    className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-700 font-semibold text-sm"
                  >
                    Tiếp &gt;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hiển thị phí giao hàng */}
          {typeof deliveryFee === "number" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Phí giao hàng</label>
              <p className="text-gray-900">{deliveryFee.toLocaleString()} đ</p>
            </div>
          )}

          {orderItem.note && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <p className="text-gray-900">{orderItem.note}</p>
            </div>
          )}

          {orderItem.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <p className="text-gray-900">{orderItem.description}</p>
            </div>
          )}

          {orderItem.assignedVehicle && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Xe được gán</label>
              <p className="text-gray-900">
                {orderItem.assignedVehicle.licensePlate} - {orderItem.assignedVehicle.vehicleType}
              </p>
            </div>
          )}

          {orderItem.currentDriver && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tài xế</label>
              <p className="text-gray-900">
                {orderItem.currentDriver.fullName || orderItem.currentDriver.username}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
