#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script validation kiểm tra kết quả tính phí giao hàng
Tác giả: DataCo Team
Ngày tạo: 2025-01-11
"""

import mysql.connector
import logging
from datetime import datetime
from decimal import Decimal
import sys
import os

# Cấu hình logging
def setup_logging():
    """Thiết lập logging"""
    log_dir = "validation_logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(log_dir, f"validation_{timestamp}.log")
    
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
    'database': 'fastroute',  # hoặc fastroute_test để test
    'user': 'fastroute_user',
    'password': 'fastroute_password',
    'charset': 'utf8mb4'
}

class ShippingFeeValidator:
    def __init__(self, database='fastroute'):
        DB_CONFIG['database'] = database
        self.connection = None
        self.cursor = None
        self.log_file = setup_logging()
        
        logging.info("=== BẮT ĐẦU VALIDATION PHÍ GIAO HÀNG ===")
        logging.info(f"Database: {database}")
        
    def connect_database(self):
        """Kết nối đến database"""
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            self.cursor = self.connection.cursor(dictionary=True)
            logging.info(f"✅ Kết nối thành công đến database: {DB_CONFIG['database']}")
            return True
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi kết nối database: {e}")
            return False
    
    def disconnect_database(self):
        """Đóng kết nối database"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logging.info("✅ Đã đóng kết nối database")
    
    def validate_shipping_fee_calculations(self):
        """Kiểm tra tính toán shipping_fee"""
        logging.info("🔍 Kiểm tra tính toán shipping_fee...")
        
        query = """
        SELECT 
            oi.id as order_item_id,
            oi.shipping_fee,
            p.weight,
            p.volume,
            p.is_fragile,
            p.name as product_name,
            d.service_type
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        JOIN deliveries d ON o.id = d.order_id
        WHERE oi.shipping_fee IS NOT NULL
        LIMIT 20
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            
            errors = 0
            for item in results:
                # Tính lại shipping_fee
                weight = Decimal(str(item['weight'])) if item['weight'] else Decimal('0')
                volume = Decimal(str(item['volume'])) if item['volume'] else Decimal('0')
                
                # Trọng lượng tính phí
                volume_weight = volume * Decimal('200')
                shipping_weight = max(weight, volume_weight)
                
                # Phí cơ bản
                base_fee = shipping_weight * Decimal('15000')
                
                # Hệ số rủi ro
                fragile_multiplier = Decimal('1.3') if item['is_fragile'] else Decimal('1.0')
                
                # Hệ số service type
                service_multipliers = {
                    'SECOND_CLASS': Decimal('0.8'),
                    'STANDARD': Decimal('1.0'),
                    'FIRST_CLASS': Decimal('1.3'),
                    'EXPRESS': Decimal('1.8')
                }
                service_multiplier = service_multipliers.get(item['service_type'], Decimal('1.0'))
                
                # Tổng phí
                expected_fee = base_fee * fragile_multiplier * service_multiplier
                expected_fee = expected_fee.quantize(Decimal('0.01'))
                
                actual_fee = Decimal(str(item['shipping_fee']))
                
                if abs(expected_fee - actual_fee) > Decimal('0.01'):
                    logging.error(f"❌ Order Item {item['order_item_id']}: Expected {expected_fee}, Got {actual_fee}")
                    errors += 1
                else:
                    logging.info(f"✅ Order Item {item['order_item_id']}: {actual_fee} VNĐ (Correct)")
            
            logging.info(f"📊 Kiểm tra shipping_fee: {len(results) - errors}/{len(results)} đúng")
            return errors == 0
            
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi kiểm tra shipping_fee: {e}")
            return False
    
    def validate_delivery_fee_calculations(self):
        """Kiểm tra tính toán delivery_fee"""
        logging.info("🔍 Kiểm tra tính toán delivery_fee...")
        
        query = """
        SELECT 
            d.id as delivery_id,
            d.delivery_fee,
            SUM(oi.shipping_fee) as expected_delivery_fee,
            COUNT(oi.id) as item_count
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE d.delivery_fee IS NOT NULL AND oi.shipping_fee IS NOT NULL
        GROUP BY d.id, d.delivery_fee
        LIMIT 20
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            
            errors = 0
            for delivery in results:
                actual_fee = Decimal(str(delivery['delivery_fee']))
                expected_fee = Decimal(str(delivery['expected_delivery_fee']))
                
                if abs(expected_fee - actual_fee) > Decimal('0.01'):
                    logging.error(f"❌ Delivery {delivery['delivery_id']}: Expected {expected_fee}, Got {actual_fee}")
                    errors += 1
                else:
                    logging.info(f"✅ Delivery {delivery['delivery_id']}: {actual_fee} VNĐ ({delivery['item_count']} items)")
            
            logging.info(f"📊 Kiểm tra delivery_fee: {len(results) - errors}/{len(results)} đúng")
            return errors == 0
            
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi kiểm tra delivery_fee: {e}")
            return False
    
    def get_statistics(self):
        """Lấy thống kê tổng quan"""
        logging.info("📊 Lấy thống kê tổng quan...")
        
        queries = {
            'total_order_items': "SELECT COUNT(*) as count FROM order_items",
            'order_items_with_shipping_fee': "SELECT COUNT(*) as count FROM order_items WHERE shipping_fee IS NOT NULL",
            'total_deliveries': "SELECT COUNT(*) as count FROM deliveries",
            'deliveries_with_delivery_fee': "SELECT COUNT(*) as count FROM deliveries WHERE delivery_fee IS NOT NULL",
            'shipping_fee_stats': """
                SELECT 
                    MIN(shipping_fee) as min_fee,
                    MAX(shipping_fee) as max_fee,
                    AVG(shipping_fee) as avg_fee,
                    SUM(shipping_fee) as total_fee
                FROM order_items 
                WHERE shipping_fee IS NOT NULL
            """,
            'delivery_fee_stats': """
                SELECT 
                    MIN(delivery_fee) as min_fee,
                    MAX(delivery_fee) as max_fee,
                    AVG(delivery_fee) as avg_fee,
                    SUM(delivery_fee) as total_fee
                FROM deliveries 
                WHERE delivery_fee IS NOT NULL
            """,
            'service_type_distribution': """
                SELECT 
                    d.service_type,
                    COUNT(*) as count,
                    AVG(oi.shipping_fee) as avg_shipping_fee
                FROM deliveries d
                JOIN orders o ON d.order_id = o.id
                JOIN order_items oi ON o.id = oi.order_id
                WHERE oi.shipping_fee IS NOT NULL
                GROUP BY d.service_type
                ORDER BY count DESC
            """
        }
        
        stats = {}
        for key, query in queries.items():
            try:
                self.cursor.execute(query)
                if key in ['service_type_distribution']:
                    stats[key] = self.cursor.fetchall()
                else:
                    stats[key] = self.cursor.fetchone()
                    
            except mysql.connector.Error as e:
                logging.error(f"❌ Lỗi truy vấn {key}: {e}")
                stats[key] = None
        
        # In thống kê
        logging.info("=" * 50)
        logging.info("📈 THỐNG KÊ TỔNG QUAN")
        logging.info("=" * 50)
        
        if stats['total_order_items']:
            logging.info(f"📦 Tổng order_items: {stats['total_order_items']['count']:,}")
        
        if stats['order_items_with_shipping_fee']:
            total = stats['total_order_items']['count'] if stats['total_order_items'] else 0
            with_fee = stats['order_items_with_shipping_fee']['count']
            percentage = (with_fee / total * 100) if total > 0 else 0
            logging.info(f"💰 Order_items có shipping_fee: {with_fee:,} ({percentage:.2f}%)")
        
        if stats['total_deliveries']:
            logging.info(f"🚚 Tổng deliveries: {stats['total_deliveries']['count']:,}")
        
        if stats['deliveries_with_delivery_fee']:
            total = stats['total_deliveries']['count'] if stats['total_deliveries'] else 0
            with_fee = stats['deliveries_with_delivery_fee']['count']
            percentage = (with_fee / total * 100) if total > 0 else 0
            logging.info(f"💰 Deliveries có delivery_fee: {with_fee:,} ({percentage:.2f}%)")
        
        if stats['shipping_fee_stats']:
            s = stats['shipping_fee_stats']
            logging.info(f"📊 Shipping fee - Min: {s['min_fee']:,}, Max: {s['max_fee']:,}, Avg: {s['avg_fee']:,.2f}")
            logging.info(f"💵 Tổng shipping fee: {s['total_fee']:,.2f} VNĐ")
        
        if stats['delivery_fee_stats']:
            s = stats['delivery_fee_stats']
            logging.info(f"📊 Delivery fee - Min: {s['min_fee']:,}, Max: {s['max_fee']:,}, Avg: {s['avg_fee']:,.2f}")
            logging.info(f"💵 Tổng delivery fee: {s['total_fee']:,.2f} VNĐ")
        
        if stats['service_type_distribution']:
            logging.info("📈 Phân bố theo service type:")
            for item in stats['service_type_distribution']:
                logging.info(f"   {item['service_type']}: {item['count']:,} orders (Avg: {item['avg_shipping_fee']:,.2f} VNĐ)")
        
        return stats
    
    def check_data_integrity(self):
        """Kiểm tra tính toàn vẹn dữ liệu"""
        logging.info("🔍 Kiểm tra tính toàn vẹn dữ liệu...")
        
        checks = [
            {
                'name': 'Order items có shipping_fee âm',
                'query': 'SELECT COUNT(*) as count FROM order_items WHERE shipping_fee < 0'
            },
            {
                'name': 'Deliveries có delivery_fee âm',
                'query': 'SELECT COUNT(*) as count FROM deliveries WHERE delivery_fee < 0'
            },
            {
                'name': 'Order items có shipping_fee = 0',
                'query': 'SELECT COUNT(*) as count FROM order_items WHERE shipping_fee = 0'
            },
            {
                'name': 'Deliveries có delivery_fee = 0',
                'query': 'SELECT COUNT(*) as count FROM deliveries WHERE delivery_fee = 0'
            },
            {
                'name': 'Orders không có delivery tương ứng',
                'query': '''
                    SELECT COUNT(*) as count 
                    FROM orders o 
                    LEFT JOIN deliveries d ON o.id = d.order_id 
                    WHERE d.id IS NULL
                '''
            }
        ]
        
        issues = 0
        for check in checks:
            try:
                self.cursor.execute(check['query'])
                result = self.cursor.fetchone()
                count = result['count']
                
                if count > 0:
                    logging.warning(f"⚠️  {check['name']}: {count:,} records")
                    issues += 1
                else:
                    logging.info(f"✅ {check['name']}: OK")
                    
            except mysql.connector.Error as e:
                logging.error(f"❌ Lỗi kiểm tra {check['name']}: {e}")
                issues += 1
        
        logging.info(f"📊 Kiểm tra tính toàn vẹn: {len(checks) - issues}/{len(checks)} OK")
        return issues == 0
    
    def run_validation(self):
        """Chạy toàn bộ validation"""
        try:
            if not self.connect_database():
                return False
            
            # Các kiểm tra
            shipping_fee_ok = self.validate_shipping_fee_calculations()
            delivery_fee_ok = self.validate_delivery_fee_calculations()
            integrity_ok = self.check_data_integrity()
            
            # Thống kê
            self.get_statistics()
            
            # Kết luận
            logging.info("=" * 50)
            if shipping_fee_ok and delivery_fee_ok and integrity_ok:
                logging.info("🎉 ✅ TẤT CẢ VALIDATION ĐỀU THÀNH CÔNG!")
            else:
                logging.error("❌ CÓ LỖI TRONG QUÁ TRÌNH VALIDATION!")
                logging.error(f"   Shipping fee: {'✅' if shipping_fee_ok else '❌'}")
                logging.error(f"   Delivery fee: {'✅' if delivery_fee_ok else '❌'}")
                logging.error(f"   Data integrity: {'✅' if integrity_ok else '❌'}")
            
            logging.info("=" * 50)
            return shipping_fee_ok and delivery_fee_ok and integrity_ok
            
        finally:
            self.disconnect_database()

def main():
    """Hàm main"""
    print("🔍 === VALIDATION PHÍ GIAO HÀNG ===")
    print("1. Validate trên database TEST (fastroute_test)")
    print("2. Validate trên database PRODUCTION (fastroute)")
    
    choice = input("Chọn database (1/2): ").strip()
    
    if choice == '1':
        database = 'fastroute_test'
    elif choice == '2':
        database = 'fastroute'
    else:
        print("❌ Lựa chọn không hợp lệ.")
        return
    
    # Chạy validation
    validator = ShippingFeeValidator(database)
    success = validator.run_validation()
    
    if success:
        print(f"\n✅ Validation thành công!")
        print(f"📄 Log file: {validator.log_file}")
    else:
        print(f"\n❌ Validation có lỗi!")
        print(f"📄 Xem chi tiết trong log file: {validator.log_file}")

if __name__ == "__main__":
    main()

