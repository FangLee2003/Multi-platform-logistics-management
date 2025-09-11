import 'package:flutter/material.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_detail_response.dart';
import 'package:ktc_logistics_driver/domain/models/delivery/delivery_status_update.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_status_update.dart';
import 'package:ktc_logistics_driver/presentation/components/spatial_button.dart';
import 'package:ktc_logistics_driver/presentation/components/spatial_glass_card.dart';
import 'package:ktc_logistics_driver/presentation/components/spatial_text_field.dart';
import 'package:ktc_logistics_driver/presentation/design/spatial_ui.dart';
import 'package:ktc_logistics_driver/presentation/screens/order/order_detail_screen.dart';
import 'package:ktc_logistics_driver/services/delivery_services.dart';
import 'package:ktc_logistics_driver/services/orders_services.dart';
import 'package:ktc_logistics_driver/services/googlemaps_services.dart';
import 'package:ktc_logistics_driver/presentation/helpers/url_launcher_frave.dart';
import 'package:timeline_tile/timeline_tile.dart';
import 'dart:ui';
import 'package:intl/intl.dart';

// Tab chứa dữ liệu cấu hình
class DeliveryTab {
  final String text;
  final Widget Function() contentBuilder;

  DeliveryTab({required this.text, required this.contentBuilder});
}

class DeliveryDetailScreen extends StatefulWidget {
  final String deliveryId;

  const DeliveryDetailScreen({
    super.key,
    required this.deliveryId,
  });

  @override
  State<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<DeliveryTab> _tabs;
  String _selectedStatus = 'Assigned'; // Trạng thái mặc định
  final _noteController = TextEditingController();
  bool _isUpdatingStatus = false;
  bool _isLoading = true;
  String _errorMessage = '';

  DeliveryDetailResponse? _deliveryDetail;

  // Danh sách các trạng thái có thể có của một chuyến giao hàng
  final List<String> _statusOptions = [
    'Assigned',
    'Started',
    'In Progress',
    'Completed',
    'Cancelled',
  ];

