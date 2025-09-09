import { Card, Row, Col, Divider, Typography, Table, Checkbox, Select, Form } from "antd";
import { Store } from "@/types/Store";
import { OrderItem } from "@/types/orders";

const { Text, Title } = Typography;

interface Props {
  store: Store | null;
  shippingAddress?: string;
  description?: string;
  notes?: string;
  items: OrderItem[];
  isFragile?: boolean;
  serviceType?: string;
  calculateShippingFee: (items: OrderItem[]) => number;
}

export default function StepInvoice({
  store,
  shippingAddress,
  description,
  notes,
  items,
  isFragile,
  serviceType,
  calculateShippingFee,
}: Props) {
  const validItems = items.filter(
    (i) => i && i.product_name && i.quantity > 0 && i.weight > 0
  );

  const baseShippingFee = calculateShippingFee(validItems);

  let serviceFeeMultiplier = 1;
  switch (serviceType) {
    case "SECOND_CLASS":
      serviceFeeMultiplier = 0.8;
      break;
    case "FIRST_CLASS":
      serviceFeeMultiplier = 1.5;
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
        <Col xs={24} md={12}>
          <Card size="small" title="Thông tin giao hàng">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <Text strong>Từ: </Text>
                <Text>{store?.address || "Đang tải..."}</Text>
              </div>
              <div>
                <Text strong>Đến: </Text>
                <Text>{shippingAddress || "Chưa nhập địa chỉ giao hàng"}</Text>
              </div>
              {description && (
                <div>
                  <Text strong>Mô tả: </Text>
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
                  { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
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
                <Form.Item name="is_fragile" valuePropName="checked" initialValue={false}>
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
                    <Select.Option value="SECOND_CLASS">Tiết kiệm (-20%)</Select.Option>
                    <Select.Option value="STANDARD">Tiêu chuẩn</Select.Option>
                    <Select.Option value="FIRST_CLASS">Cao cấp (+50%)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}>
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
                    {isFragile && (
                      <>
                        <Col span={12}>
                          <Text>Phí hàng dễ vỡ:</Text>
                        </Col>
                        <Col span={12} style={{ textAlign: "right" }}>
                          <Text>x {fragileFeeMultiplier}</Text>
                        </Col>
                      </>
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
