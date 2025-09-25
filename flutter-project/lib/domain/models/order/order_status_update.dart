// order_status_update.dart
// Model cho cập nhật trạng thái đơn hàng

class OrderStatusUpdate {
  final int statusId;
  final String? notes;

  OrderStatusUpdate({
    required this.statusId,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'statusId': statusId,
    };

    if (notes != null) data['notes'] = notes;
    
    return data;
  }
  
  factory OrderStatusUpdate.fromJson(Map<String, dynamic> json) {
    return OrderStatusUpdate(
      statusId: json['statusId'],
      notes: json['notes'],
    );
  }
}

// Mapping statusId cho đơn hàng - updated for standardized 7-status system
class OrderStatusId {
  // New standardized status IDs
  static const int CREATED = 1;
  static const int CONFIRMED = 2;
  static const int ON_DELIVERY = 3;
  static const int DELIVERED_AWAIT = 4;
  static const int DELIVERED_PAID = 5;
  static const int CANCELLED = 6;
  static const int FAILED = 50;
  
  // Chuyển đổi từ tên trạng thái sang id
  static int fromStatusName(String statusName) {
    switch (statusName.toUpperCase()) {
      // Standardized statuses
      case 'CREATED':
        return CREATED;
      case 'CONFIRMED':
        return CONFIRMED;
      case 'ON_DELIVERY':
        return ON_DELIVERY;
      case 'DELIVERED_AWAIT':
        return DELIVERED_AWAIT;
      case 'DELIVERED_PAID':
        return DELIVERED_PAID;
      case 'CANCELLED':
        return CANCELLED;
      case 'FAILED':
        return FAILED;
      default:
        return CREATED; // Default to CREATED
    }
  }
}
