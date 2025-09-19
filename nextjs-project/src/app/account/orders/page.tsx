"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Modal,
  Timeline,
  message,
} from "antd";
import {
  orderApi,
  type PaginatedOrderSummaryResponse,
  type OrderSummary,
} from "@/services/orderService";
import OrderDetailModal from "./components/OrderDetailModal";
import { OrderFilters } from "./components/OrderFilters";
import type { Dayjs } from "dayjs";
import {
  PlusOutlined,
  EyeOutlined,
  HistoryOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title } = Typography;
interface Order {
  id: string;
  created_at: string;
  store_name: string;
  shipping_address: string;
  total_items: number;
  cod_amount: number;
  shipping_fee: number;
  status: {
    id: number;
    name: string;
    color: string;
  };
  tracking_updates: {
    time: string;
    status: string;
    description: string;
  }[];
}

const getStatusId = (status: string): number => {
  const statusMap: { [key: string]: number } = {
    PENDING: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    COMPLETED: 5,
    CANCELLED: 6,
  };
  return statusMap[status] || 1;
};

const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    PENDING: "default",
    PROCESSING: "processing",
    SHIPPED: "warning",
    DELIVERED: "success",
    COMPLETED: "success",
    CANCELLED: "error",
  };
  return colorMap[status] || "default";
};

