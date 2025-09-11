// delivery.dart
// Models cho thông tin giao hàng và tài xế

import 'dart:convert';

// Model cho tài xế giao hàng (đổi tên từ Delivery cũ thành DeliveryPerson)
class DeliveryPerson {
  final int personId;             // ID tài xế
  final String nameDelivery;      // Tên tài xế
  final String phone;             // Số điện thoại
  final String image;             // URL ảnh đại diện
  final String notificationToken; // Token cho notification

  // Constructor với các tham số bắt buộc
  DeliveryPerson({
    required this.personId,
    required this.nameDelivery,
    required this.phone,
    required this.image,
    required this.notificationToken,
  });

  // Factory constructor để parse JSON thành object
  factory DeliveryPerson.fromJson(Map<String, dynamic> json) {
    return DeliveryPerson(
      personId: json['personId'] ?? 0,
      nameDelivery: json['nameDelivery'] ?? '',
      phone: json['phone'] ?? '',
      image: json['image'] ?? '',
      notificationToken: json['notificationToken'] ?? '',
    );
  }

  // Convert object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'personId': personId,
      'nameDelivery': nameDelivery,
      'phone': phone,
      'image': image,
      'notificationToken': notificationToken,
    };
  }
}

// Model mới cho thông tin đơn giao hàng theo API
class Delivery {
  final int id;
  final int orderId;
  final double deliveryFee;
  final String transportMode;
  final String serviceType;
  final String? pickupDate;
  final String? scheduleDeliveryTime;
  final String? actualDeliveryTime;
  final int lateDeliveryRisk;
  final int deliveryAttempts;
  final String? deliveryNotes;
  final String orderDate;
  final int vehicleId;
  final int? driverId;
  final int? routeId;
  final String? status;
  final String statusDisplay;
  final Map<String, dynamic>? order;
  final Map<String, dynamic>? vehicle;
  final Map<String, dynamic>? driver;
  final Map<String, dynamic>? route;

  Delivery({
    required this.id,
    required this.orderId,
    required this.deliveryFee,
    required this.transportMode,
    required this.serviceType,
    this.pickupDate,
    this.scheduleDeliveryTime,
    this.actualDeliveryTime,
    required this.lateDeliveryRisk,
    required this.deliveryAttempts,
    this.deliveryNotes,
    required this.orderDate,
    required this.vehicleId,
    this.driverId,
    this.routeId,
    this.status,
    required this.statusDisplay,
    this.order,
    this.vehicle,
    this.driver,
    this.route,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'],
      orderId: json['orderId'],
      deliveryFee: json['deliveryFee'].toDouble(),
      transportMode: json['transportMode'] ?? '',
      serviceType: json['serviceType'] ?? '',
      pickupDate: json['pickupDate'],
      scheduleDeliveryTime: json['scheduleDeliveryTime'],
      actualDeliveryTime: json['actualDeliveryTime'],
      lateDeliveryRisk: json['lateDeliveryRisk'],
      deliveryAttempts: json['deliveryAttempts'],
      deliveryNotes: json['deliveryNotes'],
      orderDate: json['orderDate'],
      vehicleId: json['vehicleId'],
      driverId: json['driverId'],
      routeId: json['routeId'],
      status: json['deliveryStatus'],
      statusDisplay: json['statusDisplay'] ?? 'Unknown',
      order: json['order'],
      vehicle: json['vehicle'],
      driver: json['driver'],
      route: json['route'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'deliveryFee': deliveryFee,
      'transportMode': transportMode,
      'serviceType': serviceType,
      'pickupDate': pickupDate,
      'scheduleDeliveryTime': scheduleDeliveryTime,
      'actualDeliveryTime': actualDeliveryTime,
      'lateDeliveryRisk': lateDeliveryRisk,
      'deliveryAttempts': deliveryAttempts,
      'deliveryNotes': deliveryNotes,
      'orderDate': orderDate,
      'vehicleId': vehicleId,
      'driverId': driverId,
      'routeId': routeId,
      'status': status,
      'statusDisplay': statusDisplay,
      'order': order,
      'vehicle': vehicle,
      'driver': driver,
      'route': route,
    };
  }

  static List<Delivery> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((item) => Delivery.fromJson(item)).toList();
  }
}
