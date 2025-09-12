import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geocoding/geocoding.dart';
import '../data/env/environment.dart';
import '../data/local_secure/secure_storage.dart';
import '../data/network/http_client.dart';
import '../domain/models/tracking/driver_location.dart';
import '../presentation/helpers/performance_monitor.dart';

/// LocationService - Optimized for performance and battery efficiency
/// Manages background tracking, location updates, and server communication
class LocationService {
  // Singleton pattern
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;

  // Private constructor
  LocationService._internal() {
    _httpClient = HttpClient(baseUrl: baseUrl, secureStorage: secureStorage);
    _initializeOptimizations();
  }

  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();
  late final HttpClient _httpClient;
  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  // Tracking state - optimized
  StreamSubscription<Position>? _positionStreamSubscription;
  Timer? _locationUpdateTimer;
  Timer? _batchUploadTimer;
  bool _isTracking = false;
  
  // Performance optimizations
  final List<DriverLocation> _locationBuffer = [];
  Position? _lastKnownPosition;
  DateTime? _lastUploadTime;
  
  // Configuration
  static const int _maxBufferSize = 50;
  static const Duration _batchUploadInterval = Duration(minutes: 2);
  static const double _minimumDistanceFilter = 10.0; // meters
  static const Duration _minimumTimeFilter = Duration(seconds: 30);
  
  // Key cho SharedPreferences để lưu thông tin tracking
  final String _lastTrackingTimeKey = 'last_tracking_time';
  final String _activeDeliveryIdKey = 'active_delivery_id';
  final String _activeDriverIdKey = 'active_driver_id';
  final String _activeVehicleIdKey = 'active_vehicle_id';
  final String _activeStatusIdKey = 'active_status_id';

  // Getters
  String get baseUrl => _env.apiBaseUrl;
  bool get isTracking => _isTracking;

  /// Initialize performance optimizations
  void _initializeOptimizations() {
    // Start batch upload timer
    _batchUploadTimer = Timer.periodic(_batchUploadInterval, (_) {
      _uploadLocationBatch();
    });
  }

  /// Upload buffered locations in batch for efficiency
  Future<void> _uploadLocationBatch() async {
    if (_locationBuffer.isEmpty) return;
    
    performanceMonitor.startTimer('location_batch_upload');
    
    try {
      final locations = List<DriverLocation>.from(_locationBuffer);
      _locationBuffer.clear();
      
      final token = await secureStorage.readToken();
      final driverId = await secureStorage.readDriverId();
      
      if (token == null || driverId == null) return;
      
      final requestBody = {
        'driverId': driverId,
        'locations': locations.map((loc) => {
          'latitude': loc.latitude,
          'longitude': loc.longitude,
          'timestamp': loc.timestamp,
          'speed': loc.speed,
          'heading': loc.heading,
          'vehicleStatus': loc.vehicleStatus,
        }).toList(),
      };
      
      await _httpClient.post<bool>(
        '/tracking/locations/batch',
        body: requestBody,
        timeout: const Duration(seconds: 10),
      );
      
      _lastUploadTime = DateTime.now();
      performanceMonitor.stopTimer('location_batch_upload');
      
    } catch (e) {
      performanceMonitor.stopTimer('location_batch_upload');
      debugPrint('Batch upload failed: $e');
    }
  }

  /// Check if location should be filtered (too close/frequent)
  bool _shouldFilterLocation(Position position) {
    if (_lastKnownPosition == null) return false;
    
    final distance = Geolocator.distanceBetween(
      _lastKnownPosition!.latitude,
      _lastKnownPosition!.longitude,
      position.latitude,
      position.longitude,
    );
    
    final timeDiff = DateTime.now().difference(
      DateTime.fromMillisecondsSinceEpoch(_lastKnownPosition!.timestamp.millisecondsSinceEpoch)
    );
    
    return distance < _minimumDistanceFilter && timeDiff < _minimumTimeFilter;
  }

  /// Add location to buffer for batch processing
  void _bufferLocation(DriverLocation location) {
    _locationBuffer.add(location);
    
    // Force upload if buffer is full
    if (_locationBuffer.length >= _maxBufferSize) {
      _uploadLocationBatch();
    }
  }

