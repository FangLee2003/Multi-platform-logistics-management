import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:ktc_logistics_driver/data/env/environment.dart';
import 'package:ktc_logistics_driver/data/local_secure/secure_storage.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_status_update.dart';
import 'package:ktc_logistics_driver/domain/models/order/order.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/get_all_delivery_response.dart' as old_model;

/// DeliveryServices - Handles all API operations related to deliveries
class DeliveryServices {
  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();
  
  // Constructor
  DeliveryServices() {}

  /// Get driver ID from secure storage
  Future<int?> _getDriverId() async {
    final driverId = await secureStorage.readDriverId();
    if (driverId == null) {
      return null;
    }
    return int.parse(driverId);
  }

  /// Get all deliveries assigned to the current driver
  /// 
  /// Optional query parameters for filtering and sorting
  /// [status] Filter by delivery status
  /// [sortBy] Field to sort by
  /// [sortDirection] Direction to sort (asc/desc)
  /// 
  /// Returns a list of driver deliveries or empty list if failed
  Future<List<Delivery>> getDriverDeliveries({
    String? status,
    String? sortBy,
    String? sortDirection,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get deliveries');
      return [];
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get deliveries');
      return [];
    }
    
    // Build query string for filters and sorting
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (sortBy != null) queryParams['sortBy'] = sortBy;
    if (sortDirection != null) queryParams['sortDirection'] = sortDirection;
    
    final queryString = queryParams.isNotEmpty 
        ? '?' + queryParams.entries.map((e) => '${e.key}=${e.value}').join('&')
        : '';
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/deliveries$queryString'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        final List<dynamic> data = json.decode(resp.body);
        return data.map((delivery) => Delivery.fromJson(delivery)).toList();
      } else {
        debugPrint('Error getting driver deliveries: ${resp.statusCode} - ${resp.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error getting driver deliveries: $e');
      return [];
    }
  }

  /// Get details of a specific delivery
  /// 
  /// [deliveryId] ID of the delivery to get details for
  /// Returns delivery detail or null if failed
  Future<Delivery?> getDeliveryById(int deliveryId) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get delivery detail');
      return null;
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get delivery detail');
      return null;
    }
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/deliveries/$deliveryId'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        return Delivery.fromJson(data);
      } else {
        debugPrint('Error getting delivery detail: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting delivery detail: $e');
      return null;
    }
  }

  /// Get active deliveries for the current driver
  /// These are deliveries that are assigned but not completed
  /// 
  /// Returns a list of active deliveries or empty list if failed
  Future<List<Delivery>> getActiveDeliveries() async {
    // Active deliveries are those with status ASSIGNED or IN_TRANSIT
    return getDriverDeliveries(
      status: 'active', // API endpoint will handle this keyword to filter active deliveries
      sortBy: 'createdAt',
      sortDirection: 'desc',
    );
  }

  /// Get order details for a specific delivery
  /// 
  /// [deliveryId] ID of the delivery to get order for
  /// Returns order or null if failed
  Future<Order?> getOrderForDelivery(int deliveryId) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get order details');
      return null;
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get order details');
      return null;
    }
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/deliveries/$deliveryId/order'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        return Order.fromJson(data);
      } else {
        debugPrint('Error getting order for delivery: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting order for delivery: $e');
      return null;
    }
  }

  /// Get route information for a specific delivery
  /// 
  /// [deliveryId] ID of the delivery to get route for
  /// Returns route data as Map or null if failed
  Future<Map<String, dynamic>?> getDeliveryRoute(int deliveryId) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get delivery route');
      return null;
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get delivery route');
      return null;
    }
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/deliveries/$deliveryId/route'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        return json.decode(resp.body);
      } else {
        debugPrint('Error getting delivery route: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting delivery route: $e');
      return null;
    }
  }

  /// Update delivery status
  /// 
  /// [deliveryId] ID of the delivery to update
  /// [statusUpdate] Status update details
  /// Returns the updated delivery or null if failed
  Future<Delivery?> updateDeliveryStatus(
    int deliveryId, 
    DeliveryStatusUpdate statusUpdate
  ) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot update delivery status');
      return null;
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot update delivery status');
      return null;
    }
    
    try {
      final resp = await http.patch(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/deliveries/$deliveryId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: json.encode(statusUpdate.toJson())
      );
      
      if (resp.statusCode == 200) {
        debugPrint('Delivery status updated successfully');
        final data = json.decode(resp.body);
        return Delivery.fromJson(data);
      } else {
        debugPrint('Error updating delivery status: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error updating delivery status: $e');
      return null;
    }
  }
  
  /// Get all delivery people (drivers)
  /// 
  /// Returns a list of delivery people or empty list if failed
  Future<List<old_model.Delivery>> getAllDeliveryPeople() async {
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get delivery people');
      return [];
    }
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.endpointApi}/get-all-delivery'),
        headers: { 'Accept': 'application/json', 'xx-token': token }
      );
      
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        return old_model.GetAllDeliveryResponse.fromJson(data).delivery;
      } else {
        debugPrint('Error getting delivery people: ${resp.statusCode} - ${resp.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error getting delivery people: $e');
      return [];
    }
  }
  
  /// Legacy method to get all delivery personnel for admin screens
  /// This is used by the list_deliverys_screen.dart
  /// 
  /// Returns a list of delivery personnel
  Future<List<DeliveryPerson>> getAlldelivery() async {
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get all delivery personnel');
      return [];
    }
    
    try {
      // Trước tiên thử dùng API mới nếu available
      final driverId = await _getDriverId();
      if (driverId != null) {
        final resp = await http.get(
          Uri.parse('${_env.apiBaseUrl}/api/admin/delivery-personnel'),
          headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
        );

        if (resp.statusCode == 200) {
          final List<dynamic> data = json.decode(resp.body);
          return data.map((item) => DeliveryPerson.fromJson(item)).toList();
        }
      }
      
      // Fallback về API cũ nếu API mới không available
      final resp = await http.get(
        Uri.parse('${_env.endpointApi}/get-all-delivery'),
        headers: {'Accept': 'application/json', 'xx-token': token},
      );
      
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        if (data['delivery'] != null) {
          final List<dynamic> deliveryList = data['delivery'];
          return deliveryList.map((item) => DeliveryPerson.fromJson({
            'personId': item['person_id'] ?? 0,
            'nameDelivery': item['nameDelivery'] ?? '',
            'phone': item['phone'] ?? '',
            'image': item['image'] ?? '',
            'notificationToken': item['notification_token'] ?? '',
          })).toList();
        }
      }
      
      // Nếu cả hai API đều không hoạt động, trả về danh sách rỗng
      return [];
    } catch (e) {
      debugPrint('Error getting all delivery personnel: $e');
      return [];
    }
  }
}

final deliveryServices = DeliveryServices();