import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../design/spatial_ui.dart';
import '../../components/spatial_stat_card.dart';
import '../../components/spatial_button.dart';
import '../../components/spatial_glass_card.dart';
import 'package:ktc_logistics_driver/presentation/blocs/blocs.dart';
import '../../components/delivery_charts.dart';
import '../../utils/performance_helper.dart';

class DashboardScreenSpatial extends StatefulWidget {
  final bool showBottomNav;

  const DashboardScreenSpatial({
    super.key,
    this.showBottomNav = true,
  });

  @override
  State<DashboardScreenSpatial> createState() => _DashboardScreenSpatialState();
}

class _DashboardScreenSpatialState extends State<DashboardScreenSpatial>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  int _selectedIndex = 0;
  bool _isSidebarExpanded = true;

  // Cache these values to avoid repeated expensive calls
  bool _isDark = false;
  Size _screenSize = Size.zero;
  bool _isTablet = false;
  bool _needsUpdate = true;

  @override
  void initState() {
    super.initState();

    // Start performance monitoring in debug mode
    PerformanceHelper.startFrameMonitoring();
    PerformanceHelper.logPerformanceTip(
        'Dashboard optimized with lazy loading and RepaintBoundary');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_needsUpdate) {
      _updateCachedValues();
      _needsUpdate = false;
    }
  }

  void _updateCachedValues() {
    final newIsDark = Theme.of(context).brightness == Brightness.dark;
    final newScreenSize = MediaQuery.of(context).size;
    final newIsTablet = newScreenSize.width > 768;

    // Only update if values actually changed
    if (_isDark != newIsDark ||
        _screenSize != newScreenSize ||
        _isTablet != newIsTablet) {
      _isDark = newIsDark;
      _screenSize = newScreenSize;
      _isTablet = newIsTablet;
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: _isDark
          ? SpatialDesignSystem.darkBackgroundColor
          : SpatialDesignSystem.backgroundColor,
      body: Row(
        children: [
          // Sidebar Navigation
          if (_isTablet)
            RepaintBoundary(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                width: _isSidebarExpanded ? 250 : 80,
                child: _SidebarWidget(
                  isTablet: _isTablet,
                  isDark: _isDark,
                  isSidebarExpanded: _isSidebarExpanded,
                  selectedIndex: _selectedIndex,
                  onToggleSidebar: () {
                    setState(() {
                      _isSidebarExpanded = !_isSidebarExpanded;
                    });
                  },
                  onNavigate: (index) {
                    setState(() {
                      _selectedIndex = index;
                    });
                    _handleNavigation(index);
                  },
                ),
              ),
            ),

          // Main Content
          Expanded(
            child: Column(
              children: [
                // Top App Bar
                _DashboardAppBar(isDark: _isDark, isTablet: _isTablet),

                // Content Area
                Expanded(
                  child: _DashboardContent(
                    isDark: _isDark,
                    isTablet: _isTablet,
                    onStartTracking: () => _startTracking(context),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      // Bottom Navigation for Mobile
      bottomNavigationBar: !_isTablet ? _buildBottomNav() : null,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _startTracking(context);
        },
        backgroundColor: SpatialDesignSystem.primaryColor,
        child: const Icon(Icons.location_on, color: Colors.white),
      ),
    );
  }

  void _handleNavigation(int index) {
    switch (index) {
      case 0: // Dashboard - đã ở trang hiện tại
        break;
      case 1: // Deliveries
        Navigator.pushNamed(context, '/deliveries');
        break;
      case 3: // Profile
        Navigator.pushNamed(context, '/profile');
        break;
    }
  }

  void _startTracking(BuildContext context) {
    final trackingBloc = BlocProvider.of<TrackingBloc>(context);

    trackingBloc.add(StartTrackingEvent(
      driverId: "driver_123",
      vehicleId: "vehicle_456",
      routeId: "RT-2025-08-14-01",
    ));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.location_on, color: Colors.white),
            SizedBox(width: 10),
            Text('Location tracking started'),
          ],
        ),
        backgroundColor: SpatialDesignSystem.successColor,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Widget _buildBottomNav() {
    // Only show bottom nav if showBottomNav is true
    if (!widget.showBottomNav) {
      return const SizedBox.shrink();
    }

    return BottomNavigationBar(
      currentIndex: _selectedIndex,
      onTap: (index) {
        setState(() {
          _selectedIndex = index;
        });

        // Thêm điều hướng đến trang tương ứng
        switch (index) {
          case 0: // Dashboard - đã ở trang hiện tại
            break;
          case 1: // Deliveries - chuyển hướng đến màn hình gộp mới
            Navigator.pushNamed(context, '/deliveries');
            break;
          case 2: // Profile
            Navigator.pushNamed(context, '/profile');
            break;
        }
      },
      type: BottomNavigationBarType.fixed,
      backgroundColor: Theme.of(context).colorScheme.surface,
      selectedItemColor: SpatialDesignSystem.primaryColor,
      unselectedItemColor: SpatialDesignSystem.textSecondaryColor,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: "Dashboard",
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.local_shipping),
          label: "Deliveries",
        ),
        // BottomNavigationBarItem(
        //   icon: Icon(Icons.shopping_bag),
        //   label: "Orders",
        // ),
        BottomNavigationBarItem(
          icon: Icon(Icons.account_circle),
          label: "Profile",
        ),
      ],
    );
  }
}

