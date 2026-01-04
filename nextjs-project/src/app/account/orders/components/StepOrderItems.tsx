import { Form, Input, InputNumber, Button, Table, Checkbox, Select, message } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { OrderItem } from "@/types/orders";
import { FormInstance } from "antd";
import ExcelUploadModal from "./ExcelUploadModal";
import { Product } from "@/types/Product";

interface Props {
  form: FormInstance;
}

export default function StepOrderItems({ form }: Props) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load danh sách sản phẩm có sẵn khi component mount
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/products?page=0&size=1000`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
        console.log(`✅ Loaded ${data.length} products for selection`);
      } catch (error) {
        console.error('❌ Error loading products:', error);
        message.error('Failed to load product list. Please refresh the page.');
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const handleDownloadSample = () => {
    import("xlsx").then((XLSX) => {
      const sampleData = [
        [
          "Product Name",
          "Quantity",
          "Weight (kg)",
          "Height (cm)",
          "Width (cm)",
          "Length (cm)",
        ],
        ["Sample Product 1", 2, 1.5, 30, 20, 40],
        ["Sample Product 2", 1, 0.8, 15, 15, 25],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sampleData);

      const colWidths = [
        { wch: 20 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Weight
        { wch: 12 }, // Height
        { wch: 12 }, // Width
        { wch: 12 }, // Length
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Order Items");

      XLSX.writeFile(wb, "sample_order_items.xlsx");
    });
  };

  const handleExcelData = (data: OrderItem[]) => {
    const currentItems: OrderItem[] = form.getFieldValue("items") || [];
    const updatedItems = [...currentItems, ...data];
    form.setFieldValue("items", updatedItems);
  };

  // Hàm xử lý khi chọn sản phẩm - tự động fill weight và fragile
  const handleProductSelect = (productId: number, index: number) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const items = form.getFieldValue("items") || [];
      items[index] = {
        ...items[index],
        product_id: productId,
        product_name: selectedProduct.name,
        weight: selectedProduct.weight || items[index]?.weight,
        is_fragile: selectedProduct.fragile ?? items[index]?.is_fragile,
      };
      form.setFieldValue("items", items);
      console.log(`✅ Selected product: ${selectedProduct.name} (ID: ${productId})`);
    }
  };

  return (
    <div>
      {/* Action buttons */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleDownloadSample}
        >
          Download Sample File
        </Button>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setIsExcelModalOpen(true)}
          style={{
            marginRight: 8,
            backgroundColor: "#15803d",
            borderColor: "#15803d",
          }}
        >
          Import Excel File
        </Button>
      </div>

      {/* Table with form list */}
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
                scroll={{ x: 900 }}
                size="small"
                columns={[
                  {
                    title: "Product",
                    key: "product_id",
                    width: 250,
                    render: (_, __, index) => (
                      <>
                        {/* Hidden field để lưu product_name */}
                        <Form.Item name={[index, "product_name"]} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[index, "product_id"]}
                          rules={[
                            { required: true, message: "Select a product" },
                          ]}
                          style={{ margin: 0 }}
                        >
                          <Select
                            showSearch
                            placeholder="Select product..."
                            loading={loadingProducts}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(value) => handleProductSelect(value, index)}
                            options={products.map(p => ({
                              value: p.id,
                              label: `${p.name} (Stock: ${p.stockQuantity || 0})`,
                            }))}
                          />
                        </Form.Item>
                      </>
                    ),
                  },
                  {
                    title: "Quantity",
                    key: "quantity",
                    width: 120,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "quantity"]}
                        rules={[{ required: true, message: "Enter quantity" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Weight (kg)",
                    key: "weight",
                    width: 150,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "weight"]}
                        rules={[{ required: true, message: "Enter weight" }]}
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
                    title: "Height (cm)",
                    key: "height",
                    width: 150,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "height"]}
                        rules={[{ required: true, message: "Enter height" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Width (cm)",
                    key: "width",
                    width: 150,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "width"]}
                        rules={[{ required: true, message: "Enter width" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Length (cm)",
                    key: "length",
                    width: 150,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "length"]}
                        rules={[{ required: true, message: "Enter length" }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: "Fragile",
                    key: "is_fragile",
                    width: 120,
                    render: (_, __, index) => (
                      <Form.Item
                        name={[index, "is_fragile"]}
                        valuePropName="checked"
                        style={{ margin: 0 }}
                      >
                        <Checkbox>Fragile</Checkbox>
                      </Form.Item>
                    ),
                  },
                  {
                    title: "",
                    key: "action",
                    width: 60,
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

              {/* Add button */}
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                block
              >
                Add Product
              </Button>
            </div>
          );
        }}
      </Form.List>

      {/* Excel Import Modal */}
      <ExcelUploadModal
        open={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSaveData={handleExcelData}
      />
    </div>
  );
}
