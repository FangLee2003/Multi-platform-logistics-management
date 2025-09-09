// auth_models.dart
// Models cho xác thực và đăng nhập

class LoginRequest {
  final String username;
  final String password;

  LoginRequest({
    required this.username,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'password': password,
    };
  }
}

class LoginResponse {
  final String accessToken;
  final String tokenType;
  final int expiresIn;
  final String refreshToken;
  final int userId;
  final int driverId;
  final String username;
  final List<String> roles;

  LoginResponse({
    required this.accessToken,
    required this.tokenType,
    required this.expiresIn,
    required this.refreshToken,
    required this.userId,
    required this.driverId,
    required this.username,
    required this.roles,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    // Extract user info if it exists in the response
    final userInfo = json['user'] as Map<String, dynamic>?;
    
    // Get userId either directly or from nested user object
    final userId = json['userId'] ?? userInfo?['id'] ?? 0;
    
    return LoginResponse(
      accessToken: json['accessToken'] ?? json['token'] ?? '',
      tokenType: json['tokenType'] ?? 'Bearer',
      expiresIn: json['expiresIn'] ?? 0,
      refreshToken: json['refreshToken'] ?? '',
      userId: userId,
      driverId: json['driverId'] ?? userId, // Use userId as driverId if not explicitly provided
      username: json['username'] ?? userInfo?['username'] ?? '',
      roles: json['roles'] != null ? List<String>.from(json['roles']) : 
             userInfo?['role'] != null ? [userInfo?['role']] : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'tokenType': tokenType,
      'expiresIn': expiresIn,
      'refreshToken': refreshToken,
      'userId': userId,
      'driverId': driverId,
      'username': username,
      'roles': roles,
    };
  }
}
