"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Divider,
  Alert,
  message,
  Select,
} from "antd";
import { CalculatorOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { storeService } from "@/services/storeService";
import type { Store } from "@/types/Store";
import {
  addressService,
  Province,
  District,
  Ward,
} from "@/services/addressService";
import { getCoordinatesFromAddress } from "@/server/geocode.api";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EstimateForm {
  pickupAddress: string;
  deliveryAddress: string;
  // Thêm các field cho địa chỉ giao hàng chi tiết
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  streetAddress?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  weight: number;
  length: number;
  width: number;
  height: number;
}

const calculateShippingFee = (values: EstimateForm): number => {
  // Công thức tính phí giao hàng (ví dụ):
  // 1. Phí cơ bản: 15,000đ
  const baseFee = 15000;

  // 2. Phí theo khối lượng: 10,000đ/kg
  const weightFee = values.weight * 10000;

  // 3. Phí theo thể tích (dài x rộng x cao): 500đ/cm³
  const volumeFee = values.length * values.width * values.height * 500;

  // Tổng phí = Phí cơ bản + Phí khối lượng + Phí thể tích
  const totalFee = baseFee + weightFee + volumeFee;

  return totalFee;
};

export default function EstimatePage() {
  const [form] = Form.useForm<EstimateForm>();
  const [fee, setFee] = useState<number>(0);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  // States cho địa chỉ giao hàng
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [addressValue, setAddressValue] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          message.error("Vui lòng đăng nhập để sử dụng tính năng này");
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id;

        if (!userId) {
          message.error("Không tìm thấy thông tin người dùng");
          setLoading(false);
          return;
        }

        const data = await storeService.getStoresByUserId(userId.toString());

        if (data && data.length > 0) {
          setStore(data[0]);
          form.setFieldsValue({ pickupAddress: data[0].address });
        } else {
          message.warning(
            "Không tìm thấy thông tin cửa hàng. Vui lòng nhập địa chỉ lấy hàng thủ công."
          );
        }
      } catch (error) {
        console.error("Failed to fetch store:", error);
        message.error("Không thể tải thông tin cửa hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [form]);

  // Load danh sách tỉnh/thành phố khi component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const provincesData = await addressService.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error("Error loading provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  // Load danh sách quận/huyện khi chọn tỉnh
  const handleProvinceChange = async (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict("");
    setSelectedWard("");
    setDistricts([]);
    setWards([]);

    await updateAddressDisplay(value, "", "", streetAddress);

    try {
      const districtsData = await addressService.getDistricts(value);
      setDistricts(districtsData);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  // Load danh sách xã/phường khi chọn quận
  const handleDistrictChange = async (value: string) => {
    setSelectedDistrict(value);
    setSelectedWard("");
    setWards([]);

    await updateAddressDisplay(selectedProvince, value, "", streetAddress);

    try {
      const wardsData = await addressService.getWards(value);
      setWards(wardsData);
    } catch (error) {
      console.error("Error loading wards:", error);
    }
  };

  // Xử lý khi chọn xã/phường
  const handleWardChange = async (value: string) => {
    setSelectedWard(value);
    await updateAddressDisplay(
      selectedProvince,
      selectedDistrict,
      value,
      streetAddress
    );
  };

  // Xử lý khi nhập số nhà/đường
  const handleStreetAddressChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setStreetAddress(value);
    await updateAddressDisplay(
      selectedProvince,
      selectedDistrict,
      selectedWard,
      value
    );
  };

  // Cập nhật hiển thị địa chỉ đầy đủ
  const updateAddressDisplay = async (
    provinceCode: string,
    districtCode: string,
    wardCode: string,
    street: string
  ) => {
    const provinceName =
      provinces.find((p) => p.code === provinceCode)?.name || "";
    const districtName =
      districts.find((d) => d.code === districtCode)?.name || "";
    const wardName = wards.find((w) => w.code === wardCode)?.name || "";

    const addressParts = [];
    if (street.trim()) {
      addressParts.push(street.trim());
    }
    if (wardName) {
      addressParts.push(wardName);
    }
    if (districtName) {
      addressParts.push(districtName);
    }
    if (provinceName) {
      addressParts.push(provinceName);
    }

    const displayAddress = addressParts.join(", ");
    setAddressValue(displayAddress);

    // Cập nhật form
    form.setFieldsValue({
      deliveryAddress: displayAddress,
      city: provinceName,
      address: addressParts.slice(0, -1).join(", "), // Không bao gồm tỉnh
      provinceCode,
      districtCode,
      wardCode,
      streetAddress: street,
    });

    // Lấy tọa độ nếu có đủ thông tin
    if (provinceName && districtName && displayAddress.trim()) {
      try {
        const coords = await getCoordinatesFromAddress(
          displayAddress + ", Việt Nam"
        );
        setCoordinates(coords);
        form.setFieldsValue({
          latitude: coords.latitude || undefined,
          longitude: coords.longitude || undefined,
        });
      } catch (error) {
        console.error("Error in geocoding process:", error);
        setCoordinates({ latitude: null, longitude: null });
      }
    }
  };

  // Hàm xóa toàn bộ địa chỉ và reset form
  const handleClearAddress = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
    setStreetAddress("");
    setAddressValue("");
    setCoordinates({ latitude: null, longitude: null });
    setDistricts([]);
    setWards([]);

    form.setFieldsValue({
      deliveryAddress: "",
      city: "",
      address: "",
      provinceCode: "",
      districtCode: "",
      wardCode: "",
      streetAddress: "",
      latitude: undefined,
      longitude: undefined,
    });
  };

  const handleCalculate = (values: EstimateForm) => {
    const estimatedFee = calculateShippingFee(values);
    setFee(estimatedFee);
  };

  return (
    <Card loading={loading}>
      <Title level={2}>Ước tính phí vận chuyển</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCalculate}
        initialValues={{
          weight: 0,
          length: 0,
          width: 0,
          height: 0,
        }}
      >
        {/* Địa chỉ lấy hàng - Full width */}
        <Row gutter={[24, 16]}>
          <Col xs={24}>
            <Form.Item
              name="pickupAddress"
              label={`Địa chỉ lấy hàng${
                store ? ` (từ cửa hàng: ${store.storeName})` : ""
              }`}
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ lấy hàng!" },
              ]}
            >
              <TextArea
                rows={3}
                placeholder={
                  store ? "Địa chỉ cửa hàng của bạn" : "Nhập địa chỉ lấy hàng"
                }
                disabled={true}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Địa chỉ giao hàng - Full width */}
        <Row gutter={[24, 16]}>
          <Col xs={24}>
            <Form.Item label="Địa chỉ giao hàng" required>
              {/* Hidden fields for backend */}
              <Form.Item name="city" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <Form.Item name="address" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <Form.Item name="latitude" style={{ display: "none" }}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="longitude" style={{ display: "none" }}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="provinceCode" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <Form.Item name="districtCode" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <Form.Item name="wardCode" style={{ display: "none" }}>
                <Input />
              </Form.Item>
              <Form.Item name="streetAddress" style={{ display: "none" }}>
                <Input />
              </Form.Item>

              <Form.Item
                name="deliveryAddress"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập địa chỉ giao hàng!",
                  },
                ]}
              >
                <Input
                  placeholder="Địa chỉ sẽ hiển thị sau khi chọn tỉnh/huyện/xã"
                  value={addressValue}
                  readOnly
                  style={{
                    marginBottom: 16,
                    borderRadius: 6,
                    backgroundColor: addressValue ? "#f5f5f5" : "#fff",
                    cursor: "default",
                  }}
                  suffix={
                    addressValue ? (
                      <CloseCircleOutlined
                        onClick={handleClearAddress}
                        style={{ cursor: "pointer", color: "#999" }}
                      />
                    ) : null
                  }
                />
              </Form.Item>

              {/* Hiển thị tọa độ nếu có */}
              {coordinates.latitude && coordinates.longitude && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#52c41a",
                    marginBottom: 12,
                    padding: "4px 8px",
                    background: "#f6ffed",
                    borderRadius: 4,
                    border: "1px solid #b7eb8f",
                  }}
                >
                  📍 Tọa độ: {coordinates.latitude.toFixed(6)},{" "}
                  {coordinates.longitude.toFixed(6)}
                </div>
              )}

              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <Select
                    placeholder="Tỉnh/Thành phố"
                    style={{ width: "100%" }}
                    value={selectedProvince || undefined}
                    onChange={handleProvinceChange}
                    showSearch
                    filterOption={(input, option) =>
                      option?.label
                        ?.toString()
                        .toLowerCase()
                        .includes(input.toLowerCase()) ?? false
                    }
                  >
                    {provinces.map((province) => (
                      <Select.Option
                        key={province.code}
                        value={province.code}
                        label={province.name}
                      >
                        {province.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    placeholder="Huyện/Quận"
                    style={{ width: "100%" }}
                    value={selectedDistrict || undefined}
                    onChange={handleDistrictChange}
                    disabled={!selectedProvince}
                    showSearch
                    filterOption={(input, option) =>
                      option?.label
                        ?.toString()
                        .toLowerCase()
                        .includes(input.toLowerCase()) ?? false
                    }
                  >
                    {districts.map((district) => (
                      <Select.Option
                        key={district.code}
                        value={district.code}
                        label={district.name}
                      >
                        {district.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    placeholder="Xã/Phường"
                    style={{ width: "100%" }}
                    value={selectedWard || undefined}
                    onChange={handleWardChange}
                    disabled={!selectedDistrict}
                    showSearch
                    filterOption={(input, option) =>
                      option?.label
                        ?.toString()
                        .toLowerCase()
                        .includes(input.toLowerCase()) ?? false
                    }
                  >
                    {wards.map((ward) => (
                      <Select.Option
                        key={ward.code}
                        value={ward.code}
                        label={ward.name}
                      >
                        {ward.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Input
                    placeholder="Đường/Thôn/Xóm/Số nhà"
                    style={{ width: "100%" }}
                    value={streetAddress}
                    onChange={handleStreetAddressChange}
                  />
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        {/* Thông tin kích thước và khối lượng */}
        <Row gutter={[24, 0]}>
          <Col xs={24} md={6}>
            <Form.Item
              name="weight"
              label="Khối lượng (kg)"
              rules={[{ required: true, message: "Vui lòng nhập khối lượng!" }]}
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: "100%" }}
                placeholder="Nhập khối lượng"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={18}>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="length"
                  label="Chiều dài (cm)"
                  rules={[
                    { required: true, message: "Vui lòng nhập chiều dài!" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Chiều dài"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="width"
                  label="Chiều rộng (cm)"
                  rules={[
                    { required: true, message: "Vui lòng nhập chiều rộng!" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Chiều rộng"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="height"
                  label="Chiều cao (cm)"
                  rules={[
                    { required: true, message: "Vui lòng nhập chiều cao!" },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Chiều cao"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        <Row>
          <Col span={24} style={{ textAlign: "center" }}>
            <Space direction="vertical" size="large">
              <Button
                type="primary"
                htmlType="submit"
                icon={<CalculatorOutlined />}
                size="large"
              >
                Tính phí vận chuyển
              </Button>

              {fee > 0 && (
                <Alert
                  message="Ước tính phí vận chuyển"
                  description={
                    <Space direction="vertical">
                      <Text>Chi tiết phí:</Text>
                      <Text>• Phí cơ bản: 15,000đ</Text>
                      <Text>• Phí khối lượng: 10,000đ/kg</Text>
                      <Text>• Phí thể tích: 500đ/cm³</Text>
                      <Divider style={{ margin: "12px 0" }} />
                      <Text strong style={{ fontSize: "18px" }}>
                        Tổng phí: {fee.toLocaleString("vi-VN")}đ
                      </Text>
                    </Space>
                  }
                  type="info"
                  showIcon
                />
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
