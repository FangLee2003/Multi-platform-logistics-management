import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import '../../../domain/models/delivery/delivery.dart';
import '../../../domain/models/order/order.dart';
import '../../../domain/models/delivery/delivery_status_update.dart';
import '../../../domain/models/driver/driver_profile.dart';
import '../../../domain/models/analytics/driver_analytics.dart';
import '../../../services/driver_services.dart';

part 'driver_event.dart';
part 'driver_state.dart';

/// Bloc để quản lý các tương tác liên quan đến tài xế
class DriverBloc extends Bloc<DriverEvent, DriverState> {
  final DriverServices _driverServices;

  DriverBloc({required DriverServices driverServices})
      : _driverServices = driverServices,
        super(DriverInitial()) {
    on<LoadDeliveriesEvent>(_onLoadDeliveries);
    on<LoadDeliveryDetailsEvent>(_onLoadDeliveryDetails);
    on<LoadOrderDetailsEvent>(_onLoadOrderDetails);
    on<UpdateDeliveryStatusEvent>(_onUpdateDeliveryStatus);
    on<LoadDriverProfileEvent>(_onLoadDriverProfile);
    on<LoadDriverAnalyticsEvent>(_onLoadDriverAnalytics);
    on<UpdateDriverProfileEvent>(_onUpdateDriverProfile);
  }

  Future<void> _onLoadDeliveries(
      LoadDeliveriesEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final deliveries = await _driverServices.getDriverDeliveries(
        status: event.status,
        sortBy: event.sortBy,
        sortDirection: event.sortDirection,
      );
      emit(DeliveriesLoadedState(deliveries));
    } catch (e) {
      emit(DriverError('Không thể tải danh sách giao hàng: ${e.toString()}'));
    }
  }

  Future<void> _onLoadDeliveryDetails(
      LoadDeliveryDetailsEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final delivery = await _driverServices.getDeliveryById(event.deliveryId);
      emit(DeliveryDetailsLoadedState(delivery));
    } catch (e) {
      emit(DriverError('Không thể tải chi tiết giao hàng: ${e.toString()}'));
    }
  }

  Future<void> _onLoadOrderDetails(
      LoadOrderDetailsEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final order = await _driverServices.getOrderForDelivery(event.deliveryId);
      emit(OrderDetailsLoadedState(order));
    } catch (e) {
      emit(DriverError('Không thể tải chi tiết đơn hàng: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateDeliveryStatus(
      UpdateDeliveryStatusEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final updatedDelivery = await _driverServices.updateDeliveryStatus(
        event.deliveryId,
        event.statusUpdate,
      );
      emit(DeliveryStatusUpdatedState(updatedDelivery));
    } catch (e) {
      emit(DriverError('Không thể cập nhật trạng thái: ${e.toString()}'));
    }
  }

  Future<void> _onLoadDriverProfile(
      LoadDriverProfileEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final profile = await _driverServices.getDriverProfile();
      emit(DriverProfileLoadedState(profile));
    } catch (e) {
      emit(DriverError('Không thể tải thông tin tài xế: ${e.toString()}'));
    }
  }

  Future<void> _onLoadDriverAnalytics(
      LoadDriverAnalyticsEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final analytics = await _driverServices.getDriverAnalytics(
        startDate: event.startDate,
        endDate: event.endDate,
      );
      emit(DriverAnalyticsLoadedState(analytics));
    } catch (e) {
      emit(DriverError('Không thể tải thông tin phân tích: ${e.toString()}'));
    }
  }

  Future<void> _onUpdateDriverProfile(
      UpdateDriverProfileEvent event, Emitter<DriverState> emit) async {
    emit(DriverLoading());
    try {
      final updatedProfile = await _driverServices.updateDriverProfile(event.profile);
      emit(DriverProfileLoadedState(updatedProfile));
    } catch (e) {
      emit(DriverError('Không thể cập nhật thông tin tài xế: ${e.toString()}'));
    }
  }
}
