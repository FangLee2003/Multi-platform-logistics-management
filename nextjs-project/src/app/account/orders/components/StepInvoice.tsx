import {
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Table,
  Checkbox,
  Select,
  Form,
} from "antd";
import { Store } from "@/types/Store";
import { OrderItem } from "@/types/orders";
import { FormInstance } from "antd";

const { Text, Title } = Typography;

interface Props {
  form: FormInstance<any>;
  store: Store | null;
  calculateShippingFee: (items: OrderItem[]) => number;
}

export default function StepInvoice({
  form,
  store,
  calculateShippingFee,
}: Props) {
  // Sử dụng form.getFieldValue() cho từng field để đảm bảo lấy được dữ liệu đã lưu
  const shippingAddress = form.getFieldValue("shipping_address");
  const receiverName = form.getFieldValue("receiver_name");
  const receiverPhone = form.getFieldValue("receiver_phone");
  const receiverEmail = form.getFieldValue("receiver_email");
  const description = form.getFieldValue("description");
  const notes = form.getFieldValue("notes");
  const items: OrderItem[] = form.getFieldValue("items") || [];

  // Watch những field cần real-time update (checkbox và select)
  const isFragile = Form.useWatch("is_fragile", form) ?? false;
  const serviceType = Form.useWatch("service_type", form) ?? "STANDARD";

  const validItems = items.filter(
    (i) => i && i.product_name && i.quantity > 0 && i.weight > 0
  );

  const baseShippingFee = calculateShippingFee(validItems);

  let serviceFeeMultiplier = 1;
  switch (serviceType) {
    case "SECOND_CLASS":
      serviceFeeMultiplier = 0.8;
      break;
    case "STANDARD":
      serviceFeeMultiplier = 1.0;
      break;
    case "FIRST_CLASS":
      serviceFeeMultiplier = 1.3;
      break;
    case "EXPRESS":
      serviceFeeMultiplier = 1.8;
      break;
    default:
      serviceFeeMultiplier = 1.0;
      break;
  }

  const fragileFeeMultiplier = isFragile ? 1.3 : 1;
  const totalFee = Math.round(
    baseShippingFee * serviceFeeMultiplier * fragileFeeMultiplier
  );

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
                    title: "Kích thước (cm)",
                    key: "dimensions",
                    render: (_, r: OrderItem) =>
                      `${r.height || 0} × ${r.width || 0} × ${r.length || 0}`,
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
                  name="is_fragile"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Checkbox>Hàng dễ vỡ (+30% phí)</Checkbox>
                </Form.Item>
              </Col>
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
                      <Text>Phí vận chuyển cơ bản:</Text>
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
                    <Col span={12}>
                      <Text>Phí hàng dễ vỡ:</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text>x {fragileFeeMultiplier}</Text>
                    </Col>
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
