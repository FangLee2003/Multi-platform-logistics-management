part of 'driver_bloc.dart';

@immutable
abstract class DriverState {}

class DriverInitial extends DriverState {}

class DriverLoading extends DriverState {}

class DriverError extends DriverState {
  final String message;

  DriverError(this.message);
}

// Delivery related states
class DeliveriesLoadedState extends DriverState {
  final List<Delivery> deliveries;

  DeliveriesLoadedState(this.deliveries);
}

class DeliveryDetailsLoadedState extends DriverState {
  final Delivery delivery;

  DeliveryDetailsLoadedState(this.delivery);
}

class DeliveryStatusUpdatedState extends DriverState {
  final Delivery delivery;

  DeliveryStatusUpdatedState(this.delivery);
}

// Order related states
class OrderDetailsLoadedState extends DriverState {
  final Order order;

  OrderDetailsLoadedState(this.order);
}

// Driver related states
class DriverProfileLoadedState extends DriverState {
  final DriverProfile profile;

  DriverProfileLoadedState(this.profile);
}

class DriverAnalyticsLoadedState extends DriverState {
  final DriverAnalytics analytics;

  DriverAnalyticsLoadedState(this.analytics);
}
