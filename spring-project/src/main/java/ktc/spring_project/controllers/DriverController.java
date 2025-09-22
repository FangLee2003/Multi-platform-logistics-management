package ktc.spring_project.controllers;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import ktc.spring_project.dtos.delivery.DeliveryResponseDTO;
import ktc.spring_project.dtos.delivery.DeliveryDetailResponseDTO;
import ktc.spring_project.dtos.order.DriverOrderSimpleResponseDTO;
import ktc.spring_project.dtos.order.OrderDetailResponseDTO;
import ktc.spring_project.dtos.order.OrderStatusUpdateDTO;
import ktc.spring_project.dtos.order.DeliveryOrderResponseDTO;
import ktc.spring_project.dtos.route.RouteResponseDTO;
import ktc.spring_project.dtos.tracking.LocationUpdateDTO;
import ktc.spring_project.services.DeliveryService;
import ktc.spring_project.services.OrderService;
import ktc.spring_project.services.StatusService;
import ktc.spring_project.services.RouteService;
import ktc.spring_project.services.DeliveryTrackingService;
import ktc.spring_project.entities.Status;
import ktc.spring_project.entities.Order;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

	private final DeliveryService deliveryService;
	private final OrderService orderService;
	private final StatusService statusService;
	private final RouteService routeService;
	private final DeliveryTrackingService trackingService;

	@Autowired
	public DriverController(
		DeliveryService deliveryService,
		OrderService orderService,
		StatusService statusService,
		RouteService routeService,
		DeliveryTrackingService trackingService) {
		this.deliveryService = deliveryService;
		this.orderService = orderService;
		this.statusService = statusService;
		this.routeService = routeService;
		this.trackingService = trackingService;
	}

	// Kept for backward compatibility
	@GetMapping("/{driverId}/orders")
	public List<DriverOrderSimpleResponseDTO> getOrdersByDriver(@PathVariable Long driverId) {
		return deliveryService.getOrdersByDriverId(driverId);
	}

	// Updated to include driverId in path
	@GetMapping("/{driverId}/orders/{orderId}")
	public OrderDetailResponseDTO getOrderDetail(
		@PathVariable Long driverId, 
		@PathVariable Long orderId) {
		// TODO: Validate that order belongs to driver
		return deliveryService.getOrderDetailById(orderId);
	}

	// New endpoint to get driver's deliveries
	@GetMapping("/{driverId}/deliveries")
	public List<DeliveryResponseDTO> getDriverDeliveries(@PathVariable Long driverId) {
		return deliveryService.getDeliveriesByDriverId(driverId);
	}

	// New endpoint to get delivery details
	@GetMapping("/{driverId}/deliveries/{deliveryId}")
	public DeliveryDetailResponseDTO getDeliveryDetail(
		@PathVariable Long driverId, 
		@PathVariable Long deliveryId) {
		// TODO: Validate that delivery belongs to driver
		return deliveryService.getDeliveryDetailById(deliveryId);
	}

	// New endpoint to update order status (simple version)
	@PatchMapping("/{driverId}/orders/{orderId}/status")
	public ResponseEntity<?> updateOrderStatus(
		@PathVariable Long driverId,
		@PathVariable Long orderId,
		@Valid @RequestBody OrderStatusUpdateDTO statusUpdate) {
		// TODO: Validate that order belongs to driver
		orderService.updateOrderStatus(orderId, statusUpdate);
		return ResponseEntity.ok().build();
	}

	/**
	 * Driver cập nhật trạng thái giao hàng
	 * Hỗ trợ các trạng thái: "In Transit", "Delivered", "Failed"
	 */
	@PatchMapping("/{driverId}/orders/{orderId}/delivery-status")
	public ResponseEntity<Map<String, Object>> updateDeliveryStatus(
			@PathVariable Long driverId,
			@PathVariable Long orderId,
			@RequestBody Map<String, Object> payload) {
		try {
			// Lấy thông tin đơn hàng
			Order order = orderService.getOrderById(orderId);
			// Kiểm tra driver có quyền cập nhật đơn này không
			if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
				return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(Map.of("error", "Driver không có quyền cập nhật đơn hàng này"));
			}
			// Lấy status từ payload
			String statusName = (String) payload.get("status");
			String reason = (String) payload.get("reason");
			if (statusName == null || statusName.trim().isEmpty()) {
				return ResponseEntity.badRequest()
					.body(Map.of("error", "Status không được để trống"));
			}
			// Validate status hợp lệ
			if (!isValidDeliveryStatus(statusName)) {
				return ResponseEntity.badRequest()
					.body(Map.of("error", "Status không hợp lệ. Chỉ chấp nhận: In Transit, Delivered, Failed"));
			}
			// Kiểm tra logic chuyển trạng thái
			String currentStatus = order.getStatus() != null ? order.getStatus().getName() : "";
			if (!isValidStatusTransition(currentStatus, statusName)) {
				return ResponseEntity.badRequest()
					.body(Map.of("error", "Không thể chuyển từ trạng thái '" + currentStatus + "' sang '" + statusName + "'"));
			}
			// Cập nhật status
			Optional<Status> newStatus = statusService.getStatusByTypeAndName("DELIVERY", statusName);
			if (newStatus.isPresent()) {
				order.setStatus(newStatus.get());
				// Thêm lý do nếu có (đặc biệt với trạng thái Failed)
				if (reason != null && !reason.trim().isEmpty()) {
					String currentNotes = order.getNotes() != null ? order.getNotes() : "";
					order.setNotes(currentNotes + "\n[Driver Update] " + statusName + ": " + reason);
				}
				Order updatedOrder = orderService.updateOrder(orderId, order);
				return ResponseEntity.ok(Map.of(
					"message", "Cập nhật trạng thái thành công",
					"orderId", orderId,
					"status", statusName,
					"updatedAt", updatedOrder.getUpdatedAt()
				));
			} else {
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(Map.of("error", "Không tìm thấy status '" + statusName + "' trong hệ thống"));
			}
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(Map.of("error", "Lỗi cập nhật trạng thái: " + e.getMessage()));
		}
	}

	/**
	 * Kiểm tra status có hợp lệ cho delivery không
	 */
	private boolean isValidDeliveryStatus(String status) {
		return "In Transit".equals(status) || "Delivered".equals(status) || "Failed".equals(status);
	}

	/**
	 * Kiểm tra logic chuyển trạng thái có hợp lệ không
	 */
	private boolean isValidStatusTransition(String currentStatus, String newStatus) {
		// Các quy tắc chuyển trạng thái hợp lệ
		switch (currentStatus) {
			case "Scheduled":
				return "In Transit".equals(newStatus);
			case "In Transit":
				return "Delivered".equals(newStatus) || "Failed".equals(newStatus);
			case "Delivered":
			case "Failed":
				return false; // Không cho phép chuyển từ trạng thái kết thúc
			default:
				return "In Transit".equals(newStatus); // Cho phép bắt đầu từ bất kỳ trạng thái nào
		}
	}

	// New endpoint to get delivery route
	@GetMapping("/{driverId}/deliveries/{deliveryId}/route")
	public RouteResponseDTO getDeliveryRoute(
		@PathVariable Long driverId,
		@PathVariable Long deliveryId) {
		// TODO: Validate that delivery belongs to driver
		return routeService.getRouteForDelivery(deliveryId);
	}

	// New endpoint for tracking updates
	@PostMapping("/{driverId}/deliveries/{deliveryId}/tracking")
	public ResponseEntity<?> updateDeliveryLocation(
		@PathVariable Long driverId,
		@PathVariable Long deliveryId,
		@Valid @RequestBody LocationUpdateDTO locationUpdate) {
		// TODO: Validate that delivery belongs to driver
		trackingService.updateDeliveryLocation(driverId, deliveryId, locationUpdate);
		return ResponseEntity.ok().build();
	}
}
