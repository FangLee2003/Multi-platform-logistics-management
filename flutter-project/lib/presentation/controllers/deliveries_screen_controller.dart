// deliveries_screen_controller.dart
// Controller for the DeliveriesScreen

import 'package:ktc_logistics_driver/domain/models/delivery/driver_delivery.dart';
import 'package:ktc_logistics_driver/services/driver_services.dart';
import 'package:ktc_logistics_driver/services/mock_deliveries_service.dart';

class DeliveriesScreenController {
  final dynamic _service; // Can be DriverServices or MockDeliveriesService
  
  DeliveriesScreenController(this._service);
  
  List<DriverDelivery> upcomingDeliveries = [];
  List<DriverDelivery> historyDeliveries = [];
  bool isLoading = true;
  String? errorMessage;
  
  // Load all deliveries and sort them
  Future<void> loadDeliveries() async {
    try {
      isLoading = true;
      errorMessage = null;
      
      List<DriverDelivery> deliveries;
      
      // Check if we're using the mock service
      if (_service is MockDeliveriesService) {
        deliveries = await (_service as MockDeliveriesService).getMockDriverDeliveries();
      } else {
        // In a real implementation, we'd convert Delivery models to DriverDelivery models
        // For now, we'll just return an empty list in the real service case
        deliveries = [];
      }
      
      // Separate deliveries into upcoming and history based on their status
      upcomingDeliveries = deliveries.where((delivery) => 
        !delivery.completed && 
        (delivery.statusDisplay == 'In Progress' || 
         delivery.statusDisplay == 'Assigned' || 
         delivery.statusDisplay == 'Started' ||
         delivery.statusDisplay == 'Pending')
      ).toList();
      
      historyDeliveries = deliveries.where((delivery) => 
        delivery.completed || 
        delivery.statusDisplay == 'Completed' || 
        delivery.statusDisplay == 'Cancelled' ||
        delivery.statusDisplay == 'Failed'
      ).toList();
      
      // Sort upcoming deliveries by scheduled time
      upcomingDeliveries.sort((a, b) {
        if (a.scheduleDeliveryTime == null) return 1;
        if (b.scheduleDeliveryTime == null) return -1;
        return a.scheduleDeliveryTime!.compareTo(b.scheduleDeliveryTime!);
      });
      
      // Sort history deliveries by actual delivery time (most recent first)
      historyDeliveries.sort((a, b) {
        if (a.actualDeliveryTime == null) return 1;
        if (b.actualDeliveryTime == null) return -1;
        return b.actualDeliveryTime!.compareTo(a.actualDeliveryTime!);
      });
      
    } catch (e) {
      errorMessage = 'Failed to load deliveries: $e';
    } finally {
      isLoading = false;
    }
  }
  
  // Format delivery time for display
  String formatDeliveryTime(String? timeString) {
    if (timeString == null) return 'No time specified';
    
    try {
      final dateTime = DateTime.parse(timeString);
      return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return timeString;
    }
  }
}
