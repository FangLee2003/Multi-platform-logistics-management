import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ktc_logistics_driver/presentation/design/spatial_ui.dart';
import 'package:ktc_logistics_driver/presentation/components/spatial_glass_card.dart';
import 'package:ktc_logistics_driver/domain/models/maintenance/maintenance_request.dart';
import 'package:ktc_logistics_driver/presentation/blocs/maintenance/maintenance_bloc.dart';

class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Do not create BlocProvider here, use the BlocProvider already provided in app.dart
    // and trigger load event when the screen is first displayed
    return BlocListener<MaintenanceBloc, MaintenanceState>(
      listener: (context, state) {
        // Trigger load event when the screen is first initialized
        if (state is MaintenanceInitial) {
          context.read<MaintenanceBloc>().add(const LoadMaintenanceRequests());
        }
      },
      child: const MaintenanceScreenContent(),
    );
  }
}

class MaintenanceScreenContent extends StatefulWidget {
  const MaintenanceScreenContent({super.key});

  @override
  State<MaintenanceScreenContent> createState() =>
      _MaintenanceScreenContentState();
}

class _MaintenanceScreenContentState extends State<MaintenanceScreenContent> {
  // Add variable to track dark mode
  bool _isDark = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Update dark mode state
    final newIsDark = Theme.of(context).brightness == Brightness.dark;
    if (_isDark != newIsDark) {
      setState(() {
        _isDark = newIsDark;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Update state in build to ensure always correct
    _isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              _isDark
                  ? SpatialDesignSystem.darkBackgroundColor
                  : SpatialDesignSystem.backgroundColor,
              _isDark
                  ? SpatialDesignSystem.darkBackgroundColor.withOpacity(0.8)
                  : SpatialDesignSystem.backgroundColor.withOpacity(0.8),
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
                  content:
                      const Text('Maintenance request created successfully'),
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
                'Report Maintenance',
                style: SpatialDesignSystem.headingLarge.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
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
                        const RefreshMaintenanceRequests(),
                      );
                },
                icon: const Icon(Icons.refresh),
                color: SpatialDesignSystem.primaryColor,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Manage your vehicle maintenance requests',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: _isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
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
      final pendingCount = requests
          .where((r) => r.status?.id == 17)
          .length; // AVAILABLE - pending
      final acceptedCount =
          requests.where((r) => r.status?.id == 18).length; // IN_USE - accepted
      final maintenanceCount = requests
          .where((r) => r.status?.id == 19)
          .length; // MAINTENANCE - under maintenance

      return Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Pending',
              pendingCount.toString(),
              SpatialDesignSystem.warningColor,
              Icons.pending_actions,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Accepted',
              acceptedCount.toString(),
              SpatialDesignSystem.successColor,
              Icons.check_circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'Under Maintenance',
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
          child: _buildStatCard('Pending', '-',
              SpatialDesignSystem.warningColor, Icons.pending_actions),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard('Accepted', '-',
              SpatialDesignSystem.successColor, Icons.check_circle),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard('Under Maintenance', '-',
              SpatialDesignSystem.primaryColor, Icons.build),
        ),
      ],
    );
  }

  Widget _buildStatCard(
      String label, String value, Color color, IconData icon) {
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
                color: _isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMaintenanceContent(
      BuildContext context, MaintenanceState state) {
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
              'Cannot load data',
              style: SpatialDesignSystem.headingMedium.copyWith(
                color: _isDark
                    ? SpatialDesignSystem.textDarkPrimaryColor
                    : SpatialDesignSystem.textPrimaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              state.message,
              style: SpatialDesignSystem.bodyMedium.copyWith(
                color: _isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                context.read<MaintenanceBloc>().add(
                      const LoadMaintenanceRequests(),
                    );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: SpatialDesignSystem.primaryColor,
              ),
              child: const Text('Try again'),
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
                color: _isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
              const SizedBox(height: 16),
              Text(
                'No maintenance requests yet',
                style: SpatialDesignSystem.headingMedium.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You have no maintenance requests. Press the + button to create a new request.',
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
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
                const RefreshMaintenanceRequests(),
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

  Widget _buildMaintenanceCard(
      BuildContext context, MaintenanceRequest request) {
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
                    request.description
                        .toLowerCase()
                        .contains('emergency')) ...[
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                color: _isDark
                    ? SpatialDesignSystem.textDarkPrimaryColor
                    : SpatialDesignSystem.textPrimaryColor,
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
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
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
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
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

            // Add action buttons based on the status
            const SizedBox(height: 16),
            _buildActionButtons(context, request),
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
          color: (_isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor)
              .withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: (_isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor)
                  .withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.help_outline, size: 14, color: Colors.grey),
            const SizedBox(width: 4),
            Text(
              'Unknown',
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
      case 17: // AVAILABLE - pending
        color = SpatialDesignSystem.warningColor;
        icon = Icons.pending;
        break;
      case 18: // IN_USE - accepted
        color = SpatialDesignSystem.successColor;
        icon = Icons.check_circle_outline;
        break;
      case 19: // MAINTENANCE - under maintenance
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
        return 'Pending';
      case 18: // IN_USE
        return 'Accepted';
      case 19: // MAINTENANCE
        return 'Under Maintenance';
      default:
        return status.name; // Fallback to API name
    }
  }

  Widget _buildFloatingActionButton(BuildContext context) {
    return BlocBuilder<MaintenanceBloc, MaintenanceState>(
      builder: (context, state) {
        final isCreating = state is MaintenanceCreating;

        return FloatingActionButton.extended(
          onPressed:
              isCreating ? null : () => _showCreateMaintenanceDialog(context),
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
            isCreating ? 'Creating...' : 'Report maintenance',
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
    final descriptionController = TextEditingController();
    final notesController = TextEditingController();
    String selectedType = MaintenanceType.routine.name;
    int selectedVehicleId =
        1; // Default vehicle ID, should be retrieved from a list

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: _isDark
            ? SpatialDesignSystem.darkSurfaceColor
            : SpatialDesignSystem.surfaceColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Create maintenance request',
          style: SpatialDesignSystem.headingSmall.copyWith(
            color: _isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
          ),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Vehicle selection (would be a dropdown in a real app)
              Text(
                'Vehicle',
                style: SpatialDesignSystem.captionText.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _isDark
                      ? SpatialDesignSystem.darkSurfaceColorSecondary
                      : SpatialDesignSystem.backgroundColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.directions_car,
                        size: 18,
                        color: _isDark
                            ? SpatialDesignSystem.textDarkPrimaryColor
                            : SpatialDesignSystem.textPrimaryColor),
                    const SizedBox(width: 8),
                    Text(
                      'KTC-51A 12345', // Demo value, should be dynamic
                      style: SpatialDesignSystem.bodyMedium.copyWith(
                        color: _isDark
                            ? SpatialDesignSystem.textDarkPrimaryColor
                            : SpatialDesignSystem.textPrimaryColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Maintenance type selection
              Text(
                'Maintenance type',
                style: SpatialDesignSystem.captionText.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
              StatefulBuilder(
                builder: (context, setState) {
                  return DropdownButtonFormField<String>(
                    value: selectedType,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: _isDark
                          ? SpatialDesignSystem.darkSurfaceColorSecondary
                          : SpatialDesignSystem.backgroundColor,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide:
                            BorderSide(color: Colors.grey.withOpacity(0.3)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                    ),
                    dropdownColor: _isDark
                        ? SpatialDesignSystem.darkSurfaceColorSecondary
                        : SpatialDesignSystem.backgroundColor,
                    style: TextStyle(
                      color: _isDark
                          ? SpatialDesignSystem.textDarkPrimaryColor
                          : SpatialDesignSystem.textPrimaryColor,
                    ),
                    items: [
                      DropdownMenuItem(
                        value: MaintenanceType.routine.name,
                        child: Text('Routine maintenance'),
                      ),
                      DropdownMenuItem(
                        value: MaintenanceType.repair.name,
                        child: Text('Repair'),
                      ),
                      DropdownMenuItem(
                        value: MaintenanceType.inspection.name,
                        child: Text('Inspection'),
                      ),
                      DropdownMenuItem(
                        value: MaintenanceType.emergency.name,
                        child: Text('Emergency'),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => selectedType = value);
                      }
                    },
                  );
                },
              ),
              const SizedBox(height: 16),

              // Description input
              Text(
                'Problem description',
                style: SpatialDesignSystem.captionText.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
              TextField(
                controller: descriptionController,
                style: TextStyle(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _isDark
                      ? SpatialDesignSystem.darkSurfaceColorSecondary
                      : SpatialDesignSystem.backgroundColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
                  ),
                  hintText: 'Describe the vehicle issue in detail',
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),

              // Notes input
              Text(
                'Additional notes (optional)',
                style: SpatialDesignSystem.captionText.copyWith(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
              TextField(
                controller: notesController,
                style: TextStyle(
                  color: _isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _isDark
                      ? SpatialDesignSystem.darkSurfaceColorSecondary
                      : SpatialDesignSystem.backgroundColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
                  ),
                  hintText: 'Additional information',
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(
              'Cancel',
              style: SpatialDesignSystem.bodyMedium.copyWith(
                color: _isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              if (descriptionController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Please enter a problem description')),
                );
                return;
              }

              // Create maintenance request
              context.read<MaintenanceBloc>().add(
                    CreateMaintenanceRequest(
                      driverId: 1, // This will be ignored by the service
                      createDto: CreateMaintenanceRequestDto(
                        vehicleId: selectedVehicleId,
                        description: descriptionController.text.trim(),
                        maintenanceType: selectedType,
                        statusId: 51, // MAINTENANCE_PENDING
                        notes: notesController.text.trim().isNotEmpty
                            ? notesController.text.trim()
                            : null,
                      ),
                    ),
                  );

              Navigator.of(dialogContext).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: SpatialDesignSystem.primaryColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Create request',
              style: SpatialDesignSystem.bodyMedium.copyWith(
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _formatTime(DateTime dateTime) {
  final now = DateTime.now();
  final difference = now.difference(dateTime);

  if (difference.inDays > 0) {
    return '${difference.inDays} days ago';
  } else if (difference.inHours > 0) {
    return '${difference.inHours} hours ago';
  } else if (difference.inMinutes > 0) {
    return '${difference.inMinutes} minutes ago';
  } else {
    return 'Just now';
  }
}

// Widget to show action buttons based on maintenance request status
Widget _buildActionButtons(BuildContext context, MaintenanceRequest request) {
  final status = request.status?.id;

  // No status or no need for actions
  if (status == null) {
    return const SizedBox.shrink();
  }

  // Scheduled/Accepted - Status 18 (IN_USE)
  // Show "Take vehicle to garage" button for scheduled maintenance
  if (status == 18) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton.icon(
          onPressed: () => _showTakeToGarageDialog(context, request),
          icon: const Icon(Icons.garage_outlined),
          label: const Text('Take vehicle to garage'),
          style: OutlinedButton.styleFrom(
            foregroundColor: SpatialDesignSystem.primaryColor,
            side: BorderSide(color: SpatialDesignSystem.primaryColor),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  // Under Maintenance - Status 19 (MAINTENANCE)
  // Show "View Details" button since driver is waiting
  else if (status == 19) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton.icon(
          onPressed: () => _showMaintenanceDetailDialog(context, request),
          icon: const Icon(Icons.info_outline),
          label: const Text('View details'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.blue,
            side: BorderSide(color: Colors.blue),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  // Completed, ready for pickup - Status 17 (AVAILABLE)
  // Show "Pick up vehicle" button
  else if (status == 17) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        ElevatedButton.icon(
          onPressed: () => _showPickUpVehicleDialog(context, request),
          icon: const Icon(Icons.check),
          label: const Text('Pick up vehicle'),
          style: ElevatedButton.styleFrom(
            backgroundColor: SpatialDesignSystem.successColor,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  // Pending - Status 51 (MAINTENANCE_PENDING)
  // Show "Cancel" button
  else if (status == 51) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton.icon(
          onPressed: () => _showCancelMaintenanceDialog(context, request),
          icon: const Icon(Icons.cancel_outlined),
          label: const Text('Cancel request'),
          style: OutlinedButton.styleFrom(
            foregroundColor: SpatialDesignSystem.errorColor,
            side: BorderSide(color: SpatialDesignSystem.errorColor),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
        ),
      ],
    );
  }

  return const SizedBox.shrink();
}

// Dialog for driver to take vehicle to garage (Step 5)
void _showTakeToGarageDialog(BuildContext context, MaintenanceRequest request) {
  final notesController = TextEditingController();

  showDialog(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: SpatialDesignSystem.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        'Take vehicle to garage',
        style: SpatialDesignSystem.headingSmall.copyWith(
          color: SpatialDesignSystem.textPrimaryColor,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm taking vehicle ${request.vehicle?.licensePlate ?? "N/A"} to garage for maintenance.',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Notes (optional)',
            style: SpatialDesignSystem.captionText.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          TextField(
            controller: notesController,
            decoration: InputDecoration(
              filled: true,
              fillColor: SpatialDesignSystem.backgroundColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
              ),
              hintText: 'Add notes when handing over the vehicle...',
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(
            'Hủy',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            // Update status to MAINTENANCE (19)
            context.read<MaintenanceBloc>().add(
                  UpdateMaintenanceRequest(
                    driverId: 0, // Not used in our updated service
                    maintenanceId: request.id,
                    updateDto: CreateMaintenanceRequestDto(
                      vehicleId: request.vehicle?.id ?? 0,
                      description: request.description,
                      maintenanceType: request.maintenanceType,
                      statusId: 19, // MAINTENANCE status
                      notes: notesController.text.trim().isNotEmpty
                          ? notesController.text.trim()
                          : null,
                    ),
                  ),
                );

            Navigator.of(dialogContext).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Confirmed vehicle taken to garage'),
                backgroundColor: Colors.green,
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: SpatialDesignSystem.primaryColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Confirm',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: Colors.white,
            ),
          ),
        ),
      ],
    ),
  );
}

// Dialog for showing maintenance details
void _showMaintenanceDetailDialog(
    BuildContext context, MaintenanceRequest request) {
  showDialog(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: SpatialDesignSystem.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        'Maintenance details',
        style: SpatialDesignSystem.headingSmall.copyWith(
          color: SpatialDesignSystem.textPrimaryColor,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Vehicle info
          Row(
            children: [
              const Icon(Icons.directions_car, size: 20),
              const SizedBox(width: 8),
              Text(
                'Vehicle: ${request.vehicle?.licensePlate ?? "N/A"}',
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Maintenance type
          Row(
            children: [
              const Icon(Icons.category, size: 20),
              const SizedBox(width: 8),
              Text(
                'Type: ${request.maintenanceType}',
                style: SpatialDesignSystem.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Date info
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 20),
              const SizedBox(width: 8),
              Text(
                'Date: ${request.formattedMaintenanceDate}',
                style: SpatialDesignSystem.bodyMedium,
              ),
            ],
          ),
          const Divider(height: 24),

          // Description
          Text(
            'Description:',
            style: SpatialDesignSystem.captionText.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            request.description,
            style: SpatialDesignSystem.bodyMedium,
          ),
          const SizedBox(height: 12),

          // Notes if available
          if (request.notes != null && request.notes!.isNotEmpty) ...[
            Text(
              'Notes:',
              style: SpatialDesignSystem.captionText.copyWith(
                color: SpatialDesignSystem.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              request.notes!,
              style: SpatialDesignSystem.bodyMedium,
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(
            'Close',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.primaryColor,
            ),
          ),
        ),
      ],
    ),
  );
}

// Dialog for driver to pick up vehicle after maintenance (Step 7)
void _showPickUpVehicleDialog(
    BuildContext context, MaintenanceRequest request) {
  final notesController = TextEditingController();

  showDialog(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: SpatialDesignSystem.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        'Pick up vehicle',
        style: SpatialDesignSystem.headingSmall.copyWith(
          color: SpatialDesignSystem.textPrimaryColor,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Confirm picking up vehicle ${request.vehicle?.licensePlate ?? "N/A"} after maintenance is completed.',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Notes (optional)',
            style: SpatialDesignSystem.captionText.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          TextField(
            controller: notesController,
            decoration: InputDecoration(
              filled: true,
              fillColor: SpatialDesignSystem.backgroundColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
              ),
              hintText: 'Add notes when picking up the vehicle...',
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(
            'Hủy',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            // Update status to IN_USE (18)
            context.read<MaintenanceBloc>().add(
                  UpdateMaintenanceRequest(
                    driverId: 0, // Not used in our updated service
                    maintenanceId: request.id,
                    updateDto: CreateMaintenanceRequestDto(
                      vehicleId: request.vehicle?.id ?? 0,
                      description: request.description,
                      maintenanceType: request.maintenanceType,
                      statusId: 18, // IN_USE status
                      notes: notesController.text.trim().isNotEmpty
                          ? notesController.text.trim()
                          : null,
                    ),
                  ),
                );

            Navigator.of(dialogContext).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Confirmed vehicle picked up'),
                backgroundColor: Colors.green,
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: SpatialDesignSystem.successColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Confirm',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: Colors.white,
            ),
          ),
        ),
      ],
    ),
  );
}

// Dialog for canceling a maintenance request
void _showCancelMaintenanceDialog(
    BuildContext context, MaintenanceRequest request) {
  final reasonController = TextEditingController();

  showDialog(
    context: context,
    builder: (dialogContext) => AlertDialog(
      backgroundColor: SpatialDesignSystem.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Text(
        'Cancel maintenance request',
        style: SpatialDesignSystem.headingSmall.copyWith(
          color: SpatialDesignSystem.textPrimaryColor,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Are you sure you want to cancel the maintenance request for vehicle ${request.vehicle?.licensePlate ?? "N/A"}?',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Reason for cancellation',
            style: SpatialDesignSystem.captionText.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          TextField(
            controller: reasonController,
            decoration: InputDecoration(
              filled: true,
              fillColor: SpatialDesignSystem.backgroundColor,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
              ),
              hintText: 'Enter reason for cancellation...',
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            maxLines: 2,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(
            'Close',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: SpatialDesignSystem.textSecondaryColor,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            if (reasonController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Please enter reason for cancellation')),
              );
              return;
            }

            // Delete/Cancel the request
            context.read<MaintenanceBloc>().add(
                  DeleteMaintenanceRequest(
                    driverId: 0, // Not used in our updated service
                    maintenanceId: request.id,
                  ),
                );

            Navigator.of(dialogContext).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: SpatialDesignSystem.errorColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Cancel request',
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: Colors.white,
            ),
          ),
        ),
      ],
    ),
  );
}
