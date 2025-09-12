import { Form, Input, InputNumber, Button, Table, Checkbox } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { OrderItem } from "@/types/orders";
import { FormInstance } from "antd";
import ExcelUploadModal from "./ExcelUploadModal";

interface Props {
  form: FormInstance;
}

export default function StepOrderItems({ form }: Props) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const handleDownloadSample = () => {
    // Tạo file Excel mẫu với cột cần thiết
    const sampleData = [
      [
        "Tên sản phẩm",
        "Số lượng",
        "Cân nặng (kg)",
        "Chiều cao (cm)",
        "Chiều rộng (cm)",
        "Chiều dài (cm)",
      ],
      ["Sản phẩm mẫu 1", 2, 1.5, 30, 20, 40],
      ["Sản phẩm mẫu 2", 1, 0.8, 15, 15, 25],
    ];

    // Tạo CSV content
    const csvContent = sampleData.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "sample_order_items.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelData = (data: OrderItem[]) => {
    // Lấy dữ liệu hiện có và thêm dữ liệu từ Excel vào cuối
    const currentItems: OrderItem[] = form.getFieldValue("items") || [];
    const updatedItems = [...currentItems, ...data];
    form.setFieldValue("items", updatedItems);
  };

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleDownloadSample}
        >
          Tải file mẫu
        </Button>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setIsExcelModalOpen(true)}
        >
          Nhập file Excel
        </Button>
      </div>

      <Form.List name="items">
        {(fields, { add, remove }) => {
          const items: OrderItem[] = form.getFieldValue("items") || [];

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Table
                dataSource={fields.map((field, index) => ({
                  key: field.key,
                  ...(items[index] || {}),
                }))}
                pagination={false}
                columns={[
                  {
                    title: "Tên sản phẩm",
                    key: "product_name",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "product_name"]}
                        rules={[
                          { required: true, message: "Nhập tên sản phẩm" },
                        ]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="Tên sản phẩm" />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Số lượng",
                    key: "quantity",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "quantity"]}
                        rules={[{ required: true, message: "Nhập số lượng" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Cân nặng (kg)",
                    key: "weight",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "weight"]}
                        rules={[{ required: true, message: "Nhập cân nặng" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber
                          min={0}
                          step={0.1}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Chiều cao (cm)",
                    key: "height",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "height"]}
                        rules={[{ required: true, message: "Nhập chiều cao" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Chiều rộng (cm)",
                    key: "width",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "width"]}
                        rules={[{ required: true, message: "Nhập chiều rộng" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Chiều dài (cm)",
                    key: "length",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "length"]}
                        rules={[{ required: true, message: "Nhập chiều dài" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Hàng dễ vỡ",
                    key: "is_fragile",
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "is_fragile"]}
                        valuePropName="checked"
                        style={{ margin: 0 }}
                      >
                        <Checkbox>Dễ vỡ</Checkbox>
                      </Form.Item>
                    ),
                  },
                  {
                    title: "",
                    key: "action",
                    render: (_, __, index) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(index)}
                      />
                    ),
                  },
                ]}
              />
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                block
              >
                Thêm sản phẩm
              </Button>
            </div>
          );
        }}
      </Form.List>

      <ExcelUploadModal
        open={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSaveData={handleExcelData}
      />
    </div>
  );
}
