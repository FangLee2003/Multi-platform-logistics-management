import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, Row, Col, Spin } from "antd";
import {
  addressService,
  Province,
  District,
  Ward,
} from "@/services/addressService";

const { Option } = Select;
const { TextArea } = Input;

interface AddressData {
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  fullAddress?: string;
}


interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: (address: AddressData & {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }) => void;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}


export default function AddressFormModal({ visible, onCancel, onOk, contactName, contactPhone, contactEmail }: Props) {
  const [form] = Form.useForm();
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  // Data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces when modal opens
  useEffect(() => {
    if (visible) {
      loadProvinces();
    }
  }, [visible]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await addressService.getProvinces();
      setProvinces(data);
    } catch (error) {
      console.error("Failed to load provinces:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceChange = async (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict("");
    setDistricts([]);
    setWards([]);
    form.setFieldsValue({ district: undefined, ward: undefined });

    setLoadingDistricts(true);
    try {
      const data = await addressService.getDistricts(value);
      setDistricts(data);
    } catch (error) {
      console.error("Failed to load districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (value: string) => {
    setSelectedDistrict(value);
    setWards([]);
    form.setFieldsValue({ ward: undefined });

    setLoadingWards(true);
    try {
      const data = await addressService.getWards(value);
      setWards(data);
    } catch (error) {
      console.error("Failed to load wards:", error);
    } finally {
      setLoadingWards(false);
    }
  };

  // Hàm lấy lat/lng từ địa chỉ (dùng Nominatim OpenStreetMap)
  const getLatLngFromAddress = async (address: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch {
      // ignore
    }
    return { latitude: null, longitude: null };
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const provinceName = provinces.find((p) => p.code === values.province)?.name || "";
      const districtName = districts.find((d) => d.code === values.district)?.name || "";
      const wardName = wards.find((w) => w.code === values.ward)?.name || "";


      // Địa chỉ mô tả (address): nối detailAddress, wardName, districtName
      const addressStr = [values.detailAddress, wardName, districtName]
        .filter(Boolean)
        .join(', ');

      // Lấy lat/lng tự động
      const { latitude, longitude } = await getLatLngFromAddress(`${addressStr}, ${provinceName}`);

      const addressData = {
        // Các trường cho frontend (giữ nguyên)
        province: provinceName,
        district: districtName,
        ward: wardName,
        detailAddress: values.detailAddress || "",
        fullAddress: `${values.detailAddress}, ${wardName}, ${districtName}, ${provinceName}`.replace(/^,\s*/, "").replace(/,\s*,/g, ","),
        // Các trường cho backend
        city: provinceName, // Tỉnh/Thành phố
        address: addressStr, // Quận/Huyện, Phường/Xã, Địa chỉ cụ thể nối lại
        contactName,
        contactPhone,
        contactEmail,
        latitude,
        longitude,
      };

      onOk(addressData);
      handleCancel();
    } catch (e) {
      // ignore
    }
  };

  const handleCancel = () => {
    onCancel();
    form.resetFields();
    setSelectedProvince("");
    setSelectedDistrict("");
    setProvinces([]);
    setDistricts([]);
    setWards([]);
  };

  return (
    <Modal
      title="Nhập địa chỉ giao hàng"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="province"
              label="Tỉnh/Thành phố"
              rules={[
                { required: true, message: "Vui lòng chọn tỉnh/thành phố!" },
              ]}
            >
              <Select
                placeholder="Chọn tỉnh/thành phố"
                onChange={handleProvinceChange}
                loading={loadingProvinces}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {provinces.map((province) => (
                  <Option key={province.code} value={province.code}>
                    {province.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="district"
              label="Quận/Huyện"
              rules={[{ required: true, message: "Vui lòng chọn quận/huyện!" }]}
            >
              <Select
                placeholder="Chọn quận/huyện"
                onChange={handleDistrictChange}
                disabled={!selectedProvince}
                loading={loadingDistricts}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {districts.map((district) => (
                  <Option key={district.code} value={district.code}>
                    {district.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="ward"
              label="Phường/Xã"
              rules={[{ required: true, message: "Vui lòng chọn phường/xã!" }]}
            >
              <Select
                placeholder="Chọn phường/xã"
                disabled={!selectedDistrict}
                loading={loadingWards}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {wards.map((ward) => (
                  <Option key={ward.code} value={ward.code}>
                    {ward.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="detailAddress"
              label="Địa chỉ cụ thể"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ cụ thể!" },
              ]}
            >
              <TextArea rows={2} placeholder="Nhập số nhà, tên đường..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export type { AddressData };
