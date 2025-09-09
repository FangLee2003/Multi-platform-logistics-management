import { Row, Col, Form, Input, Button } from "antd";
import { Store } from "@/types/Store";
import { useState } from "react";
import AddressFormModal, { AddressData } from "./AddressFormModal";

const { TextArea } = Input;

interface Props {
  store: Store | null;
}

export default function StepStoreInfo({ store }: Props) {
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [addressValue, setAddressValue] = useState<string>("");
  const form = Form.useFormInstance();

  const handleAddressSelect = (addressData: AddressData) => {
    setAddressValue(addressData.fullAddress || "");
    form.setFieldsValue({ shipping_address: addressData.fullAddress });
    setIsAddressModalVisible(false);
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        {/* Cột trái: Địa chỉ cửa hàng và giao hàng */}
        <Col xs={24} md={12}>
          <Form.Item label="Địa chỉ cửa hàng">
            <Input
              value={store?.address || "Đang tải..."}
              disabled
              placeholder="Địa chỉ cửa hàng"
            />
          </Form.Item>
          <Form.Item
            name="shipping_address"
            label="Địa chỉ giao hàng"
            rules={[
              { required: true, message: "Vui lòng nhập địa chỉ giao hàng!" },
            ]}
          >
            <Input
              placeholder="Nhấp để chọn địa chỉ giao hàng"
              value={addressValue}
              onClick={() => setIsAddressModalVisible(true)}
              readOnly
              style={{ cursor: "pointer" }}
            />
          </Form.Item>
        </Col>

        {/* Cột phải: Thông tin người nhận */}
        <Col xs={24} md={12}>
          <Form.Item
            name="receiver_name"
            label="Tên người nhận"
            rules={[
              { required: true, message: "Vui lòng nhập tên người nhận!" },
            ]}
          >
            <Input placeholder="Nhập tên người nhận" />
          </Form.Item>
          <Form.Item
            name="receiver_phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại không hợp lệ!",
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item
            name="receiver_email"
            label="Email người nhận"
            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
          >
            <Input placeholder="Nhập email (không bắt buộc)" />
          </Form.Item>
        </Col>

        {/* Phần mô tả và ghi chú full width */}
        <Col xs={24}>
          <Form.Item name="description" label="Mô tả đơn hàng">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả chi tiết (không bắt buộc)"
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú bổ sung (nếu có)" />
          </Form.Item>
        </Col>
      </Row>

      <AddressFormModal
        visible={isAddressModalVisible}
        onCancel={() => setIsAddressModalVisible(false)}
        onOk={handleAddressSelect}
      />
    </>
  );
}
