import 'dart:async';
import 'package:bloc/bloc.dart';
import '../../../services/auth_services.dart';
import '../../../domain/models/auth/auth_models.dart';
import 'auth_event.dart';
import 'auth_state.dart';
import 'user_model.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthServices _authServices;

  AuthBloc({required AuthServices authServices})
      : _authServices = authServices,
        super(AuthInitialState()) {
    on<LoginEvent>(_onLogin);
    on<CheckLoginEvent>(_onCheckLogin);
    on<LogOutEvent>(_onLogOut);
    on<RefreshTokenEvent>(_onRefreshToken);
    on<UpdateUserEvent>(_onUpdateUser);
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    try {
      emit(AuthLoadingState());

      // Gọi trực tiếp service đăng nhập
      final loginResponse = await _authServices.login(event.email, event.password);

      // Thêm delay để hiển thị loading
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Chuyển đổi từ LoginResponse của API sang UserModel
      final userModel = _convertToUserModel(loginResponse);
      
      emit(AuthenticatedState(
        user: userModel,
        token: loginResponse.accessToken,
      ));
    } catch (e) {
      emit(AuthErrorState(message: 'Đăng nhập thất bại: ${e.toString()}'));
    }
  }

  Future<void> _onCheckLogin(CheckLoginEvent event, Emitter<AuthState> emit) async {
    try {
      emit(AuthLoadingState());

      // Kiểm tra trạng thái đăng nhập trực tiếp từ service
      final isAuthenticated = await _authServices.checkAuthStatus();

      if (isAuthenticated) {
        try {
          // Làm mới token
          final loginResponse = await _authServices.refreshToken();
          
          // Chuyển đổi sang UserModel
          final userModel = _convertToUserModel(loginResponse);
          
          emit(AuthenticatedState(
            user: userModel,
            token: loginResponse.accessToken,
          ));
        } catch (e) {
          emit(UnauthenticatedState());
        }
      } else {
        emit(UnauthenticatedState());
      }
    } catch (e) {
      emit(UnauthenticatedState());
    }
  }

  Future<void> _onLogOut(LogOutEvent event, Emitter<AuthState> emit) async {
    try {
      // Gọi trực tiếp service đăng xuất
      await _authServices.logout();
      emit(UnauthenticatedState());
    } catch (e) {
      emit(AuthErrorState(message: 'Lỗi đăng xuất: ${e.toString()}'));
    }
  }

  Future<void> _onRefreshToken(RefreshTokenEvent event, Emitter<AuthState> emit) async {
    if (state is AuthenticatedState) {
      try {
        // Gọi trực tiếp service làm mới token
        final loginResponse = await _authServices.refreshToken();
        
        // Chuyển đổi sang UserModel
        final userModel = _convertToUserModel(loginResponse);
        
        emit(AuthenticatedState(
          user: userModel,
          token: loginResponse.accessToken,
        ));
      } catch (e) {
        emit(AuthErrorState(message: 'Lỗi làm mới token: ${e.toString()}'));
      }
    }
  }

  Future<void> _onUpdateUser(UpdateUserEvent event, Emitter<AuthState> emit) async {
    try {
      if (state is AuthenticatedState) {
        final currentState = state as AuthenticatedState;
        // Create updated user with new data
        final updatedUser = UserModel(
          id: currentState.user.id,
          email: event.userData['email'] ?? currentState.user.email,
          name: event.userData['name'] ?? currentState.user.name,
          phone: event.userData['phone'] ?? currentState.user.phone,
          avatar: event.userData['avatar'] ?? currentState.user.avatar,
          vehicle: event.userData['vehicle'] ?? currentState.user.vehicle,
          rating: (event.userData['rating'] ?? currentState.user.rating).toDouble(),
          totalDeliveries: event.userData['totalDeliveries'] ?? currentState.user.totalDeliveries,
        );
        
        emit(AuthenticatedState(
          user: updatedUser,
          token: currentState.token,
        ));
      }
    } catch (e) {
      emit(AuthErrorState(message: 'Lỗi cập nhật thông tin: ${e.toString()}'));
    }
  }
  
  // Phương thức helper để chuyển đổi LoginResponse thành UserModel
  UserModel _convertToUserModel(LoginResponse loginResponse) {
    return UserModel(
      id: loginResponse.userId.toString(),
      name: loginResponse.username,
      email: loginResponse.username,  // Giả sử username là email
      phone: '',  // Điền thông tin nếu có
      avatar: '',  // Điền thông tin nếu có
      vehicle: '',  // Điền thông tin nếu có
      rating: 0.0,  // Giá trị mặc định
      totalDeliveries: 0,  // Giá trị mặc định
    );
  }
}


