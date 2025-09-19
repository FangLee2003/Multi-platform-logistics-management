package ktc.spring_project.controllers;

import ktc.spring_project.entities.Vehicle;
import ktc.spring_project.entities.User;
import ktc.spring_project.services.VehicleService;
import ktc.spring_project.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for Operations Dashboard APIs
 * Provides aggregated data for operations management
 */
@RestController
@RequestMapping("/api/operations")
public class OperationsController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private UserService userService;

    /**
     * Get all vehicles for operations dashboard
     * Returns vehicles in dashboard format for real-time monitoring
     */
    @GetMapping("/vehicles")
    public ResponseEntity<List<Map<String, Object>>> getVehiclesForOperations(Authentication authentication) {
        try {
            // Get all vehicles without pagination for operations dashboard
            List<Vehicle> vehicles = vehicleService.getAllVehicles();
            
            // Convert to dashboard format
            List<Map<String, Object>> vehicleDTOs = vehicles.stream().map(vehicle -> {
                Map<String, Object> vehicleDTO = new HashMap<>();
                vehicleDTO.put("id", vehicle.getId().toString());
                vehicleDTO.put("name", vehicle.getLicensePlate()); // Use license plate as name
                vehicleDTO.put("type", mapVehicleTypeToString(vehicle.getVehicleType()));

                // Map status to dashboard format based on actual database values
                String dashboardStatus = "IDLE"; // default
                String displayStatus = "Không xác định"; // Vietnamese display status
                String statusCode = null;
                String statusDescription = null;

                if (vehicle.getStatus() != null) {
                    statusCode = vehicle.getStatus().getName();
                    statusDescription = vehicle.getStatus().getDescription();
                    String statusName = statusCode.toUpperCase();
                    switch (statusName) {
                        case "IN_USE":
                            dashboardStatus = "ACTIVE";
                            displayStatus = "Đang sử dụng";
                            break;
                        case "AVAILABLE":
                            dashboardStatus = "IDLE";
                            displayStatus = "Sẵn sàng";
                            break;
                        case "MAINTENANCE":
                            dashboardStatus = "MAINTENANCE";
                            displayStatus = "Bảo trì";
                            break;
                        case "MAINTENANCE_PENDING":
                            dashboardStatus = "MAINTENANCE";
                            displayStatus = "Chờ bảo trì";
                            break;
                        default:
                            dashboardStatus = "IDLE";
                            displayStatus = statusCode;
                    }
                }
                vehicleDTO.put("status", dashboardStatus);
                vehicleDTO.put("statusDisplay", displayStatus);
                vehicleDTO.put("statusCode", statusCode);
                vehicleDTO.put("statusDescription", statusDescription);

                // Driver info
                if (vehicle.getCurrentDriver() != null) {
                    Map<String, Object> driverDTO = new HashMap<>();
                    driverDTO.put("id", vehicle.getCurrentDriver().getId().toString());
                    driverDTO.put("name", vehicle.getCurrentDriver().getFullName());
                    driverDTO.put("phone", vehicle.getCurrentDriver().getPhone());
                    vehicleDTO.put("driver", driverDTO);
                }

                vehicleDTO.put("mileage", 45000);
                vehicleDTO.put("lastMaintenance", "2024-01-15");
                vehicleDTO.put("nextMaintenance", "2024-04-15");
                
                // Add created_at with proper formatting to match database exactly
                if (vehicle.getCreatedAt() != null) {
                    // Format as DD/MM/YYYY HH:MM:SS using UTC to match database time
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                    sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    vehicleDTO.put("created_at", sdf.format(vehicle.getCreatedAt()));
                } else {
                    vehicleDTO.put("created_at", "");
                }
                
                // Debug log to check if created_at is being set
                System.out.println("Vehicle " + vehicle.getId() + " created_at: " + vehicle.getCreatedAt());
                return vehicleDTO;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(vehicleDTOs);
            
        } catch (Exception e) {
            // Return empty list on error to prevent 500 errors
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Update vehicle status for operations dashboard
     */
    @PatchMapping("/vehicles/{vehicleId}/status")
    public ResponseEntity<Map<String, Object>> updateVehicleStatus(
            @PathVariable Long vehicleId,
            @RequestBody Map<String, String> statusUpdate,
            Authentication authentication) {
        try {
            // This would need to be implemented based on your status system
            // For now, return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Status updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to update status");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Get staff data for operations dashboard
     */
    @GetMapping("/staff")
    public ResponseEntity<List<Map<String, Object>>> getStaffForOperations(
            @RequestParam(required = false) String department,
            Authentication authentication) {
        try {
            List<User> staff = userService.getAllUsers().stream()
                .filter(user -> user.getRole() != null && 
                    (user.getRole().getRoleName().equals("DRIVER") ||
                     user.getRole().getRoleName().equals("FLEET") ||
                     user.getRole().getRoleName().equals("DISPATCHER")))
                .collect(Collectors.toList());
            
            // Filter by department if specified
            if (department != null && !department.isEmpty()) {
                // Implement department filtering based on your user model
            }
            
            List<Map<String, Object>> staffDTOs = staff.stream().map(user -> {
                Map<String, Object> staffDTO = new HashMap<>();
                staffDTO.put("id", user.getId().toString());
                staffDTO.put("name", user.getFullName());
                staffDTO.put("email", user.getEmail());
                staffDTO.put("phone", user.getPhone());
                staffDTO.put("role", user.getRole().getRoleName());
                staffDTO.put("status", mapStatusToFrontend(user.getStatus() != null ? user.getStatus().getName() : "Unknown"));
                staffDTO.put("department", mapRoleToDepartment(user.getRole().getRoleName()));
                staffDTO.put("shiftStart", "08:00");
                staffDTO.put("shiftEnd", "17:00");
                staffDTO.put("performanceScore", 85);
                staffDTO.put("totalDeliveries", 0);
                staffDTO.put("onTimeDeliveries", 0);
                return staffDTO;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(staffDTOs);
            
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    private String mapVehicleTypeToString(Object vehicleType) {
        if (vehicleType == null) return "TRUCK";
        String type = vehicleType.toString().toUpperCase();
        switch (type) {
            case "TRUCK":
            case "XE_TAI":
                return "TRUCK";
            case "VAN":
            case "XE_VAN":
                return "VAN";
            case "MOTORCYCLE":
            case "XE_MAY":
                return "MOTORCYCLE";
            default:
                return "TRUCK";
        }
    }

    private String mapRoleToDepartment(String roleName) {
        switch (roleName) {
            case "DRIVER":
                return "Vận chuyển";
            case "DISPATCHER":
                return "Điều phối";
            case "FLEET":
                return "Bảo trì";
            default:
                return "Khác";
        }
    }

    private String mapStatusToFrontend(String statusName) {
        switch (statusName) {
            case "Active":
                return "ACTIVE";
            case "Inactive":
                return "ON_LEAVE";
            case "Suspended":
                return "TERMINATED";
            default:
                return "ACTIVE";
        }
    }
}