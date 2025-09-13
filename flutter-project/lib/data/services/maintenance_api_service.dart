import '../network/http_client.dart';
import '../local_secure/secure_storage.dart';
import '../../domain/models/maintenance/maintenance_request.dart';

class MaintenanceApiService {
  late final HttpClient _httpClient;

  MaintenanceApiService({
    String? baseUrl,
    SecureStorageFrave? secureStorage,
  }) {
    _httpClient = HttpClient(
      baseUrl: baseUrl ?? 'http://localhost:8080',
      secureStorage: secureStorage ?? SecureStorageFrave(),
    );
  }

  // =================
  // DRIVER APIs (Steps 1, 4, 6)
  // =================

  /// Step 1: Driver creates maintenance request
  Future<MaintenanceRequest> createMaintenanceRequest({
    required int driverId,
    required CreateMaintenanceRequestDto createDto,
  }) async {
    try {
      final response = await _httpClient.post(
        '/api/drivers/$driverId/maintenance-requests',
        body: createDto.toJson(),
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to create maintenance request: $e');
    }
  }

  /// Step 4 & 6: Driver views their maintenance requests
  Future<List<MaintenanceRequest>> getDriverMaintenanceRequests({
    required int driverId,
    int page = 0,
    int size = 10,
    String? status,
    String? maintenanceType,
  }) async {
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

      final response = await _httpClient.get(
        '/api/drivers/$driverId/maintenance-requests',
        queryParams: queryParams,
      );

      final data = response['data'] as Map<String, dynamic>;
      final content = data['content'] as List<dynamic>;
      
      return content
          .map((json) => MaintenanceRequest.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiException('Failed to fetch driver maintenance requests: $e');
    }
  }

  /// Step 4 & 6: Driver views specific maintenance request detail
  Future<MaintenanceRequest> getDriverMaintenanceRequestDetail({
    required int driverId,
    required int maintenanceId,
  }) async {
    try {
      final response = await _httpClient.get(
        '/api/drivers/$driverId/maintenance-requests/$maintenanceId',
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to fetch maintenance request detail: $e');
    }
  }

  // =================
  // FLEET MANAGEMENT APIs (Steps 2, 3, 5)
  // =================

  /// Step 2: Fleet manager gets list of vehicles needing maintenance
  Future<List<MaintenanceRequest>> getFleetMaintenanceRequests({
    int page = 0,
    int size = 10,
    String? status,
    String? maintenanceType,
    int? vehicleId,
  }) async {
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
      if (vehicleId != null) {
        queryParams['vehicleId'] = vehicleId.toString();
      }

      final response = await _httpClient.get(
        '/api/fleet/maintenance-requests',
        queryParams: queryParams,
      );

      final data = response['data'] as Map<String, dynamic>;
      final content = data['content'] as List<dynamic>;
      
      return content
          .map((json) => MaintenanceRequest.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiException('Failed to fetch fleet maintenance requests: $e');
    }
  }

  /// Step 2: Fleet manager gets detail of specific maintenance request
  Future<MaintenanceRequest> getFleetMaintenanceRequestDetail({
    required int maintenanceId,
  }) async {
    try {
      final response = await _httpClient.get(
        '/api/fleet/maintenance-requests/$maintenanceId',
      );

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to fetch fleet maintenance request detail: $e');
    }
  }

  /// Step 3: Fleet manager accepts request and assigns garage + schedule
  Future<MaintenanceRequest> acceptMaintenanceRequest({
    required int maintenanceId,
    required String maintenanceDate, // Format: "2025-09-15"
    required String garageInfo,
  }) async {
    try {
      final url = '/api/fleet/maintenance-requests/$maintenanceId/accept?maintenanceDate=$maintenanceDate&garageInfo=${Uri.encodeComponent(garageInfo)}';

      final response = await _httpClient.put(url);

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to accept maintenance request: $e');
    }
  }

  /// Step 5: Fleet manager updates maintenance status
  Future<MaintenanceRequest> updateMaintenanceStatus({
    required int maintenanceId,
    required int statusId, // 17=AVAILABLE, 18=IN_USE, 19=MAINTENANCE
    String? notes,
    double? cost,
  }) async {
    try {
      String url = '/api/fleet/maintenance-requests/$maintenanceId/status?statusId=$statusId';
      
      if (notes != null) {
        url += '&notes=${Uri.encodeComponent(notes)}';
      }
      if (cost != null) {
        url += '&cost=$cost';
      }

      final response = await _httpClient.put(url);

      final data = response['data'] as Map<String, dynamic>;
      return MaintenanceRequest.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to update maintenance status: $e');
    }
  }

  // =================
  // UTILITY APIs
  // =================

  /// Get maintenance requests summary for dashboard
  Future<List<MaintenanceRequest>> getMaintenanceRequestsSummary() async {
    try {
      final response = await _httpClient.get('/api/maintenance-requests/summary');
      final data = response['data'] as List<dynamic>;
      
      return data
          .map((json) => MaintenanceRequest.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiException('Failed to fetch maintenance summary: $e');
    }
  }

  /// Search maintenance requests by keyword
  Future<List<MaintenanceRequest>> searchMaintenanceRequests({
    required String keyword,
    int page = 0,
    int size = 10,
  }) async {
    try {
      final Map<String, String> queryParams = {
        'keyword': keyword,
        'page': page.toString(),
        'size': size.toString(),
      };

      final response = await _httpClient.get(
        '/api/maintenance-requests/search',
        queryParams: queryParams,
      );

      final data = response['data'] as Map<String, dynamic>;
      final content = data['content'] as List<dynamic>;
      
      return content
          .map((json) => MaintenanceRequest.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw ApiException('Failed to search maintenance requests: $e');
    }
  }

  /// Delete maintenance request (admin only)
  Future<void> deleteMaintenanceRequest({
    required int maintenanceId,
  }) async {
    try {
      await _httpClient.delete('/api/maintenance-requests/$maintenanceId');
    } catch (e) {
      throw ApiException('Failed to delete maintenance request: $e');
    }
  }
}

// DTO classes for API communication
class CreateMaintenanceRequestDto {
  final int vehicleId;
  final String description;
  final String maintenanceType;
  final int statusId;
  final double? cost;
  final String? maintenanceDate;
  final String? nextDueDate;
  final String? notes;

  CreateMaintenanceRequestDto({
    required this.vehicleId,
    required this.description,
    required this.maintenanceType,
    required this.statusId,
    this.cost,
    this.maintenanceDate,
    this.nextDueDate,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'vehicleId': vehicleId,
      'description': description,
      'maintenanceType': maintenanceType,
      'statusId': statusId,
      if (cost != null) 'cost': cost,
      if (maintenanceDate != null) 'maintenanceDate': maintenanceDate,
      if (nextDueDate != null) 'nextDueDate': nextDueDate,
      if (notes != null) 'notes': notes,
    };
  }
}

class ApiException implements Exception {
  final String message;
  
  ApiException(this.message);
  
  @override
  String toString() => 'ApiException: $message';
}