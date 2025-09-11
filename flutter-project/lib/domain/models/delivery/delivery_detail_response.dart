// delivery_detail_response.dart
// DTO cho response chi tiết giao hàng từ API

class DeliveryDetailResponse {
  final int id;
  final String? deliveryCode;
  final String? status;
  final int? statusId;
  final String? scheduledTime;
  final String? actualDeliveryTime;
  final double deliveryFee;
  final String? notes;
  final String? pickupAddress;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String? routeName;
  final int? routeId;
  final String? estimatedDistance;
  final String? estimatedDuration;
  final DriverDetailDTO? driver;
  final VehicleDetailDTO? vehicle;
  final List<OrderDetailDTO> orders;
  final String? createdAt;
  final String? updatedAt;

  DeliveryDetailResponse({
    required this.id,
    this.deliveryCode,
    this.status,
    this.statusId,
    this.scheduledTime,
    this.actualDeliveryTime,
    required this.deliveryFee,
    this.notes,
    this.pickupAddress,
    this.pickupLatitude,
    this.pickupLongitude,
    this.routeName,
    this.routeId,
    this.estimatedDistance,
    this.estimatedDuration,
    this.driver,
    this.vehicle,
    required this.orders,
    this.createdAt,
    this.updatedAt,
  });

  factory DeliveryDetailResponse.fromJson(Map<String, dynamic> json) {
    // Hàm parse danh sách đơn hàng
    List<OrderDetailDTO> parseOrders(List<dynamic>? orderList) {
      if (orderList == null) return [];
      return orderList.map((item) => OrderDetailDTO.fromJson(item)).toList();
    }

    return DeliveryDetailResponse(
      id: json['id'] ?? 0,
      deliveryCode: json['deliveryCode'],
      status: json['status'],
      statusId: json['statusId'],
      scheduledTime: json['scheduledTime'],
      actualDeliveryTime: json['actualDeliveryTime'],
      deliveryFee: json['deliveryFee'] != null 
          ? (json['deliveryFee'] is int 
              ? (json['deliveryFee'] as int).toDouble() 
              : json['deliveryFee'] is String
                  ? double.tryParse(json['deliveryFee']) ?? 0.0
                  : json['deliveryFee']) 
          : 0.0,
      notes: json['notes'],
      pickupAddress: json['pickupAddress'],
      pickupLatitude: json['pickupLatitude'],
      pickupLongitude: json['pickupLongitude'],
      routeName: json['routeName'],
      routeId: json['routeId'],
      estimatedDistance: json['estimatedDistance'],
      estimatedDuration: json['estimatedDuration'],
      driver: json['driver'] != null ? DriverDetailDTO.fromJson(json['driver']) : null,
      vehicle: json['vehicle'] != null ? VehicleDetailDTO.fromJson(json['vehicle']) : null,
      orders: parseOrders(json['orders'] as List?),
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }
}

class DriverDetailDTO {
  final int id;
  final String? fullName;
  final String? email;
  final String? phone;
  final String? address;
  final bool? isActive;
  final String? notes;
  final int? roleId;
  final String? roleName;
  final String? roleDescription;
  final String? createdAt;
  final String? updatedAt;
  final String? displayName;
  final bool activeUser;

  DriverDetailDTO({
    required this.id,
    this.fullName,
    this.email,
    this.phone,
    this.address,
    this.isActive,
    this.notes,
    this.roleId,
    this.roleName,
    this.roleDescription,
    this.createdAt,
    this.updatedAt,
    this.displayName,
    required this.activeUser,
  });

  factory DriverDetailDTO.fromJson(Map<String, dynamic> json) {
    return DriverDetailDTO(
      id: json['id'] ?? 0,
      fullName: json['fullName'],
      email: json['email'],
      phone: json['phone'],
      address: json['address'],
      isActive: json['isActive'],
      notes: json['notes'],
      roleId: json['roleId'],
      roleName: json['roleName'],
      roleDescription: json['roleDescription'],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      displayName: json['displayName'],
      activeUser: json['activeUser'] ?? false,
    );
  }
}

class VehicleDetailDTO {
  final int id;
  final String? licensePlate;
  final String? vehicleType;
  final String? model;

  VehicleDetailDTO({
    required this.id,
    this.licensePlate,
    this.vehicleType,
    this.model,
  });

  factory VehicleDetailDTO.fromJson(Map<String, dynamic> json) {
    return VehicleDetailDTO(
      id: json['id'] ?? 0,
      licensePlate: json['licensePlate'],
      vehicleType: json['vehicleType'],
      model: json['model'],
    );
  }
}

class OrderDetailDTO {
  final int id;
  final String? orderCode;
  final String? status;
  final int? statusId;
  final String? deliveryAddress;
  final String? recipientName;
  final String? recipientPhone;
  final double? totalAmount;
  final String? createdAt;

  OrderDetailDTO({
    required this.id,
    this.orderCode,
    this.status,
    this.statusId,
    this.deliveryAddress,
    this.recipientName,
    this.recipientPhone,
    this.totalAmount,
    this.createdAt,
  });

  factory OrderDetailDTO.fromJson(Map<String, dynamic> json) {
    // Hàm parse totalAmount
    double parseTotalAmount() {
      var amount = json['totalAmount'];
      if (amount == null) return 0.0;
      if (amount is int) return amount.toDouble();
      if (amount is double) return amount;
      if (amount is String) return double.tryParse(amount) ?? 0.0;
      return 0.0;
    }

    return OrderDetailDTO(
      id: json['id'] ?? 0,
      orderCode: json['orderCode'],
      status: json['status'],
      statusId: json['statusId'],
      deliveryAddress: json['deliveryAddress'],
      recipientName: json['recipientName'],
      recipientPhone: json['recipientPhone'],
      totalAmount: parseTotalAmount(),
      createdAt: json['createdAt'],
    );
  }
}
