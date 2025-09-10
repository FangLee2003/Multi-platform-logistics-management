import { Row, Col, Form, Input, Button, Select } from "antd";
import { Card } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { Store } from "@/types/Store";
import { useState, useEffect } from "react";
import { addressService, Province, District, Ward } from "@/services/addressService";

const { TextArea } = Input;

interface Props {
  store: Store | null;
}

export default function StepStoreInfo({ store }: Props) {
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [addressValue, setAddressValue] = useState<string>("");
  const form = Form.useFormInstance();

  // States cho địa chỉ
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>(""); // Thêm state cho số nhà/đường

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
    
    // Cập nhật địa chỉ ngay khi chọn tỉnh
    updateAddressDisplay(value, "", "", streetAddress);
    
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
    
    // Cập nhật địa chỉ khi chọn huyện
    updateAddressDisplay(selectedProvince, value, "", streetAddress);
    
    try {
      const wardsData = await addressService.getWards(value);
      setWards(wardsData);
    } catch (error) {
      console.error("Error loading wards:", error);
    }
  };

  // Xử lý khi chọn xã/phường
  const handleWardChange = (value: string) => {
    setSelectedWard(value);
    updateAddressDisplay(selectedProvince, selectedDistrict, value, streetAddress);
  };

  // Xử lý khi nhập số nhà/đường
  const handleStreetAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStreetAddress(value);
    updateAddressDisplay(selectedProvince, selectedDistrict, selectedWard, value);
  };

  // Cập nhật hiển thị địa chỉ đầy đủ
  const updateAddressDisplay = (provinceCode: string, districtCode: string, wardCode: string, street: string) => {
    console.log('updateAddressDisplay called with:', { provinceCode, districtCode, wardCode, street });
    
    const provinceName = provinces.find(p => p.code === provinceCode)?.name || "";
    const districtName = districts.find(d => d.code === districtCode)?.name || "";
    const wardName = wards.find(w => w.code === wardCode)?.name || "";
    
    console.log('Found names:', { provinceName, districtName, wardName });
    
    let addressParts = [];
    
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
    
    const fullAddress = addressParts.join(", ");
    console.log('Generated fullAddress:', fullAddress);
    
    if (fullAddress && provinceName) {
      setAddressValue(fullAddress);
      form.setFieldsValue({
        shipping_address: fullAddress, // Hiển thị cho user
        city: provinceName, // Lưu tỉnh/thành phố riêng biệt cho backend
        address: fullAddress, // Lưu địa chỉ đầy đủ cho backend
      });
      console.log('Form values set:', { shipping_address: fullAddress, city: provinceName, address: fullAddress });
    } else {
      console.log('Conditions not met:', { fullAddress: !!fullAddress, provinceName: !!provinceName });
    }
  };

  // Hàm xóa toàn bộ địa chỉ và reset form
  const handleClearAddress = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
    setStreetAddress("");
    setAddressValue("");
    setDistricts([]);
    setWards([]);
    
    form.setFieldsValue({
      shipping_address: "",
      city: "",
      address: "",
    });
  };

  // Lấy tên tỉnh/thành phố từ mã
  const getProvinceName = (provinceCode: string) => {
    return provinces.find((p) => p.code === provinceCode)?.name || "";
  };

  // Hàm submit tạo địa chỉ mới (ví dụ khi nhấn nút Lưu)
  const handleCreateAddress = async () => {
    const city = getProvinceName(selectedProvince);
    const address = addressValue;
    // ... lấy các trường khác nếu cần
    const payload = {
      city,
      address,
      // ... các trường khác như contactName, contactPhone, ...
    };
    // Gửi payload này tới API backend
    // await fetch('/api/address', { method: 'POST', body: JSON.stringify(payload) })
  };


  return (
    <>
      {/* Hidden fields for backend */}
      <Form.Item name="city" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="address" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      
      <Row gutter={[24, 16]}>
        {/* Phần thông tin cửa hàng - Full width */}
        <Col xs={24}>
          <Form.Item label="Địa chỉ cửa hàng">
            <Input
              value={store?.address || "Đang tải..."}
              disabled
              placeholder="Địa chỉ cửa hàng"
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>
        </Col>

        {/* Phần thông tin người nhận - 2 cột */}
        <Col xs={24} lg={12}>
          <Form.Item
            name="receiver_name"
            label="Tên người nhận"
            rules={[
              { required: true, message: "Vui lòng nhập tên người nhận!" },
            ]}
          >
            <Input placeholder="Nhập tên người nhận" />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
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
        </Col>
        <Col xs={24} lg={12}>
          <Form.Item
            name="receiver_email"
            label="Email người nhận"
            rules={[{ type: "email", message: "Email không hợp lệ!" }]}
          >
            <Input placeholder="Nhập email (không bắt buộc)" />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Form.Item
            name="addressType"
            label="Loại địa chỉ giao hàng"
            initialValue="DELIVERY"
            rules={[{ required: true, message: "Vui lòng chọn loại địa chỉ!" }]}
          >
            <Select placeholder="Chọn loại địa chỉ">
              <Select.Option value="HOME">Nhà riêng</Select.Option>
              <Select.Option value="STORE">Cửa hàng</Select.Option>
              <Select.Option value="OFFICE">Văn phòng</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Phần địa chỉ giao hàng - Full width */}
        <Col xs={24}>
          <Form.Item
            label="Địa chỉ giao hàng"
            required
          >
            <Input
              placeholder="Địa chỉ sẽ hiển thị sau khi chọn tỉnh/huyện/xã"
              value={addressValue}
              readOnly
              style={{ 
                marginBottom: 16, 
                borderRadius: 6,
                backgroundColor: addressValue ? '#f5f5f5' : '#fff',
                cursor: 'default'
              }}
              suffix={
                addressValue ? (
                  <CloseCircleOutlined 
                    onClick={handleClearAddress}
                    style={{ cursor: 'pointer', color: '#999' }}
                  />
                ) : null
              }
            />
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} md={6}>
                <Select 
                  placeholder="Tỉnh/Thành phố" 
                  style={{ width: '100%' }}
                  value={selectedProvince || undefined}
                  onChange={handleProvinceChange}
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                >
                  {provinces.map((province) => (
                    <Select.Option key={province.code} value={province.code} label={province.name}>
                      {province.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select 
                  placeholder="Huyện/Quận" 
                  style={{ width: '100%' }}
                  value={selectedDistrict || undefined}
                  onChange={handleDistrictChange}
                  disabled={!selectedProvince}
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                >
                  {districts.map((district) => (
                    <Select.Option key={district.code} value={district.code} label={district.name}>
                      {district.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select 
                  placeholder="Xã/Phường" 
                  style={{ width: '100%' }}
                  value={selectedWard || undefined}
                  onChange={handleWardChange}
                  disabled={!selectedDistrict}
                  showSearch
                  filterOption={(input, option) =>
                    option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                >
                  {wards.map((ward) => (
                    <Select.Option key={ward.code} value={ward.code} label={ward.name}>
                      {ward.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Input 
                  placeholder="Đường/Thôn/Xóm/Số nhà" 
                  style={{ width: '100%' }}
                  value={streetAddress}
                  onChange={handleStreetAddressChange}
                />
              </Col>
            </Row>
          </Form.Item>
        </Col>

        {/* Phần mô tả và ghi chú - 2 cột trên desktop */}
        <Col xs={24} lg={12}>
          <Form.Item name="description" label="Mô tả đơn hàng">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả chi tiết (không bắt buộc)"
            />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea 
              rows={4} 
              placeholder="Ghi chú bổ sung (nếu có)" 
            />
          </Form.Item>
        </Col>
      </Row>

      {/* <AddressFormModal
        visible={isAddressModalVisible}
        onCancel={() => setIsAddressModalVisible(false)}
        onOk={handleAddressSelect}
        contactName={form.getFieldValue("receiver_name") || ""}
        contactPhone={form.getFieldValue("receiver_phone") || ""}
        contactEmail={form.getFieldValue("receiver_email") || ""}
      /> */}
    </>
  );
}
