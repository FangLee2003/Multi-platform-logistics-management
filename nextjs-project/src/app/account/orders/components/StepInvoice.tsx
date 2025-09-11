import React from "react";
import {
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Table,
  Select,
  Form,
} from "antd";
import { Store } from "@/types/Store";
import { OrderItem } from "@/types/orders";
import { FormInstance } from "antd";
import { calculateShippingFee, getServiceMultiplier, calculateBaseShippingFee } from "@/utils/shipping";
import { calculateDistanceFee, calculateTotalDistance } from "@/utils/distance";
import { getMapboxRoute } from "@/utils/mapbox";
import { isValidItem, calculateVolume } from "@/utils/orderItems";

const { Text, Title } = Typography;

interface Props {
  form: FormInstance<any>;
  store: Store | null;
}

export default function StepInvoice({ form, store }: Props) {
  // Lấy dữ liệu từ form
  const shippingAddress = form.getFieldValue("shipping_address");
  const receiverName = form.getFieldValue("receiver_name");
  const receiverPhone = form.getFieldValue("receiver_phone");
  const receiverEmail = form.getFieldValue("receiver_email");
  const description = form.getFieldValue("description");
  const notes = form.getFieldValue("notes");
  const items: OrderItem[] = form.getFieldValue("items") || [];

  // Watch những field cần real-time update
  const serviceType = Form.useWatch("service_type", form) ?? "STANDARD";

  // State cho tính toán khoảng cách
  const [distanceKm, setDistanceKm] = React.useState<number | null>(null);
  const [distanceFee, setDistanceFee] = React.useState<number | null>(null);
  const [distanceRegion, setDistanceRegion] = React.useState<string>("");
  const [loadingRoute, setLoadingRoute] = React.useState(false);

  // Tự động lấy route và tính phí khi đủ tọa độ
  React.useEffect(() => {
    const fetchRouteAndCalculate = async () => {
      // Reset state
      setDistanceKm(null);
      setDistanceFee(null);
      setDistanceRegion("");
      
      // Kiểm tra tọa độ
      if (!store?.longitude || !store?.latitude) return;
      
      const endLat = form.getFieldValue("latitude");
      const endLng = form.getFieldValue("longitude");
      if (!endLat || !endLng) return;
      
      setLoadingRoute(true);
      
      try {
        // Lấy route từ Mapbox
        const coordinates = await getMapboxRoute(
          store.longitude,
          store.latitude,
          endLng,
          endLat
        );
        
        // Tính khoảng cách
        if (coordinates.length >= 2) {
          const distance = calculateTotalDistance(coordinates);
          setDistanceKm(distance);
          
          // Tính phí theo khoảng cách
          const feeResult = calculateDistanceFee(distance);
          console.log(`🗺️ Distance: ${distance.toFixed(2)}km, Fee result:`, feeResult);
          setDistanceFee(feeResult.fee);
          setDistanceRegion(feeResult.region);
        }
      } catch (error) {
        console.error("Lỗi khi tính toán route:", error);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRouteAndCalculate();
  }, [store?.longitude, store?.latitude, form.getFieldValue("latitude"), form.getFieldValue("longitude")]);

  // Tính toán phí vận chuyển
  const serviceFeeMultiplier = getServiceMultiplier(serviceType);
  
  // Tính tổng phí sản phẩm (chỉ tính phí cơ bản, chưa áp dụng hệ số dịch vụ)
  let baseShippingFee = 0;
  items.forEach((item) => {
    if (isValidItem(item)) {
      const itemFragile = (item as any)?.is_fragile || false;
      // Tính phí cơ bản (chưa áp dụng hệ số dịch vụ)
      const itemFee = calculateBaseShippingFee([item], itemFragile);
      baseShippingFee += itemFee;
    }
  });

  // Tổng phí vận chuyển = (phí sản phẩm × hệ số dịch vụ) + phí khoảng cách
  const totalFee = Math.round(baseShippingFee * serviceFeeMultiplier + (distanceFee || 0));

  // Tự động lưu totalFee vào form
  React.useEffect(() => {
    form.setFieldValue("delivery_fee", totalFee);
  }, [totalFee, form]);

  return (
    <Card>
      <Title level={4}>Chi tiết đơn hàng</Title>
      <Row gutter={[16, 24]}>
        <Col xs={24}>
          <Card size="small" title="Thông tin giao hàng">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 16 }}>
                  <Title
                    level={5}
                    style={{ margin: 0, marginBottom: 12, color: "#1890ff" }}
                  >
                    📍 Địa chỉ lấy hàng
                  </Title>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div>
                      <Text strong>Tên cửa hàng: </Text>
                      <Text>{store?.storeName || "Đang tải"}</Text>
                    </div>
                    <div>
                      <Text strong>Số điện thoại: </Text>
                      <Text>{store?.phone || "Đang tải..."}</Text>
                    </div>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>{store?.email || "Đang tải..."}</Text>
                    </div>
                    <div>
                      <Text strong>Địa chỉ: </Text>
                      <Text>{store?.address || "Đang tải..."}</Text>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 16 }}>
                  <Title
                    level={5}
                    style={{ margin: 0, marginBottom: 12, color: "#52c41a" }}
                  >
                    🏠 Địa chỉ nhận hàng
                  </Title>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div>
                      <Text strong>Tên người nhận: </Text>
                      <Text>{receiverName || "Chưa nhập tên người nhận"}</Text>
                    </div>
                    <div>
                      <Text strong>Số điện thoại: </Text>
                      <Text>{receiverPhone || "Chưa nhập số điện thoại"}</Text>
                    </div>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>{receiverEmail || "Không có"}</Text>
                    </div>
                    <div>
                      <Text strong>Địa chỉ: </Text>
                      <Text>
                        {shippingAddress || "Chưa nhập địa chỉ giao hàng"}
                      </Text>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            {(description || notes) && (
              <>
                <Divider style={{ margin: "16px 0" }} />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {description && (
                    <div>
                      <Text strong>Mô tả đơn hàng: </Text>
                      <Text>{description}</Text>
                    </div>
                  )}
                  {notes && (
                    <div>
                      <Text strong>Ghi chú: </Text>
                      <Text>{notes}</Text>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card size="small" title="Danh sách sản phẩm">
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
                <Text>Chưa có sản phẩm nào được thêm</Text>
              </div>
            ) : (
              <Table
                dataSource={items.map((item, index) => ({
                  ...item,
                  key: `item-${index}`,
                }))}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: "Tên sản phẩm",
                    dataIndex: "product_name",
                    key: "product_name",
                  },
                  { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
                  {
                    title: "Cân nặng (kg)",
                    dataIndex: "weight",
                    key: "weight",
                    render: (w: number) => `${w || 0} kg`,
                  },
                  {
                    title: "Thể tích (cm³)",
                    key: "volume",
                    render: (_, r: OrderItem) => {
                      const volume = calculateVolume(r);
                      return volume > 0
                        ? volume.toLocaleString("vi-VN") + " cm³"
                        : "-";
                    },
                  },
                  {
                    title: "Hàng dễ vỡ",
                    key: "is_fragile",
                    render: (_, r: OrderItem) => {
                      const itemFragile = (r as any)?.is_fragile || false;
                      return (
                        <Text style={{ color: itemFragile ? "#ff4d4f" : "#52c41a" }}>
                          {itemFragile ? "Có" : "Không"}
                        </Text>
                      );
                    },
                  },
                  {
                    title: "Phí vận chuyển",
                    key: "shipping_fee",
                    render: (_, r: OrderItem) => {
                      const itemFragile = (r as any)?.is_fragile || false;
                      // Hiển thị phí cơ bản (chưa áp dụng hệ số dịch vụ)
                      const itemFee = calculateBaseShippingFee([r], itemFragile);
                      return (
                        <Text strong style={{ color: "#1890ff" }}>
                          {itemFee.toLocaleString("vi-VN")} ₫
                        </Text>
                      );
                    },
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card size="small" title="Chi phí">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="service_type"
                  label="Loại dịch vụ"
                  initialValue="STANDARD"
                  rules={[{ required: true, message: "Chọn loại dịch vụ" }]}
                >
                  <Select placeholder="Chọn loại dịch vụ">
                    <Select.Option value="SECOND_CLASS">
                      Tiết kiệm (-20%)
                    </Select.Option>
                    <Select.Option value="STANDARD">Tiêu chuẩn</Select.Option>
                    <Select.Option value="FIRST_CLASS">
                      Cao cấp (+30%)
                    </Select.Option>
                    <Select.Option value="EXPRESS">
                      Hỏa tốc (+80%)
                    </Select.Option>
                    {/* <Select.Option value="PRIORITY">
                      Ưu tiên (+100%)
                    </Select.Option> */}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: 16,
                    borderRadius: 6,
                  }}
                >
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text>Phí sản phẩm (theo trọng lượng & loại hàng):</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text>{baseShippingFee.toLocaleString("vi-VN")} ₫</Text>
                    </Col>
                    <Col span={12}>
                      <Text>Loại dịch vụ ({serviceType || "STANDARD"}):</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text>x {serviceFeeMultiplier}</Text>
                    </Col>
                    {/* Đã xóa phần phí hàng dễ vỡ theo yêu cầu */}
                    {/* Hiển thị phí vận chuyển theo khoảng cách nếu có */}
                    {distanceFee !== null && (
                      <Col span={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          Phí vận chuyển theo khoảng cách ({distanceRegion}
                          {distanceKm !== null && (
                            <span style={{ color: '#888', fontWeight: 400 }}>
                              {' '}~{distanceKm.toFixed(2)} km
                            </span>
                          )}
                          )
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {Math.round(distanceFee).toLocaleString("vi-VN")} ₫
                        </span>
                      </Col>
                    )}
                    <Col span={24}>
                      <Divider style={{ margin: "12px 0" }} />
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 16 }}>
                        Tổng phí vận chuyển:
                      </Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                        {totalFee.toLocaleString("vi-VN")} ₫
                      </Text>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
