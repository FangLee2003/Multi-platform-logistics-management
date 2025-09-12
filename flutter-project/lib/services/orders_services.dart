import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:ktc_logistics_driver/data/env/environment.dart';
import 'package:ktc_logistics_driver/data/local_secure/secure_storage.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_details_response.dart';
import 'package:ktc_logistics_driver/domain/models/order/orders_by_status_response.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_status_update.dart';

/// OrdersServices - Handles all API operations related to orders
class OrdersServices {
  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();

  // Constructor
  OrdersServices();

  /// Get driver ID from secure storage
  Future<int?> _getDriverId() async {
    final driverId = await secureStorage.readDriverId();
    if (driverId == null) {
      return null;
    }
    return int.parse(driverId);
  }

  /// Retrieves all orders assigned to the current driver
  ///
  /// Returns a list of [OrdersResponse] objects
  Future<List<OrdersResponse>> getDriverOrdersList() async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get orders');
      return [];
    }

    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get orders');
      return [];
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/driver/$driverId/orders'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      if (resp.statusCode == 200) {
        final List<dynamic> data = json.decode(resp.body);
        return data.map((item) => OrdersResponse.fromJson(item)).toList();
      } else {
        debugPrint(
            'Error getting driver orders: ${resp.statusCode} - ${resp.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error getting driver orders: $e');
      return [];
    }
  }

  /// Get detailed information about a specific order
  ///
  /// [orderId] The ID of the order to retrieve
  /// Returns [OrderDetailsResponse] object with order details
  Future<OrderDetailsResponse?> getDriverOrderDetail(int orderId) async {
        final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot get orders');
      return null;
    }

    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get order details');
      return null;
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/driver/$driverId/orders/$orderId'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      if (resp.statusCode == 200) {
        final orderData = json.decode(resp.body);
        return OrderDetailsResponse.fromJson(orderData);
      } else {
        debugPrint(
            'Error getting order detail: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting order detail: $e');
      return null;
    }
  }
  
  /// Update order status using OrderStatusUpdate model
  /// 
  /// [orderId] ID of the order to update
  /// [statusUpdate] Status update details
  /// [driverId] Optional driver ID (will use stored driver ID if not provided)
  /// Returns true if successful, false otherwise
  Future<bool> updateOrderStatus({
    int? driverId,
    required int orderId,
    required OrderStatusUpdate statusUpdate
  }) async {
    // Use provided driverId or get from secure storage
    final dId = driverId ?? await _getDriverId();
    if (dId == null) {
      debugPrint('Driver ID not found - cannot update order status');
      return false;
    }

    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot update order status');
      return false;
    }

    try {
      // Construct URL using the pattern api/driver/:driverId/orders/:orderId/status
      final url = '${_env.apiBaseUrl}/driver/$dId/orders/$orderId/status';
      debugPrint('Updating order status at: $url');
      debugPrint('Request payload: ${statusUpdate.toJson()}');

      final resp = await http.patch(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: json.encode(statusUpdate.toJson())
      );

      if (resp.statusCode == 200) {
        debugPrint('Order status updated successfully');
        return true;
      } else {
        debugPrint('Error updating order status: ${resp.statusCode} - ${resp.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Error updating order status: $e');
      return false;
    }
  }
}

/// Singleton instance for app-wide use
final ordersServices = OrdersServices();
