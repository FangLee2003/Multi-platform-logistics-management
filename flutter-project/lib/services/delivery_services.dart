import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:ktc_logistics_driver/data/env/environment.dart';
import 'package:ktc_logistics_driver/data/local_secure/secure_storage.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_detail_response.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_status_update.dart';

/// DeliveryServices - Handles all API operations related to deliveries
class DeliveryServices {
  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();

  // Constructor
  DeliveryServices();

  /// Get driver ID from secure storage
  Future<int?> _getDriverId() async {
    // Đọc driverId từ secure storage
    final driverId = await secureStorage.readDriverId();
    if (driverId == null || driverId == "0" || driverId.isEmpty) {
      // Debug log
      debugPrint('Warning: driverId not found in secure storage');
      return null;
    }

    try {
      final id = int.parse(driverId);
      debugPrint('Using driverId from storage: $id');
      return id;
    } catch (e) {
      debugPrint('Error parsing driverId: $e. Value was: $driverId');
      return null;
    }
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
    try {
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
          ? '?${queryParams.entries.map((e) => '${e.key}=${e.value}').join('&')}'
          : '';

      // Make sure to use consistent URL pattern
      final url = '${_env.endpointBase}api/driver/$driverId/deliveries$queryString';
      debugPrint('Fetching deliveries from: $url');

      final resp = await http.get(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      debugPrint('Response status: ${resp.statusCode}');
      if (resp.statusCode == 200) {
        final responseBody = resp.body;
        debugPrint('Response body length: ${responseBody.length} characters');
        if (responseBody.isNotEmpty) {
          try {
            final List<dynamic> data = json.decode(responseBody);
            debugPrint('Parsed JSON data with ${data.length} items');

            final deliveries = <Delivery>[];
            for (var i = 0; i < data.length; i++) {
              try {
                final delivery = Delivery.fromJson(data[i]);
                deliveries.add(delivery);
              } catch (e) {
                debugPrint('Error parsing delivery at index $i: $e');
                debugPrint('Problematic data: ${data[i]}');
              }
            }

            debugPrint(
                'Successfully parsed ${deliveries.length} out of ${data.length} deliveries');
            return deliveries;
          } catch (e) {
            debugPrint('Error decoding JSON response: $e');
            return [];
          }
        } else {
          debugPrint('Empty response body');
          return [];
        }
      } else {
        debugPrint(
            'Error getting driver deliveries: ${resp.statusCode} - ${resp.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Error getting driver deliveries: $e');
      return [];
    }
  }

  /// Get detailed information about a specific delivery
  ///
  /// [deliveryId] ID of the delivery to get complete details for
  /// Returns detailed delivery response or null if failed
  Future<DeliveryDetailResponse?> getDeliveryDetail(int deliveryId) async {
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

    debugPrint(
        'Attempting to get detail for delivery ID: $deliveryId (Driver ID: $driverId)');

    try {
      // Đúng endpoint: http://localhost:8080/api/driver/:driverId/deliveries/:deliveryId
      // apiBaseUrl đã chứa '/api' nên không thêm nữa
      final url = '${_env.endpointBase}api/driver/$driverId/deliveries/$deliveryId';
      debugPrint('Requesting delivery details from: $url');

      final resp = await http.get(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      debugPrint('Response status: ${resp.statusCode}');
      if (resp.statusCode == 200) {
        final data = json.decode(resp.body);
        debugPrint('Successfully parsed response data');
        return DeliveryDetailResponse.fromJson(data);
      } else {
        debugPrint(
            'Error getting delivery detail: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting delivery detail: $e');
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
      final url =
          '${_env.endpointBase}api/driver/$driverId/deliveries/$deliveryId/route';
      debugPrint('Requesting route data from: $url');

      final resp = await http.get(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token'
        },
      );

      if (resp.statusCode == 200) {
        return json.decode(resp.body);
      } else {
        debugPrint(
            'Error getting delivery route: ${resp.statusCode} - ${resp.body}');
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
      int deliveryId, DeliveryStatusUpdate statusUpdate) async {
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
      final url =
          '${_env.endpointBase}api/driver/$driverId/deliveries/$deliveryId/status';
      debugPrint('Updating delivery status at: $url');

      final resp = await http.patch(Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token'
          },
          body: json.encode(statusUpdate.toJson()));

      if (resp.statusCode == 200) {
        debugPrint('Delivery status updated successfully');
        final data = json.decode(resp.body);
        return Delivery.fromJson(data);
      } else {
        debugPrint(
            'Error updating delivery status: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error updating delivery status: $e');
      return null;
    }
  }
}

final deliveryServices = DeliveryServices();