export default function OrdersPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [isTrackingModalVisible, setIsTrackingModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal chi tiết đơn hàng
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  // Store ID để sử dụng cho search
  const [storeId, setStoreId] = useState<number | null>(null);

  const fetchOrders = useCallback(
    async (page: number = 1, size: number = 10) => {
      setLoading(true);
      try {
        // Get user from localStorage
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          console.error("User not found in localStorage");
          return;
        }
        const user = JSON.parse(userStr);
        const response = await orderApi.getOrdersByUserPaginated(
          user.id,
          page,
          size
        );

        const formattedOrders: Order[] = response.data.map((order) => ({
          id: order.orderId?.toString() || "N/A",
          created_at: order.createdAt || new Date().toISOString(),
          store_name: `Store ${order.storeId || "Unknown"}`,
          shipping_address: order.deliveryAddress || "No address provided",
          total_items: order.totalItems || 0,
          cod_amount: 0, // Not available in the API
          shipping_fee: order.deliveryFee || 0,
          status: {
            id: getStatusId(order.orderStatus || "PENDING"),
            name: order.orderStatus || "PENDING",
            color: getStatusColor(order.orderStatus || "PENDING"),
          },
          tracking_updates: [
            {
              time: order.createdAt || new Date().toISOString(),
              status: order.orderStatus || "PENDING",
              description: `Order ${(
                order.orderStatus || "PENDING"
              ).toLowerCase()}`,
            },
          ],
        }));

        setOrders(formattedOrders);
        setTotalRecords(response.totalRecords);
        setCurrentPage(response.pageNumber);

        // Lấy storeId từ đơn hàng đầu tiên để sử dụng cho search
        if (response.data.length > 0 && !storeId) {
          setStoreId(response.data[0].storeId);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Effect để xử lý tìm kiếm
  useEffect(() => {
    const searchOrders = async () => {
      if (searchText.trim() && storeId) {
        // Kiểm tra xem searchText có phải là số không (orderId)
        const orderIdNumber = parseInt(searchText.trim());
        if (!isNaN(orderIdNumber)) {
          try {
            setLoading(true);
            const searchResults = await orderApi.searchOrdersByStoreAndOrderId(
              storeId,
              orderIdNumber,
              currentPage,
              pageSize
            );

            // Format kết quả search giống như fetchOrders
            const formattedSearchResults: Order[] = searchResults.data.map(
              (order) => ({
                id: order.orderId?.toString() || "N/A",
                created_at: order.createdAt || new Date().toISOString(),
                store_name: `Store ${order.storeId || "Unknown"}`,
                shipping_address:
                  order.deliveryAddress || "No address provided",
                total_items: order.totalItems || 0,
                cod_amount: 0,
                shipping_fee: order.deliveryFee || 0,
                status: {
                  id: getStatusId(order.orderStatus || "PENDING"),
                  name: order.orderStatus || "PENDING",
                  color: getStatusColor(order.orderStatus || "PENDING"),
                },
                tracking_updates: [
                  {
                    time: order.createdAt || new Date().toISOString(),
                    status: order.orderStatus || "PENDING",
                    description: `Order ${(
                      order.orderStatus || "PENDING"
                    ).toLowerCase()}`,
                  },
                ],
              })
            );

            setOrders(formattedSearchResults);
            setTotalRecords(searchResults.totalRecords);
            setLoading(false);
          } catch (error) {
            console.error("Search failed:", error);
            setLoading(false);
            messageApi.error("Tìm kiếm thất bại");
          }
        }
      } else if (searchText.trim() === "") {
        // Logic sẽ được handle bởi useEffect khác
        return;
      }
    };

    // Debounce search để tránh gọi API liên tục
    const timeoutId = setTimeout(searchOrders, 500);
    return () => clearTimeout(timeoutId);
  }, [searchText, storeId, currentPage, pageSize, messageApi]);

  // Effect để xử lý tìm kiếm theo khoảng thời gian
  useEffect(() => {
    // Chỉ thực hiện tìm kiếm theo date range khi:
    // 1. Có date range được chọn
    // 2. Không có search text (để tránh conflict)
    // 3. Có storeId và dateRange không null
    if (
      dateRange &&
      dateRange[0] &&
      dateRange[1] &&
      storeId &&
      searchText.trim() === ""
    ) {
      const searchByDateRange = async () => {
        try {
          setLoading(true);

          // Chuyển đổi Dayjs thành chuỗi định dạng yyyy-MM-dd
          const fromDate = dateRange[0]!.format("YYYY-MM-DD");
          const toDate = dateRange[1]!.format("YYYY-MM-DD");

          const searchResults = await orderApi.searchOrdersByStoreAndDateRange(
            storeId,
            currentPage,
            pageSize,
            fromDate,
            toDate
          );

          // Format kết quả search giống như fetchOrders
          const formattedSearchResults: Order[] = searchResults.data.map(
            (order: OrderSummary) => ({
              id: order.orderId?.toString() || "N/A",
              created_at: order.createdAt || new Date().toISOString(),
              store_name: `Store ${order.storeId || "Unknown"}`,
              shipping_address: order.deliveryAddress || "No address provided",
              total_items: order.totalItems || 0,
              cod_amount: 0,
              shipping_fee: order.deliveryFee || 0,
              status: {
                id: getStatusId(order.orderStatus || "PENDING"),
                name: order.orderStatus || "PENDING",
                color: getStatusColor(order.orderStatus || "PENDING"),
              },
              tracking_updates: [
                {
                  time: order.createdAt || new Date().toISOString(),
                  status: order.orderStatus || "PENDING",
                  description: `Order ${(
                    order.orderStatus || "PENDING"
                  ).toLowerCase()}`,
                },
              ],
            })
          );

          setOrders(formattedSearchResults);
          setTotalRecords(searchResults.totalRecords);
          setLoading(false);
        } catch (error) {
          console.error("Date range search failed:", error);
          setLoading(false);
          messageApi.error("Tìm kiếm theo khoảng thời gian thất bại");
        }
      };

      // Debounce search để tránh gọi API liên tục
      const timeoutId = setTimeout(searchByDateRange, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [dateRange, storeId, currentPage, pageSize, messageApi, searchText]);

  // Effect riêng để load lại list khi clear tất cả filters
  useEffect(() => {
    // Load lại list khi:
    // 1. Không có search text
    // 2. HOẶC không có date range (dateRange null hoặc một trong hai date bị null)
    if (!searchText.trim() && (!dateRange || !dateRange[0] || !dateRange[1])) {
      console.log("Loading normal list - filters cleared");
      fetchOrders(currentPage, pageSize);
    }
  }, [dateRange, searchText, currentPage, pageSize, fetchOrders]);

  const showTrackingModal = (order: Order) => {
    setSelectedOrder(order);
    setIsTrackingModalVisible(true);
  };

  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard
      .writeText(orderId)
      .then(() => {
        messageApi.success(`Đã sao chép mã đơn hàng: ${orderId}`);
      })
      .catch(() => {
        messageApi.error("Không thể sao chép mã đơn hàng");
      });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewInvoice = (orderId: string) => {
    // TODO: Implement invoice viewing functionality
  };

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
      render: (text: string) => (
        <a
          onClick={() => handleCopyOrderId(text)}
          style={{ cursor: "pointer" }}
          title="Click để sao chép mã đơn hàng"
        >
          {text}
        </a>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Địa chỉ nhận hàng",
      dataIndex: "shipping_address",
      key: "shipping_address",
      ellipsis: true,
    },
    {
      title: "Số SP",
      dataIndex: "total_items",
      key: "total_items",
      align: "center" as const,
    },
    {
      title: "Phí vận chuyển",
      dataIndex: "shipping_fee",
      key: "shipping_fee",
      align: "right" as const,
      render: (amount: number | null) =>
        (amount || 0).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: { name: string; color: string }) => (
        <Tag color={status.color}>{status.name}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: Order) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setDetailOrderId(record.id);
                setIsDetailModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Lịch sử vận chuyển">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => showTrackingModal(record)}
            />
          </Tooltip>
          <Tooltip title="Hoá đơn điện tử">
            <Button
              type="text"
              icon={<FilePdfOutlined />}
              onClick={() => handleViewInvoice(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card className="orders-page" style={{ margin: "24px" }}>
        <div className="orders-header" style={{ marginBottom: "24px" }}>
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 24 }}
          >
            <Col>
              <Title level={2}>Quản lý đơn hàng</Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/account/orders/new")}
              >
                Tạo đơn hàng
              </Button>
            </Col>
          </Row>

          <OrderFilters
            searchText={searchText}
            dateRange={dateRange}
            statusFilter={statusFilter}
            onSearchChange={setSearchText}
            onDateRangeChange={(dates) => setDateRange(dates)}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          pagination={
            // Luôn hiển thị pagination, chỉ ẩn khi có search text (orderId search)
            searchText.trim() && !isNaN(parseInt(searchText.trim()))
              ? false
              : {
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalRecords,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} đơn hàng`,
                  position: ["bottomCenter"],
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size || 10);
                  },
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                }
          }
        />
      </Card>

      {/* Modal chi tiết đơn hàng */}
      {isDetailModalVisible && detailOrderId && (
        <OrderDetailModal
          orderId={Number(detailOrderId)}
          onClose={() => setIsDetailModalVisible(false)}
        />
      )}

      {/* Tracking Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Lịch sử vận chuyển</span>
          </Space>
        }
        open={isTrackingModalVisible}
        onCancel={() => setIsTrackingModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <>
            <p>
              <strong>Mã đơn hàng:</strong> {selectedOrder.id}
            </p>
            <Timeline
              items={selectedOrder.tracking_updates.map((update) => ({
                color: "blue",
                children: (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>{update.status}</strong>
                    </p>
                    <p style={{ margin: 0 }}>{update.description}</p>
                    <p style={{ margin: 0, color: "#8c8c8c" }}>
                      {new Date(update.time).toLocaleString("vi-VN")}
                    </p>
                  </>
                ),
              }))}
            />
          </>
        )}
      </Modal>
      {contextHolder}
    </>
  );
}
// ...existing code...
