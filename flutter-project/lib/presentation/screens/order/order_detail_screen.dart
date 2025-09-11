import 'package:flutter/material.dart';
import 'package:ktc_logistics_driver/domain/models/order/order_status_update.dart';
import 'package:ktc_logistics_driver/services/orders_services.dart';

import '../../design/spatial_ui.dart';
import '../../components/spatial_button.dart';
import '../../components/spatial_glass_card.dart';
import '../../helpers/url_lancher_frave.dart';
import '../../../services/googlemaps_services.dart';

// Tab chứa dữ liệu cấu hình
class OrderTab {
  final String text;
  final Widget Function() contentBuilder;

  OrderTab({required this.text, required this.contentBuilder});
}

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({
    super.key,
    required this.orderId,
  });

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<OrderTab> _tabs;
  
  // For order status
  bool _isOrderAccepted = false;
  bool _isUpdatingStatus = false;
  String _selectedStatus = 'PENDING';
  
  // For status update
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();

    // Khởi tạo danh sách tab một lần duy nhất
    _tabs = [
      OrderTab(text: "Overview", contentBuilder: _buildOverviewTab),
      OrderTab(text: "Items", contentBuilder: _buildItemsTab),
    ];

    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? SpatialDesignSystem.darkBackgroundColor
          : SpatialDesignSystem.backgroundColor,
      appBar: AppBar(
        title: Text(
          "Order #${widget.orderId}",
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
        actions: [
          IconButton(
            icon: const Icon(Icons.phone),
            color: isDark
                ? SpatialDesignSystem.textDarkPrimaryColor
                : SpatialDesignSystem.textPrimaryColor,
            onPressed: () {
              _callCustomer();
            },
          ),
        ],
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
                  width: 3.0,
                  color: SpatialDesignSystem.primaryColor,
                ),
                insets: const EdgeInsets.symmetric(horizontal: 16.0),
              ),
              // Cải thiện style cho text
              labelStyle: SpatialDesignSystem.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
              // Thêm padding bên ngoài để điều chỉnh chiều cao của toàn bộ TabBar
              padding: const EdgeInsets.symmetric(vertical: 4),
              labelColor: SpatialDesignSystem.primaryColor,
              unselectedLabelColor: isDark
                  ? SpatialDesignSystem.textDarkSecondaryColor
                  : SpatialDesignSystem.textSecondaryColor,
              isScrollable: false,
              // Sử dụng tab tùy chỉnh với padding bên trong thay vì chỉ dùng text
              tabs: _tabs
                  .map((tab) => Tab(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          // Đảm bảo tab có chiều rộng tối thiểu để tránh quá sát với viền
                          width: MediaQuery.of(context).size.width / 3.5,
                          alignment: Alignment.center,
                          child: Text(
                            tab.text,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
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

  // The shared buildStatusCard method
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
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.orderId,
                    style: SpatialDesignSystem.subtitleLarge.copyWith(
                      color: isDark
                          ? SpatialDesignSystem.textDarkPrimaryColor
                          : SpatialDesignSystem.textPrimaryColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Estimated delivery: 12:30 PM",
                    style: SpatialDesignSystem.bodyMedium.copyWith(
                      color: isDark
                          ? SpatialDesignSystem.textDarkSecondaryColor
                          : SpatialDesignSystem.textSecondaryColor,
                    ),
                  ),
                ],
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(_selectedStatus).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _getStatusColor(_selectedStatus).withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  _selectedStatus.replaceAll('_', ' '),
                  style: SpatialDesignSystem.captionText.copyWith(
                    color: _getStatusColor(_selectedStatus),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          LinearProgressIndicator(
            value: 0.65,
            backgroundColor: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : Colors.black.withValues(alpha: 0.05),
            valueColor:
                AlwaysStoppedAnimation<Color>(SpatialDesignSystem.primaryColor),
            borderRadius: BorderRadius.circular(10),
            minHeight: 8,
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Out for delivery",
                style: SpatialDesignSystem.captionText.copyWith(
                  color: SpatialDesignSystem.primaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                "65% complete",
                style: SpatialDesignSystem.captionText.copyWith(
                  color: isDark
                      ? SpatialDesignSystem.textDarkSecondaryColor
                      : SpatialDesignSystem.textSecondaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _isUpdatingStatus
              ? Center(child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(SpatialDesignSystem.primaryColor),
                ))
              : SpatialButton(
                  text: "Update Status",
                  onPressed: _showOrderStatusUpdateDialog,
                  iconData: Icons.update,
                  isGradient: true,
                  gradient: LinearGradient(
                    colors: [
                      SpatialDesignSystem.primaryColor,
                      SpatialDesignSystem.accentColor,
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Customer Info
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Customer Information",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  Icons.person,
                  "Name",
                  "Nguyen Van A",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.phone,
                  "Phone",
                  "+84 123 456 789",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.email,
                  "Email",
                  "customer@example.com",
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

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
                  Icons.location_on,
                  "Address",
                  "123 Nguyen Hue St, District 1, Ho Chi Minh City",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.access_time,
                  "Delivery Time",
                  "Today, 12:30 PM",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.note,
                  "Special Instructions",
                  "Please call when you arrive. Ring doorbell twice.",
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Order Information
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Order Information",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  Icons.calendar_today,
                  "Order Date",
                  "August 31, 2025 | 09:15 AM",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.category,
                  "Package Type",
                  "Standard Package",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.scale,
                  "Weight",
                  "2.5 kg",
                ),
                const Divider(),
                _buildInfoRow(
                  Icons.payment,
                  "Payment Method",
                  "Credit Card (Paid)",
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: SpatialDesignSystem.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 18,
              color: SpatialDesignSystem.primaryColor,
            ),
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
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order Items
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Order Items",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),

                // Item 1
                _buildOrderItem(
                  "Product A",
                  "2x",
                  "150,000 VND",
                  "https://via.placeholder.com/60",
                ),
                const Divider(),

                // Item 2
                _buildOrderItem(
                  "Product B",
                  "1x",
                  "120,000 VND",
                  "https://via.placeholder.com/60",
                ),
                const Divider(),

                // Item 3
                _buildOrderItem(
                  "Product C",
                  "3x",
                  "85,000 VND",
                  "https://via.placeholder.com/60",
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Order Summary
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Order Summary",
                  style: SpatialDesignSystem.subtitleMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                _buildSummaryRow("Subtotal", "355,000 VND"),
                const Divider(),
                _buildSummaryRow("Delivery Fee", "20,000 VND"),
                const Divider(),
                _buildSummaryRow("Discount", "-10,000 VND"),
                const Divider(thickness: 1.5),
                _buildSummaryRow("Total", "365,000 VND", isTotal: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItem(
      String name, String quantity, String price, String imageUrl) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.grey.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Icon(
                Icons.inventory_2_outlined,
                color: SpatialDesignSystem.primaryColor,
                size: 30,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: SpatialDesignSystem.subtitleSmall.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  quantity,
                  style: SpatialDesignSystem.bodySmall.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkSecondaryColor
                        : SpatialDesignSystem.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
          Text(
            price,
            style: SpatialDesignSystem.bodyMedium.copyWith(
              color: isDark
                  ? SpatialDesignSystem.textDarkPrimaryColor
                  : SpatialDesignSystem.textPrimaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: isTotal
                ? SpatialDesignSystem.subtitleSmall.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                    fontWeight: FontWeight.w600,
                  )
                : SpatialDesignSystem.bodyMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkSecondaryColor
                        : SpatialDesignSystem.textSecondaryColor,
                  ),
          ),
          Text(
            value,
            style: isTotal
                ? SpatialDesignSystem.subtitleSmall.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                    fontWeight: FontWeight.w600,
                  )
                : SpatialDesignSystem.bodyMedium.copyWith(
                    color: isDark
                        ? SpatialDesignSystem.textDarkPrimaryColor
                        : SpatialDesignSystem.textPrimaryColor,
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: screenWidth < 400
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Navigation button (shows only when order is accepted)
                  if (_isOrderAccepted)
                    SpatialButton(
                      text: "Navigation",
                      textColor: SpatialDesignSystem.primaryColor,
                      onPressed: _navigateToRouteMap,
                      iconData: Icons.map,
                      isGlass: true,
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                    ),
                  if (_isOrderAccepted) const SizedBox(height: 10),

                  // Accept or Delivered button (based on state)
                  _isOrderAccepted
                      ? SpatialButton(
                          text: "Mark as Delivered",
                          onPressed: () {
                            // Mark as delivered logic
                            _showDeliveryConfirmationDialog();
                          },
                          iconData: Icons.check_circle,
                          backgroundColor: Colors.green,
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                        )
                      : SpatialButton(
                          text: "Accept Order",
                          onPressed: () {
                            // Accept order and show navigation option
                            setState(() {
                              _isOrderAccepted = true;
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                    "Order accepted! You can now navigate to the delivery location."),
                                backgroundColor:
                                    SpatialDesignSystem.primaryColor,
                                duration: Duration(seconds: 3),
                              ),
                            );
                          },
                          iconData: Icons.delivery_dining,
                          isGradient: true,
                          gradient: LinearGradient(
                            colors: [
                              SpatialDesignSystem.primaryColor,
                              SpatialDesignSystem.accentColor,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 10),
                        ),
                ],
              )
            // For wider screens, use a Row layout with smaller padding
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Navigation button (shows only when order is accepted)
                  if (_isOrderAccepted)
                    Expanded(
                      flex: 1,
                      child: SpatialButton(
                        text: "Navigation",
                        onPressed: _navigateToRouteMap,
                        iconData: Icons.directions,
                        isGlass: true,
                        backgroundColor: Colors.white,
                        textColor: SpatialDesignSystem.primaryColor,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                    ),
                  if (_isOrderAccepted) const SizedBox(width: 10),

                  // Accept or Delivered button
                  Expanded(
                    flex: _isOrderAccepted ? 1 : 2,
                    child: _isOrderAccepted
                        ? SpatialButton(
                            text: "Mark as Delivered",
                            onPressed: () {
                              // Mark as delivered logic
                              _showDeliveryConfirmationDialog();
                            },
                            iconData: Icons.check_circle,
                            backgroundColor: Colors.green,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 12),
                          )
                        : SpatialButton(
                            text: "Accept Order",
                            onPressed: () {
                              // Accept order and show navigation option
                              setState(() {
                                _isOrderAccepted = true;
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                      "Order accepted! You can now navigate to the delivery location."),
                                  backgroundColor:
                                      SpatialDesignSystem.primaryColor,
                                  duration: Duration(seconds: 3),
                                ),
                              );
                            },
                            iconData: Icons.delivery_dining,
                            isGradient: true,
                            gradient: LinearGradient(
                              colors: [
                                SpatialDesignSystem.primaryColor,
                                SpatialDesignSystem.accentColor,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 12),
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  // Navigate to map screen
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

      final mapsService = GoogleMapsService();

      // Get route data for Google Maps
      final routeData = await mapsService.getDummyRouteData();

      // Open Google Maps with route
      final result = await mapsService.openGoogleMapsWithRoute(
        context: context,
        pickupLocation: routeData['pickupLocation'],
        transitPoints: routeData['transitPoints'],
        deliveryLocation: routeData['deliveryLocation'],
      );

      if (!result && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Failed to open Google Maps. Please make sure it is installed.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        print("Error opening navigation: $e");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error opening navigation: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showDeliveryConfirmationDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: GlassCard(
          padding: const EdgeInsets.all(24),
          gradient: LinearGradient(
            colors: [
              SpatialDesignSystem.successColor.withValues(alpha: 0.1),
              SpatialDesignSystem.successColor.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                color: SpatialDesignSystem.successColor,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                "Confirm Delivery",
                style: SpatialDesignSystem.headingSmall,
              ),
              const SizedBox(height: 8),
              Text(
                "Are you sure you want to mark this order as delivered?",
                style: SpatialDesignSystem.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  SpatialButton(
                    text: "Cancel",
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    isOutlined: true,
                  ),
                  SpatialButton(
                    text: "Confirm",
                    onPressed: () {
                      // Handle delivery confirmation
                      Navigator.pop(context);
                      // Show success message
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Order #${widget.orderId} marked as delivered'),
                          backgroundColor: SpatialDesignSystem.successColor,
                        ),
                      );
                      // Navigate back to delivery list
                      Future.delayed(const Duration(seconds: 1), () {
                        Navigator.pop(context);
                      });
                    },
                    isGradient: true,
                    gradient: LinearGradient(
                      colors: [
                        SpatialDesignSystem.successColor,
                        Color.fromARGB(
                          SpatialDesignSystem.successColor.alpha,
                          SpatialDesignSystem.successColor.red + 40,
                          SpatialDesignSystem.successColor.green + 40,
                          SpatialDesignSystem.successColor.blue,
                        ),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _callCustomer() {
    // Extract the phone number from the order details
    // In a real app, this would come from the order data model
    // For now, we're using the hardcoded value from the UI
    String phoneNumber = "+84 123 456 789";

    // Remove spaces from the phone number
    phoneNumber = phoneNumber.replaceAll(' ', '');

    // Launch the phone dialer with the number
    urlLauncherFrave.makePhoneCall('tel:$phoneNumber');
  }

  // Show dialog to update order status
  void _showOrderStatusUpdateDialog() {
    // Use the existing controller from the state
    _notesController.clear();
    
    // List of status options - using the same options as in the OrderStatusId class
    final List<String> statusOptions = [
      "PENDING",
      "PROCESSING",
      "IN_TRANSIT", 
      "DELIVERED",
      "CANCELLED",
      "RETURNED"
    ];
    
    // Load current order status if available
    // Use the _selectedStatus that's already in the state
    debugPrint('Current order status: $_selectedStatus');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Update Order Status"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Select new status:"),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedStatus,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              ),
              items: statusOptions.map((String status) {
                return DropdownMenuItem<String>(
                  value: status,
                  child: Text(status.replaceAll('_', ' ')),
                );
              }).toList(),
              onChanged: (String? newValue) {
                if (newValue != null) {
                  _selectedStatus = newValue;
                }
              },
            ),
            const SizedBox(height: 16),
            const Text("Add notes (optional):"),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: "Enter notes about status change",
                contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              // Close dialog
              Navigator.pop(context);
              
              // Create status update object
              final OrderStatusUpdate statusUpdate = OrderStatusUpdate(
                statusId: OrderStatusId.fromStatusName(_selectedStatus),
                notes: _notesController.text.trim().isNotEmpty 
                    ? _notesController.text.trim() 
                    : null,
              );
              
              // Call update function
              _updateOrderStatus(statusUpdate);
            },
            child: const Text("Update"),
          ),
        ],
      ),
    );
  }
  
  // Update order status via API
  Future<void> _updateOrderStatus(OrderStatusUpdate statusUpdate) async {
    try {
      // Show loading indicator
      setState(() {
        _isUpdatingStatus = true;
      });
      
      // Call API service using OrdersServices instead of DeliveryServices
      final success = await ordersServices.updateOrderStatus(
        driverId: null, // Will use the one from secure storage
        orderId: int.parse(widget.orderId),
        statusUpdate: statusUpdate,
      );
      
      // Hide loading indicator
      setState(() {
        _isUpdatingStatus = false;
      });
      
      // Show success or error message
      if (success) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Order status updated successfully"),
            backgroundColor: Colors.green,
          ),
        );
        
        // Update local state to reflect the change
        setState(() {
          _selectedStatus = statusUpdate.statusId == OrderStatusId.DELIVERED ? "DELIVERED" : _selectedStatus;
        });
      } else {
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Failed to update order status"),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Hide loading indicator
      setState(() {
        _isUpdatingStatus = false;
      });
      
      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: ${e.toString()}"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  // Get color for status
  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return SpatialDesignSystem.warningColor; // Orange/Yellow
      case 'PROCESSING':
        return SpatialDesignSystem.primaryColor; // Use primary color instead of info
      case 'IN_TRANSIT':
        return SpatialDesignSystem.warningColor; // Orange/Yellow
      case 'DELIVERED':
        return SpatialDesignSystem.successColor; // Green
      case 'CANCELLED':
        return SpatialDesignSystem.errorColor; // Red
      case 'RETURNED':
        return SpatialDesignSystem.errorColor; // Red
      default:
        return SpatialDesignSystem.warningColor; // Default to orange/yellow
    }
  }
}
