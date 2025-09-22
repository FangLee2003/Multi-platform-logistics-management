package ktc.spring_project.services;

import ktc.spring_project.dtos.order.OrderStatusUpdateDTO;
import ktc.spring_project.dtos.order.OrderSummaryDTO;
import ktc.spring_project.entities.Order;
import ktc.spring_project.entities.Vehicle;
import ktc.spring_project.entities.Address;
import ktc.spring_project.entities.Status;
import ktc.spring_project.entities.Store;
import ktc.spring_project.entities.User;
import ktc.spring_project.repositories.OrderRepository;
import ktc.spring_project.repositories.AddressRepository;
import ktc.spring_project.repositories.StatusRepository;
import ktc.spring_project.repositories.StoreRepository;
import ktc.spring_project.repositories.UserRepository;
import ktc.spring_project.repositories.VehicleRepository;
import ktc.spring_project.repositories.DeliveryRepository;
import ktc.spring_project.exceptions.EntityDuplicateException;
import ktc.spring_project.exceptions.EntityNotFoundException;
import ktc.spring_project.exceptions.HttpException;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private StatusRepository statusRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    public Order createOrderFromDTO(ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO dto) {
        try {
            log.debug("Creating order from DTO: {}", dto);

            validateCreateOrderDTO(dto);
            // Chỉ kiểm tra trùng lặp nếu orderCode không null
            if (dto.getOrderCode() != null) {
                checkOrderCodeDuplication(dto.getOrderCode());
            }

            Order order = buildOrderFromDTO(dto);
            Order createdOrder = createOrder(order);
            
            return createdOrder;

        } catch (EntityDuplicateException | HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to create order: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
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

    public List<Order> getRecentOrders(int limit) {
        try {
            log.debug("Getting recent orders with limit: {}", limit);
            
            Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
            Page<Order> page = orderRepository.findAll(pageable);
            return page.getContent();
            
        } catch (Exception e) {
            throw new HttpException("Failed to get recent orders: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Page<Order> getAllOrdersPaginated(int page, int size) {
        try {
            log.debug("Getting all orders paginated: page={}, size={}", page, size);
            
            // Lấy tất cả orders, sắp xếp theo ID để đảm bảo tính nhất quán
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            return orderRepository.findAll(pageable);
            
        } catch (Exception e) {
            throw new HttpException("Failed to get paginated orders: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get orders by status with pagination
     */
    public Page<Order> getOrdersByStatusPaginated(String statusName, int page, int size) {
        try {
            log.debug("Getting orders by status paginated: status={}, page={}, size={}", statusName, page, size);
            
            // Find status by name
            Status status = statusRepository.findFirstByName(statusName)
                .orElseThrow(() -> new EntityNotFoundException("Status not found: " + statusName));
            
            // Get orders with the specified status, sorted by ID descending
            Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
            return orderRepository.findByStatus(status, pageable);
            
        } catch (Exception e) {
            throw new HttpException("Failed to get orders by status: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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

    /**
     * Đếm số lượng orders theo ngày (tối ưu cho dashboard)
     */
    public long countOrdersByDate(java.time.LocalDate date) {
        try {
            validateNotNull(date, "Date");
            log.debug("Counting orders by date: {}", date);
            
            java.time.LocalDateTime startOfDay = date.atStartOfDay();
            java.time.LocalDateTime endOfDay = date.atTime(23, 59, 59, 999999999);
            
            return orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to count orders by date: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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
        
        // Lưu thời gian buổi lấy hàng vào trường note
        String notes = dto.getNotes() != null ? dto.getNotes() : "";
        if (dto.getPickupTimePeriod() != null) {
            notes = notes.isEmpty() ? dto.getPickupTimePeriod() : notes + " | Buổi lấy hàng: " + dto.getPickupTimePeriod();
        }
        order.setNotes(notes);
        
        order.setBenefitPerOrder(BigDecimal.ZERO);
        order.setOrderProfitPerOrder(BigDecimal.ZERO);

        // Fetch đầy đủ thông tin từ database thay vì chỉ nhận object từ DTO
        if (dto.getStore() != null && dto.getStore().getId() != null) {
            Store store = storeRepository.findById(dto.getStore().getId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Store not found with id: " + dto.getStore().getId()));
            order.setStore(store);
        }
        if (dto.getStatus() != null && dto.getStatus().getId() != null) {
            Status status = statusRepository.findById(dto.getStatus().getId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Status not found with id: " + dto.getStatus().getId()));
            order.setStatus(status);
        }
        if (dto.getCreatedBy() != null && dto.getCreatedBy().getId() != null) {
            User user = userRepository.findById(dto.getCreatedBy().getId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("User not found with id: " + dto.getCreatedBy().getId()));
            order.setCreatedBy(user);
        }
        if (dto.getAddress() != null && dto.getAddress().getId() != null) {
            Address address = addressRepository.findById(dto.getAddress().getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Address not found with id: " + dto.getAddress().getId()));
            order.setAddress(address);
        }
        // Set Vehicle nếu có
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
        return orderRepository.findOrderSummariesByUserId(userId);
    }

    public Page<OrderSummaryDTO> getOrderSummariesByUserIdPaginated(Long userId, int page, int size) {
        try {
            validateId(userId, "User ID");
            validatePaginationParams(page, size);
            log.debug("Getting order summaries by user ID paginated: userId={}, page={}, size={}", userId, page, size);
            
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            return orderRepository.findOrderSummariesByUserIdPaginated(userId, pageable);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get paginated order summaries by user ID: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Tìm kiếm đơn hàng theo ID đơn hàng và store ID
     */
    public List<OrderSummaryDTO> searchOrdersByStoreIdAndOrderId(Long storeId, Long orderId) {
        try {
            validateId(storeId, "Store ID");
            validateId(orderId, "Order ID");
            log.debug("Searching orders by store ID and order ID: storeId={}, orderId={}", storeId, orderId);
            
            return orderRepository.findOrderSummariesByStoreIdAndOrderId(storeId, orderId);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to search orders by store ID and order ID: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Tìm kiếm đơn hàng theo ID đơn hàng và store ID với phân trang
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdAndOrderIdPaginated(Long storeId, Long orderId, int page, int size) {
        try {
            validateId(storeId, "Store ID");
            validateId(orderId, "Order ID");
            validatePaginationParams(page, size);
            log.debug("Searching orders by store ID and order ID paginated: storeId={}, orderId={}, page={}, size={}", storeId, orderId, page, size);
            
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            
            // Tạo Page từ List kết quả
            List<OrderSummaryDTO> orders = orderRepository.findOrderSummariesByStoreIdAndOrderId(storeId, orderId);
            int start = Math.min((int) pageable.getOffset(), orders.size());
            int end = Math.min((start + pageable.getPageSize()), orders.size());
            
            return new PageImpl<>(orders.subList(start, end), pageable, orders.size());
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to search orders by store ID and order ID paginated: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Tìm kiếm đơn hàng theo store ID và khoảng thời gian
     */
    public List<OrderSummaryDTO> searchOrdersByStoreIdAndDateRange(Long storeId, LocalDateTime fromDate, LocalDateTime toDate) {
        try {
            validateId(storeId, "Store ID");
            log.debug("Searching orders by store ID and date range: storeId={}, fromDate={}, toDate={}", storeId, fromDate, toDate);
            
            return orderRepository.findOrderSummariesByStoreIdAndDateRange(storeId, fromDate, toDate);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to search orders by store ID and date range: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Tìm kiếm đơn hàng theo store ID và khoảng thời gian với phân trang
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdAndDateRangePaginated(Long storeId, LocalDateTime fromDate, LocalDateTime toDate, int page, int size) {
        try {
            validateId(storeId, "Store ID");
            validatePaginationParams(page, size);
            log.debug("Searching orders by store ID and date range paginated: storeId={}, fromDate={}, toDate={}, page={}, size={}", storeId, fromDate, toDate, page, size);
            
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            return orderRepository.findOrderSummariesByStoreIdAndDateRangePaginated(storeId, fromDate, toDate, pageable);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to search orders by store ID and date range paginated: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Unified search method that supports multiple search criteria
     * @param storeId - required, orders must belong to this store
     * @param orderId - optional, exact match if provided
     * @param fromDate - optional, start date if provided
     * @param toDate - optional, end date if provided  
     * @param statusList - optional, list of status names if provided
     * @param page - page number (1-based)
     * @param size - page size
     * @return paginated search results
     */
    public Page<OrderSummaryDTO> searchOrdersByStoreIdWithFiltersPaginated(
            Long storeId, Long orderId, LocalDateTime fromDate, LocalDateTime toDate, 
            List<String> statusList, int page, int size) {
        try {
            validateId(storeId, "Store ID");
            validatePaginationParams(page, size);
            log.debug("Unified search orders: storeId={}, orderId={}, fromDate={}, toDate={}, statusList={}, page={}, size={}", 
                storeId, orderId, fromDate, toDate, statusList, page, size);
            
            Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
            return orderRepository.findOrderSummariesByStoreIdWithFiltersPaginated(
                storeId, orderId, fromDate, toDate, statusList, pageable);
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to search orders with filters: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get order statistics by store ID
     * @param storeId - the store ID to get statistics for
     * @return OrderStatsDto with counts for total, processing, and completed orders
     */
    public ktc.spring_project.dtos.order.OrderStatsDto getOrderStatsByStoreId(Long storeId) {
        try {
            validateId(storeId, "Store ID");
            log.debug("Getting order stats for storeId: {}", storeId);
            
            long totalOrders = orderRepository.countTotalOrdersByStoreId(storeId);
            long processingOrders = orderRepository.countProcessingOrdersByStoreId(storeId);
            long completedOrders = orderRepository.countCompletedOrdersByStoreId(storeId);
            
            return ktc.spring_project.dtos.order.OrderStatsDto.builder()
                    .totalOrders(totalOrders)
                    .processingOrders(processingOrders)
                    .completedOrders(completedOrders)
                    .build();
            
        } catch (HttpException e) {
            throw e;
        } catch (Exception e) {
            throw new HttpException("Failed to get order statistics: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Calculate performance metrics from real database data
     */
    public Map<String, Object> calculatePerformanceMetrics() {
        try {
            // Calculate delivery success rate using optimized queries
            long totalOrders = orderRepository.count();
            long completedOrders = orderRepository.countAllCompletedOrders();
            
            double deliverySuccessRate = totalOrders > 0 ? 
                (double) completedOrders / totalOrders * 100 : 0.0;
            
            // Calculate average delivery time from actual delivery data
            double avgDeliveryTime = calculateAverageDeliveryTime();
            
            // Calculate average cost per km from actual data
            double costPerKm = calculateAverageCostPerKm();
            
            // Calculate total distance transported in km
            double totalDistanceKm = calculateTotalDistanceKm();

            // Set targets (these could come from configuration or admin settings)
            Map<String, Object> targets = new HashMap<>();
            targets.put("deliverySuccessRate", 95.0);
            targets.put("avgDeliveryTime", 60.0); // Target 60 minutes
            targets.put("costPerKm", 13000.0);
            // targets.put("customerSatisfaction", 4.5); // Không cần nữa

            // Build response
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("deliverySuccessRate", Math.round(deliverySuccessRate * 10.0) / 10.0);
            metrics.put("avgDeliveryTime", avgDeliveryTime);
            metrics.put("costPerKm", costPerKm);
            metrics.put("totalDistanceKm", Math.round(totalDistanceKm));
            // metrics.put("customerSatisfaction", customerSatisfaction); // Không cần nữa
            metrics.put("onTimeDeliveryRate", 87.3); // TODO: Calculate from actual data
            metrics.put("fuelEfficiency", 8.5); // TODO: Calculate from actual data
            metrics.put("target", targets);

            log.info("Calculated performance metrics: deliverySuccessRate={}%, totalOrders={}, completedOrders={}, totalDistanceKm={}", 
                deliverySuccessRate, totalOrders, completedOrders, totalDistanceKm);

            return metrics;
            
        } catch (Exception e) {
            log.error("Error calculating performance metrics", e);
            throw new RuntimeException("Failed to calculate performance metrics: " + e.getMessage());
        }
    }

    /**
     * Calculate total distance transported in km from actual delivery data
     */
    private double calculateTotalDistanceKm() {
        try {
            Double totalDistance = deliveryRepository.getTotalDistanceKm();
            
            if (totalDistance == null) {
                log.warn("No total distance data found, returning 0");
                return 0.0;
            }
            
            log.info("Calculated total distance transported: {} km", totalDistance);
            return totalDistance;
            
        } catch (Exception e) {
            log.error("Error calculating total distance km", e);
            return 0.0; // Fallback in case of error
        }
    }

    /**
     * Calculate average delivery time in minutes from order creation to actual delivery
     */
    private double calculateAverageDeliveryTime() {
        try {
            List<Object[]> deliveryTimes = deliveryRepository.findDeliveryTimesForCompletedOrders();
            
            if (deliveryTimes.isEmpty()) {
                log.warn("No completed deliveries found, returning default average delivery time");
                return 45.0; // Default fallback in minutes
            }
            
            double totalMinutes = 0.0;
            int validDeliveries = 0;
            
            for (Object[] row : deliveryTimes) {
                java.sql.Timestamp orderCreated = (java.sql.Timestamp) row[0];
                java.sql.Timestamp actualDelivery = (java.sql.Timestamp) row[1];
                
                if (orderCreated != null && actualDelivery != null) {
                    long diffInMillis = actualDelivery.getTime() - orderCreated.getTime();
                    double minutes = diffInMillis / (1000.0 * 60.0); // Convert to minutes
                    
                    // Only include reasonable delivery times (between 30 minutes and 7 days)
                    if (minutes > 30 && minutes <= 10080) { // 7 days = 10080 minutes
                        totalMinutes += minutes;
                        validDeliveries++;
                    }
                }
            }
            
            if (validDeliveries == 0) {
                log.warn("No valid delivery times found, returning default average");
                return 45.0; // Default fallback in minutes
            }
            
            double avgMinutes = totalMinutes / validDeliveries;
            log.info("Calculated average delivery time: {} minutes from {} valid deliveries", avgMinutes, validDeliveries);
            
            return Math.round(avgMinutes * 10.0) / 10.0; // Round to 1 decimal place
            
        } catch (Exception e) {
            log.error("Error calculating average delivery time", e);
            return 45.0; // Fallback in case of error (in minutes)
        }
    }

    /**
     * Calculate average cost per km from actual delivery and route data
     */
    private double calculateAverageCostPerKm() {
        try {
            // Query to get deliveries with route distance data
            List<Object[]> costData = deliveryRepository.findCostPerKmData();
            
            if (costData.isEmpty()) {
                log.warn("No delivery cost per km data found, using default value");
                return 12500.0; // Default cost per km in VND
            }
            
            double totalCostPerKm = 0.0;
            int validRecords = 0;
            
            for (Object[] row : costData) {
                java.math.BigDecimal deliveryFee = (java.math.BigDecimal) row[0];
                java.math.BigDecimal distance = (java.math.BigDecimal) row[1];
                
                if (deliveryFee != null && distance != null && distance.doubleValue() > 0) {
                    double costPerKm = deliveryFee.doubleValue() / distance.doubleValue();
                    
                    // Only include reasonable cost per km (between 1,000 and 100,000 VND/km)
                    if (costPerKm >= 1000 && costPerKm <= 100000) {
                        totalCostPerKm += costPerKm;
                        validRecords++;
                    }
                }
            }
            
            if (validRecords == 0) {
                log.warn("No valid cost per km records found, using default value");
                return 12500.0; // Default cost per km in VND
            }
            
            double avgCostPerKm = totalCostPerKm / validRecords;
            log.info("Calculated average cost per km: {} VND/km from {} valid records", avgCostPerKm, validRecords);
            
            return Math.round(avgCostPerKm); // Round to nearest VND
            
        } catch (Exception e) {
            log.error("Error calculating average cost per km", e);
            return 12500.0; // Fallback in case of error
        }
    }
}