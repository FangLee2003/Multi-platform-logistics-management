part of 'driver_bloc.dart';

@immutable
abstract class DriverEvent {}

class LoadDeliveriesEvent extends DriverEvent {
  final String? status;
  final String? sortBy;
  final String? sortDirection;

  LoadDeliveriesEvent({this.status, this.sortBy, this.sortDirection});
}

class LoadDeliveryDetailsEvent extends DriverEvent {
  final int deliveryId;

  LoadDeliveryDetailsEvent(this.deliveryId);
}

class LoadOrderDetailsEvent extends DriverEvent {
  final int deliveryId;

  LoadOrderDetailsEvent(this.deliveryId);
}

class UpdateDeliveryStatusEvent extends DriverEvent {
  final int deliveryId;
  final DeliveryStatusUpdate statusUpdate;

  UpdateDeliveryStatusEvent(this.deliveryId, this.statusUpdate);
}

class LoadDriverProfileEvent extends DriverEvent {}

class LoadDriverAnalyticsEvent extends DriverEvent {
  final String? startDate;
  final String? endDate;

  LoadDriverAnalyticsEvent({this.startDate, this.endDate});
}

class UpdateDriverProfileEvent extends DriverEvent {
  final DriverProfile profile;

  UpdateDriverProfileEvent(this.profile);
}