// Separate Widget Components for better performance
class _SidebarWidget extends StatelessWidget {
  final bool isTablet;
  final bool isDark;
  final bool isSidebarExpanded;
  final int selectedIndex;
  final VoidCallback onToggleSidebar;
  final Function(int) onNavigate;

  const _SidebarWidget({
    required this.isTablet,
    required this.isDark,
    required this.isSidebarExpanded,
    required this.selectedIndex,
    required this.onToggleSidebar,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      borderRadius: const BorderRadius.only(
        topRight: Radius.circular(16),
        bottomRight: Radius.circular(16),
      ),
      backgroundColor: isDark
          ? Colors.black.withValues(alpha: 0.3)
          : Colors.white.withValues(alpha: 0.6),
      child: Column(
        children: [
          const SizedBox(height: 24),
          // Logo
          _buildLogo(),
          const SizedBox(height: 24),

          // Navigation Items
          _buildNavItem(0, Icons.dashboard, "Dashboard"),
          _buildNavItem(1, Icons.local_shipping, "Deliveries"),
          _buildNavItem(3, Icons.account_circle, "Profile"),

          const Spacer(),

          // Toggle Sidebar Size
          _buildToggleButton(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return isSidebarExpanded
        ? Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: SpatialDesignSystem.primaryColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Text(
                      "KTC",
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  "KTC Logistics",
                  style: SpatialDesignSystem.headingSmall.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
              ],
            ),
          )
        : Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: SpatialDesignSystem.primaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text(
                  "KTC",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = index == selectedIndex;

    return GestureDetector(
      onTap: () => onNavigate(index),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? SpatialDesignSystem.primaryColor.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: isSelected
              ? Border.all(color: SpatialDesignSystem.primaryColor, width: 1)
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? SpatialDesignSystem.primaryColor
                  : (isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor),
              size: 24,
            ),
            if (isSidebarExpanded) ...[
              const SizedBox(width: 16),
              Text(
                label,
                style: SpatialDesignSystem.subtitleMedium.copyWith(
                  color: isSelected
                      ? SpatialDesignSystem.primaryColor
                      : (isDark
                          ? SpatialDesignSystem.textDarkSecondaryColor
                          : SpatialDesignSystem.textSecondaryColor),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildToggleButton() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GestureDetector(
        onTap: onToggleSidebar,
        child: Row(
          mainAxisAlignment: isSidebarExpanded
              ? MainAxisAlignment.end
              : MainAxisAlignment.center,
          children: [
            Icon(
              isSidebarExpanded
                  ? Icons.keyboard_double_arrow_left
                  : Icons.keyboard_double_arrow_right,
              color: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
            ),
            if (isSidebarExpanded) ...[
              const SizedBox(width: 8),
              Text(
                "Collapse",
                style: SpatialDesignSystem.captionText.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DashboardAppBar extends StatelessWidget {
  final bool isDark;
  final bool isTablet;

  const _DashboardAppBar({
    required this.isDark,
    required this.isTablet,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: isDark
          ? SpatialDesignSystem.darkBackgroundColor
          : SpatialDesignSystem.backgroundColor,
      elevation: 0,
      centerTitle: true,
      title: Text(
        'Dashboard',
        style: SpatialDesignSystem.headingMedium.copyWith(
          color: isDark
              ? SpatialDesignSystem.textDarkPrimaryColor
              : SpatialDesignSystem.textPrimaryColor,
        ),
      ),
      automaticallyImplyLeading: false,
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final bool isDark;
  final bool isTablet;
  final VoidCallback onStartTracking;

  const _DashboardContent({
    required this.isDark,
    required this.isTablet,
    required this.onStartTracking,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Welcome Section
        _WelcomeSection(isDark: isDark),
        const SizedBox(height: 24),

        // // Current Activity & Route
        // _CurrentActivitySection(isDark: isDark, isTablet: isTablet),
        // const SizedBox(height: 24),

        Text(
          "Delivery Analytics",
          style: SpatialDesignSystem.subtitleLarge.copyWith(
            color: isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
          ),
        ),

        // Stats Grid
        _StatsGridSection(isDark: isDark, isTablet: isTablet),
        const SizedBox(height: 24),

        // Analytics Charts with lazy loading
        _LazyAnalyticsSection(isDark: isDark, isTablet: isTablet),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _WelcomeSection extends StatelessWidget {
  final bool isDark;

  const _WelcomeSection({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: _WelcomeText(isDark: isDark),
          ),
          const SizedBox(width: 16),
          _DeliveryScoreCard(isDark: isDark),
        ],
      ),
    );
  }
}

class _WelcomeText extends StatelessWidget {
  final bool isDark;

  const _WelcomeText({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: "Good Morning,\n",
                style: SpatialDesignSystem.headingSmall.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              TextSpan(
                text: "Việt Hùng",
                style: SpatialDesignSystem.headingLarge.copyWith(
                  color: SpatialDesignSystem.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "Your performance is excellent! Keep up the good work.",
          style: SpatialDesignSystem.bodyMedium.copyWith(
            color: isDark
                ? SpatialDesignSystem.textDarkSecondaryColor
                : SpatialDesignSystem.textSecondaryColor,
          ),
        ),
        const SizedBox(height: 16),
        const _TrackingStatus(),
      ],
    );
  }
}

class _TrackingStatus extends StatelessWidget {
  const _TrackingStatus();

  @override
  Widget build(BuildContext context) {
    return BlocSelector<TrackingBloc, TrackingState, bool>(
      selector: (state) => state is TrackingActiveState,
      builder: (context, isTracking) {
        if (isTracking) {
          return const Row(
            children: [
              Icon(
                Icons.check_circle,
                color: SpatialDesignSystem.successColor,
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                "Location tracking active",
                style: TextStyle(
                  color: SpatialDesignSystem.successColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          );
        }
        return const Row(
          children: [
            Icon(
              Icons.info_outline,
              color: SpatialDesignSystem.warningColor,
              size: 20,
            ),
            SizedBox(width: 8),
            Text(
              "Location tracking inactive",
              style: TextStyle(
                color: SpatialDesignSystem.warningColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _DeliveryScoreCard extends StatelessWidget {
  final bool isDark;

  const _DeliveryScoreCard({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: SpatialDesignSystem.accentGradient,
            ),
            child: const Center(
              child: Icon(
                Icons.emoji_events,
                color: Colors.white,
                size: 30,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "95%",
            style: SpatialDesignSystem.headingMedium.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          Text(
            "Delivery Score",
            style: SpatialDesignSystem.captionText.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _CurrentActivitySection extends StatelessWidget {
  final bool isDark;
  final bool isTablet;

  const _CurrentActivitySection({
    required this.isDark,
    required this.isTablet,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Current Activity",
          style: SpatialDesignSystem.subtitleLarge.copyWith(
            color: isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
          ),
        ),
        const SizedBox(height: 16),
        _buildCurrentRouteCard(context),
      ],
    );
  }

  Widget _buildCurrentRouteCard(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      gradient: LinearGradient(
        colors: [
          SpatialDesignSystem.primaryColor.withValues(alpha: 0.1),
          SpatialDesignSystem.accentColor.withValues(alpha: 0.05),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Active Route",
                style: SpatialDesignSystem.subtitleMedium.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color:
                      SpatialDesignSystem.successColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color:
                        SpatialDesignSystem.successColor.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  "In Progress",
                  style: SpatialDesignSystem.captionText.copyWith(
                    color: SpatialDesignSystem.successColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Row(
            children: [
              Icon(Icons.route, color: SpatialDesignSystem.primaryColor),
              SizedBox(width: 8),
              Text("Route #RT-2025-08-14-01"),
            ],
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Icon(Icons.timer_outlined,
                  color: SpatialDesignSystem.accentColor),
              SizedBox(width: 8),
              Text("Started at 08:30 AM (2h 45m elapsed)"),
            ],
          ),
          const SizedBox(height: 12),
          const Row(
            children: [
              Icon(Icons.local_shipping_outlined,
                  color: SpatialDesignSystem.warningColor),
              SizedBox(width: 8),
              Text("Vehicle: Delivery Van #KTC-2025"),
            ],
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              return Row(
                children: [
                  SizedBox(
                    width: (constraints.maxWidth - 16) / 2,
                    child: SpatialButton(
                      text: "See Details",
                      textColor: SpatialDesignSystem.primaryColor,
                      onPressed: () {
                        Navigator.pushNamed(context, '/order-detail',
                            arguments: 'ORD-2025-08-14-042');
                      },
                      iconData: Icons.info_outline,
                      isGlass: false,
                      backgroundColor: SpatialDesignSystem.primaryColor
                          .withValues(alpha: 0.5),
                      isOutlined: true,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 16),
                    ),
                  ),
                  const SizedBox(width: 16),
                  SizedBox(
                    width: (constraints.maxWidth - 16) / 2,
                    child: SpatialButton(
                      text: "Navigation",
                      textColor: SpatialDesignSystem.successColor,
                      iconData: Icons.directions,
                      isGlass: false,
                      backgroundColor: SpatialDesignSystem.successColor
                          .withValues(alpha: 0.8),
                      isOutlined: true,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 16),
                      onPressed: () async {
                        // Navigation logic here
                      },
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _StatsGridSection extends StatelessWidget {
  final bool isDark;
  final bool isTablet;

  const _StatsGridSection({
    required this.isDark,
    required this.isTablet,
  });

  // Cache the stats data to avoid recreating widgets
  static const List<Map<String, dynamic>> _statsData = [
    {
      'title': "Completed Today",
      'value': "8",
      'icon': Icons.check_circle_outline,
      'iconColor': SpatialDesignSystem.successColor,
      'isPositive': true,
      'changePercentage': "12",
    },
    {
      'title': "Pending",
      'value': "3",
      'icon': Icons.pending_actions,
      'iconColor': SpatialDesignSystem.warningColor,
      'isPositive': false,
      'changePercentage': "5",
    },
    {
      'title': "Total Distance",
      'value': "42.5 km",
      'icon': Icons.timeline,
      'iconColor': SpatialDesignSystem.accentColor,
      'isPositive': false,
      'changePercentage': "3",
    },
    {
      'title': "Earnings",
      'value': "\$124.50",
      'icon': Icons.attach_money,
      'iconColor': SpatialDesignSystem.primaryColor,
      'isPositive': true,
      'changePercentage': "8",
    },
  ];

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: GridView.builder(
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: isTablet ? 4 : 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.2,
        ),
        itemCount: _statsData.length,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) {
          final stat = _statsData[index];
          return StatCard(
            title: stat['title'],
            value: stat['value'],
            icon: stat['icon'],
            iconColor: stat['iconColor'],
            showArrow: true,
            isPositive: stat['isPositive'],
            changePercentage: stat['changePercentage'],
          );
        },
      ),
    );
  }
}

class _LazyAnalyticsSection extends StatefulWidget {
  final bool isDark;
  final bool isTablet;

  const _LazyAnalyticsSection({
    required this.isDark,
    required this.isTablet,
  });

  @override
  State<_LazyAnalyticsSection> createState() => _LazyAnalyticsSectionState();
}

class _LazyAnalyticsSectionState extends State<_LazyAnalyticsSection>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  bool _shouldRenderCharts = false;

  @override
  void initState() {
    super.initState();
    // Delay chart rendering to improve initial render performance
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          setState(() {
            _shouldRenderCharts = true;
          });
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    if (!_shouldRenderCharts) {
      return RepaintBoundary(
        child: Container(
          height: 400,
          margin: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: widget.isDark
                ? Colors.grey[800]?.withValues(alpha: 0.3)
                : Colors.grey[200]?.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      );
    }

    return RepaintBoundary(
      child: _AnalyticsChartsSection(
        isDark: widget.isDark,
        isTablet: widget.isTablet,
      ),
    );
  }
}

class _AnalyticsChartsSection extends StatelessWidget {
  final bool isDark;
  final bool isTablet;

  const _AnalyticsChartsSection({
    required this.isDark,
    required this.isTablet,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Weekly Delivery Trend",
                style: SpatialDesignSystem.subtitleMedium.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              const SizedBox(height: 16),
              RepaintBoundary(
                child: SizedBox(
                  height: 200, // Fixed height để tránh layout shifts
                  child: DeliveryAreaChart(isDark: isDark),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: SpatialDesignSystem.primaryColor
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: SpatialDesignSystem.primaryColor
                              .withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            "Average",
                            style: SpatialDesignSystem.captionText.copyWith(
                              color: isDark
                                  ? SpatialDesignSystem.textDarkSecondaryColor
                                  : SpatialDesignSystem.textSecondaryColor,
                            ),
                          ),
                          Text(
                            "23 deliveries",
                            style: SpatialDesignSystem.bodyMedium.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? SpatialDesignSystem.textDarkPrimaryColor
                                  : SpatialDesignSystem.textPrimaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: SpatialDesignSystem.successColor
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: SpatialDesignSystem.successColor
                              .withValues(alpha: 0.3),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            "Growth",
                            style: SpatialDesignSystem.captionText.copyWith(
                              color: isDark
                                  ? SpatialDesignSystem.textDarkSecondaryColor
                                  : SpatialDesignSystem.textSecondaryColor,
                            ),
                          ),
                          Text(
                            "+12.5%",
                            style: SpatialDesignSystem.bodyMedium.copyWith(
                              fontWeight: FontWeight.bold,
                              color: SpatialDesignSystem.successColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        isTablet
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _buildPieChartCard(),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildScatterChartCard(),
                  ),
                ],
              )
            : Column(
                children: [
                  _buildPieChartCard(),
                  const SizedBox(height: 16),
                  _buildScatterChartCard(),
                ],
              ),
      ],
    );
  }

  Widget _buildPieChartCard() {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Delivery Types",
            style: SpatialDesignSystem.subtitleMedium.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: IntrinsicWidth(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Pie Chart on the left
                  RepaintBoundary(
                    child: SizedBox(
                      height: 180, // Fixed height
                      width: 180, // Fixed width to match height
                      child: DeliveryTypePieChart(isDark: isDark),
                    ),
                  ),
                  const SizedBox(width: 24),
                  // Legends on the right
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildVerticalPieChartLegend(
                          SpatialDesignSystem.primaryColor, "Regular"),
                      const SizedBox(height: 12),
                      _buildVerticalPieChartLegend(
                          SpatialDesignSystem.accentColor, "Express"),
                      const SizedBox(height: 12),
                      _buildVerticalPieChartLegend(
                          SpatialDesignSystem.warningColor, "Overnight"),
                      const SizedBox(height: 12),
                      _buildVerticalPieChartLegend(
                          SpatialDesignSystem.successColor, "Premium"),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalPieChartLegend(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: SpatialDesignSystem.captionText.copyWith(
            color: isDark
                ? SpatialDesignSystem.textDarkSecondaryColor
                : SpatialDesignSystem.textSecondaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildScatterChartCard() {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Delivery Distribution",
            style: SpatialDesignSystem.subtitleMedium.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Time vs. Distance correlation",
            style: SpatialDesignSystem.captionText.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 16),
          RepaintBoundary(
            child: SizedBox(
              height: 180, // Fixed height
              child: DeliveryScatterChart(isDark: isDark),
            ),
          ),
        ],
      ),
    );
  }
}
