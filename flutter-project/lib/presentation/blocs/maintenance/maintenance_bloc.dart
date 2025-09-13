import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/services/maintenance_api_service.dart';
import '../../../domain/models/maintenance/maintenance_request.dart';

// States
abstract class MaintenanceState {
  const MaintenanceState();
}

class MaintenanceInitial extends MaintenanceState {
  const MaintenanceInitial();
}

class MaintenanceLoading extends MaintenanceState {
  const MaintenanceLoading();
}

class MaintenanceLoaded extends MaintenanceState {
  final List<MaintenanceRequest> requests;
  final int totalPages;
  final int currentPage;

  const MaintenanceLoaded({
    required this.requests,
    required this.totalPages,
    required this.currentPage,
  });

  MaintenanceLoaded copyWith({
    List<MaintenanceRequest>? requests,
    int? totalPages,
    int? currentPage,
  }) {
    return MaintenanceLoaded(
      requests: requests ?? this.requests,
      totalPages: totalPages ?? this.totalPages,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

class MaintenanceError extends MaintenanceState {
  final String message;
  final String? details;

  const MaintenanceError({
    required this.message,
    this.details,
  });
}

class MaintenanceCreating extends MaintenanceState {
  const MaintenanceCreating();
}

class MaintenanceCreated extends MaintenanceState {
  final MaintenanceRequest request;

  const MaintenanceCreated({required this.request});
}

// Events
abstract class MaintenanceEvent {
  const MaintenanceEvent();
}

class LoadMaintenanceRequests extends MaintenanceEvent {
  final int driverId;
  final int page;
  final int size;
  final int? statusIdFilter;
  final bool? isEmergencyFilter;

  const LoadMaintenanceRequests({
    required this.driverId,
    this.page = 1,
    this.size = 10,
    this.statusIdFilter,
    this.isEmergencyFilter,
  });
}

class RefreshMaintenanceRequests extends MaintenanceEvent {
  final int driverId;

  const RefreshMaintenanceRequests({required this.driverId});
}

class CreateMaintenanceRequest extends MaintenanceEvent {
  final int driverId;
  final CreateMaintenanceRequestDto createDto;

  const CreateMaintenanceRequest({
    required this.driverId,
    required this.createDto,
  });
}

class UpdateMaintenanceRequest extends MaintenanceEvent {
  final int driverId;
  final int maintenanceId;
  final CreateMaintenanceRequestDto updateDto;

  const UpdateMaintenanceRequest({
    required this.driverId,
    required this.maintenanceId,
    required this.updateDto,
  });
}

class DeleteMaintenanceRequest extends MaintenanceEvent {
  final int driverId;
  final int maintenanceId;

  const DeleteMaintenanceRequest({
    required this.driverId,
    required this.maintenanceId,
  });
}

// BLoC
class MaintenanceBloc extends Bloc<MaintenanceEvent, MaintenanceState> {
  final MaintenanceApiService _apiService;

  MaintenanceBloc({
    required MaintenanceApiService apiService,
  }) : _apiService = apiService, super(const MaintenanceInitial()) {
    
    on<LoadMaintenanceRequests>(_onLoadMaintenanceRequests);
    on<RefreshMaintenanceRequests>(_onRefreshMaintenanceRequests);
    on<CreateMaintenanceRequest>(_onCreateMaintenanceRequest);
    on<UpdateMaintenanceRequest>(_onUpdateMaintenanceRequest);
    on<DeleteMaintenanceRequest>(_onDeleteMaintenanceRequest);
  }

  Future<void> _onLoadMaintenanceRequests(
    LoadMaintenanceRequests event,
    Emitter<MaintenanceState> emit,
  ) async {
    try {
      emit(const MaintenanceLoading());

      final requests = await _apiService.getDriverMaintenanceRequests(
        driverId: event.driverId,
        page: event.page,
        size: event.size,
        status: event.statusIdFilter?.toString(),
      );

      emit(MaintenanceLoaded(
        requests: requests,
        totalPages: 1, // TODO: Get from API response pagination
        currentPage: event.page,
      ));
    } catch (e) {
      emit(MaintenanceError(
        message: 'Failed to load maintenance requests',
        details: e.toString(),
      ));
    }
  }

  Future<void> _onRefreshMaintenanceRequests(
    RefreshMaintenanceRequests event,
    Emitter<MaintenanceState> emit,
  ) async {
    try {
      final requests = await _apiService.getDriverMaintenanceRequests(
        driverId: event.driverId,
      );

      emit(MaintenanceLoaded(
        requests: requests,
        totalPages: 1,
        currentPage: 1,
      ));
    } catch (e) {
      // On refresh error, keep existing state but could show snackbar
      if (state is! MaintenanceLoaded) {
        emit(MaintenanceError(
          message: 'Failed to refresh maintenance requests',
          details: e.toString(),
        ));
      }
    }
  }

  Future<void> _onCreateMaintenanceRequest(
    CreateMaintenanceRequest event,
    Emitter<MaintenanceState> emit,
  ) async {
    try {
      emit(const MaintenanceCreating());

      final newRequest = await _apiService.createMaintenanceRequest(
        driverId: event.driverId,
        createDto: event.createDto,
      );

      emit(MaintenanceCreated(request: newRequest));

      // Refresh the list
      add(RefreshMaintenanceRequests(driverId: event.driverId));
    } catch (e) {
      emit(MaintenanceError(
        message: 'Failed to create maintenance request',
        details: e.toString(),
      ));
    }
  }

  Future<void> _onUpdateMaintenanceRequest(
    UpdateMaintenanceRequest event,
    Emitter<MaintenanceState> emit,
  ) async {
    try {
      await _apiService.updateMaintenanceStatus(
        maintenanceId: event.maintenanceId,
        statusId: event.updateDto.statusId,
        notes: event.updateDto.notes,
        cost: event.updateDto.cost,
      );

      // Refresh the list
      add(RefreshMaintenanceRequests(driverId: event.driverId));
    } catch (e) {
      emit(MaintenanceError(
        message: 'Failed to update maintenance request',
        details: e.toString(),
      ));
    }
  }

  Future<void> _onDeleteMaintenanceRequest(
    DeleteMaintenanceRequest event,
    Emitter<MaintenanceState> emit,
  ) async {
    try {
      await _apiService.deleteMaintenanceRequest(
        maintenanceId: event.maintenanceId,
      );

      // Refresh the list
      add(RefreshMaintenanceRequests(driverId: event.driverId));
    } catch (e) {
      emit(MaintenanceError(
        message: 'Failed to delete maintenance request',
        details: e.toString(),
      ));
    }
  }
}