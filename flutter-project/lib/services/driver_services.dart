import 'dart:convert';
import 'package:http/http.dart' as http;
import '../data/env/environment.dart';
import '../data/local_secure/secure_storage.dart';
import '../data/network/http_client.dart';
import '../domain/models/driver/driver_profile.dart';
import '../domain/models/delivery/delivery.dart';
import '../domain/models/order/order.dart';
import '../domain/models/analytics/driver_analytics.dart';
import '../domain/models/delivery/delivery_status_update.dart';
import '../domain/models/tracking/driver_location.dart';

class DriverServices {
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();
  late final HttpClient _httpClient;
  
  String get baseUrl => _env.apiBaseUrl;
  
  DriverServices() {
    _httpClient = HttpClient(baseUrl: baseUrl, secureStorage: secureStorage);
  }

  /// Get driver ID from secure storage
  Future<int?> _getDriverId() async {
    final driverId = await secureStorage.readDriverId();
    if (driverId == null) {
      return null;
    }
    return int.parse(driverId);
  }

  // Lấy danh sách các đơn giao hàng của tài xế - API mới
  Future<List<Delivery>> getDriverDeliveries({
    String? status,
    String? sortBy,
    String? sortDirection,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    // Add query parameters if provided
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (sortBy != null) queryParams['sortBy'] = sortBy;
    if (sortDirection != null) queryParams['sortDirection'] = sortDirection;
    
    try {
      final data = await _httpClient.get<List<dynamic>>(
        '/drivers/$driverId/deliveries',
        queryParams: queryParams,
      );
      return Delivery.fromJsonList(data);
    } catch (e) {
      // Fallback to old API if new API fails
      return _getDriverDeliveriesLegacy();
    }
  }
  
  // Phương thức legacy để tương thích với API cũ
  Future<List<Delivery>> _getDriverDeliveriesLegacy() async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      throw Exception('Token or driverId not found');
    }
    
