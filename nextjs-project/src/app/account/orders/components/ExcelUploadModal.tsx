"use client";

import { Modal, Button, Upload, Typography, Divider, Table } from "antd";
import {
  CloudUploadOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import type { UploadProps } from "antd";
import { OrderItem } from "@/types/orders";
import * as XLSX from "xlsx";

const { Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaveData: (data: OrderItem[]) => void;
}

export default function ExcelUploadModal({ open, onClose, onSaveData }: Props) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<OrderItem[]>([]);

  const handleDownloadSample = () => {
    // Tạo file Excel mẫu
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

    // Tạo workbook và worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "Order Items");

    // Tải file
    XLSX.writeFile(wb, "sample_order_items.xlsx");
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Chuyển đổi dữ liệu sang định dạng OrderItem
        const orderItems: OrderItem[] = (
          jsonData as Record<string, unknown>[]
        ).map((row) => ({
          product_name: String(
            row["Tên sản phẩm"] || row["product_name"] || ""
          ),
          quantity: Number(row["Số lượng"] || row["quantity"]) || 1,
          weight: Number(row["Cân nặng (kg)"] || row["weight"]) || 0,
          height: Number(row["Chiều cao (cm)"] || row["height"]) || 0,
          width: Number(row["Chiều rộng (cm)"] || row["width"]) || 0,
          length: Number(row["Chiều dài (cm)"] || row["length"]) || 0,
        }));

        setExcelData(orderItems);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        // Có thể thêm thông báo lỗi cho người dùng
      }
    };
    reader.readAsBinaryString(file);
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".xlsx,.xls",
    disabled: uploadedFile !== null, // Disable khi đã có file
    beforeUpload: (file) => {
      setUploadedFile(file);
      processExcelFile(file); // Tự động xử lý file khi upload
      return false; // Prevent default upload
    },
    onRemove: () => {
      setUploadedFile(null);
      setExcelData([]);
    },
  };

  const handleSaveData = () => {
    if (excelData.length > 0) {
      onSaveData(excelData);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    // Reset tất cả state khi đóng modal
    setUploadedFile(null);
    setExcelData([]);
    onClose();
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExcelData([]);
  };

  const tableColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "product_name",
      key: "product_name",
      width: 200,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
    },
    {
      title: "Cân nặng (kg)",
      dataIndex: "weight",
      key: "weight",
      width: 100,
    },
    {
      title: "Chiều cao (cm)",
      dataIndex: "height",
      key: "height",
      width: 100,
    },
    {
      title: "Chiều rộng (cm)",
      dataIndex: "width",
      key: "width",
      width: 100,
    },
    {
      title: "Chiều dài (cm)",
      dataIndex: "length",
      key: "length",
      width: 100,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleCloseModal}
      width={600}
      footer={null}
      closeIcon={<CloseOutlined />}
      centered
    >
      <div style={{ padding: "20px 0" }}>
        <Title level={3} style={{ marginBottom: 8, textAlign: "center" }}>
          Excel Upload
        </Title>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Button
            type="default"
            onClick={handleDownloadSample}
            style={{
              backgroundColor: "#f0f0f0",
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              padding: "6px 24px",
              height: "auto",
            }}
          >
            Download Sample Categories Data
          </Button>
        </div>

        <Upload.Dragger
          {...uploadProps}
          style={{
            backgroundColor: uploadedFile ? "#f6f6f6" : "#fafafa",
            border: "2px dashed #d9d9d9",
            borderRadius: 8,
            padding: "40px 20px",
            marginBottom: 24,
            opacity: uploadedFile ? 0.5 : 1,
          }}
        >
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
          </p>
          <p
            className="ant-upload-text"
            style={{ fontSize: 16, color: "#8c8c8c" }}
          >
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p
            className="ant-upload-hint"
            style={{ fontSize: 14, color: "#bfbfbf" }}
          >
            Only Excel Files (.xlsx)
          </p>
        </Upload.Dragger>

        {/* Hiển thị file đã chọn */}
        {uploadedFile && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "#f0f0f0",
                borderRadius: 6,
                border: "1px solid #d9d9d9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>📎</span>
                <span style={{ fontSize: 14 }}>{uploadedFile.name}</span>
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleRemoveFile}
                style={{ color: "#ff4d4f" }}
              />
            </div>
          </div>
        )}

        {excelData.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Divider orientation="left">Preview Data</Divider>
            <Table
              dataSource={excelData.map((item, index) => ({
                ...item,
                key: index,
              }))}
              columns={tableColumns}
              pagination={false}
              scroll={{ y: 300, x: 700 }}
              size="small"
              style={{
                backgroundColor: "#fafafa",
                border: "1px solid #d9d9d9",
                borderRadius: 6,
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={handleCloseModal}>Cancel</Button>

          <Button
            type="primary"
            onClick={handleSaveData}
            disabled={excelData.length === 0}
            style={{
              backgroundColor: "#1f2937",
              borderColor: "#1f2937",
            }}
          >
            Save Data
          </Button>
        </div>
      </div>
    </Modal>
  );
}
