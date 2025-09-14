import '../data/env/environment.dart';
import '../data/local_secure/secure_storage.dart';
import '../data/network/http_client.dart';
import '../domain/models/maintenance/maintenance_request.dart';

/// MaintenanceServices - Handles maintenance-related API operations for drivers
/// such as creating maintenance requests, viewing maintenance history, and updating status.
class MaintenanceServices {
  // Dependencies
  final Environment _env = Environment.getInstance();
  final SecureStorageFrave secureStorage = SecureStorageFrave();
  late final HttpClient _httpClient;
  
  /// Base URL for API requests
  String get baseUrl => _env.apiBaseUrl;
  
  /// Constructor
  MaintenanceServices() {
    _httpClient = HttpClient(baseUrl: baseUrl, secureStorage: secureStorage);
  }

  /// Retrieves the driver ID from secure storage
  /// 
  /// Returns null if driver ID is not found
  Future<int?> _getDriverId() async {
    final driverId = await secureStorage.readDriverId();
    if (driverId == null) {
      return null;
    }
    return int.parse(driverId);
  }

  /// Step 1: Driver creates a maintenance request
  /// 
  /// [vehicleId] ID of the vehicle requiring maintenance
  /// [description] Detailed description of the maintenance issue
  /// [maintenanceType] Type of maintenance (ROUTINE, EMERGENCY, etc.)
  /// [notes] Optional additional notes
  /// 
  /// Returns the created [MaintenanceRequest]
  /// Throws exception if driver ID is not found or if API request fails
  Future<MaintenanceRequest> createMaintenanceRequest({
    required int vehicleId,
    required String description,
    required String maintenanceType,
    String? notes,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      final createDto = {
        'vehicleId': vehicleId,
        'description': description,
        'maintenanceType': maintenanceType,
        'statusId': 51, // MAINTENANCE_PENDING
        if (notes != null) 'notes': notes,
      };

      final response = await _httpClient.post(
        '/drivers/$driverId/maintenance-requests',
        body: createDto,
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw Exception('Failed to create maintenance request: $e');
    }
  }

  /// Step 4: Driver views their maintenance requests
  /// 
  /// [page] Page number for pagination (starts at 0)
  /// [size] Number of items per page
  /// [status] Optional filter by status
  /// [maintenanceType] Optional filter by maintenance type
  /// 
  /// Returns a list of [MaintenanceRequest] objects
  /// Throws exception if driver ID is not found or if API request fails
  Future<List<MaintenanceRequest>> getDriverMaintenanceRequests({
    int page = 0,
    int size = 10,
    String? status,
    String? maintenanceType,
    bool useCache = true, // Thêm tham số useCache
  }) async {
    print('🌐 MaintenanceServices: getDriverMaintenanceRequests called');
    print('🌐 MaintenanceServices: useCache = $useCache');
    
    final driverId = await _getDriverId();
    if (driverId == null) {
      print('❌ MaintenanceServices: Driver ID not found');
      throw Exception('Driver ID not found');
    }
    print('✅ MaintenanceServices: Driver ID found: $driverId');

    try {
      final Map<String, String> queryParams = {
        'page': page.toString(),
        'size': size.toString(),
      };

      if (status != null) {
        queryParams['status'] = status;
      }
      if (maintenanceType != null) {
        queryParams['maintenanceType'] = maintenanceType;
      }

      final endpoint = '/drivers/$driverId/maintenance-requests';
      print('🌐 MaintenanceServices: Making API call to: $baseUrl$endpoint');
      print('🌐 MaintenanceServices: Query params: $queryParams');

      final response = await _httpClient.get(
        endpoint,
        queryParams: queryParams,
        useCache: useCache, // Sử dụng giá trị useCache
      );

      print('✅ MaintenanceServices: API response received');
      
      final data = response['data'] as Map<String, dynamic>;
      final content = data['content'] as List<dynamic>;
      
      final requests = content
          .map((json) => MaintenanceRequest.fromJson(json as Map<String, dynamic>))
          .toList();
      
      print('✅ MaintenanceServices: Parsed ${requests.length} maintenance requests');
      return requests;
    } catch (e) {
      print('❌ MaintenanceServices: Error during API call: $e');
      throw Exception('Failed to fetch driver maintenance requests: $e');
    }
  }

  /// Driver views details of a specific maintenance request
  /// 
  /// [maintenanceId] ID of the maintenance request
  /// 
  /// Returns a [MaintenanceRequest] object with complete details
  /// Throws exception if driver ID is not found or if API request fails
  Future<MaintenanceRequest> getMaintenanceRequestDetail({
    required int maintenanceId,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      final response = await _httpClient.get(
        '/drivers/$driverId/maintenance-requests/$maintenanceId',
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw Exception('Failed to fetch maintenance request detail: $e');
    }
  }

  /// Step 5: Driver takes vehicle to garage for maintenance
  /// 
  /// [maintenanceId] ID of the maintenance request
  /// [notes] Optional additional notes
  /// 
  /// Returns the updated [MaintenanceRequest]
  /// Throws exception if driver ID is not found or if API request fails
  Future<MaintenanceRequest> takeVehicleToGarage({
    required int maintenanceId,
    String? notes,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      String url = '/drivers/$driverId/maintenance-requests/$maintenanceId/to-garage';
      
      if (notes != null) {
        url += '?notes=${Uri.encodeComponent(notes)}';
      }

      final response = await _httpClient.put(url);

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw Exception('Failed to update maintenance status: $e');
    }
  }

  /// Step 7: Driver picks up vehicle after maintenance completion or cancels maintenance request
  /// 
  /// [maintenanceId] ID of the maintenance request
  /// [notes] Optional additional notes
  /// 
  /// Returns the updated [MaintenanceRequest]
  /// Throws exception if driver ID is not found or if API request fails
  /// 
  /// This method updates the status to IN_USE (18), which can be used both for
  /// picking up vehicle after maintenance or canceling a maintenance request
  Future<MaintenanceRequest> pickUpVehicle({
    required int maintenanceId,
    String? notes,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      String url = '/maintenance-requests/$maintenanceId';
      
      // if (notes != null) {
      //   url += '?notes=${Uri.encodeComponent(notes)}';
      // }

      final body = {
        'statusId': 18,
      };

      final response = await _httpClient.put(url, body: body);

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw Exception('Failed to update maintenance status: $e');
    }
  }

  /// Cancel a pending maintenance request
  /// 
  /// [maintenanceId] ID of the maintenance request to cancel
  /// [reason] Reason for cancellation
  /// 
  /// Returns the updated [MaintenanceRequest]
  /// Throws exception if driver ID is not found or if API request fails
  Future<MaintenanceRequest> cancelMaintenanceRequest({
    required int maintenanceId,
    required String reason,
  }) async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      final response = await _httpClient.put(
        '/drivers/$driverId/maintenance-requests/$maintenanceId/cancel?reason=${Uri.encodeComponent(reason)}',
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw Exception('Failed to cancel maintenance request: $e');
    }
  }

  /// Get maintenance request counts by status for driver dashboard
  /// 
  /// Returns a Map with status counts (pending, scheduled, in-progress, completed)
  /// Throws exception if driver ID is not found or if API request fails
  Future<Map<String, int>> getMaintenanceStatusCounts() async {
    final driverId = await _getDriverId();
    if (driverId == null) {
      throw Exception('Driver ID not found');
    }

    try {
      final response = await _httpClient.get(
        '/drivers/$driverId/maintenance-requests/counts',
      );

      final data = response['data'] as Map<String, dynamic>;
      return {
        'pending': data['pending'] as int,
        'scheduled': data['scheduled'] as int,
        'inProgress': data['inProgress'] as int,
        'completed': data['completed'] as int,
      };
    } catch (e) {
      throw Exception('Failed to fetch maintenance status counts: $e');
    }
  }
}