import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../local_secure/secure_storage.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? body;

  ApiException(this.message, {this.statusCode, this.body});

  @override
  String toString() {
    if (statusCode != null) {
      return 'ApiException: $message (Status code: $statusCode)';
    }
    return 'ApiException: $message';
  }
}

/// Cache entry for HTTP responses
class CacheEntry {
  final dynamic data;
  final DateTime expiresAt;

  CacheEntry({required this.data, required this.expiresAt});

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

/// HTTP client with authentication, caching, and error handling
class HttpClient {
  final String baseUrl;
  final SecureStorageFrave secureStorage;
  final http.Client _client;
  
  // Cache for GET requests (simple in-memory cache)
  final Map<String, CacheEntry> _cache = {};
  static const Duration _defaultCacheDuration = Duration(minutes: 5);
  static const Duration _defaultTimeout = Duration(seconds: 30);

  HttpClient({
    required this.baseUrl,
    required this.secureStorage,
  }) : _client = http.Client();

  /// Dispose resources
  void dispose() {
    _client.close();
    _cache.clear();
  }

  /// Get authorization headers with token (cached)
  String? _cachedToken;
  DateTime? _tokenCacheTime;
  static const Duration _tokenCacheDuration = Duration(minutes: 10);

  Future<Map<String, String>> _getAuthHeaders() async {
    // Use cached token if available and not expired
    if (_cachedToken != null && 
        _tokenCacheTime != null && 
        DateTime.now().difference(_tokenCacheTime!) < _tokenCacheDuration) {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_cachedToken',
      };
    }

    final token = await secureStorage.readToken();
    if (token == null) {
      throw ApiException('No authentication token available');
    }
    
    // Cache the token
    _cachedToken = token;
    _tokenCacheTime = DateTime.now();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Check cache for GET requests
  T? _getFromCache<T>(String cacheKey) {
    final entry = _cache[cacheKey];
    if (entry != null && !entry.isExpired) {
      return entry.data as T?;
    }
    return null;
  }

  /// Store in cache
  void _setCache<T>(String cacheKey, T data, {Duration? duration}) {
    _cache[cacheKey] = CacheEntry(
      data: data,
      expiresAt: DateTime.now().add(duration ?? _defaultCacheDuration),
    );
  }

