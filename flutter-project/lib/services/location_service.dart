import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import '../domain/models/tracking/driver_location.dart';
import 'driver_services.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  StreamSubscription<Position>? _positionStreamSubscription;
  Timer? _locationUpdateTimer;
  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();
  final DriverServices _driverServices = DriverServices();
  bool _isTracking = false;
  
  bool get isTracking => _isTracking;
  
  // Gửi vị trí tài xế đến server thông qua DriverServices
  Future<bool> _sendLocationToServer(double latitude, double longitude, double speed, double heading) async {
    try {
      final driverLocation = DriverLocation(
        latitude: latitude,
        longitude: longitude,
        timestamp: DateTime.now().toIso8601String(),
        speed: speed,
        heading: heading,
        vehicleStatus: 'active', // Giá trị mặc định, có thể cập nhật sau
      );
      
      // Sử dụng DriverServices để gửi vị trí
      final result = await _driverServices.updateDriverLocation(driverLocation);
      if (kDebugMode) {
        print('Sent location to server: Lat: $latitude, Long: $longitude, Result: $result');
      }
      return result;
    } catch (e) {
      debugPrint('Error sending location to server: $e');
      return false;
    }
  }

  Future<void> initialize() async {
    // Initialize notifications
    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    final DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    
    final InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _notificationsPlugin.initialize(initSettings);
  }

  Future<bool> _checkLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    // For background location on iOS
    if (Platform.isIOS) {
      await Permission.locationAlways.request();
    }

    return true;
  }

  // Start background location tracking
  Future<void> startBackgroundLocationService() async {
    if (!await _checkLocationPermission()) {
      debugPrint('Location permission not granted');
      return;
    }

    _isTracking = true;

    // Start foreground notification (required for Android background service)
    if (Platform.isAndroid) {
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'location_channel',
        'Location Updates',
        channelDescription: 'Used for tracking driver location',
        importance: Importance.low,
        priority: Priority.low,
        ongoing: true,
      );
      
      const NotificationDetails notificationDetails = NotificationDetails(
        android: androidDetails,
      );
      
      await _notificationsPlugin.show(
        888,
        'KTC Logistics Driver',
        'Tracking your location in background',
        notificationDetails,
      );
    }

    // Configure location settings
    LocationSettings locationSettings = Platform.isAndroid
        ? AndroidSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 10,
            foregroundNotificationConfig: const ForegroundNotificationConfig(
              notificationTitle: 'KTC Logistics Driver',
              notificationText: 'Tracking your location',
              enableWakeLock: true,
              notificationIcon: AndroidResource(name: 'ic_notification'),
            ),
          )
        : AppleSettings(
            accuracy: LocationAccuracy.high,
            activityType: ActivityType.automotiveNavigation,
            distanceFilter: 10,
            pauseLocationUpdatesAutomatically: false,
            showBackgroundLocationIndicator: true,
          );

    // Start the continuous location stream for immediate updates
    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        // This will get continuous updates as the driver moves
        debugPrint('Position Update: ${position.latitude}, ${position.longitude}');
        // Send to server
        _sendLocationToServer(
          position.latitude, 
          position.longitude, 
          position.speed, 
          position.heading
        );
      },
      onError: (error) {
        debugPrint('Error getting location: $error');
      },
    );

    // Start hourly location updates
    _startHourlyLocationUpdates();
  }

  // Hourly location updates to the server
  void _startHourlyLocationUpdates() {
    // Cancel any existing timer
    _locationUpdateTimer?.cancel();
    
    // Initial update
    _sendHourlyLocationUpdate();
    
    // Schedule hourly updates (3600000 milliseconds = 1 hour)
    _locationUpdateTimer = Timer.periodic(
      const Duration(hours: 1), 
      (_) => _sendHourlyLocationUpdate()
    );
  }

  Future<void> _sendHourlyLocationUpdate() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );
      
      await _sendLocationToServer(
        position.latitude, 
        position.longitude, 
        position.speed, 
        position.heading
      );
      
      debugPrint('Hourly location update sent: ${position.latitude}, ${position.longitude}');
    } catch (e) {
      debugPrint('Error getting hourly location: $e');
    }
  }

  // Stop the background location service
  Future<void> stopBackgroundLocationService() async {
    _isTracking = false;
    
    await _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
    
    if (Platform.isAndroid) {
      await _notificationsPlugin.cancel(888);
    }
    
    debugPrint('Background location service stopped');
  }
  
  // Thêm các phương thức từ LocationTrackingService để đảm bảo tương thích
  
  // Bắt đầu tracking với các tham số cụ thể (tương thích với LocationTrackingService)
  Future<void> startTracking({
    required double latitude,
    required double longitude,
    required double speed,
    required double heading,
    required String vehicleStatus,
    Duration updateInterval = const Duration(minutes: 1),
  }) async {
    if (_isTracking) return;
    
    await startBackgroundLocationService();
    
    // Nếu không có GPS hoặc giả lập, gửi vị trí được cung cấp
    await _sendLocationToServer(latitude, longitude, speed, heading);
    
    // Cập nhật vị trí định kỳ nếu không có luồng vị trí liên tục
    if (_positionStreamSubscription == null) {
      _locationUpdateTimer = Timer.periodic(updateInterval, (timer) async {
        try {
          final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high
          );
          await _sendLocationToServer(
            position.latitude, 
            position.longitude, 
            position.speed, 
            position.heading
          );
        } catch (e) {
          // Fallback nếu không lấy được vị trí thực
          await _sendLocationToServer(latitude, longitude, speed, heading);
        }
      });
    }
  }
}
