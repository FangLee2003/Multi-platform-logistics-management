// Dependency Injection setup
// Thiết lập injection đơn giản hơn cho toàn bộ app theo mẫu project tham khảo

import 'package:get_it/get_it.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

// Environment
import '../data/env/environment.dart';

// Services (theo mẫu project tham khảo)
import '../services/socket_service.dart';
import '../services/mapbox_services.dart';
import '../services/push_notification_services.dart';
import '../services/auth_services.dart';
import '../services/user_services.dart';
import '../services/delivery_services.dart';
import '../services/driver_services.dart';
import '../services/orders_services.dart';

// Blocs
import '../presentation/blocs/driver/driver_bloc.dart';
import '../presentation/blocs/delivery/delivery_bloc.dart';
import '../presentation/blocs/orders/orders_bloc.dart';

// Get_It singleton instance
final GetIt getIt = GetIt.instance;

// Thiết lập dependency injection
Future<void> setupDependencyInjection() async {
  // Reset any existing registrations
  await getIt.reset();

  print('🔧 Setting up Dependency Injection...');

  // Environment
  getIt.registerLazySingleton<Environment>(
    () => Environment.getInstance(),
  );

  // External Dependencies
  getIt.registerLazySingleton<FlutterSecureStorage>(
    () => const FlutterSecureStorage(),
  );
  
  getIt.registerLazySingleton<http.Client>(
    () => http.Client(),
  );

  // Core Services (theo mẫu project tham khảo)
  getIt.registerLazySingleton<PushNotificationService>(
    () => PushNotificationService(),
  );

  getIt.registerLazySingleton<SocketService>(
    () => SocketService(),
  );

  getIt.registerLazySingleton<MapBoxServices>(
    () => MapBoxServices(),
  );

  // Domain Services (sử dụng Firebase trực tiếp theo mẫu project tham khảo)
  getIt.registerLazySingleton<AuthServices>(
    () => AuthServices(),
  );

  // Thay đổi cách đăng ký UserServices để tránh vòng lặp vô hạn
  getIt.registerLazySingleton<UserServices>(
    () => UserServices(),
  );
  
  // Đăng ký các services mới
  getIt.registerLazySingleton<DeliveryServices>(
    () => DeliveryServices(),
  );
  
  getIt.registerLazySingleton<DriverServices>(
    () => DriverServices(),
  );
  
  getIt.registerLazySingleton<OrdersServices>(
    () => OrdersServices(),
  );
  
  // Đăng ký các Blocs
  getIt.registerFactory<DriverBloc>(
    () => DriverBloc(driverServices: getIt<DriverServices>()),
  );
  
  getIt.registerFactory<DeliveryBloc>(
    () => DeliveryBloc(deliveryServices: getIt<DeliveryServices>()),
  );
  
  getIt.registerFactory<OrdersBloc>(
    () => OrdersBloc(ordersServices: getIt<OrdersServices>()),
  );

  print('✅ Dependency Injection setup completed');
}

// Service Getters
SocketService get socketService => getIt<SocketService>();
MapBoxServices get mapBoxServices => getIt<MapBoxServices>();
PushNotificationService get pushNotificationService => getIt<PushNotificationService>();
AuthServices get authServices => getIt<AuthServices>();
UserServices get userServices => getIt<UserServices>();
DeliveryServices get deliveryServices => getIt<DeliveryServices>();
DriverServices get driverServices => getIt<DriverServices>();
DriverBloc get driverBloc => getIt<DriverBloc>();
DeliveryBloc get deliveryBloc => getIt<DeliveryBloc>();