    final resp = await http.get(
      Uri.parse('$baseUrl/driver/$driverId/deliveries'),
      headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
    );
    
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      if (data is List) {
        return Delivery.fromJsonList(data);
      } else if (data is Map && data.containsKey('data') && data['data'] is List) {
        return Delivery.fromJsonList(data['data']);
      }
    }
    
    throw Exception('Failed to load deliveries: ${resp.statusCode}');
  }

  // Lấy thông tin chi tiết về đơn giao hàng - API mới
  Future<Delivery> getDeliveryById(int deliveryId) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      final data = await _httpClient.get<Map<String, dynamic>>(
        '/drivers/$driverId/deliveries/$deliveryId',
      );
      return Delivery.fromJson(data);
    } catch (e) {
      // Fallback to old API if new API fails
      return _getDeliveryDetailLegacy(deliveryId.toString());
    }
  }
  
  // Phương thức legacy để tương thích với API cũ
  Future<Delivery> _getDeliveryDetailLegacy(String deliveryId) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      throw Exception('Token or driverId not found');
    }
    
    final resp = await http.get(
      Uri.parse('$baseUrl/driver/$driverId/deliveries/$deliveryId'),
      headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
    );
    
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      if (data is Map<String, dynamic>) {
        return Delivery.fromJson(data);
      } else if (data is Map && data.containsKey('data')) {
        return Delivery.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to load delivery detail: ${resp.statusCode}');
  }

  // Get order details for a delivery - API mới
  Future<Order> getOrderForDelivery(int deliveryId) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      final data = await _httpClient.get<Map<String, dynamic>>(
        '/drivers/$driverId/deliveries/$deliveryId/order',
      );
      return Order.fromJson(data);
    } catch (e) {
      // Fallback to old API if new API fails
      return _getOrderDetailLegacy(deliveryId.toString());
    }
  }
  
  // Phương thức legacy để tương thích với API cũ
  Future<Order> _getOrderDetailLegacy(String orderId) async {
    final token = await secureStorage.readToken();
    
    if (token == null) {
      throw Exception('Token not found');
    }
    
    final resp = await http.get(
      Uri.parse('$baseUrl/driver/orders/$orderId'),
      headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
    );
    
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      if (data is Map<String, dynamic>) {
        return Order.fromJson(data);
      } else if (data is Map && data.containsKey('data')) {
        return Order.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to load order detail: ${resp.statusCode}');
  }

  // Update delivery status - API mới
  Future<Delivery> updateDeliveryStatus(
    int deliveryId,
    DeliveryStatusUpdate statusUpdate,
  ) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      final data = await _httpClient.put<Map<String, dynamic>>(
        '/drivers/$driverId/deliveries/$deliveryId/status',
        body: statusUpdate.toJson(),
      );
      return Delivery.fromJson(data);
    } catch (e) {
      // Fallback to old API
      throw Exception('Error updating delivery status: $e');
    }
  }

  // Update driver location - API mới
  Future<bool> updateDriverLocation(DriverLocation location) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    // Sử dụng endpoint tracking location thay vì PATCH /api/driver/location
    final requestBody = {
      'driverId': driverId,
      'latitude': location.latitude,
      'longitude': location.longitude,
      'timestamp': location.timestamp,
      'speed': location.speed,
      'heading': location.heading,
      'vehicleStatus': location.vehicleStatus,
    };
    
    try {
      return await _httpClient.post<bool>(
        '/tracking/location',
        body: requestBody,
      );
    } catch (e) {
      // Fallback to old API
      return _updateDriverLocationLegacy(location);
    }
  }
  
  // Phương thức legacy để tương thích với API cũ
  Future<bool> _updateDriverLocationLegacy(DriverLocation location) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      return false;
    }
    
    final data = {
      'driverId': driverId,
      'latitude': location.latitude,
      'longitude': location.longitude,
      'timestamp': location.timestamp
    };
    
    try {
      final resp = await http.post(
        Uri.parse('$baseUrl/tracking/update'),
        headers: {
          'Accept': 'application/json', 
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
        body: json.encode(data)
      );
      
      return resp.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Get driver analytics - API mới
  Future<DriverAnalytics> getDriverAnalytics({
    String? startDate,
    String? endDate,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    // Add query parameters if provided
    final queryParams = <String, String>{};
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;
    
    try {
      final data = await _httpClient.get<Map<String, dynamic>>(
        '/drivers/$driverId/analytics',
        queryParams: queryParams,
      );
      return DriverAnalytics.fromJson(data);
    } catch (e) {
      // Fallback to old API
      return _getDriverAnalyticsLegacy();
    }
  }
  
  // Phương thức legacy để tương thích với API cũ
  Future<DriverAnalytics> _getDriverAnalyticsLegacy() async {
    final token = await secureStorage.readToken();
    
    if (token == null) {
      throw Exception('Token not found');
    }
    
    final resp = await http.get(
      Uri.parse('$baseUrl/dashboard/driver-analytics'),
      headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
    );
    
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      if (data is Map<String, dynamic>) {
        return DriverAnalytics.fromJson(data);
      } else if (data is Map && data.containsKey('data')) {
        return DriverAnalytics.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to load driver analytics: ${resp.statusCode}');
  }

  // Get driver profile - API mới
  Future<DriverProfile> getDriverProfile() async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      final data = await _httpClient.get<Map<String, dynamic>>(
        '/drivers/$driverId',
      );
      return DriverProfile.fromJson(data);
    } catch (e) {
      // Fallback to old API if new API fails
      throw Exception('Error getting driver profile: $e');
    }
  }

  // Update driver profile - API mới
  Future<DriverProfile> updateDriverProfile(DriverProfile profile) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      final data = await _httpClient.put<Map<String, dynamic>>(
        '/drivers/$driverId',
        body: profile.toJson(),
      );
      return DriverProfile.fromJson(data);
    } catch (e) {
      throw Exception('Error updating driver profile: $e');
    }
  }

  // Upload driver document/image - API mới
  Future<String> uploadDriverDocument(String filePath, String documentType) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }
    
    try {
      return await _httpClient.uploadFile(
        '/drivers/$driverId/documents',
        filePath,
        fields: {'documentType': documentType},
      );
    } catch (e) {
      throw Exception('Error uploading document: $e');
    }
  }
  
  // Cập nhật trạng thái đơn hàng
  Future<Map<String, dynamic>> updateOrderStatus(String orderId, int statusId, String notes) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      return {'success': false, 'message': 'Không tìm thấy token hoặc driverId'};
    }
    
    final data = {
      'statusId': statusId,
      'notes': notes
    };
    
    final resp = await http.patch(
      Uri.parse('$baseUrl/driver/$driverId/orders/$orderId/status'),
      headers: {
        'Accept': 'application/json', 
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json'
      },
      body: json.encode(data)
    );
    
    return json.decode(resp.body);
  }

  // Lấy thông tin lộ trình cho đơn giao hàng
  Future<Map<String, dynamic>> getDeliveryRoute(String deliveryId) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      return {'success': false, 'message': 'Không tìm thấy token hoặc driverId'};
    }
    
    final resp = await http.get(
      Uri.parse('$baseUrl/driver/$driverId/deliveries/$deliveryId/route'),
      headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
    );
    
    return json.decode(resp.body);
  }

  // Cập nhật vị trí giao hàng và trạng thái
  Future<Map<String, dynamic>> updateDeliveryTracking(
    String deliveryId, 
    double latitude, 
    double longitude, 
    String location,
    int statusId,
    String notes,
    int vehicleId
  ) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();
    
    if (token == null || driverId == null) {
      return {'success': false, 'message': 'Không tìm thấy token hoặc driverId'};
    }
    
    final data = {
      'latitude': latitude,
      'longitude': longitude,
      'location': location,
      'statusId': statusId,
      'notes': notes,
      'vehicleId': vehicleId
    };
    
    final resp = await http.post(
      Uri.parse('$baseUrl/driver/$driverId/deliveries/$deliveryId/tracking'),
      headers: {
        'Accept': 'application/json', 
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json'
      },
      body: json.encode(data)
    );
    
    return json.decode(resp.body);
  }

  // Cập nhật trạng thái tài xế
  Future<Map<String, dynamic>> updateDriverStatus(int statusId) async {
    final token = await secureStorage.readToken();
    
    if (token == null) {
      return {'success': false, 'message': 'Không tìm thấy token'};
    }
    
    final data = {
      'statusId': statusId
    };
    
    final resp = await http.patch(
      Uri.parse('$baseUrl/driver/status'),
      headers: {
        'Accept': 'application/json', 
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json'
      },
      body: json.encode(data)
    );
    
    return json.decode(resp.body);
  }
}
