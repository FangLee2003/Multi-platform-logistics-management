import 'package:ktc_logistics_driver/data/services/driver_api_service.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_detail.dart';

class OrderDetailScreenController {
  final DriverApiService _apiService;
  
  OrderDetailScreenController(this._apiService);
  
  OrderDetail? orderDetail;
  bool isLoading = true;
  String? errorMessage;
  bool isOrderAccepted = false;
  
  // Load order details
  Future<void> loadOrderDetails(int orderId) async {
    try {
      isLoading = true;
      errorMessage = null;
      
      orderDetail = await _apiService.getOrderDetail(orderId);
      
      // Check if order is already accepted based on status
      isOrderAccepted = orderDetail?.status == 'In Progress' || 
                         orderDetail?.status == 'Completed';
      
    } catch (e) {
      errorMessage = 'Failed to load order details: $e';
    } finally {
      isLoading = false;
    }
  }
  
  // Accept order
  Future<bool> acceptOrder(int orderId) async {
    try {
      final result = await _apiService.updateOrderStatus(orderId, 'In Progress', null);
      if (result) {
        isOrderAccepted = true;
        await loadOrderDetails(orderId); // Reload details to reflect changes
      }
      return result;
    } catch (e) {
      errorMessage = 'Failed to accept order: $e';
      return false;
    }
  }
  
  // Mark order as delivered
  Future<bool> markOrderAsDelivered(int orderId, String? notes) async {
    try {
      final result = await _apiService.updateOrderStatus(orderId, 'Completed', notes);
      if (result) {
        await loadOrderDetails(orderId); // Reload details to reflect changes
      }
      return result;
    } catch (e) {
      errorMessage = 'Failed to mark order as delivered: $e';
      return false;
    }
  }
  
  // Get total order amount
  String getTotalAmount() {
    if (orderDetail == null) return '0 VND';
    
    double total = 0;
    for (var item in orderDetail!.orderItems) {
      total += item.shippingFee;
    }
    
    return '${total.toStringAsFixed(0)} VND';
  }
  
  // Get customer phone number
  String getCustomerPhone() {
    if (orderDetail == null) return '';
    return orderDetail!.address.contactPhone;
  }
}
