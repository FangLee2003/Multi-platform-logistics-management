import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ktc_logistics_driver/presentation/design/spatial_ui.dart';
import 'package:ktc_logistics_driver/presentation/components/spatial_glass_card.dart';
import 'package:ktc_logistics_driver/domain/models/maintenance/maintenance_request.dart';
import 'package:ktc_logistics_driver/presentation/blocs/maintenance/maintenance_bloc.dart';
import 'package:ktc_logistics_driver/data/services/maintenance_api_service.dart';

class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => MaintenanceBloc(
        apiService: MaintenanceApiService(),
      )..add(const LoadMaintenanceRequests(driverId: 1)), // TODO: Get actual driverId
      child: const MaintenanceScreenContent(),
    );
  }
}

class MaintenanceScreenContent extends StatefulWidget {
  const MaintenanceScreenContent({super.key});

  @override
  State<MaintenanceScreenContent> createState() => _MaintenanceScreenContentState();
}

class _MaintenanceScreenContentState extends State<MaintenanceScreenContent> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              SpatialDesignSystem.backgroundColor,
              SpatialDesignSystem.backgroundColor.withOpacity(0.8),
            ],
          ),
        ),
        child: BlocConsumer<MaintenanceBloc, MaintenanceState>(
          listener: (context, state) {
            if (state is MaintenanceError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: SpatialDesignSystem.errorColor,
                ),
              );
            } else if (state is MaintenanceCreated) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Yêu cầu bảo trì đã được tạo thành công'),
                  backgroundColor: SpatialDesignSystem.successColor,
                ),
              );
            }
          },
          builder: (context, state) {
            return Column(
              children: [
                _buildHeader(context, state),
                Expanded(
                  child: _buildMaintenanceContent(context, state),
                ),
              ],
            );
          },
        ),
      ),
      floatingActionButton: _buildFloatingActionButton(context),
    );
  }

  Widget _buildHeader(BuildContext context, MaintenanceState state) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top),
          Row(
            children: [
              const Icon(
                Icons.build_circle,
                color: SpatialDesignSystem.primaryColor,
                size: 32,
              ),
              const SizedBox(width: 12),
              Text(
                'Báo Bảo Trì',
                style: SpatialDesignSystem.headingLarge.copyWith(
                  color: SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              const Spacer(),
              if (state is MaintenanceLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              IconButton(
                onPressed: () {
                  context.read<MaintenanceBloc>().add(
                    const RefreshMaintenanceRequests(driverId: 1),
                  );
                },
                icon: const Icon(Icons.refresh),
                color: SpatialDesignSystem.primaryColor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Quản lý yêu cầu bảo trì xe của bạn',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 16),
          _buildStatsCards(state),
        ],
      ),
    );
  }

  Widget _buildStatsCards(MaintenanceState state) {
    if (state is MaintenanceLoaded) {
      final requests = state.requests;
      final pendingCount = requests.where((r) => r.status?.id == 17).length; // AVAILABLE - chờ xử lý
      final acceptedCount = requests.where((r) => r.status?.id == 18).length; // IN_USE - đã chấp nhận
      final maintenanceCount = requests.where((r) => r.status?.id == 19).length; // MAINTENANCE - đang bảo trì

      return Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Chờ xử lý',
              pendingCount.toString(),
              SpatialDesignSystem.warningColor,
              Icons.pending_actions,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Đã chấp nhận',
              acceptedCount.toString(),
              SpatialDesignSystem.successColor,
              Icons.check_circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Đang bảo trì',
              maintenanceCount.toString(),
              SpatialDesignSystem.primaryColor,
              Icons.build,
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        Expanded(
          child: _buildStatCard('Chờ xử lý', '-', SpatialDesignSystem.warningColor, Icons.pending_actions),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard('Đã chấp nhận', '-', SpatialDesignSystem.successColor, Icons.check_circle),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard('Đang bảo trì', '-', SpatialDesignSystem.primaryColor, Icons.build),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const Spacer(),
                Text(
                  value,
                  style: SpatialDesignSystem.headingMedium.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: SpatialDesignSystem.captionText.copyWith(
                color: SpatialDesignSystem.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMaintenanceContent(BuildContext context, MaintenanceState state) {
    if (state is MaintenanceLoading && state is! MaintenanceLoaded) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state is MaintenanceError && state is! MaintenanceLoaded) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: SpatialDesignSystem.errorColor,
            ),
            const SizedBox(height: 16),
            Text(
              'Không thể tải dữ liệu',
              style: SpatialDesignSystem.headingMedium.copyWith(
                color: SpatialDesignSystem.textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              state.message,
              style: SpatialDesignSystem.bodyMedium.copyWith(
                color: SpatialDesignSystem.textSecondaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                context.read<MaintenanceBloc>().add(
                  const LoadMaintenanceRequests(driverId: 1),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: SpatialDesignSystem.primaryColor,
              ),
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (state is MaintenanceLoaded) {
      final requests = state.requests;
      
      if (requests.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.build_circle_outlined,
                size: 64,
                color: SpatialDesignSystem.textSecondaryColor,
              ),
              const SizedBox(height: 16),
              Text(
                'Chưa có yêu cầu bảo trì',
                style: SpatialDesignSystem.headingMedium.copyWith(
                  color: SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Bạn chưa có yêu cầu bảo trì nào. Nhấn nút + để tạo yêu cầu mới.',
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  color: SpatialDesignSystem.textSecondaryColor,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      }

      return RefreshIndicator(
        onRefresh: () async {
          context.read<MaintenanceBloc>().add(
            const RefreshMaintenanceRequests(driverId: 1),
          );
        },
        child: ListView.builder(
          padding: const EdgeInsets.all(16.0),
          itemCount: requests.length,
          itemBuilder: (context, index) {
            final request = requests[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildMaintenanceCard(context, request),
            );
          },
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildMaintenanceCard(BuildContext context, MaintenanceRequest request) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildStatusBadge(request.status),
                const Spacer(),
                // Emergency badge if available in notes or description
                if (request.description.toLowerCase().contains('khẩn cấp') || 
                    request.description.toLowerCase().contains('emergency')) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.warning, size: 14, color: Colors.red),
                        const SizedBox(width: 4),
                        Text(
                          'Khẩn cấp',
                          style: SpatialDesignSystem.captionText.copyWith(
                            color: Colors.red,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Text(
              request.description,
              style: SpatialDesignSystem.headingSmall.copyWith(
                color: SpatialDesignSystem.textPrimaryColor,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            if (request.notes != null && request.notes!.isNotEmpty) ...[
              Text(
                request.notes!,
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  color: SpatialDesignSystem.textSecondaryColor,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Icon(
                  Icons.directions_car,
                  size: 16,
                  color: SpatialDesignSystem.textSecondaryColor,
                ),
                const SizedBox(width: 4),
                Text(
                  request.vehicle?.licensePlate ?? 'N/A',
                  style: SpatialDesignSystem.captionText.copyWith(
                    color: SpatialDesignSystem.textSecondaryColor,
                  ),
                ),
                const Spacer(),
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: SpatialDesignSystem.textSecondaryColor,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatTime(request.createdAt),
                  style: SpatialDesignSystem.captionText.copyWith(
                    color: SpatialDesignSystem.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(StatusInfo? status) {
    if (status == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: SpatialDesignSystem.textSecondaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: SpatialDesignSystem.textSecondaryColor.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.help_outline, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(
              'Chưa xác định',
              style: SpatialDesignSystem.captionText.copyWith(
                color: Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    Color color;
    IconData icon;

    // Map status based on ID (from our API: 17=AVAILABLE, 18=IN_USE, 19=MAINTENANCE)
    switch (status.id) {
      case 17: // AVAILABLE - chờ xử lý
        color = SpatialDesignSystem.warningColor;
        icon = Icons.pending;
        break;
      case 18: // IN_USE - đã chấp nhận
        color = SpatialDesignSystem.successColor;
        icon = Icons.check_circle_outline;
        break;
      case 19: // MAINTENANCE - đang bảo trì
        color = SpatialDesignSystem.primaryColor;
        icon = Icons.build;
        break;
      default:
        color = SpatialDesignSystem.textSecondaryColor;
        icon = Icons.help_outline;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            _getStatusDisplayName(status),
            style: SpatialDesignSystem.captionText.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusDisplayName(StatusInfo status) {
    switch (status.id) {
      case 17: // AVAILABLE
        return 'Chờ xử lý';
      case 18: // IN_USE  
        return 'Đã chấp nhận';
      case 19: // MAINTENANCE
        return 'Đang bảo trì';
      default:
        return status.name; // Fallback to API name
    }
  }

  Widget _buildFloatingActionButton(BuildContext context) {
    return BlocBuilder<MaintenanceBloc, MaintenanceState>(
      builder: (context, state) {
        final isCreating = state is MaintenanceCreating;
        
        return FloatingActionButton.extended(
          onPressed: isCreating ? null : () => _showCreateMaintenanceDialog(context),
          backgroundColor: SpatialDesignSystem.primaryColor,
          icon: isCreating 
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Icon(Icons.add, color: Colors.white),
          label: Text(
            isCreating ? 'Đang tạo...' : 'Báo bảo trì',
            style: SpatialDesignSystem.captionText.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        );
      },
    );
  }

  void _showCreateMaintenanceDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: SpatialDesignSystem.surfaceColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Tạo yêu cầu bảo trì',
          style: SpatialDesignSystem.headingSmall.copyWith(
            color: SpatialDesignSystem.textPrimaryColor,
          ),
        ),
        content: Text(
          'Chức năng tạo yêu cầu bảo trì sẽ được phát triển trong phiên bản tiếp theo.',
          style: SpatialDesignSystem.bodyMedium.copyWith(
            color: SpatialDesignSystem.textSecondaryColor,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'Đóng',
              style: SpatialDesignSystem.bodyMedium.copyWith(
                color: SpatialDesignSystem.primaryColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} phút trước';
    } else {
      return 'Vừa xong';
    }
  }
}