import { Row, Col, Form, Input } from "antd";
import { Store } from "@/types/Store";

const { TextArea } = Input;

interface Props {
  store: Store | null;
}

export default function StepStoreInfo({ store }: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item label="Địa chỉ cửa hàng">
          <Input
            value={store?.address || "Đang tải..."}
            disabled
            placeholder="Địa chỉ cửa hàng"
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          name="shipping_address"
          label="Địa chỉ giao hàng"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ giao hàng!" }]}
        >

          <Input.TextArea rows={2} placeholder="Nhập địa chỉ giao hàng" />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="description" label="Mô tả đơn hàng">
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết (không bắt buộc)" />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú bổ sung (nếu có)" />
        </Form.Item>
      </Col>
    </Row>
  );
}
