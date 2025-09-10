#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script tính và cập nhật phí giao hàng (shipping_fee và delivery_fee)
Tác giả: DataCo Team
Ngày tạo: 2025-01-11
"""

import mysql.connector
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import sys
import os

# Cấu hình logging
def setup_logging(log_file_name):
    """Thiết lập logging với file riêng biệt"""
    log_dir = "shipping_calculation_logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_file = os.path.join(log_dir, f"{log_file_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file

# Thông tin kết nối database
DB_CONFIG = {
    'host': 'server.aptech.io',
    'port': 3307,
    'database': 'fastroute_test',  # Sử dụng test database trước
    'user': 'fastroute_user',
    'password': 'fastroute_password',
    'charset': 'utf8mb4',
    'autocommit': False
}

# Hệ số service type
SERVICE_TYPE_MULTIPLIERS = {
    'SECOND_CLASS': Decimal('0.8'),
    'STANDARD': Decimal('1.0'),
    'FIRST_CLASS': Decimal('1.3'),
    'EXPRESS': Decimal('1.8')
}

# Hằng số tính toán
BASE_PRICE_PER_KG = Decimal('15000')  # 15,000 VNĐ/kg
FRAGILE_MULTIPLIER = Decimal('1.3')   # Hệ số hàng dễ vỡ
NORMAL_MULTIPLIER = Decimal('1.0')    # Hệ số hàng bình thường
VOLUME_TO_WEIGHT_FACTOR = Decimal('200')  # Volume (m³) × 200 = kg

class ShippingFeeCalculator:
    def __init__(self, test_mode=True):
        self.test_mode = test_mode
        self.connection = None
        self.cursor = None
        self.log_file = setup_logging("shipping_fee_calculation")
        logging.info("=== BẮT ĐẦU TÍNH TOÁN PHÍ GIAO HÀNG ===")
        logging.info(f"Chế độ: {'TEST' if test_mode else 'PRODUCTION'}")
        
    def connect_database(self):
        """Kết nối đến database"""
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            self.cursor = self.connection.cursor(dictionary=True)
            logging.info(f"Kết nối thành công đến database: {DB_CONFIG['database']}")
            return True
        except mysql.connector.Error as e:
            logging.error(f"Lỗi kết nối database: {e}")
            return False
    
    def disconnect_database(self):
        """Đóng kết nối database"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logging.info("Đã đóng kết nối database")
    
    def calculate_shipping_weight(self, actual_weight, volume):
        """Tính trọng lượng tính phí = MAX(trọng lượng thực tế, trọng lượng quy đổi)"""
        actual_weight = Decimal(str(actual_weight)) if actual_weight else Decimal('0')
        volume = Decimal(str(volume)) if volume else Decimal('0')
        
        # Trọng lượng quy đổi = Volume (m³) × 200
        volume_weight = volume * VOLUME_TO_WEIGHT_FACTOR
        
        shipping_weight = max(actual_weight, volume_weight)
        return shipping_weight
    
    def calculate_base_fee(self, shipping_weight):
        """Tính phí cơ bản = Trọng lượng tính phí × 15,000 VNĐ/kg"""
        return shipping_weight * BASE_PRICE_PER_KG
    
    def get_fragile_multiplier(self, is_fragile):
        """Lấy hệ số rủi ro dựa trên is_fragile"""
        return FRAGILE_MULTIPLIER if is_fragile else NORMAL_MULTIPLIER
    
    def get_service_type_multiplier(self, service_type):
        """Lấy hệ số service type"""
        return SERVICE_TYPE_MULTIPLIERS.get(service_type, Decimal('1.0'))
    
    def calculate_shipping_fee(self, weight, volume, is_fragile, service_type):
        """
        Tính phí logistics cho một order_item
        TỔNG PHÍ LOGISTICS = PHÍ CƠ BẢN × HỆ SỐ RỦI RO × HỆ SỐ SERVICE_TYPE
        """
        # 1. Tính trọng lượng tính phí
        shipping_weight = self.calculate_shipping_weight(weight, volume)
        
        # 2. Tính phí cơ bản
        base_fee = self.calculate_base_fee(shipping_weight)
        
        # 3. Áp dụng hệ số rủi ro
        fragile_multiplier = self.get_fragile_multiplier(is_fragile)
        
        # 4. Áp dụng hệ số service type
        service_multiplier = self.get_service_type_multiplier(service_type)
        
        # 5. Tính tổng phí
        total_fee = base_fee * fragile_multiplier * service_multiplier
        
        # Làm tròn đến 2 chữ số thập phân
        total_fee = total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return total_fee, shipping_weight, base_fee
    
    def get_order_items_data(self):
        """Lấy dữ liệu order_items cần tính shipping_fee"""
        query = """
        SELECT 
            oi.id as order_item_id,
            oi.order_id,
            oi.product_id,
            oi.quantity,
            oi.shipping_fee as current_shipping_fee,
            p.weight,
            p.volume,
            p.is_fragile,
            p.name as product_name,
            d.service_type,
            o.external_id as order_external_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        JOIN deliveries d ON o.id = d.order_id
        ORDER BY oi.id
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            logging.info(f"Lấy được {len(results)} order_items cần tính shipping_fee")
            return results
        except mysql.connector.Error as e:
            logging.error(f"Lỗi truy vấn order_items: {e}")
            return []
    
    def update_order_item_shipping_fee(self, order_item_id, shipping_fee):
        """Cập nhật shipping_fee cho order_item"""
        if self.test_mode:
            logging.info(f"[TEST MODE] Sẽ cập nhật order_item {order_item_id}: shipping_fee = {shipping_fee}")
            return True
        
        try:
            update_query = """
            UPDATE order_items 
            SET shipping_fee = %s, updated_at = NOW()
            WHERE id = %s
            """
            self.cursor.execute(update_query, (shipping_fee, order_item_id))
            return True
        except mysql.connector.Error as e:
            logging.error(f"Lỗi cập nhật shipping_fee cho order_item {order_item_id}: {e}")
            return False
    
    def calculate_delivery_fees(self):
        """Tính delivery_fee cho các deliveries"""
        query = """
        SELECT 
            d.id as delivery_id,
            d.order_id,
            d.delivery_fee as current_delivery_fee,
            SUM(oi.shipping_fee) as total_shipping_fee
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.shipping_fee IS NOT NULL
        GROUP BY d.id, d.order_id, d.delivery_fee
        ORDER BY d.id
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            logging.info(f"Tìm được {len(results)} deliveries cần cập nhật delivery_fee")
            return results
        except mysql.connector.Error as e:
            logging.error(f"Lỗi truy vấn deliveries: {e}")
            return []
    
    def update_delivery_fee(self, delivery_id, delivery_fee):
        """Cập nhật delivery_fee cho delivery"""
        if self.test_mode:
            logging.info(f"[TEST MODE] Sẽ cập nhật delivery {delivery_id}: delivery_fee = {delivery_fee}")
            return True
        
        try:
            update_query = """
            UPDATE deliveries 
            SET delivery_fee = %s, updated_at = NOW()
            WHERE id = %s
            """
            self.cursor.execute(update_query, (delivery_fee, delivery_id))
            return True
        except mysql.connector.Error as e:
            logging.error(f"Lỗi cập nhật delivery_fee cho delivery {delivery_id}: {e}")
            return False
    
    def process_shipping_fees(self):
        """Xử lý tính toán và cập nhật shipping_fees"""
        logging.info("Bắt đầu xử lý shipping_fees...")
        
        order_items = self.get_order_items_data()
        if not order_items:
            logging.warning("Không có order_items nào để xử lý")
            return False
        
        success_count = 0
        error_count = 0
        
        for item in order_items:
            try:
                # Tính shipping_fee
                shipping_fee, shipping_weight, base_fee = self.calculate_shipping_fee(
                    weight=item['weight'],
                    volume=item['volume'],
                    is_fragile=bool(item['is_fragile']),
                    service_type=item['service_type']
                )
                
                # Log chi tiết tính toán
                logging.info(f"Order Item {item['order_item_id']} - Product: {item['product_name']}")
                logging.info(f"  Weight: {item['weight']}kg, Volume: {item['volume']}m³")
                logging.info(f"  Shipping Weight: {shipping_weight}kg")
                logging.info(f"  Is Fragile: {bool(item['is_fragile'])}, Service: {item['service_type']}")
                logging.info(f"  Base Fee: {base_fee:,} VNĐ")
                logging.info(f"  Final Shipping Fee: {shipping_fee:,} VNĐ")
                
                # Cập nhật database
                if self.update_order_item_shipping_fee(item['order_item_id'], shipping_fee):
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                logging.error(f"Lỗi xử lý order_item {item['order_item_id']}: {e}")
                error_count += 1
        
        logging.info(f"Hoàn thành xử lý shipping_fees: {success_count} thành công, {error_count} lỗi")
        return error_count == 0
    
    def process_delivery_fees(self):
        """Xử lý tính toán và cập nhật delivery_fees"""
        logging.info("Bắt đầu xử lý delivery_fees...")
        
        deliveries = self.calculate_delivery_fees()
        if not deliveries:
            logging.warning("Không có deliveries nào để xử lý")
            return False
        
        success_count = 0
        error_count = 0
        
        for delivery in deliveries:
            try:
                delivery_fee = Decimal(str(delivery['total_shipping_fee']))
                
                logging.info(f"Delivery {delivery['delivery_id']} - Order {delivery['order_id']}")
                logging.info(f"  Current delivery_fee: {delivery['current_delivery_fee']}")
                logging.info(f"  New delivery_fee: {delivery_fee:,} VNĐ")
                
                if self.update_delivery_fee(delivery['delivery_id'], delivery_fee):
                    success_count += 1
                else:
                    error_count += 1
                    
            except Exception as e:
                logging.error(f"Lỗi xử lý delivery {delivery['delivery_id']}: {e}")
                error_count += 1
        
        logging.info(f"Hoàn thành xử lý delivery_fees: {success_count} thành công, {error_count} lỗi")
        return error_count == 0
    
    def run(self):
        """Chạy toàn bộ quy trình tính toán phí giao hàng"""
        try:
            # Kết nối database
            if not self.connect_database():
                return False
            
            # Bắt đầu transaction
            if not self.test_mode:
                self.connection.start_transaction()
            
            # Xử lý shipping_fees
            if not self.process_shipping_fees():
                if not self.test_mode:
                    self.connection.rollback()
                logging.error("Lỗi xử lý shipping_fees, rollback transaction")
                return False
            
            # Xử lý delivery_fees
            if not self.process_delivery_fees():
                if not self.test_mode:
                    self.connection.rollback()
                logging.error("Lỗi xử lý delivery_fees, rollback transaction")
                return False
            
            # Commit transaction
            if not self.test_mode:
                self.connection.commit()
                logging.info("Commit transaction thành công")
            else:
                logging.info("TEST MODE: Không commit transaction")
            
            logging.info("=== HOÀN THÀNH TÍNH TOÁN PHÍ GIAO HÀNG ===")
            return True
            
        except Exception as e:
            logging.error(f"Lỗi trong quá trình xử lý: {e}")
            if not self.test_mode and self.connection:
                self.connection.rollback()
            return False
        finally:
            self.disconnect_database()

def main():
    """Hàm main"""
    print("=== SCRIPT TÍNH TOÁN PHÍ GIAO HÀNG ===")
    print("1. Chạy ở chế độ TEST (không cập nhật database)")
    print("2. Chạy ở chế độ PRODUCTION (cập nhật database)")
    
    choice = input("Chọn chế độ (1/2): ").strip()
    
    if choice == '1':
        calculator = ShippingFeeCalculator(test_mode=True)
    elif choice == '2':
        confirm = input("Bạn có chắc muốn chạy ở chế độ PRODUCTION? (y/N): ").strip().lower()
        if confirm != 'y':
            print("Hủy bỏ thực thi.")
            return
        calculator = ShippingFeeCalculator(test_mode=False)
    else:
        print("Lựa chọn không hợp lệ.")
        return
    
    # Chạy script
    success = calculator.run()
    
    if success:
        print(f"\n✅ Script hoàn thành thành công!")
        print(f"📄 Log file: {calculator.log_file}")
    else:
        print(f"\n❌ Script gặp lỗi!")
        print(f"📄 Xem chi tiết trong log file: {calculator.log_file}")

if __name__ == "__main__":
    main()

