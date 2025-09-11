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

// Mapping statusId cho đơn hàng
class OrderStatusId {
  static const int PENDING = 1;
  static const int PROCESSING = 2;
  static const int IN_TRANSIT = 3;
  static const int DELIVERED = 4;
  static const int CANCELLED = 5;
  static const int RETURNED = 6;
  
  // Chuyển đổi từ tên trạng thái sang id
  static int fromStatusName(String statusName) {
    switch (statusName.toUpperCase()) {
      case 'PENDING':
        return PENDING;
      case 'PROCESSING':
        return PROCESSING;
      case 'IN_TRANSIT':
      case 'IN PROGRESS':
        return IN_TRANSIT;
      case 'DELIVERED':
      case 'COMPLETED':
        return DELIVERED;
      case 'CANCELLED':
        return CANCELLED;
      case 'RETURNED':
        return RETURNED;
      default:
        return PENDING;
    }
  }
}
