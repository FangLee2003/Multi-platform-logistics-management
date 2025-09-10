import { Form, Input, InputNumber, Button, Table } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { OrderItem } from "@/types/orders";
import { FormInstance } from "antd";

interface Props {
  form: FormInstance<any>;
}

export default function StepOrderItems({ form }: Props) {
  return (
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
                      rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
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
  );
}
