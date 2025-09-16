package ktc.spring_project.controllers;

import ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO;
import ktc.spring_project.dtos.order.DeliveryOrderResponseDTO;
import ktc.spring_project.dtos.order.OrderSummaryDTO;
import ktc.spring_project.entities.Order;
import ktc.spring_project.entities.User;
import ktc.spring_project.entities.Vehicle;
import ktc.spring_project.entities.Status;
import ktc.spring_project.entities.Route;
import ktc.spring_project.entities.Delivery;
import ktc.spring_project.services.OrderService;
import ktc.spring_project.services.UserService;
import ktc.spring_project.services.VehicleService;
import ktc.spring_project.services.DeliveryTrackingService;
import ktc.spring_project.services.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;
import ktc.spring_project.dtos.order.PaginatedOrderResponseDto;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private DeliveryTrackingService deliveryTrackingService;

    @Autowired
    private DeliveryService deliveryService;

    /**
     * Get order by ID with items included
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrder(@PathVariable Long orderId) {
        Order order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }
    
    /**
     * Get all orders with pagination (simple version)
     * @deprecated Use the detailed version with more filters instead
     */
    // Commented out to fix duplicate mapping
    /*
    @GetMapping
    public ResponseEntity<Page<Order>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Order> orders = orderService.getAllOrders(
                org.springframework.data.domain.PageRequest.of(page, size));
        return ResponseEntity.ok(orders);
    }
    */

    /**
     * Tạo đơn hàng mới
     */
    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateDeliveryOrderRequestDTO dto) {
        try {
            // Log thông tin tạo đơn hàng nếu cần
            System.out.println("Creating order with DTO: " + dto.getOrderCode());
            if (dto.getStore() != null) System.out.println("Store ID: " + dto.getStore().getId());
            if (dto.getCreatedBy() != null) System.out.println("CreatedBy ID: " + dto.getCreatedBy().getId());
            if (dto.getStatus() != null) System.out.println("Status ID: " + dto.getStatus().getId());
            if (dto.getAddress() != null) System.out.println("Address ID: " + dto.getAddress().getId());

            Order createdOrder = orderService.createOrderFromDTO(dto);

            // Log thông tin đơn hàng đã tạo
            System.out.println("Order created successfully:");
            System.out.println("- Order ID: " + createdOrder.getId());
            System.out.println("- Store ID: " + (createdOrder.getStore() != null ? createdOrder.getStore().getId() : "null"));
            System.out.println("- Status ID: " + (createdOrder.getStatus() != null ? createdOrder.getStatus().getId() : "null"));
            System.out.println("- Created By ID: " + (createdOrder.getCreatedBy() != null ? createdOrder.getCreatedBy().getId() : "null"));
            System.out.println("- Address ID: " + (createdOrder.getAddress() != null ? createdOrder.getAddress().getId() : "null"));

            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            System.err.println("Bad request: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("===== DETAILED ERROR =====");
            System.err.println("Error creating order: " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getName());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "null"));
            e.printStackTrace();
            System.err.println("===========================");
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy số lượng đơn hàng theo ngày (tối ưu cho dashboard)
     */
    @GetMapping("/count-by-date")
    public ResponseEntity<Map<String, Object>> getOrderCountByDate(
            @RequestParam(required = false) String date) {
        try {
            // Nếu không có date parameter, tính cho hôm nay và hôm qua
            java.time.LocalDate targetDate = date != null ? 
                java.time.LocalDate.parse(date) : java.time.LocalDate.now();
            java.time.LocalDate yesterday = targetDate.minusDays(1);
            
            // Sử dụng database query trực tiếp thay vì load toàn bộ data
            long todayCount = orderService.countOrdersByDate(targetDate);
            long yesterdayCount = orderService.countOrdersByDate(yesterday);
            
            // Tính phần trăm thay đổi
            double changePercent = 0;
            String trend = "stable";
            
            if (yesterdayCount > 0) {
                changePercent = ((double)(todayCount - yesterdayCount) / yesterdayCount) * 100;
            } else if (todayCount > 0) {
                changePercent = 100;
            }
            
            if (changePercent > 0) {
                trend = "increase";
            } else if (changePercent < 0) {
                trend = "decrease";
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("date", targetDate.toString());
            result.put("count", todayCount);
            result.put("previousCount", yesterdayCount);
            result.put("changePercent", Math.round(changePercent * 10.0) / 10.0);
            result.put("trend", trend);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error getting order count by date: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy tất cả đơn hàng (có phân trang)
     */
    @GetMapping
    public ResponseEntity<PaginatedOrderResponseDto> getAllOrders(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            // Sử dụng phân trang thật từ database với sắp xếp theo createdAt descending
            Page<Order> orderPage = orderService.getOrdersPaginated(page, size);
            
            // Chuyển đổi Order entities thành DTO để tránh circular reference
            List<Map<String, Object>> orderDTOs = orderPage.getContent().stream().map(order -> {
                Map<String, Object> orderDTO = new HashMap<>();
                orderDTO.put("id", order.getId());
                orderDTO.put("description", order.getDescription());
                orderDTO.put("notes", order.getNotes());
                orderDTO.put("totalAmount", order.getTotalAmount());
                orderDTO.put("benefitPerOrder", order.getBenefitPerOrder());
                orderDTO.put("orderProfitPerOrder", order.getOrderProfitPerOrder());
                orderDTO.put("createdAt", order.getCreatedAt());
                orderDTO.put("updatedAt", order.getUpdatedAt());
                // Status info
                if (order.getStatus() != null) {
                    Map<String, Object> statusDTO = new HashMap<>();
                    statusDTO.put("id", order.getStatus().getId().longValue());
                    statusDTO.put("name", order.getStatus().getName());
                    statusDTO.put("statusType", order.getStatus().getStatusType());
                    orderDTO.put("status", statusDTO);
                }
                // Vehicle info
                if (order.getVehicle() != null) {
                    Map<String, Object> vehicleDTO = new HashMap<>();
                    vehicleDTO.put("id", order.getVehicle().getId());
                    vehicleDTO.put("licensePlate", order.getVehicle().getLicensePlate());
                    vehicleDTO.put("vehicleType", order.getVehicle().getVehicleType());
                    // Current driver info
                    if (order.getVehicle().getCurrentDriver() != null) {
                        Map<String, Object> driverDTO = new HashMap<>();
                        driverDTO.put("id", order.getVehicle().getCurrentDriver().getId());
                        driverDTO.put("fullName", order.getVehicle().getCurrentDriver().getFullName());
                        driverDTO.put("phone", order.getVehicle().getCurrentDriver().getPhone());
                        vehicleDTO.put("currentDriver", driverDTO);
                    }
                    orderDTO.put("vehicle", vehicleDTO);
                }
                // Address info
                if (order.getAddress() != null) {
                    Map<String, Object> addressDTO = new HashMap<>();
                    addressDTO.put("id", order.getAddress().getId());
                    addressDTO.put("address", order.getAddress().getAddress());
                    addressDTO.put("city", order.getAddress().getCity());
                    addressDTO.put("latitude", order.getAddress().getLatitude());
                    addressDTO.put("longitude", order.getAddress().getLongitude());
                    orderDTO.put("address", addressDTO);
                }
                // Store info
                if (order.getStore() != null) {
                    Map<String, Object> storeDTO = new HashMap<>();
                    storeDTO.put("id", order.getStore().getId());
                    storeDTO.put("storeName", order.getStore().getStoreName());
                    storeDTO.put("address", order.getStore().getAddress());
                    storeDTO.put("phone", order.getStore().getPhone());
                    storeDTO.put("latitude", order.getStore().getLatitude());
                    storeDTO.put("longitude", order.getStore().getLongitude());
                    orderDTO.put("store", storeDTO);
                }
                // Created by user info
                if (order.getCreatedBy() != null) {
                    Map<String, Object> createdByDTO = new HashMap<>();
                    createdByDTO.put("id", order.getCreatedBy().getId());
                    createdByDTO.put("fullName", order.getCreatedBy().getFullName());
                    createdByDTO.put("username", order.getCreatedBy().getUsername());
                    orderDTO.put("createdBy", createdByDTO);
                }
                return orderDTO;
            }).collect(Collectors.toList());

            PaginatedOrderResponseDto response = PaginatedOrderResponseDto.builder()
                    .data(orderDTOs)
                    .pageNumber(page)
                    .pageSize(size)
                    .totalRecords(orderPage.getTotalElements())
                    .totalPages(orderPage.getTotalPages())
                    .hasNext(orderPage.hasNext())
                    .hasPrevious(orderPage.hasPrevious())
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in getAllOrders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Lấy đơn hàng theo ID
     * Note: This is a duplicate of the method above. The original method has been kept.
     */
    /*
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        try {
            Order order = orderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    */

    /**
     * Cập nhật đơn hàng
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Order> patchOrder(
            @PathVariable Long id,
            @Valid @RequestBody Order orderDetails) {
        try {
            Order updatedOrder = orderService.updateOrder(id, orderDetails);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
public ResponseEntity<Order> putOrder(
        @PathVariable Long id,
    @Valid @RequestBody Order orderDetails) {
    try {
        Order updatedOrder = orderService.updateOrder(id, orderDetails);
        return ResponseEntity.ok(updatedOrder);
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
}
// ...existing code...

    // DTO đơn giản để nhận statusId
    public static class UpdateOrderStatusDTO {
        public Long statusId;
    }

    // DTO đơn giản để nhận vehicleId
    public static class UpdateOrderVehicleDTO {
        public Long vehicleId;
    }

    // API cập nhật trạng thái đơn hàng
    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusDTO dto) {
        try {
            Order order = orderService.getOrderById(id);
            if (dto.statusId != null) {
                Status status = new Status();
                status.setId(dto.statusId != null ? dto.statusId.shortValue() : null);
                order.setStatus(status);
            }
            Order updatedOrder = orderService.createOrder(order); // hoặc orderService.save(order)
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // API cập nhật vehicle cho đơn hàng
    @PatchMapping("/{id}/vehicle")
    public ResponseEntity<Order> updateOrderVehicle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderVehicleDTO dto) {
        try {
            Order order = orderService.getOrderById(id);
            
            if (dto.vehicleId != null && dto.vehicleId > 0) {
                // Assign vehicle - lấy vehicle đầy đủ từ database
                Vehicle vehicle = vehicleService.getVehicleById(dto.vehicleId);
                if (vehicle == null) {
                    return ResponseEntity.badRequest().build();
                }
                order.setVehicle(vehicle);
                System.out.println("Assigning vehicle " + vehicle.getLicensePlate() + " to order " + id);
                
                // Tìm hoặc tạo delivery record để lưu driver
                try {
                    List<Delivery> deliveries = deliveryService.findByOrderId(id);
                    Delivery delivery = null;
                    if (deliveries != null && !deliveries.isEmpty()) {
                        delivery = deliveries.get(0); // Lấy delivery đầu tiên
                    }
                    
                    if (delivery == null) {
                        // Tạo delivery mới
                        delivery = new Delivery();
                        delivery.setOrder(order);
                        delivery.setVehicle(vehicle);
                        if (vehicle.getCurrentDriver() != null) {
                            delivery.setDriver(vehicle.getCurrentDriver());
                            System.out.println("Creating new delivery with driver: " + vehicle.getCurrentDriver().getFullName());
                        }
                        delivery.setOrderDate(new java.sql.Timestamp(System.currentTimeMillis()));
                        delivery.setLateDeliveryRisk(0);
                        deliveryService.save(delivery);
                    } else {
                        // Cập nhật delivery hiện có
                        delivery.setVehicle(vehicle);
                        if (vehicle.getCurrentDriver() != null) {
                            delivery.setDriver(vehicle.getCurrentDriver());
                            System.out.println("Updating delivery with driver: " + vehicle.getCurrentDriver().getFullName());
                        }
                        deliveryService.save(delivery);
                    }
                } catch (Exception deliveryException) {
                    System.err.println("Error managing delivery: " + deliveryException.getMessage());
                    // Vẫn tiếp tục cập nhật order ngay cả khi delivery bị lỗi
                }
                
            } else {
                // Unassign vehicle (vehicleId is null or 0)
                order.setVehicle(null);
                System.out.println("Unassigning vehicle from order " + id);
                
                // Cũng cần unassign driver từ delivery
                try {
                    List<Delivery> deliveries = deliveryService.findByOrderId(id);
                    if (deliveries != null && !deliveries.isEmpty()) {
                        Delivery delivery = deliveries.get(0);
                        delivery.setVehicle(null);
                        delivery.setDriver(null);
                        deliveryService.save(delivery);
                        System.out.println("Unassigned vehicle and driver from delivery");
                    }
                } catch (Exception deliveryException) {
                    System.err.println("Error unassigning delivery: " + deliveryException.getMessage());
                }
            }
            
            Order updatedOrder = orderService.updateOrder(id, order);
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            System.err.println("Error updating order vehicle: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getOrderTracking(@PathVariable Long id) {
        try {
            // Giả sử bạn có service lấy tracking info
            Object trackingInfo = orderService.getOrderTrackingInfo(id);
            if (trackingInfo == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(trackingInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách đơn hàng theo store ID
     */
    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<Order>> getOrdersByStore(@PathVariable Long storeId) {
        try {
            List<Order> orders = orderService.getOrdersByStoreId(storeId);
            if (orders.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy thông tin tóm tắt của đơn hàng theo store ID, bao gồm:
     * - Store ID
     * - Ngày tạo
     * - Địa chỉ nhận hàng
     * - Số lượng sản phẩm
     * - Phí vận chuyển
     * - Trạng thái đơn hàng
     */
    @GetMapping("/store/{storeId}/summary")
    public ResponseEntity<List<OrderSummaryDTO>> getOrderSummariesByStore(@PathVariable Long storeId) {
        try {
            List<OrderSummaryDTO> orderSummaries = orderService.getOrderSummariesByStoreId(storeId);
            if (orderSummaries.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(orderSummaries);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy thông tin tóm tắt của tất cả đơn hàng theo user ID
     * User ID sẽ được dùng để tìm các store mà user đó tạo
     * Sau đó lấy tất cả order của các store đó
     */
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<List<OrderSummaryDTO>> getOrderSummariesByUser(@PathVariable Long userId) {
        try {
            List<OrderSummaryDTO> orderSummaries = orderService.getOrderSummariesByUserId(userId);
            if (orderSummaries.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(orderSummaries);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}