  /// Generic GET request with caching
  Future<T> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(Map<String, dynamic> json)? fromJson,
    bool requiresAuth = true,
    bool useCache = true,
    Duration? cacheDuration,
    Duration? timeout,
  }) async {
    var url = '$baseUrl$endpoint';
    
    if (queryParams != null && queryParams.isNotEmpty) {
      url += '?${queryParams.entries.map((e) => '${e.key}=${e.value}').join('&')}';
    }

    // Check cache first for GET requests
    if (useCache) {
      final cached = _getFromCache<T>(url);
      if (cached != null) {
        return cached;
      }
    }

    final headers = requiresAuth ? await _getAuthHeaders() : {'Content-Type': 'application/json'};
    
    try {
      final response = await _client.get(
        Uri.parse(url),
        headers: headers,
      ).timeout(timeout ?? _defaultTimeout);
      
      final result = _handleResponse<T>(response, fromJson: fromJson);
      
      // Cache successful GET responses
      if (useCache && response.statusCode >= 200 && response.statusCode < 300) {
        _setCache(url, result, duration: cacheDuration);
      }
      
      return result;
    } on TimeoutException {
      throw ApiException('Request timeout');
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error performing GET request: $e');
    }
  }

  /// Generic POST request
  Future<T> post<T>(
    String endpoint, {
    dynamic body,
    T Function(Map<String, dynamic> json)? fromJson,
    bool requiresAuth = true,
    Duration? timeout,
  }) async {
    final url = '$baseUrl$endpoint';
    final headers = requiresAuth ? await _getAuthHeaders() : {'Content-Type': 'application/json'};
    
    try {
      final response = await _client.post(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(timeout ?? _defaultTimeout);
      
      return _handleResponse<T>(response, fromJson: fromJson);
    } on TimeoutException {
      throw ApiException('Request timeout');
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error performing POST request: $e');
    }
  }

  /// Generic PUT request
  Future<T> put<T>(
    String endpoint, {
    dynamic body,
    T Function(Map<String, dynamic> json)? fromJson,
    bool requiresAuth = true,
  }) async {
    final url = '$baseUrl$endpoint';
    final headers = requiresAuth ? await _getAuthHeaders() : {'Content-Type': 'application/json'};
    
    try {
      final response = await _client.put(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      
      return _handleResponse<T>(response, fromJson: fromJson);
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error performing PUT request: $e');
    }
  }

  /// Generic PATCH request
  Future<T> patch<T>(
    String endpoint, {
    dynamic body,
    T Function(Map<String, dynamic> json)? fromJson,
    bool requiresAuth = true,
  }) async {
    final url = '$baseUrl$endpoint';
    final headers = requiresAuth ? await _getAuthHeaders() : {'Content-Type': 'application/json'};
    
    try {
      final response = await _client.patch(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      
      return _handleResponse<T>(response, fromJson: fromJson);
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error performing PATCH request: $e');
    }
  }

  /// Generic DELETE request
  Future<T> delete<T>(
    String endpoint, {
    T Function(Map<String, dynamic> json)? fromJson,
    bool requiresAuth = true,
  }) async {
    final url = '$baseUrl$endpoint';
    final headers = requiresAuth ? await _getAuthHeaders() : {'Content-Type': 'application/json'};
    
    try {
      final response = await _client.delete(
        Uri.parse(url),
        headers: headers,
      );
      
      return _handleResponse<T>(response, fromJson: fromJson);
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error performing DELETE request: $e');
    }
  }

  /// Handle HTTP response
  T _handleResponse<T>(http.Response response, {T Function(Map<String, dynamic> json)? fromJson}) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (T == bool) {
        return true as T;
      }
      
      if (response.body.isEmpty) {
        return null as T;
      }
      
      final dynamic jsonData = json.decode(response.body);
      
      if (fromJson != null) {
        if (jsonData is Map<String, dynamic>) {
          return fromJson(jsonData);
        } else {
          throw ApiException('Invalid response format', statusCode: response.statusCode, body: response.body);
        }
      }
      
      return jsonData as T;
    } else if (response.statusCode == 401) {
      throw ApiException('Unauthorized', statusCode: response.statusCode, body: response.body);
    } else if (response.statusCode == 403) {
      throw ApiException('Forbidden', statusCode: response.statusCode, body: response.body);
    } else if (response.statusCode == 404) {
      throw ApiException('Resource not found', statusCode: response.statusCode, body: response.body);
    } else {
      throw ApiException('Request failed', statusCode: response.statusCode, body: response.body);
    }
  }
  
  /// Upload file to endpoint
  Future<String> uploadFile(
    String endpoint,
    String filePath, {
    Map<String, String>? fields,
    String fileField = 'file',
    bool requiresAuth = true,
  }) async {
    final url = '$baseUrl$endpoint';
    final request = http.MultipartRequest('POST', Uri.parse(url));
    
    if (requiresAuth) {
      final token = await secureStorage.readToken();
      if (token == null) {
        throw ApiException('No authentication token available');
      }
      request.headers.addAll({'Authorization': 'Bearer $token'});
    }
    
    if (fields != null) {
      request.fields.addAll(fields);
    }
    
    request.files.add(await http.MultipartFile.fromPath(fileField, filePath));
    
    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['fileUrl'] as String;
      } else {
        throw ApiException(
          'Failed to upload file',
          statusCode: response.statusCode,
          body: response.body,
        );
      }
    } on SocketException {
      throw ApiException('No internet connection');
    } catch (e) {
      throw ApiException('Error uploading file: $e');
    }
  }
  
  /// Close the HTTP client
  void close() {
    _client.close();
  }
}
