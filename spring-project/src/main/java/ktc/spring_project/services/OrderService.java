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
import ktc.spring_project.exceptions.EntityDuplicateException;
import ktc.spring_project.exceptions.EntityNotFoundException;
import ktc.spring_project.exceptions.HttpException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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

    public Order createOrderFromDTO(ktc.spring_project.dtos.order.CreateDeliveryOrderRequestDTO dto) {
        try {
            log.debug("Creating order from DTO: {}", dto);

            validateCreateOrderDTO(dto);
            // Chỉ kiểm tra trùng lặp nếu orderCode không null
            if (dto.getOrderCode() != null) {
                checkOrderCodeDuplication(dto.getOrderCode());
            }

            Order order = buildOrderFromDTO(dto);
            return createOrder(order);

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
        order.setNotes(dto.getNotes());
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
        tracking.put("currentLocation", order.getNotes());
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
}