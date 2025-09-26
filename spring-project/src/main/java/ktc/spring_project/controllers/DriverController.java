
package ktc.spring_project.controllers;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import ktc.spring_project.dtos.delivery.DeliveryResponseDTO;
import ktc.spring_project.dtos.delivery.DeliveryDetailResponseDTO;
import ktc.spring_project.dtos.order.DriverOrderSimpleResponseDTO;
import ktc.spring_project.dtos.order.OrderDetailResponseDTO;
import ktc.spring_project.dtos.order.OrderStatusUpdateDTO;
import ktc.spring_project.dtos.route.RouteResponseDTO;
import ktc.spring_project.dtos.tracking.LocationUpdateDTO;
import ktc.spring_project.services.DeliveryService;
import ktc.spring_project.services.OrderService;
import ktc.spring_project.services.RouteService;
import ktc.spring_project.services.DeliveryTrackingService;
import ktc.spring_project.services.DeliveryProofService;

import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

	private final DeliveryService deliveryService;
	private final OrderService orderService;
	private final RouteService routeService;
	private final DeliveryTrackingService trackingService;
	private final DeliveryProofService deliveryProofService;

	@Autowired
	public DriverController(
		DeliveryService deliveryService,
		OrderService orderService,
		RouteService routeService,
		DeliveryTrackingService trackingService,
		DeliveryProofService deliveryProofService) {
		this.deliveryService = deliveryService;
		this.orderService = orderService;
		this.routeService = routeService;
		this.trackingService = trackingService;
		this.deliveryProofService = deliveryProofService;
	}

	// Kept for backward compatibility
	@GetMapping("/{driverId}/orders")
	public List<DriverOrderSimpleResponseDTO> getOrdersByDriver(@PathVariable Long driverId) {
		return deliveryService.getOrdersByDriverId(driverId);
	}

	// Updated to include driverId in path
	@GetMapping("/{driverId}/orders/{orderId}")
	public ResponseEntity<?> getOrderDetail(
		@PathVariable Long driverId, 
		@PathVariable Long orderId) {
		// TODO: Validate that order belongs to driver
		OrderDetailResponseDTO orderDetail = deliveryService.getOrderDetailById(orderId);
		
		// Get simplified delivery proofs for this order and include them in response
		try {
			// Verify order exists
			orderService.getOrderById(orderId);
			
			Map<String, Object> response = new HashMap<>();
			response.put("orderDetail", orderDetail);
			response.put("deliveryProofs", deliveryProofService.findSimplifiedByOrderId(orderId));
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.ok(orderDetail); // Fallback to just order details if error
		}
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
	
	// New endpoint to update order status
	@PatchMapping("/{driverId}/orders/{orderId}/status")
	public ResponseEntity<?> updateOrderStatus(
		@PathVariable Long driverId,
		@PathVariable Long orderId,
		@Valid @RequestBody OrderStatusUpdateDTO statusUpdate) {
		// TODO: Validate that order belongs to driver
		orderService.updateOrderStatus(orderId, statusUpdate);
		return ResponseEntity.ok().build();
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