  @override
  void initState() {
    super.initState();

    // Khởi tạo danh sách tab một lần duy nhất
    _tabs = [
      DeliveryTab(text: "Overview", contentBuilder: _buildOverviewTab),
      DeliveryTab(text: "Orders", contentBuilder: _buildOrdersTab),
    ];

    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });

    // Lấy dữ liệu chi tiết của chuyến giao hàng từ API
    _loadDeliveryDetails();
  }

  Future<void> _loadDeliveryDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    // Khai báo biến bên ngoài khối try để có thể truy cập từ cả try và catch
    int? deliveryId;
    String deliveryIdStr = widget.deliveryId;

    try {
      // Kiểm tra nếu ID là số lớn (như 85797) thì dùng trực tiếp
      if (int.tryParse(deliveryIdStr) != null &&
          int.parse(deliveryIdStr) > 10000) {
        deliveryId = int.parse(deliveryIdStr);
        debugPrint('Using numeric ID directly: $deliveryId');
      }
      // Nếu không phải số lớn, thử xử lý định dạng "DEL-26009"
      else if (deliveryIdStr.contains('-')) {
        // Tách lấy phần số sau dấu gạch ngang
        final parts = deliveryIdStr.split('-');
        if (parts.length > 1 && int.tryParse(parts[1]) != null) {
          deliveryId = int.parse(parts[1]); // Lấy "26009" từ "DEL-26009"
          debugPrint('Extracted numeric ID from format: $deliveryId');
        } else {
          throw FormatException(
              'Không thể phân tích mã giao hàng: $deliveryIdStr');
        }
      } else {
        // Nếu không có dấu gạch ngang, thử parse trực tiếp
        deliveryId = int.parse(deliveryIdStr);
        debugPrint('Parsed ID as number: $deliveryId');
      }

      debugPrint('Calling delivery service with ID: $deliveryId');
      final detail = await deliveryServices.getDeliveryDetail(deliveryId);

      if (detail != null) {
        setState(() {
          _deliveryDetail = detail;
          _isLoading = false;

          // Cập nhật trạng thái từ dữ liệu API
          if (detail.status != null) {
            _selectedStatus = _mapApiStatusToUiStatus(detail.status!);
          }
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Không thể tải dữ liệu chi tiết đơn hàng $deliveryId';
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Lỗi: $e';
      });
    }
  }

  // Chuyển đổi trạng thái từ API sang trạng thái hiển thị UI
  String _mapApiStatusToUiStatus(String apiStatus) {
    switch (apiStatus.toUpperCase()) {
      case 'ASSIGNED':
        return 'Assigned';
      case 'STARTED':
        return 'Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return apiStatus; // Giữ nguyên nếu không có mapping
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Hiển thị loading nếu đang tải dữ liệu
    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark
            ? SpatialDesignSystem.darkBackgroundColor
            : SpatialDesignSystem.backgroundColor,
        appBar: AppBar(
          title: Text(
            "Delivery #${widget.deliveryId}",
            style: SpatialDesignSystem.subtitleLarge.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back,
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                "Đang tải dữ liệu...",
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              )
            ],
          ),
        ),
      );
    }

    // Hiển thị lỗi nếu có
    if (_errorMessage.isNotEmpty) {
      return Scaffold(
        backgroundColor: isDark
            ? SpatialDesignSystem.darkBackgroundColor
            : SpatialDesignSystem.backgroundColor,
        appBar: AppBar(
          title: Text(
            "Delivery #${widget.deliveryId}",
            style: SpatialDesignSystem.subtitleLarge.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back,
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _errorMessage,
                textAlign: TextAlign.center,
                style: SpatialDesignSystem.bodyMedium.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 16),
              SpatialButton(
                text: "Thử lại",
                onPressed: _loadDeliveryDetails,
                isGlass: true,
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark
          ? SpatialDesignSystem.darkBackgroundColor
          : SpatialDesignSystem.backgroundColor,
      appBar: AppBar(
        title: Text(
          "Delivery #${_deliveryDetail?.deliveryCode ?? widget.deliveryId}",
          style: SpatialDesignSystem.subtitleLarge.copyWith(
            color: isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Status Card
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: _buildStatusCard(),
          ),

          // Tab Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TabBar(
              controller: _tabController,
              indicator: UnderlineTabIndicator(
                borderSide: BorderSide(
                  color: SpatialDesignSystem.primaryColor,
                ),
                insets: const EdgeInsets.symmetric(horizontal: 16.0),
              ),
              labelStyle: SpatialDesignSystem.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
              padding: const EdgeInsets.symmetric(vertical: 4),
              labelColor: SpatialDesignSystem.primaryColor,
              unselectedLabelColor: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
              isScrollable: false,
              tabs: _tabs
                  .map((tab) => Tab(
                        text: tab.text,
                      ))
                  .toList(),
            ),
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _tabs.map((tab) => tab.contentBuilder()).toList(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildStatusCard() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                "KTC Logistics",
                style: SpatialDesignSystem.headingSmall.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor().withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _selectedStatus,
                  style: SpatialDesignSystem.bodySmall.copyWith(
                    color: _getStatusColor(),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "Route #${_deliveryDetail?.routeName ?? 'RT-${widget.deliveryId}'}",
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
            ),
          ),
          const SizedBox(height: 20),
          LinearProgressIndicator(
            value: _getProgressValue(),
            backgroundColor: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.05),
            valueColor:
                AlwaysStoppedAnimation<Color>(SpatialDesignSystem.primaryColor),
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _getStatusDescription(),
                style: SpatialDesignSystem.captionText.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                "${(_getProgressValue() * 100).toInt()}% complete",
                style: SpatialDesignSystem.captionText.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (_selectedStatus) {
      case 'Assigned':
        return Colors.blue;
      case 'Started':
        return Colors.orange;
      case 'In Progress':
        return SpatialDesignSystem.primaryColor;
      case 'Completed':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  double _getProgressValue() {
    switch (_selectedStatus) {
      case 'Assigned':
        return 0.2;
      case 'Started':
        return 0.4;
      case 'In Progress':
        return 0.65;
      case 'Completed':
        return 1.0;
      case 'Cancelled':
        return 0.0;
      default:
        return 0.0;
    }
  }

  String _getStatusDescription() {
    switch (_selectedStatus) {
      case 'Assigned':
        return "Waiting to start";
      case 'Started':
        return "Journey started";
      case 'In Progress':
        return "In transit";
      case 'Completed':
        return "Delivery completed";
      case 'Cancelled':
        return "Delivery cancelled";
      default:
        return "Unknown status";
    }
  }

  Widget _buildOverviewTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Delivery Info
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Delivery Information",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  Icons.calendar_today,
                  "Date",
                  _formatDate(_deliveryDetail?.scheduledTime ??
                      _deliveryDetail?.createdAt),
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.schedule,
                  "Estimated Time",
                  _deliveryDetail?.estimatedDuration ?? "Chưa có thông tin",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.location_on,
                  "Starting Point",
                  _deliveryDetail?.pickupAddress ?? "KTC Warehouse",
                  allowMultiLine: true,
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.location_city,
                  "Destination Area",
                  _getDestinationArea(),
                  allowMultiLine: true,
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.route,
                  "Total Distance",
                  _deliveryDetail?.estimatedDistance ?? "Chưa có thông tin",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.shopping_bag,
                  "Total Orders",
                  "${_deliveryDetail?.orders.length ?? 0} orders",
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Status Update
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Update Status",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedStatus,
                  decoration: InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    filled: true,
                    fillColor: isDark
                        ? Colors.black.withValues(alpha: 0.2)
                        : Colors.white.withValues(alpha: 0.8),
                  ),
                  items: _statusOptions.map((status) {
                    return DropdownMenuItem<String>(
                      value: status,
                      child: Text(status),
                    );
                  }).toList(),
                  onChanged: (newValue) {
                    setState(() {
                      _selectedStatus = newValue!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                SpatialTextField(
                  controller: _noteController,
                  label: "Notes",
                  hint: "Add notes about status change",
                  maxLines: 3,
                  isGlass: true,
                ),
                const SizedBox(height: 16),
                SpatialButton(
                  text: "Update Status",
                  onPressed: _isUpdatingStatus
                      ? () {}
                      : () {
                          setState(() {
                            _isUpdatingStatus = true;
                          });

                          // TODO: API endpoint for updateDeliveryStatus doesn't exist
                          // Using a mock update instead of real API call
                          Future.delayed(const Duration(seconds: 1)).then((_) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Mock status update to $_selectedStatus'),
                                  backgroundColor: SpatialDesignSystem.successColor,
                                ),
                              );
                              
                              setState(() {
                                _isUpdatingStatus = false;
                              });
                            }
                          });
                        },
                  isGlass: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  height: 40,
                  width: double.infinity,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Timeline
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Delivery Timeline",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                // Xây dựng timeline với các trạng thái theo thứ tự
                _buildTimelineTile(
                  "Assigned to Driver",
                  _formatDate(_deliveryDetail?.createdAt),
                  "Delivery route assigned to ${_deliveryDetail?.driver?.fullName ?? 'Driver'}",
                  _isStatusCompleted("Assigned"),
                  isFirst: true,
                ),
                _buildTimelineTile(
                  "Started Journey",
                  _getTimelineDate("Started"),
                  "Driver has started the delivery route",
                  _isStatusCompleted("Started"),
                ),
                _buildTimelineTile(
                  "In Progress",
                  _getTimelineDate("In Progress"),
                  "Currently delivering orders",
                  _isStatusCompleted("In Progress"),
                ),
                _buildTimelineTile(
                  "Completed",
                  _deliveryDetail?.actualDeliveryTime != null
                      ? _formatDate(_deliveryDetail?.actualDeliveryTime)
                      : "Estimated ${_formatDate(_deliveryDetail?.scheduledTime, addHours: 2)}",
                  "All orders delivered successfully",
                  _isStatusCompleted("Completed"),
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value,
      {bool allowMultiLine = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 20,
            color: SpatialDesignSystem.primaryColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: SpatialDesignSystem.captionText.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkSecondaryColor
                        : SpatialDesignSystem.textSecondaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: SpatialDesignSystem.bodyMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                  maxLines: allowMultiLine ? null : 1,
                  overflow: allowMultiLine
                      ? TextOverflow.visible
                      : TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineTile(
    String title,
    String time,
    String description,
    bool isCompleted, {
    bool isFirst = false,
    bool isLast = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return TimelineTile(
      alignment: TimelineAlign.start,
      isFirst: isFirst,
      isLast: isLast,
      indicatorStyle: IndicatorStyle(
        width: 24,
        height: 24,
        indicator: Container(
          decoration: BoxDecoration(
            color: isCompleted
                ? SpatialDesignSystem.primaryColor
                : isDark
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.black.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(
              color: isCompleted
                  ? SpatialDesignSystem.primaryColor
                  : Colors.transparent,
              width: 2,
            ),
          ),
          child: isCompleted
              ? const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 16,
                )
              : null,
        ),
      ),
      beforeLineStyle: LineStyle(
        color: isCompleted
            ? SpatialDesignSystem.primaryColor
            : isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.1),
        thickness: 2,
      ),
      afterLineStyle: LineStyle(
        color: isCompleted
            ? SpatialDesignSystem
                .primaryColor // Sử dụng màu xanh cho phần đã hoàn thành
            : isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.1),
        thickness: 2,
      ),
      endChild: Padding(
        padding: const EdgeInsets.only(left: 16, bottom: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: SpatialDesignSystem.subtitleSmall.copyWith(
                color: isDark
                    ? SpatialDesignSystem.textDarkPrimaryColor
                    : SpatialDesignSystem.textPrimaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              time,
              style: SpatialDesignSystem.captionText.copyWith(
                color: isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              style: SpatialDesignSystem.bodySmall.copyWith(
                color: isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Nếu không có dữ liệu từ API, hiển thị thông báo
    if (_deliveryDetail == null || _deliveryDetail!.orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 64,
              color: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
            ),
            const SizedBox(height: 16),
            Text(
              "Không có đơn hàng nào",
              style: SpatialDesignSystem.subtitleMedium.copyWith(
                color: isDark
                    ? SpatialDesignSystem.textDarkSecondaryColor
                    : SpatialDesignSystem.textSecondaryColor,
              ),
            ),
          ],
        ),
      );
    }

    // Sử dụng dữ liệu từ API để hiển thị danh sách đơn hàng
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _deliveryDetail!.orders.length,
      itemBuilder: (context, index) {
        final order = _deliveryDetail!.orders[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    OrderDetailScreen(orderId: order.id.toString()),
              ),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            child: GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Order #${order.orderCode ?? order.id}",
                        style: SpatialDesignSystem.subtitleSmall.copyWith(
                          color: SpatialDesignSystem.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getOrderStatusColor(order.status ?? 'Pending')
                              .withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          order.status ?? 'Pending',
                          style: SpatialDesignSystem.captionText.copyWith(
                            color:
                                _getOrderStatusColor(order.status ?? 'Pending'),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.person_outline, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            "Customer:",
                            style: SpatialDesignSystem.captionText.copyWith(
                              color: isDark
                                  ? SpatialDesignSystem.textDarkSecondaryColor
                                  : SpatialDesignSystem.textSecondaryColor,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        order.recipientName ?? 'Không có thông tin',
                        style: SpatialDesignSystem.bodyMedium.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.attach_money, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            "Amount:",
                            style: SpatialDesignSystem.captionText.copyWith(
                              color: isDark
                                  ? SpatialDesignSystem.textDarkSecondaryColor
                                  : SpatialDesignSystem.textSecondaryColor,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        _formatCurrency(order.totalAmount),
                        style: SpatialDesignSystem.bodyMedium.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Add order status update section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: SpatialButton(
                          text: "View Details",
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    OrderDetailScreen(orderId: order.id.toString()),
                              ),
                            );
                          },
                          isGlass: true,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          height: 50,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SpatialButton(
                          text: "Update Status",
                          onPressed: () {
                            _showOrderStatusUpdateDialog(order);
                          },
                          isGlass: true,
                          backgroundColor: SpatialDesignSystem.primaryColor,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          height: 50,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Helper methods

  // Format date from API string to readable format
  String _formatDate(String? dateString, {int addHours = 0}) {
    if (dateString == null || dateString.isEmpty) {
      return "Chưa có thông tin";
    }

    try {
      final date = DateTime.parse(dateString).add(Duration(hours: addHours));
      final formatter = DateFormat('dd/MM/yyyy | HH:mm');
      return formatter.format(date);
    } catch (e) {
      return dateString;
    }
  }

  // Get the destination area from the first order address
  String _getDestinationArea() {
    if (_deliveryDetail == null || _deliveryDetail!.orders.isEmpty) {
      return "Chưa có thông tin";
    }

    // Lấy địa chỉ từ đơn hàng đầu tiên
    String? address = _deliveryDetail!.orders.first.deliveryAddress;
    if (address == null || address.isEmpty) {
      return "Chưa có thông tin địa chỉ";
    }

    // Hiển thị đầy đủ địa chỉ không cắt bớt
    return address;
  }

  // Check if a status should be shown as completed based on current status
  bool _isStatusCompleted(String status) {
    // Danh sách các trạng thái theo thứ tự tiến triển
    const statusOrder = ['Assigned', 'Started', 'In Progress', 'Completed'];
    final currentIndex = statusOrder.indexOf(_selectedStatus);
    final statusIndex = statusOrder.indexOf(status);

    // Nếu trạng thái hiện tại đã đạt hoặc vượt qua status đang xét
    if (currentIndex >= statusIndex && currentIndex >= 0 && statusIndex >= 0) {
      return true;
    }

    // Trường hợp đặc biệt: Nếu đã hoàn thành (Completed), tất cả các trạng thái đều hoàn thành
    if (_selectedStatus == 'Completed') {
      return true;
    }

    return false;
  }

  // Get date for timeline item
  String _getTimelineDate(String status) {
    switch (status) {
      case 'Started':
        return "Estimated ${_formatDate(_deliveryDetail?.scheduledTime, addHours: -1)}";
      case 'In Progress':
        return "Estimated ${_formatDate(_deliveryDetail?.scheduledTime)}";
      default:
        return "Chưa có thông tin";
    }
  }

  // Format currency from number to string
  String _formatCurrency(double? amount) {
    if (amount == null) {
      return "0 VND";
    }

    // Format với dấu phân cách hàng nghìn
    final formatter = NumberFormat("#,###", "vi_VN");
    return "${formatter.format(amount)} VND";
  }

  // Get color for order status
  Color _getOrderStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return Colors.green;
      case 'IN_TRANSIT':
      case 'IN TRANSIT':
      case 'IN PROGRESS':
        return SpatialDesignSystem.primaryColor;
      case 'PENDING':
      case 'ASSIGNED':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  // Show dialog to update order status
  void _showOrderStatusUpdateDialog(dynamic order) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    String selectedStatus = order.status ?? 'PENDING';
    final TextEditingController notesController = TextEditingController();
    bool isUpdating = false;

    // List of available order statuses
    final List<String> orderStatusOptions = [
      'PENDING',
      'ASSIGNED',
      'IN_PROGRESS',
      'DELIVERED',
      'CANCELLED'
    ];

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: isDark
                  ? SpatialDesignSystem.darkBackgroundColor
                  : SpatialDesignSystem.backgroundColor,
              title: Text(
                "Update Order Status",
                style: SpatialDesignSystem.subtitleMedium.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkPrimaryColor
                      : SpatialDesignSystem.textPrimaryColor,
                ),
              ),
              content: Container(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Order #${order.orderCode ?? order.id}",
                      style: SpatialDesignSystem.bodyMedium.copyWith(
                        fontWeight: FontWeight.bold,
                        color: SpatialDesignSystem.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: selectedStatus,
                      decoration: InputDecoration(
                        labelText: 'Status',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        filled: true,
                        fillColor: isDark
                            ? Colors.black.withValues(alpha: 0.2)
                            : Colors.white.withValues(alpha: 0.8),
                      ),
                      items: orderStatusOptions.map((status) {
                        return DropdownMenuItem<String>(
                          value: status,
                          child: Text(status),
                        );
                      }).toList(),
                      onChanged: (newValue) {
                        setState(() {
                          selectedStatus = newValue!;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    SpatialTextField(
                      controller: notesController,
                      label: "Notes",
                      hint: "Add notes about status change",
                      maxLines: 3,
                      isGlass: true,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    "Cancel",
                    style: TextStyle(color: SpatialDesignSystem.textSecondaryColor),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SpatialDesignSystem.primaryColor,
                  ),
                  onPressed: isUpdating
                      ? null
                      : () async {
                          setState(() {
                            isUpdating = true;
                          });

                          // Get the status ID based on the selected status
                          final int statusId = _getStatusIdFromString(selectedStatus);
                          
                          // Create the update model
                          final statusUpdate = OrderStatusUpdate(
                            statusId: statusId,
                            notes: notesController.text,
                          );

                          // Call API service to update order status
                          final success = await ordersServices.updateOrderStatus(
                            orderId: order.id,
                            statusUpdate: statusUpdate,
                          );

                          // Pop the dialog regardless of result
                          Navigator.pop(context);

                          if (success) {
                            // Show success message
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Order status updated to $selectedStatus'),
                                backgroundColor: SpatialDesignSystem.successColor,
                              ),
                            );
                            
                            // Refresh delivery details to show updated status
                            _loadDeliveryDetails();
                          } else {
                            // Show error message
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Failed to update order status'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  child: Text(
                    isUpdating ? "Updating..." : "Update",
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // Convert status string to status ID for API
  int _getStatusIdFromString(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELLED':
        return 5;
      default:
        return 1; // Default to pending
    }
  }
  
  /*
  // Update delivery status via API - COMMENTED OUT BECAUSE API ENDPOINT DOESN'T EXIST
  Future<void> _updateDeliveryStatus() async {
    if (_deliveryDetail == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Delivery information is missing'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() {
        _isUpdatingStatus = false;
      });
      return;
    }
    
    try {
      // Convert UI status to API format
      String apiStatus = _selectedStatus.toUpperCase().replaceAll(' ', '_');
      
      // Create status update model
      final statusUpdate = DeliveryStatusUpdate(
        status: apiStatus,
        notes: _noteController.text,
        timestamp: DateTime.now().toIso8601String(),
      );
      
      // Call API
      final updatedDelivery = await deliveryServices.updateDeliveryStatus(
        _deliveryDetail!.id,
        statusUpdate,
      );
      
      if (updatedDelivery != null) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $_selectedStatus'),
            backgroundColor: SpatialDesignSystem.successColor,
          ),
        );
        
        // Refresh delivery details
        _loadDeliveryDetails();
      } else {
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update delivery status'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error updating status: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      // Reset loading state
      setState(() {
        _isUpdatingStatus = false;
      });
    }
  }
  */

  Widget _buildBottomBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: SpatialButton(
                text: "Open Google Maps Navigation",
                iconData: Icons.directions,
                onPressed: () {
                  _navigateToRouteMap();
                },
                isGradient: true,
                gradient: LinearGradient(
                  colors: [
                    SpatialDesignSystem.primaryColor,
                    SpatialDesignSystem.accentColor,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToRouteMap() async {
    try {
      // Show loading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 16),
              Text('Preparing navigation route...'),
            ],
          ),
          duration: Duration(seconds: 2),
        ),
      );

      // Check if we have the delivery detail data
      if (_deliveryDetail == null) {
        throw Exception('Delivery details not available');
      }

      // Check if there are any orders
      if (_deliveryDetail!.orders.isEmpty) {
        throw Exception('No delivery orders found');
      }

      // Try to use the GoogleMapsService first for a better experience
      try {
        final googleMapsService = GoogleMapsService();
        
        // Create location map for pickup
        final pickupAddress = _deliveryDetail!.pickupAddress ?? '';
        final pickupLocation = {
          'latitude': 0.0, // Will use current location if coordinates not available
          'longitude': 0.0,
          'address': pickupAddress
        };
        
        // Create location map for delivery (last order)
        final lastOrderAddress = _deliveryDetail!.orders.last.deliveryAddress ?? '';
        final deliveryLocation = {
          'latitude': 0.0,
          'longitude': 0.0,
          'address': lastOrderAddress
        };
        
        // Create transit points from other orders (if any)
        List<Map<String, dynamic>> transitPoints = [];
        if (_deliveryDetail!.orders.length > 1) {
          for (var i = 0; i < _deliveryDetail!.orders.length - 1; i++) {
            final order = _deliveryDetail!.orders[i];
            if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty) {
              transitPoints.add({
                'latitude': 0.0,
                'longitude': 0.0,
                'address': order.deliveryAddress!
              });
            }
          }
        }
        
        // Open Google Maps with route
        final success = await googleMapsService.openGoogleMapsWithRoute(
          context: context,
          pickupLocation: pickupLocation,
          deliveryLocation: deliveryLocation,
          transitPoints: transitPoints,
        );
        
        if (success) return;
      } catch (e) {
        debugPrint('Error using GoogleMapsService: $e');
        // Fall back to simple URL launcher if GoogleMapsService fails
      }

      // Fallback: Use the simpler URL launcher method
      // Get the pickup address (warehouse location)
      String origin = _deliveryDetail!.pickupAddress ?? "Current Location";
      
      // Get all delivery addresses from orders
      List<String> deliveryAddresses = [];
      for (var order in _deliveryDetail!.orders) {
        if (order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty) {
          deliveryAddresses.add(order.deliveryAddress!);
        }
      }
      
      if (deliveryAddresses.isEmpty) {
        throw Exception('No valid delivery addresses found');
      }
      
      // If we have multiple delivery addresses, use the first as waypoint and the last as destination
      if (deliveryAddresses.length > 1) {
        final destination = deliveryAddresses.last;
        final waypoints = deliveryAddresses.sublist(0, deliveryAddresses.length - 1);
        
        // Use our enhanced method to open Google Maps with waypoints
        final success = await urlLauncherFrave.openMapWithWaypoints(
          origin: origin,
          destination: destination,
          waypoints: waypoints,
        );
        
        if (!success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to open Google Maps. Please make sure it is installed.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } else {
        // For a single delivery address, just navigate directly to it
        final success = await urlLauncherFrave.openMap(deliveryAddresses.first);
        
        if (!success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to open Google Maps. Please make sure it is installed.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        debugPrint("Error opening navigation: $e");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error opening navigation: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
