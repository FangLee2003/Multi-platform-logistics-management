"use client";
import { useState, useEffect } from "react";
import { Card, Steps, Typography, Button, Form, message } from "antd";
import {
  ShopOutlined,
  BoxPlotOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { Store } from "@/types/Store";
import { storeService } from "@/services/storeService";
import StepStoreInfo from "../components/StepStoreInfo";
import StepOrderItems from "../components/StepOrderItems";
import StepInvoice from "../components/StepInvoice";
import { OrderForm, OrderItem } from "@/types/orders";

const { Title } = Typography;

const calculateShippingFee = (items: OrderItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => {
    let fee = 15000;
    fee += (item.weight || 0) * 10000;
    fee += ((item.height || 0) + (item.width || 0)) * 1000;
    fee *= item.quantity || 1;
    return total + fee;
  }, 0);
};

export default function CreateOrder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const data = await storeService.getStoresByUserId(user.id.toString());
        if (data && data.length > 0) setStore(data[0]);
      } catch (e) {
        message.error("Lỗi tải cửa hàng");
      }
    };
    fetchStore();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (values: OrderForm) => {
    message.success("Tạo đơn hàng thành công!");
  };

  const steps = [
    {
      title: "Thông tin cửa hàng",
      icon: <ShopOutlined />,
      content: <StepStoreInfo store={store} />,
    },
    {
      title: "Chi tiết đơn hàng",
      icon: <BoxPlotOutlined />,
      content: <StepOrderItems form={form} />, // chỉ truyền form, không cần items props
    },
    {
      title: "Hoá đơn",
      icon: <DollarOutlined />,
      content: (
        <StepInvoice
          form={form}
          store={store}
          calculateShippingFee={calculateShippingFee}
        />
      ),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep((prev) => prev + 1);
    } catch {
      // bỏ qua error log
    }
  };

  const prev = () => setCurrentStep((prev) => prev - 1);

  return (
    <Card>
      <Title level={2}>Tạo đơn hàng mới</Title>
      <Steps
        current={currentStep}
        items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
      />
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {steps[currentStep].content}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          {currentStep > 0 && (
            <Button onClick={prev} style={{ marginRight: 8 }}>
              Quay lại
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Tiếp tục
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" htmlType="submit">
              Tạo đơn hàng
            </Button>
          )}
        </div>
      </Form>
    </Card>
  );
}
