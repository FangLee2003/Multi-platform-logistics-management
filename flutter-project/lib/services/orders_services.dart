import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:ktc_logistics_driver/data/env/environment.dart';
import 'package:ktc_logistics_driver/data/local_secure/secure_storage.dart';
import 'package:ktc_logistics_driver/data/network/http_client.dart';
import 'package:ktc_logistics_driver/domain/models/order/product_cart.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_details_response.dart';
import 'package:ktc_logistics_driver/domain/models/order/orders_by_status_response.dart';
import 'package:ktc_logistics_driver/domain/models/order/orders_client_response.dart';
import 'package:ktc_logistics_driver/domain/models/common/response_default.dart';
import 'package:ktc_logistics_driver/domain/models/order/order.dart';


/// OrdersServices - Handles all API operations related to orders
class OrdersServices {
  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();
  late final HttpClient _httpClient;

  // Constructor
  OrdersServices() {
    _httpClient = HttpClient(baseUrl: _env.apiBaseUrl, secureStorage: secureStorage);
  }

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
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/orders'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        final List<dynamic> data = json.decode(resp.body);
        return data.map((item) => OrdersResponse.fromJson(item)).toList();
      } else {
        debugPrint('Error getting driver orders: ${resp.statusCode} - ${resp.body}');
        // Fallback to old API format
        return await getOrdersByStatus("all");
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
    final token = await secureStorage.readToken();
    if (token == null) {
      debugPrint('Token not found - cannot get order details');
      return null;
    }
    
    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/orders/$orderId'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      );

      if (resp.statusCode == 200) {
        final orderData = json.decode(resp.body);
        return OrderDetailsResponse.fromJson(orderData);
      } else {
        debugPrint('Error getting order detail: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error getting order detail: $e');
      return null;
    }
  }

  /// Update the status of an order
  /// 
  /// [orderId] The ID of the order to update
  /// [statusId] The new status ID (e.g., 1: Pending, 2: Processing, 3: In Delivery, 4: Delivered)
  /// [notes] Optional notes about the status update
  /// 
  /// Returns [ResponseDefault] object with success/failure information
  Future<ResponseDefault> updateDriverOrderStatus(
    int orderId, 
    int statusId, 
    String notes
  ) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      return ResponseDefault(
        resp: false,
        msg: 'Driver ID not found'
      );
    }
    
    final token = await secureStorage.readToken();
    if (token == null) {
      return ResponseDefault(
        resp: false, 
        msg: 'Token not found'
      );
    }
    
    try {
      final data = {
        "statusId": statusId,
        "notes": notes
      };

      final resp = await http.patch(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/orders/$orderId/status'),
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer $token'
        },
        body: json.encode(data)
      );

      if (resp.statusCode == 200) {
        return ResponseDefault.fromJson(json.decode(resp.body));
      } else {
        return ResponseDefault(
          resp: false, 
          msg: 'Error updating order status: ${resp.statusCode}'
        );
      }
    } catch (e) {
      return ResponseDefault(
        resp: false, 
        msg: e.toString()
      );
    }
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

  // LEGACY METHODS - Kept for backwards compatibility

  /// Add a new order to the system
  /// @deprecated Use newer API endpoints instead
  @Deprecated('Use newer API endpoints instead')
  Future<ResponseDefault> addNewOrders(int uidAddress, double total, String typePayment, List<ProductCart> products) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return ResponseDefault(resp: false, msg: 'Token not found');
    }

    Map<String, dynamic> data = {
      "uidAddress"  : uidAddress,
      "typePayment": typePayment,
      "total"       : total,
      "products"    : products 
    };

    try {
      final resp = await http.post(
        Uri.parse('${_env.endpointApi}/add-new-orders'),
        headers: {'Content-type' : 'application/json', 'xx-token' : token},
        body: json.encode(data)
      );

      return ResponseDefault.fromJson(jsonDecode(resp.body));
    } catch (e) {
      return ResponseDefault(resp: false, msg: e.toString());
    }
  }

  /// Get orders filtered by status
  /// @deprecated Use getDriverOrdersList instead
  @Deprecated('Use getDriverOrdersList instead')
  Future<List<OrdersResponse>> getOrdersByStatus(String status) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return [];
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.endpointApi}/get-orders-by-status/$status'),
        headers: {'Accept' : 'application/json', 'xx-token' : token},
      );
      
      return OrdersByStatusResponse.fromJson(jsonDecode(resp.body)).ordersResponse;
    } catch (e) {
      debugPrint('Error getting orders by status: $e');
      return [];
    }
  }

  /// Get order details by order ID
  /// @deprecated Use getDriverOrderDetail instead
  @Deprecated('Use getDriverOrderDetail instead')
  Future<List<DetailsOrder>> gerOrderDetailsById(String idOrder) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return [];
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.endpointApi}/get-details-order-by-id/$idOrder'),
        headers: {'Accept' : 'application/json', 'xx-token' : token},
      );
      
      return OrderDetailsResponse.fromJson(jsonDecode(resp.body)).detailsOrder;
    } catch (e) {
      debugPrint('Error getting order details: $e');
      return [];
    }
  }

  /// Update order status to dispatched
  /// @deprecated Use updateDriverOrderStatus instead
  @Deprecated('Use updateDriverOrderStatus instead')
  Future<ResponseDefault> updateStatusOrderToDispatched(String idOrder, String idDelivery) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return ResponseDefault(resp: false, msg: 'Token not found');
    }

    try {
      final resp = await http.put(
        Uri.parse('${_env.endpointApi}/update-status-order-dispatched'),
        headers: { 'Accept' : 'application/json', 'xx-token' : token },
        body: {
          'idDelivery' : idDelivery,
          'idOrder' : idOrder
        }
      );

      return ResponseDefault.fromJson(jsonDecode(resp.body));
    } catch (e) {
      return ResponseDefault(resp: false, msg: e.toString());
    }
  }


  /// Update order status to "on way"
  /// @deprecated Use updateDriverOrderStatus instead
  @Deprecated('Use updateDriverOrderStatus instead')
  Future<ResponseDefault> updateOrderStatusOnWay(String idOrder, String latitude, String longitude) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return ResponseDefault(resp: false, msg: 'Token not found');
    }

    try {
      final resp = await http.put(
        Uri.parse('${_env.endpointApi}/update-status-order-on-way/$idOrder'),
        headers: { 'Accept' : 'application/json', 'xx-token' : token },
        body: {
          'latitude' : latitude,
          'longitude' : longitude
        }
      );

      return ResponseDefault.fromJson(jsonDecode(resp.body));
    } catch (e) {
      return ResponseDefault(resp: false, msg: e.toString());
    }
  }
  
  /// Update order status to delivered
  /// @deprecated Use updateDriverOrderStatus instead
  @Deprecated('Use updateDriverOrderStatus instead')
  Future<ResponseDefault> updateOrderStatusDelivered(String idOrder) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return ResponseDefault(resp: false, msg: 'Token not found');
    }

    try {
      final resp = await http.put(
        Uri.parse('${_env.endpointApi}/update-status-order-delivered/$idOrder'),
        headers: { 'Accept' : 'application/json', 'xx-token' : token },
      );
      
      return ResponseDefault.fromJson(jsonDecode(resp.body));
    } catch (e) {
      return ResponseDefault(resp: false, msg: e.toString());
    }
  }
  
  /// Get list of orders for client
  /// @deprecated Use newer API endpoints instead
  @Deprecated('Use newer API endpoints instead')
  Future<List<OrdersClient>> getListOrdersForClient() async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return [];
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.endpointApi}/get-list-orders-for-client'),
        headers: {'Accept' : 'application/json', 'xx-token' : token}
      );
      
      return OrdersClientResponse.fromJson(jsonDecode(resp.body)).ordersClient;
    } catch (e) {
      debugPrint('Error getting client orders: $e');
      return [];
    }
  }

  // DEPRECATED METHODS - These should not be used in new code

  /// Get driver orders by driver ID
  /// @deprecated Use getDriverOrdersList instead which doesn't require driverId parameter
  @Deprecated('Use getDriverOrdersList instead')
  Future<List<dynamic>> getDriverOrders(int driverId) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return [];
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/orders'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
      );

      if (resp.statusCode == 200) {
        final List<dynamic> data = json.decode(resp.body);
        return data;
      } else {
        debugPrint('Error: ${resp.statusCode} - ${resp.body}');
        return [];
      }
    } catch (e) {
      debugPrint('Exception: $e');
      return [];
    }
  }

  /// Get order detail by order ID
  /// @deprecated Use getDriverOrderDetail instead
  @Deprecated('Use getDriverOrderDetail instead')
  Future<Map<String, dynamic>?> getOrderDetail(int orderId) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return null;
    }

    try {
      final resp = await http.get(
        Uri.parse('${_env.apiBaseUrl}/api/driver/orders/$orderId'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'}
      );

      if (resp.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(resp.body);
        return data;
      } else {
        debugPrint('Error: ${resp.statusCode} - ${resp.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Exception: $e');
      return null;
    }
  }

  /// Update order status
  /// @deprecated Use updateDriverOrderStatus instead
  @Deprecated('Use updateDriverOrderStatus instead')
  Future<bool> updateOrderStatus(int orderId, int statusId) async {
    final token = await secureStorage.readToken();
    if (token == null) {
      return false;
    }

    try {
      final driverId = await _getDriverId();
      if (driverId == null) {
        debugPrint('Driver ID not found - cannot update order status');
        return false;
      }
      
      // Use the new API structure with statusId
      final data = {
        "statusId": statusId,
        "notes": "Status updated via app"
      };
      
      final resp = await http.patch(
        Uri.parse('${_env.apiBaseUrl}/api/driver/$driverId/orders/$orderId/status'),
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer $token'
        },
        body: json.encode(data)
      );

      return resp.statusCode == 200;
    } catch (e) {
      debugPrint('Exception: $e');
      return false;
    }
  }
}

/// Singleton instance for app-wide use
final ordersServices = OrdersServices();

