package ktc.spring_project.services;

import ktc.spring_project.dtos.order.OrderStatusUpdateDTO;
import ktc.spring_project.dtos.order.OrderSummaryDTO;
import ktc.spring_project.dtos.timeline.OrderTimelineResponse;
import ktc.spring_project.dtos.timeline.ActorDto;
import ktc.spring_project.dtos.timeline.OrderStatusDto;
import ktc.spring_project.entities.Order;
import ktc.spring_project.entities.Status;
import ktc.spring_project.entities.Vehicle;
import ktc.spring_project.entities.User;
import ktc.spring_project.repositories.OrderRepository;
import ktc.spring_project.repositories.UserRepository;
import ktc.spring_project.repositories.VehicleRepository;
import ktc.spring_project.repositories.DeliveryRepository;
import ktc.spring_project.repositories.StoreRepository;
import ktc.spring_project.repositories.StatusRepository;
import ktc.spring_project.exceptions.EntityDuplicateException;
import ktc.spring_project.exceptions.EntityNotFoundException;
import ktc.spring_project.exceptions.HttpException;
import ktc.spring_project.enums.StatusType;
import ktc.spring_project.repositories.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OrderService {
    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ChecklistService checklistService;
    @Autowired
    private StatusService statusService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private StoreRepository storeRepository;
    
    @Autowired
    private StatusRepository statusRepository;
    

    public Order createOrderFromDTO(ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO dto) {
        try {
            log.debug("Creating order from DTO: {}", dto);
            validateCreateOrderDTO(dto);
            // Chỉ kiểm tra trùng lặp nếu orderCode không null
            if (dto.getOrderCode() != null) {
                checkOrderCodeDuplication(dto.getOrderCode());
            }

            Order order = buildOrderFromDTO(dto);
            // Nếu chưa có status, gán status mặc định là "pending"
            if (order.getStatus() == null) {
                Optional<Status> pendingStatus = statusService.getStatusByTypeAndName("ORDER", "Pending");
                if (pendingStatus.isPresent()) {
                    order.setStatus(pendingStatus.get());
                } else {
                    throw new HttpException("Không tìm thấy status mặc định 'pending'", HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
            Order createdOrder = createOrder(order);
            // Lưu checklist_progress cho bước CUSTOMER_CREATE_ORDER
            if (createdOrder != null && createdOrder.getCreatedBy() != null) {
                checklistService.markStepCompleted(
                    createdOrder.getCreatedBy().getId(),
                    createdOrder.getId(),
                    "CUSTOMER_CREATE_ORDER",
                    "Customer created order"
                );
            }
            return createdOrder;
        } catch (EntityDuplicateException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to create order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Lấy danh sách đơn hàng theo status với phân trang
     */
    public Page<OrderTimelineResponse> getOrdersByStatusPaginated(String statusName, int page, int size) {
    validateNotBlank(statusName, "Status name");
    validatePaginationParams(page, size);
    Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
    Status status = statusRepository.findFirstByName(statusName)
        .orElseThrow(() -> new EntityNotFoundException("Status not found: " + statusName));
    Page<Order> orders = orderRepository.findByStatus(status, pageable);
    List<OrderTimelineResponse> timelineResponses = orders.getContent().stream()
        .map(this::convertToOrderTimelineResponse)
        .toList();
    return new PageImpl<>(timelineResponses, pageable, orders.getTotalElements());
    }

    /**
     * Dispatcher xác nhận đơn hàng (accept order)
     */
    public OrderTimelineResponse acceptOrderByDispatcher(Long orderId, Long dispatcherId) {
        validateId(dispatcherId, "Dispatcher ID");
        validateId(orderId, "Order ID");
        Order order = getOrderById(orderId);
        // Cập nhật status sang "Processing"
        Optional<Status> processingStatus = statusService.getStatusByTypeAndName("ORDER", "Processing");
        if (processingStatus.isPresent()) {
            order.setStatus(processingStatus.get());
            orderRepository.save(order);
            checklistService.markStepCompleted(dispatcherId, orderId, "DISPATCHER_RECEIVE_ORDER", "Order accepted by dispatcher");
            log.info("Dispatcher {} accepted order {}", dispatcherId, orderId);
        } else {
            throw new HttpException("Processing status not found", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return convertToOrderTimelineResponse(order);
    }


    /**
     * Lấy thông tin tóm tắt đơn hàng theo userId với phân trang
     */
    public Page<OrderSummaryDTO> getOrderSummariesByUserIdPaginated(Long userId, int page, int size) {
        validateId(userId, "User ID");
        validatePaginationParams(page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        return orderRepository.findOrderSummariesByUserIdPaginated(userId, pageable);
    }

    /**
     * Unified search: tìm kiếm đơn hàng theo nhiều tiêu chí với phân trang
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdWithFiltersPaginated(Long storeId, Long orderId, LocalDateTime fromDate, LocalDateTime toDate, List<String> statusList, int page, int size) {
        validateId(storeId, "Store ID");
        validatePaginationParams(page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        return orderRepository.findOrderSummariesByStoreIdWithFiltersPaginated(storeId, orderId, fromDate, toDate, statusList, pageable);
    }

    /**
     * Tìm kiếm đơn hàng theo storeId và orderId với phân trang
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdAndOrderIdPaginated(Long storeId, Long orderId, int page, int size) {
        validateId(storeId, "Store ID");
        validateId(orderId, "Order ID");
        validatePaginationParams(page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        List<OrderSummaryDTO> summaries = orderRepository.findOrderSummariesByStoreIdAndOrderId(storeId, orderId);
        int start = (page - 1) * size;
        int end = Math.min(start + size, summaries.size());
        List<OrderSummaryDTO> pagedSummaries = summaries.subList(start, end);
        return new PageImpl<>(pagedSummaries, pageable, summaries.size());
    }

    /**
     * Tìm kiếm đơn hàng theo khoảng thời gian với phân trang
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdAndDateRangePaginated(Long storeId, LocalDateTime fromDate, LocalDateTime toDate, int page, int size) {
        validateId(storeId, "Store ID");
        validatePaginationParams(page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        return orderRepository.findOrderSummariesByStoreIdAndDateRangePaginated(storeId, fromDate, toDate, pageable);
    }

    /**
     * Lấy thống kê đơn hàng theo storeId
     */
    public ktc.spring_project.dtos.order.OrderStatsDto getOrderStatsByStoreId(Long storeId) {
        validateId(storeId, "Store ID");
        long totalOrders = orderRepository.countTotalOrdersByStoreId(storeId);
        long processingOrders = orderRepository.countProcessingOrdersByStoreId(storeId);
        long completedOrders = orderRepository.countCompletedOrdersByStoreId(storeId);
        return ktc.spring_project.dtos.order.OrderStatsDto.builder()
                .totalOrders(totalOrders)
                .processingOrders(processingOrders)
                .completedOrders(completedOrders)
                .build();
    }

    public Order createOrder(Order order) {
        try {
            log.debug("Creating order: {}", order.getOrderCode());

            validateOrder(order);
            validateBusinessRules(order);
            
            return orderRepository.save(order);
            
        } catch (EntityDuplicateException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to create order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    public Order updateOrderStatusToDispatched(Long orderId, Long driverId) {
        try {
            log.debug("Updating order {} status to dispatched with driver {}", orderId, driverId);
            
            Order order = getOrderById(orderId);
            
            // Update status to "Dispatched"
            Optional<Status> dispatchedStatus = statusService.getStatusByTypeAndName("ORDER", "Dispatched");
            if (dispatchedStatus.isPresent()) {
                order.setStatus(dispatchedStatus.get());
                log.info("Order {} status updated to Dispatched", orderId);
            }
            
            return orderRepository.save(order);
            
        } catch (Exception e) {
            throw new HttpException("Failed to update order status to dispatched: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Order getOrderById(Long id) {
        try {
            validateId(id, "Order ID");
            log.debug("Getting order by id: {}", id);

            return orderRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));

        } catch (EntityNotFoundException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public List<Order> getAllOrders() {
        try {
            log.debug("Getting all orders");
            return orderRepository.findAll(Sort.by("createdAt").descending());
        } catch (Exception e) {
            throw new HttpException("Failed to get all orders: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    public List<Order> getAllOrdersSorted() {
        try {
            return getAllOrders(); // Tránh code trùng lặp
        } catch (Exception e) {
            throw new HttpException("Failed to get sorted orders: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Page<Order> getOrdersPaginated(int page, int size) {
        try {
            validatePaginationParams(page, size);
            log.debug("Getting orders paginated: page={}, size={}", page, size);

            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            return orderRepository.findAll(pageable);

        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get paginated orders: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Order updateOrder(Long id, Order orderDetails) {
        try {
            validateId(id, "Order ID");
            validateNotNull(orderDetails, "Order details");
            log.debug("Updating order with id: {}", id);

            Order existingOrder = getOrderById(id);

            // Kiểm tra trùng lặp orderCode nếu được thay đổi
            if (orderDetails.getOrderCode() != null
                    && !orderDetails.getOrderCode().equals(existingOrder.getOrderCode())) {
                checkOrderCodeDuplication(orderDetails.getOrderCode());
                existingOrder.setOrderCode(orderDetails.getOrderCode());
            }

            validateBusinessRules(orderDetails);
            updateOrderFields(existingOrder, orderDetails);

            return orderRepository.save(existingOrder);

        } catch (EntityDuplicateException | EntityNotFoundException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to update order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public void deleteOrder(Long id) {
        try {
            validateId(id, "Order ID");
            log.debug("Deleting order with id: {}", id);

            Order order = getOrderById(id);
            orderRepository.delete(order);

        } catch (EntityNotFoundException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to delete order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Map<String, Object> getOrderTrackingInfo(Long orderId) {
        try {
            validateId(orderId, "Order ID");
            log.debug("Getting tracking info for order: {}", orderId);

            Order order = getOrderById(orderId);
            return buildTrackingInfo(order);

        } catch (EntityNotFoundException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get order tracking info: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ================== PRIVATE HELPER METHODS ==================

    private void validateCreateOrderDTO(ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO dto) {
        validateNotNull(dto, "Request body");
        // Cho phép orderCode và totalAmount null
        validateNotNull(dto.getCreatedBy(), "CreatedBy");
        validateNotNull(dto.getStore(), "Store");
        validateNotNull(dto.getStatus(), "Status");
        // Có thể kiểm tra id của object nếu muốn chắc chắn tồn tại
        if (dto.getStore() != null
                && (dto.getStore().getId() == null || !storeRepository.existsById(dto.getStore().getId()))) {
            throw new EntityNotFoundException("Store not found with id: " + (dto.getStore().getId()));
        }
        if (dto.getStatus() != null
                && (dto.getStatus().getId() == null || !statusRepository.existsById(dto.getStatus().getId()))) {
            throw new EntityNotFoundException("Status not found with id: " + (dto.getStatus().getId()));
        }
        if (dto.getCreatedBy() != null
                && (dto.getCreatedBy().getId() == null || !userRepository.existsById(dto.getCreatedBy().getId()))) {
            throw new EntityNotFoundException("User not found with id: " + (dto.getCreatedBy().getId()));
        }
    }

    private void validateOrder(Order order) {
        validateNotNull(order, "Order");
        // Cho phép orderCode null
        // validateNotBlank(order.getOrderCode(), "Order code");
        if (order.getOrderCode() != null) {
            checkOrderCodeDuplication(order.getOrderCode());
        }
    }

    private void validateBusinessRules(Order order) {
        validateNonNegativeAmount(order.getTotalAmount(), "Total amount");
        validateNonNegativeAmount(order.getBenefitPerOrder(), "Benefit per order");
        validateNonNegativeAmount(order.getOrderProfitPerOrder(), "Order profit per order");
    }

    private void validateId(Long id, String fieldName) {
        if (id == null) {
            throw new HttpException(fieldName + " cannot be null", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateNotNull(Object value, String fieldName) {
        if (value == null) {
            throw new HttpException(fieldName + " cannot be null", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateNotBlank(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new HttpException(fieldName + " is required", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateNonNegativeAmount(BigDecimal amount, String fieldName) {
        if (amount != null && amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new HttpException(fieldName + " cannot be negative", HttpStatus.BAD_REQUEST);
        }
    }

    private void validatePaginationParams(int page, int size) {
        if (page < 1) {
            throw new HttpException("Page number must be greater than 0", HttpStatus.BAD_REQUEST);
        }
        if (size < 1) {
            throw new HttpException("Page size must be greater than 0", HttpStatus.BAD_REQUEST);
        }
    }

    private void checkOrderCodeDuplication(String orderCode) {
        if (orderRepository.existsByOrderCode(orderCode)) {
            throw new EntityDuplicateException("Order with code '" + orderCode + "' already exists");
        }
    }

    private Order buildOrderFromDTO(ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO dto) {
        Order order = new Order();
        order.setOrderCode(dto.getOrderCode());
        order.setDescription(dto.getDescription());
        order.setTotalAmount(dto.getTotalAmount());

        // Gán thông tin khách hàng (customer)
        if (dto.getCreatedBy() != null) {
            order.setCreatedBy(dto.getCreatedBy());
        }
        // Gán địa chỉ
        if (dto.getAddress() != null) {
            order.setAddress(dto.getAddress());
        }
        // Gán store
        if (dto.getStore() != null) {
            order.setStore(dto.getStore());
        }

        // Lưu thời gian buổi lấy hàng vào trường note
        String notes = dto.getNotes() != null ? dto.getNotes() : "";
        if (dto.getPickupTimePeriod() != null) {
            notes = notes.isEmpty() ? dto.getPickupTimePeriod() : notes + " | Buổi lấy hàng: " + dto.getPickupTimePeriod();
        }
        order.setNotes(notes);

        order.setBenefitPerOrder(BigDecimal.ZERO);
        order.setOrderProfitPerOrder(BigDecimal.ZERO);

        if (dto.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                    .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with id: " + dto.getVehicleId()));
            order.setVehicle(vehicle);
        }
        return order;
    }

    private void updateOrderFields(Order existingOrder, Order orderDetails) {
        existingOrder.setStatus(orderDetails.getStatus());
        existingOrder.setStore(orderDetails.getStore());
        existingOrder.setDescription(orderDetails.getDescription());
        existingOrder.setTotalAmount(orderDetails.getTotalAmount());
        existingOrder.setBenefitPerOrder(orderDetails.getBenefitPerOrder());
        existingOrder.setOrderProfitPerOrder(orderDetails.getOrderProfitPerOrder());
        existingOrder.setNotes(orderDetails.getNotes());
        existingOrder.setCreatedBy(orderDetails.getCreatedBy());
        existingOrder.setAddress(orderDetails.getAddress());

        updateVehicleIfPresent(existingOrder, orderDetails.getVehicle());
    }

    private void updateVehicleIfPresent(Order order, Vehicle vehicleDetails) {
        if (vehicleDetails != null) {
            if (vehicleDetails.getId() != null) {
                Vehicle vehicle = new Vehicle();
                vehicle.setId(vehicleDetails.getId());
                order.setVehicle(vehicle);
            } else {
                order.setVehicle(null);
            }
        }
        orderRepository.save(order);
    }

    // Helper method to build tracking info
    private Map<String, Object> buildTrackingInfo(Order order) {
        Map<String, Object> tracking = new HashMap<>();
        tracking.put("orderId", order.getId());
        tracking.put("status", order.getStatus() != null ? order.getStatus().getName() : null);
    tracking.put("address", order.getAddress() != null ? order.getAddress().getAddress() : null);
    tracking.put("storeAddress", order.getStore() != null ? order.getStore().getAddress() : null);

        // Lấy thông tin estimatedDelivery từ bảng Delivery
        List<ktc.spring_project.entities.Delivery> deliveries = deliveryRepository.findByOrderId(order.getId());
        if (deliveries != null && !deliveries.isEmpty()) {
            ktc.spring_project.entities.Delivery delivery = deliveries.get(0);
            tracking.put("estimatedDelivery", delivery.getScheduleDeliveryTime());
        } else {
            tracking.put("estimatedDelivery", null);
        }
        tracking.put("updatedAt", order.getUpdatedAt() != null ? order.getUpdatedAt() : LocalDateTime.now());
        return tracking;
    }

    /**
     * Update the status of an order
     */
    public void updateOrderStatus(Long orderId, OrderStatusUpdateDTO statusUpdate) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Status status = statusRepository.findById(statusUpdate.getStatusId())
                .orElseThrow(() -> new RuntimeException("Status not found with id: " + statusUpdate.getStatusId()));

        order.setStatus(status);

        // Update notes if provided
        if (statusUpdate.getNotes() != null && !statusUpdate.getNotes().isEmpty()) {
            // Append to existing notes or set new notes
            if (order.getNotes() != null && !order.getNotes().isEmpty()) {
                order.setNotes(order.getNotes() + "\n" + statusUpdate.getNotes());
            } else {
                order.setNotes(statusUpdate.getNotes());
            }
        }

        orderRepository.save(order);
    }

    // Missing methods needed by OrderController
    public List<Order> getOrdersByStoreId(Long storeId) {
        validateId(storeId, "Store ID");
        return orderRepository.findByStore_Id(storeId);
    }

    public List<OrderSummaryDTO> getOrderSummariesByStoreId(Long storeId) {
        validateId(storeId, "Store ID");
        return orderRepository.findOrderSummariesByStoreId(storeId);
    }

    public Page<OrderSummaryDTO> getOrderSummariesByStoreIdPaginated(Long storeId, int page, int size) {
        try {
            validateId(storeId, "Store ID");
            validatePaginationParams(page, size);
            log.debug("Getting order summaries by store ID paginated: storeId={}, page={}, size={}", storeId, page, size);
            
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            return orderRepository.findOrderSummariesByStoreIdPaginated(storeId, pageable);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get paginated order summaries by store ID: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public List<OrderSummaryDTO> getOrderSummariesByUserId(Long userId) {
        validateId(userId, "User ID");
        // Implement logic to get orders by user ID
        // For now, return all orders (you can customize this based on your business
        // logic)
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::convertToSummaryDTO)
                .toList();
    }

    // Helper method to convert Order to OrderSummaryDTO
    private OrderSummaryDTO convertToSummaryDTO(Order order) {
        // Lấy số lượng sản phẩm từ OrderItemRepository
        int totalItems = 0;
        if (order.getId() != null) {
            List<ktc.spring_project.entities.OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            totalItems = items != null ? items.size() : 0;
        }

        // Lấy deliveryFee từ DeliveryRepository
        java.math.BigDecimal deliveryFee = java.math.BigDecimal.ZERO;
        if (order.getId() != null) {
            List<ktc.spring_project.entities.Delivery> deliveries = deliveryRepository.findByOrderId(order.getId());
            if (deliveries != null && !deliveries.isEmpty() && deliveries.get(0).getDeliveryFee() != null) {
                deliveryFee = deliveries.get(0).getDeliveryFee();
            }
        }

        return new OrderSummaryDTO(
            order.getId(),
            order.getStore() != null ? order.getStore().getId() : null,
            order.getCreatedAt(),
            order.getAddress() != null ? order.getAddress().getAddress() : null,
            totalItems,
            deliveryFee,
            order.getStatus() != null ? order.getStatus().getName() : null
        );
    }
    
    // Helper method to convert Order to OrderTimelineResponse
    private OrderTimelineResponse convertToOrderTimelineResponse(Order order) {
        return OrderTimelineResponse.builder()
            .orderId(order.getId())
            .orderCode(order.getOrderCode())
            .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toLocalDateTime() : null)
            .updatedAt(order.getUpdatedAt() != null ? order.getUpdatedAt().toLocalDateTime() : null)
            // Order status
            .orderStatus(OrderStatusDto.builder()
                .statusId(order.getStatus() != null ? order.getStatus().getId() : null)
                .statusName(order.getStatus() != null ? order.getStatus().getName() : null)
                .build())
            // Customer info
            .customer(order.getCreatedBy() != null ? ActorDto.builder()
                .userId(order.getCreatedBy().getId())
                .fullName(order.getCreatedBy().getFullName())
                .phone(order.getCreatedBy().getPhone())
                .role("CUSTOMER")
                .build() : null)
            // Driver info
            .driver(order.getDriver() != null ? ActorDto.builder()
                .userId(order.getDriver().getId())
                .fullName(order.getDriver().getFullName())
                .phone(order.getDriver().getPhone())
                .role("DRIVER")
                .build() : null)
            .timeline(checklistService.buildTimelineSteps(order.getId()))
            .build();
    }
    
    // ================ CHECKLIST INTEGRATION METHODS ================
    
    /**
     * Dispatcher bàn giao hàng cho driver
     */
    public void dispatcherHandoverToDriver(Long dispatcherId, Long orderId, Long driverId, String handoverNotes) {
        try {
            Order order = getOrderById(orderId);
            
            checklistService.markStepCompleted(
                dispatcherId, 
                orderId,
                "DISPATCHER_HANDOVER_TO_DRIVER", 
                "Handed over Order: " + orderId + " to Driver: " + driverId + 
                (handoverNotes != null ? " - Notes: " + handoverNotes : "")
            );
            
            log.info("Dispatcher {} handed over order {} to driver {}", dispatcherId, orderId, driverId);
        } catch (Exception e) {
            log.error("Failed to process dispatcher handover: {}", e.getMessage());
            throw new HttpException("Failed to process dispatcher handover", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Dispatcher nhận kết quả giao hàng từ driver
     */
    public void dispatcherReceiveDeliveryResult(Long dispatcherId, Long orderId, boolean isSuccess, String resultNotes) {
        try {
            String result = isSuccess ? "Success" : "Failed";
            checklistService.markStepCompleted(
                dispatcherId, 
                orderId,
                "DISPATCHER_RECEIVE_DELIVERY_RESULT", 
                "Received delivery result: " + result + " for Order: " + orderId + 
                (resultNotes != null ? " - Notes: " + resultNotes : "")
            );
            
            log.info("Dispatcher {} received delivery result {} for order {}", dispatcherId, result, orderId);
        } catch (Exception e) {
            log.error("Failed to process dispatcher receive delivery result: {}", e.getMessage());
            throw new HttpException("Failed to process dispatcher receive delivery result", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Dispatcher cập nhật status thành "Completed"
     */
    public void dispatcherUpdateStatusToComplete(Long dispatcherId, Long orderId) {
        try {
            Order order = getOrderById(orderId);
            
            // Cập nhật status sang "Completed"
            Optional<Status> completedStatus = statusService.getStatusByTypeAndName("ORDER", "Completed");
            if (completedStatus.isPresent()) {
                order.setStatus(completedStatus.get());
                orderRepository.save(order);
                
                checklistService.markStepCompleted(
                    dispatcherId, 
                    orderId,
                    "DISPATCHER_UPDATE_STATUS_COMPLETE", 
                    "Order status updated to Completed for Order: " + orderId
                );
                
                log.info("Dispatcher {} updated order {} status to Completed", dispatcherId, orderId);
            } else {
                throw new HttpException("Completed status not found", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
            log.error("Failed to process dispatcher status update to complete: {}", e.getMessage());
            throw new HttpException("Failed to process dispatcher status update to complete", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}