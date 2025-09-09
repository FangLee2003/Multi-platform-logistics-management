// delivery_detail_screen_controller.dart
// Controller for the DeliveryDetailScreen

import 'package:ktc_logistics_driver/data/services/driver_api_service.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_detail.dart';

class DeliveryDetailScreenController {
  final DriverApiService _apiService;
  
  DeliveryDetailScreenController(this._apiService);
  
  DeliveryDetail? deliveryDetail;
  bool isLoading = true;
  String? errorMessage;
  String selectedStatus = 'Assigned';
  
  // Load delivery details
  Future<void> loadDeliveryDetails(int deliveryId) async {
    try {
      isLoading = true;
      errorMessage = null;
      
      deliveryDetail = await _apiService.getDeliveryDetail(deliveryId);
      
      // Set the status based on the API response
      if (deliveryDetail?.status != null) {
        selectedStatus = deliveryDetail!.status!;
      }
      
    } catch (e) {
      errorMessage = 'Failed to load delivery details: $e';
    } finally {
      isLoading = false;
    }
  }
  
  // Update delivery status
  Future<bool> updateStatus(int deliveryId, String status, String? notes) async {
    try {
      final result = await _apiService.updateDeliveryStatus(deliveryId, status, notes);
      if (result) {
        selectedStatus = status;
        await loadDeliveryDetails(deliveryId); // Reload details to reflect changes
      }
      return result;
    } catch (e) {
      errorMessage = 'Failed to update status: $e';
      return false;
    }
  }
  
  // Get progress value for status indicator
  double getProgressValue() {
    switch (selectedStatus) {
      case 'Assigned':
        return 0.2;
      case 'Started':
        return 0.4;
      case 'In Progress':
        return 0.65;
      case 'Completed':
        return 1.0;
      case 'Cancelled':
        return 0.0;
      default:
        return 0.0;
    }
  }
  
  // Get status description
  String getStatusDescription() {
    switch (selectedStatus) {
      case 'Assigned':
        return "Waiting to start";
      case 'Started':
        return "Journey started";
      case 'In Progress':
        return "In transit";
      case 'Completed':
        return "Delivery completed";
      case 'Cancelled':
        return "Delivery cancelled";
      default:
        return "Unknown status";
    }
  }
}