  /// Initialize the location service
  Future<void> initialize() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    final iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    final initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(initSettings);
  }

  /// Start tracking with specific parameters
  ///
  /// [latitude] Current latitude of the driver
  /// [longitude] Current longitude of the driver
  /// [speed] Current speed in m/s
  /// [heading] Current heading in degrees
  /// [vehicleStatus] Status of the vehicle (active, idle, etc.)
  /// [updateInterval] How often to update location if continuous tracking fails
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

    // Send initial location update
    await _sendLocationToServer(latitude, longitude, speed, heading);

    // Set up periodic updates as fallback if continuous stream isn't available
    if (_positionStreamSubscription == null) {
      _locationUpdateTimer?.cancel();
      _locationUpdateTimer = Timer.periodic(updateInterval, (timer) async {
        try {
          final position = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.high);
          await _sendLocationToServer(position.latitude, position.longitude,
              position.speed, position.heading);
        } catch (e) {
          // Fallback to last known position
          await _sendLocationToServer(latitude, longitude, speed, heading);
          debugPrint('Using fallback location - Error: $e');
        }
      });
    }
  }

  /// Stop all location tracking and clean up resources
  Future<void> stopBackgroundLocationService() async {
    if (!_isTracking) return;

    _isTracking = false;

    // Cancel position stream
    if (_positionStreamSubscription != null) {
      await _positionStreamSubscription?.cancel();
      _positionStreamSubscription = null;
    }

    // Cancel timer
    if (_locationUpdateTimer != null) {
      _locationUpdateTimer?.cancel();
      _locationUpdateTimer = null;
    }

    // Remove foreground notification on Android
    if (Platform.isAndroid) {
      await _notificationsPlugin.cancel(888);
    }

    debugPrint('Background location service stopped');
  }

  /// Start background location tracking service
  /// Sets up continuous location tracking and periodic updates
  Future<void> startBackgroundLocationService() async {
    if (_isTracking) return;

    if (!await _checkLocationPermission()) {
      debugPrint('Location permission not granted');
      return;
    }

    _isTracking = true;

    // Start foreground notification on Android
    if (Platform.isAndroid) {
      await _showForegroundNotification();
    }

    // Configure location settings based on platform
    final locationSettings = _getPlatformLocationSettings();

    // Start continuous location updates
    _positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      _handlePositionUpdate,
      onError: (error) => debugPrint('Error getting location: $error'),
    );

    // Start periodic location updates as backup
    _startPeriodicLocationUpdates();
  }

  /// Send location data to server
  /// Updates the driver's current location in the tracking system
  ///
  /// [location] The driver location data to send
  /// Returns true if update was successful
  Future<bool> updateDriverLocation(DriverLocation location) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      debugPrint('Driver ID not found - cannot update location');
      return false;
    }

    final requestBody = {
      'driverId': driverId,
      'latitude': location.latitude,
      'longitude': location.longitude,
      'timestamp': location.timestamp,
      'speed': location.speed,
      'heading': location.heading,
      'vehicleStatus': location.vehicleStatus,
    };

    try {
      return await _httpClient.post<bool>(
        '/tracking/location',
        body: requestBody,
      );
    } catch (e) {
      debugPrint('Error using new API, falling back to legacy: $e');
      // Fallback to legacy API
      return _updateDriverLocationLegacy(location);
    }
  }

  /// Track a specific delivery's location and status
  /// Associates the current location with a specific delivery order
  ///
  /// [deliveryId] ID of the delivery to update
  /// [location] Current location data
  /// [notes] Optional notes about the delivery status
  /// [statusId] Optional status ID for the delivery
  ///
  /// Returns true if update was successful
  Future<bool> updateDeliveryTracking(int deliveryId, DriverLocation location,
      {String? notes, int? statusId}) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();

    if (token == null || driverId == null) {
      debugPrint(
          'Token or driver ID not found - cannot update delivery tracking');
      return false;
    }

    final data = {
      'latitude': location.latitude,
      'longitude': location.longitude,
      'location': notes ?? 'Updating location',
      'statusId': statusId ?? 2, // Default status (in progress)
      'notes': notes ?? 'Location update',
      'vehicleId': 10 // Default vehicle ID
    };

    try {
      final resp = await http.post(
          Uri.parse(
              '$baseUrl/api/driver/$driverId/deliveries/$deliveryId/tracking'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json'
          },
          body: json.encode(data));

      final success = resp.statusCode == 200 || resp.statusCode == 201;
      if (!success) {
        debugPrint(
            'Delivery tracking update failed: ${resp.statusCode} - ${resp.body}');
      }
      return success;
    } catch (e) {
      debugPrint('Error updating delivery tracking: $e');
      return false;
    }
  }

  // PRIVATE METHODS

  /// Send current location to server
  /// Creates a DriverLocation object and sends it to the server
  Future<bool> _sendLocationToServer(
      double latitude, double longitude, double speed, double heading) async {
    try {
      final driverLocation = DriverLocation(
        latitude: latitude,
        longitude: longitude,
        timestamp: DateTime.now().toIso8601String(),
        speed: speed,
        heading: heading,
        vehicleStatus: 'active',
      );

      final result = await updateDriverLocation(driverLocation);
      if (kDebugMode) {
        print(
            'Location sent: Lat: $latitude, Long: $longitude, Result: $result');
      }
      return result;
    } catch (e) {
      debugPrint('Error sending location: $e');
      return false;
    }
  }

  /// Legacy method for API compatibility
  /// Used as a fallback when the new API endpoint fails
  Future<bool> _updateDriverLocationLegacy(DriverLocation location) async {
    final token = await secureStorage.readToken();
    final driverId = await secureStorage.readDriverId();

    if (token == null || driverId == null) {
      debugPrint('Token or driver ID not found - cannot use legacy update');
      return false;
    }

    final data = {
      'driverId': driverId,
      'latitude': location.latitude,
      'longitude': location.longitude,
      'timestamp': location.timestamp
    };

    try {
      final resp = await http.post(Uri.parse('$baseUrl/tracking/update'),
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json'
          },
          body: json.encode(data));

      return resp.statusCode == 200;
    } catch (e) {
      debugPrint('Legacy location update failed: $e');
      return false;
    }
  }

  /// Get driver ID from secure storage
  Future<int?> _getDriverId() async {
    final driverId = await secureStorage.readDriverId();
    return driverId != null ? int.parse(driverId) : null;
  }

  /// Check if location permissions are granted
  /// Requests permissions if not already granted
  Future<bool> _checkLocationPermission() async {
    // Check if location services are enabled
    if (!await Geolocator.isLocationServiceEnabled()) {
      debugPrint('Location services are disabled');
      return false;
    }

    // Check location permission
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('Location permission denied');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('Location permission denied permanently');
      return false;
    }

    // Request background permission on iOS
    if (Platform.isIOS) {
      final status = await Permission.locationAlways.request();
      debugPrint('iOS background location permission status: $status');
    }

    return true;
  }

  /// Show foreground notification for Android background service
  /// Required for background location tracking on Android
  Future<void> _showForegroundNotification() async {
    const androidDetails = AndroidNotificationDetails(
      'location_channel',
      'Location Updates',
      channelDescription: 'Used for tracking driver location',
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
    );

    const notificationDetails = NotificationDetails(android: androidDetails);

    await _notificationsPlugin.show(
      888,
      'KTC Logistics Driver',
      'Tracking your location in background',
      notificationDetails,
    );
  }

  /// Get platform-specific location settings
  /// Returns the appropriate settings for Android or iOS
  LocationSettings _getPlatformLocationSettings() {
    if (Platform.isAndroid) {
      return AndroidSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update if moved 10 meters
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'KTC Logistics Driver',
          notificationText: 'Tracking your location',
          enableWakeLock: true,
          notificationIcon: AndroidResource(name: 'ic_notification'),
        ),
      );
    } else {
      return AppleSettings(
        accuracy: LocationAccuracy.high,
        activityType: ActivityType.automotiveNavigation,
        distanceFilter: 10,
        pauseLocationUpdatesAutomatically: false,
        showBackgroundLocationIndicator: true,
      );
    }
  }

  /// Handle position updates from location stream
  void _handlePositionUpdate(Position position) {
    final lat = position.latitude;
    final lng = position.longitude;
    final speed = position.speed;
    final heading = position.heading;

    debugPrint(
        'Position Update: $lat, $lng (speed: ${speed.toStringAsFixed(1)} m/s)');

    _sendLocationToServer(lat, lng, speed, heading);
  }

  /// Start periodic location updates
  /// This is a backup in case continuous tracking fails
  void _startPeriodicLocationUpdates() {
    _locationUpdateTimer?.cancel();
    _sendHourlyLocationUpdate();
    _locationUpdateTimer = Timer.periodic(
        const Duration(hours: 1), (_) => _sendHourlyLocationUpdate());
  }

  /// Send hourly location update
  /// Ensures we have at least hourly updates even if continuous tracking fails
  Future<void> _sendHourlyLocationUpdate() async {
    try {
      final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);

      await _sendLocationToServer(position.latitude, position.longitude,
          position.speed, position.heading);

      debugPrint(
          'Hourly update sent: ${position.latitude}, ${position.longitude}');
    } catch (e) {
      debugPrint('Error getting hourly location: $e');
    }
  }

  /// Starts tracking for a specific delivery
  /// This method incorporates functionality from the previous driver_tracking_service
  Future<void> startDeliveryTracking({
    required int driverId,
    required int deliveryId,
    required int vehicleId,
    required int statusId,
  }) async {
    // Lưu thông tin tracking vào SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_activeDriverIdKey, driverId);
    await prefs.setInt(_activeDeliveryIdKey, deliveryId);
    await prefs.setInt(_activeVehicleIdKey, vehicleId);
    await prefs.setInt(_activeStatusIdKey, statusId);
    await prefs.setString(_lastTrackingTimeKey, DateTime.now().toIso8601String());
    
    if (_isTracking) {
      stopBackgroundLocationService();
    }
    
    // Get current position
    final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high);
    
    // Start general tracking
    await startTracking(
      latitude: position.latitude, 
      longitude: position.longitude,
      speed: position.speed,
      heading: position.heading,
      vehicleStatus: 'ACTIVE',
      updateInterval: const Duration(minutes: 30) // 30 minute interval as requested
    );
    
    // Send tracking data specifically for this delivery
    await updateDeliveryTracking(
      deliveryId, 
      DriverLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        heading: position.heading,
        timestamp: DateTime.now().toIso8601String(),
        vehicleStatus: 'ACTIVE'
      ),
      statusId: statusId
    );
    
    debugPrint('🚀 Started driver location tracking for Delivery #$deliveryId');
  }
  
  /// Restore tracking from SharedPreferences after app restart
  Future<void> restoreDeliveryTrackingIfNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    final lastTrackingTime = prefs.getString(_lastTrackingTimeKey);
    final deliveryId = prefs.getInt(_activeDeliveryIdKey);
    final driverId = prefs.getInt(_activeDriverIdKey);
    final vehicleId = prefs.getInt(_activeVehicleIdKey);
    final statusId = prefs.getInt(_activeStatusIdKey);
    
    // Nếu có thông tin tracking đã lưu
    if (lastTrackingTime != null && deliveryId != null && 
        driverId != null && vehicleId != null && statusId != null) {
      
      // Khôi phục tracking
      startDeliveryTracking(
        driverId: driverId,
        deliveryId: deliveryId, 
        vehicleId: vehicleId,
        statusId: statusId
      );
      
      debugPrint('♻️ Restored driver location tracking for Delivery #$deliveryId');
    }
  }
  
  /// Lấy địa chỉ từ vị trí (từ location_service)
  Future<Placemark?> getAddressFromPosition(Position position) async {
    try {
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        return placemarks.first;
      }
      return null;
    } catch (e) {
      debugPrint('Error getting address from position: $e');
      return null;
    }
  }
}

/// Singleton instance for app-wide use
final locationService = LocationService();
