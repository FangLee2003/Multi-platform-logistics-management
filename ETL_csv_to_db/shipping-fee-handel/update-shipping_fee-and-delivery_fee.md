# Task: Tính và cập nhật phí giao hàng (shipping_fee và delivery_fee) trong database MySQL

# Yêu cầu:
# 1. Điền giá trị cho cột `shipping_fee` trong bảng `order_items`.
#    - `order_items.product_id` liên kết với `products.id`
#    - Lấy thông tin `weight` (kg), `volume` (m³), và `is_fragile` từ bảng `products`
#    - Công thức tính phí logistics cho mỗi order_item:
#
#    TỔNG PHÍ LOGISTICS = PHÍ CƠ BẢN × HỆ SỐ RỦI RO × HỆ SỐ SERVICE_TYPE
#
#    ### 1. Phí Cơ Bản (Weight-based)
#    - Trọng lượng tính phí = MAX(Trọng lượng thực tế, Trọng lượng quy đổi)
#    - Trọng lượng quy đổi = (Volume × 1,000,000) / 5000
#         (vì Volume là m³, cần đổi ra cm³ trước: 1 m³ = 1,000,000 cm³)
#         → Công thức rút gọn: Trọng lượng quy đổi (kg) = Volume × 200
#    - Đơn giá: 15,000 VNĐ / kg
#
#    ### 2. Hệ số Rủi ro
#    - Nếu products.is_fragile = false → 1.0
#    - Nếu products.is_fragile = true  → 1.3
#
#    ### 3. Hệ số Service Type
#    - Lấy từ bảng deliveries.service_type (deliveries liên kết orders bằng deliveries.order_id = orders.id)
#    - Bảng order_items liên kết với orders qua order_items.order_id = orders.id
#
#    Service Type hệ số:
#       SECOND_CLASS → 0.8
#       STANDARD     → 1.0
#       FIRST_CLASS  → 1.3
#       EXPRESS      → 1.8
#
#    → shipping_fee của mỗi order_item = phí logistics tính được.
#
# 2. Sau khi cập nhật shipping_fee cho các order_items:
#    - Tính `delivery_fee` trong bảng `deliveries`.
#    - 1 delivery chỉ chứa 1 order.
#    - delivery_fee = SUM(shipping_fee) của tất cả order_items thuộc order đó.
#
# 3. Viết code Python:
#    - Kết nối MySQL
#    - Truy xuất dữ liệu từ products, order_items, orders, deliveries
#    - Tính toán theo công thức
#    - Update shipping_fee trong order_items
#    - Update delivery_fee trong deliveries
