#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script tính và cập nhật phí giao hàng (shipping_fee và delivery_fee) - PRODUCTION VERSION
Tác giả: DataCo Team
Ngày tạo: 2025-01-11
Phiên bản: Production 1.0
"""

import mysql.connector
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import sys
import os
import json

# Cấu hình logging
def setup_logging():
    """Thiết lập logging với file riêng biệt cho production"""
    log_dir = "production_logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(log_dir, f"shipping_fee_production_{timestamp}.log")
    error_log_file = os.path.join(log_dir, f"shipping_fee_errors_{timestamp}.log")
    
    # Logger chính
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Logger riêng cho errors
    error_logger = logging.getLogger('error')
    error_handler = logging.FileHandler(error_log_file, encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_formatter = logging.Formatter('%(asctime)s - ERROR - %(message)s')
    error_handler.setFormatter(error_formatter)
    error_logger.addHandler(error_handler)
    
    return log_file, error_log_file

# Thông tin kết nối database PRODUCTION
DB_CONFIG = {
    'host': 'server.aptech.io',
    'port': 3307,
    'database': 'fastroute',  # PRODUCTION DATABASE
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

class ProductionShippingFeeCalculator:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.log_file, self.error_log_file = setup_logging()
        self.stats = {
            'order_items_processed': 0,
            'order_items_updated': 0,
            'order_items_errors': 0,
            'deliveries_processed': 0,
            'deliveries_updated': 0,
            'deliveries_errors': 0,
            'start_time': datetime.now(),
            'end_time': None
        }
        
        logging.info("=== BẮT ĐẦU PRODUCTION DEPLOYMENT - TÍNH TOÁN PHÍ GIAO HÀNG ===")
        logging.info(f"Database: {DB_CONFIG['database']}")
        logging.info(f"Log file: {self.log_file}")
        logging.info(f"Error log file: {self.error_log_file}")
        
    def connect_database(self):
        """Kết nối đến database với retry logic"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.connection = mysql.connector.connect(**DB_CONFIG)
                self.cursor = self.connection.cursor(dictionary=True)
                logging.info(f"✅ Kết nối thành công đến database: {DB_CONFIG['database']}")
                return True
            except mysql.connector.Error as e:
                logging.error(f"❌ Lỗi kết nối database (lần {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return False
        return False
    
    def disconnect_database(self):
        """Đóng kết nối database"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logging.info("✅ Đã đóng kết nối database")
    
    def create_backup_table(self):
        """Tạo bảng backup trước khi cập nhật"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Backup order_items
            backup_query = f"""
            CREATE TABLE order_items_backup_{timestamp} AS 
            SELECT * FROM order_items WHERE shipping_fee IS NOT NULL OR shipping_fee != 0
            """
            self.cursor.execute(backup_query)
            
            # Backup deliveries
            backup_query = f"""
            CREATE TABLE deliveries_backup_{timestamp} AS 
            SELECT * FROM deliveries WHERE delivery_fee IS NOT NULL OR delivery_fee != 0
            """
            self.cursor.execute(backup_query)
            
            self.connection.commit()
            logging.info(f"✅ Đã tạo bảng backup: order_items_backup_{timestamp}, deliveries_backup_{timestamp}")
            return True
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi tạo backup table: {e}")
            return False
    
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
    
    def get_order_items_batch(self, limit=1000, offset=0):
        """Lấy dữ liệu order_items theo batch để xử lý"""
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
        LIMIT %s OFFSET %s
        """
        
        try:
            self.cursor.execute(query, (limit, offset))
            results = self.cursor.fetchall()
            return results
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi truy vấn order_items batch (offset={offset}): {e}")
            return []
    
    def update_order_item_shipping_fee_batch(self, updates):
        """Cập nhật shipping_fee cho nhiều order_items cùng lúc"""
        if not updates:
            return 0
        
        try:
            update_query = """
            UPDATE order_items 
            SET shipping_fee = %s, updated_at = NOW()
            WHERE id = %s
            """
            self.cursor.executemany(update_query, updates)
            return len(updates)
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi cập nhật batch shipping_fee: {e}")
            return 0
    
    def process_shipping_fees(self):
        """Xử lý tính toán và cập nhật shipping_fees theo batch"""
        logging.info("🔄 Bắt đầu xử lý shipping_fees...")
        
        batch_size = 1000
        offset = 0
        total_processed = 0
        total_updated = 0
        total_errors = 0
        
        while True:
            # Lấy batch data
            batch_items = self.get_order_items_batch(batch_size, offset)
            if not batch_items:
                break
            
            batch_updates = []
            batch_processed = 0
            batch_errors = 0
            
            for item in batch_items:
                try:
                    # Tính shipping_fee
                    shipping_fee, shipping_weight, base_fee = self.calculate_shipping_fee(
                        weight=item['weight'],
                        volume=item['volume'],
                        is_fragile=bool(item['is_fragile']),
                        service_type=item['service_type']
                    )
                    
                    # Thêm vào batch updates
                    batch_updates.append((shipping_fee, item['order_item_id']))
                    batch_processed += 1
                    
                    # Log chi tiết cho một số item đầu tiên
                    if total_processed < 10:
                        logging.info(f"Order Item {item['order_item_id']}: {shipping_fee:,} VNĐ (Weight: {shipping_weight}kg)")
                    
                except Exception as e:
                    logging.error(f"❌ Lỗi xử lý order_item {item['order_item_id']}: {e}")
                    batch_errors += 1
            
            # Cập nhật batch
            if batch_updates:
                updated_count = self.update_order_item_shipping_fee_batch(batch_updates)
                total_updated += updated_count
                
                if updated_count != len(batch_updates):
                    logging.warning(f"⚠️  Batch update không hoàn toàn: {updated_count}/{len(batch_updates)}")
            
            total_processed += batch_processed
            total_errors += batch_errors
            
            # Log tiến trình
            if total_processed % 10000 == 0:
                logging.info(f"📊 Đã xử lý {total_processed:,} order_items...")
            
            offset += batch_size
        
        self.stats['order_items_processed'] = total_processed
        self.stats['order_items_updated'] = total_updated
        self.stats['order_items_errors'] = total_errors
        
        logging.info(f"✅ Hoàn thành xử lý shipping_fees:")
        logging.info(f"   - Đã xử lý: {total_processed:,} order_items")
        logging.info(f"   - Đã cập nhật: {total_updated:,} order_items")
        logging.info(f"   - Lỗi: {total_errors:,} order_items")
        
        return total_errors == 0
    
    def get_deliveries_data(self):
        """Lấy dữ liệu deliveries cần tính delivery_fee"""
        query = """
        SELECT 
            d.id as delivery_id,
            d.order_id,
            d.delivery_fee as current_delivery_fee,
            SUM(oi.shipping_fee) as total_shipping_fee,
            COUNT(oi.id) as item_count
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
            logging.info(f"📋 Tìm được {len(results)} deliveries cần cập nhật delivery_fee")
            return results
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi truy vấn deliveries: {e}")
            return []
    
    def update_delivery_fees_batch(self, updates):
        """Cập nhật delivery_fee cho nhiều deliveries cùng lúc"""
        if not updates:
            return 0
        
        try:
            update_query = """
            UPDATE deliveries 
            SET delivery_fee = %s, updated_at = NOW()
            WHERE id = %s
            """
            self.cursor.executemany(update_query, updates)
            return len(updates)
        except mysql.connector.Error as e:
            logging.error(f"❌ Lỗi cập nhật batch delivery_fee: {e}")
            return 0
    
    def process_delivery_fees(self):
        """Xử lý tính toán và cập nhật delivery_fees"""
        logging.info("🔄 Bắt đầu xử lý delivery_fees...")
        
        deliveries = self.get_deliveries_data()
        if not deliveries:
            logging.warning("⚠️  Không có deliveries nào để xử lý")
            return False
        
        delivery_updates = []
        processed = 0
        errors = 0
        
        for delivery in deliveries:
            try:
                delivery_fee = Decimal(str(delivery['total_shipping_fee']))
                delivery_updates.append((delivery_fee, delivery['delivery_id']))
                processed += 1
                
                # Log chi tiết cho một số delivery đầu tiên
                if processed <= 10:
                    logging.info(f"Delivery {delivery['delivery_id']}: {delivery_fee:,} VNĐ ({delivery['item_count']} items)")
                    
            except Exception as e:
                logging.error(f"❌ Lỗi xử lý delivery {delivery['delivery_id']}: {e}")
                errors += 1
        
        # Cập nhật tất cả deliveries
        if delivery_updates:
            updated_count = self.update_delivery_fees_batch(delivery_updates)
            
            self.stats['deliveries_processed'] = processed
            self.stats['deliveries_updated'] = updated_count
            self.stats['deliveries_errors'] = errors
            
            logging.info(f"✅ Hoàn thành xử lý delivery_fees:")
            logging.info(f"   - Đã xử lý: {processed:,} deliveries")
            logging.info(f"   - Đã cập nhật: {updated_count:,} deliveries")
            logging.info(f"   - Lỗi: {errors:,} deliveries")
            
            return errors == 0
        
        return False
    
    def save_execution_report(self):
        """Lưu báo cáo thực thi"""
        self.stats['end_time'] = datetime.now()
        execution_time = self.stats['end_time'] - self.stats['start_time']
        
        report = {
            'execution_info': {
                'start_time': self.stats['start_time'].isoformat(),
                'end_time': self.stats['end_time'].isoformat(),
                'execution_time_seconds': execution_time.total_seconds(),
                'database': DB_CONFIG['database'],
                'log_file': self.log_file,
                'error_log_file': self.error_log_file
            },
            'order_items_stats': {
                'processed': self.stats['order_items_processed'],
                'updated': self.stats['order_items_updated'],
                'errors': self.stats['order_items_errors']
            },
            'deliveries_stats': {
                'processed': self.stats['deliveries_processed'],
                'updated': self.stats['deliveries_updated'],
                'errors': self.stats['deliveries_errors']
            },
            'calculation_config': {
                'base_price_per_kg': str(BASE_PRICE_PER_KG),
                'fragile_multiplier': str(FRAGILE_MULTIPLIER),
                'volume_to_weight_factor': str(VOLUME_TO_WEIGHT_FACTOR),
                'service_type_multipliers': {k: str(v) for k, v in SERVICE_TYPE_MULTIPLIERS.items()}
            }
        }
        
        # Lưu báo cáo JSON
        report_file = f"production_logs/shipping_fee_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # Lưu báo cáo markdown
        markdown_report = f"""# BÁO CÁO THỰC THI TÍNH TOÁN PHÍ GIAO HÀNG

## Thông tin thực thi
- **Thời gian bắt đầu:** {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **Thời gian kết thúc:** {self.stats['end_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **Thời gian thực thi:** {execution_time.total_seconds():.2f} giây
- **Database:** {DB_CONFIG['database']}

## Kết quả xử lý

### Order Items (shipping_fee)
- **Đã xử lý:** {self.stats['order_items_processed']:,} items
- **Đã cập nhật:** {self.stats['order_items_updated']:,} items
- **Lỗi:** {self.stats['order_items_errors']:,} items
- **Tỷ lệ thành công:** {(self.stats['order_items_updated']/max(self.stats['order_items_processed'], 1)*100):.2f}%

### Deliveries (delivery_fee)
- **Đã xử lý:** {self.stats['deliveries_processed']:,} deliveries
- **Đã cập nhật:** {self.stats['deliveries_updated']:,} deliveries
- **Lỗi:** {self.stats['deliveries_errors']:,} deliveries
- **Tỷ lệ thành công:** {(self.stats['deliveries_updated']/max(self.stats['deliveries_processed'], 1)*100):.2f}%

## Cấu hình tính toán
- **Giá cơ bản:** {BASE_PRICE_PER_KG:,} VNĐ/kg
- **Hệ số hàng dễ vỡ:** {FRAGILE_MULTIPLIER}
- **Hệ số quy đổi thể tích:** {VOLUME_TO_WEIGHT_FACTOR} kg/m³

### Hệ số service type:
- **SECOND_CLASS:** {SERVICE_TYPE_MULTIPLIERS['SECOND_CLASS']}
- **STANDARD:** {SERVICE_TYPE_MULTIPLIERS['STANDARD']}
- **FIRST_CLASS:** {SERVICE_TYPE_MULTIPLIERS['FIRST_CLASS']}
- **EXPRESS:** {SERVICE_TYPE_MULTIPLIERS['EXPRESS']}

## Files
- **Log file:** {self.log_file}
- **Error log file:** {self.error_log_file}
- **Report file:** {report_file}
"""
        
        markdown_file = f"production_logs/shipping_fee_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        logging.info(f"📄 Đã lưu báo cáo: {report_file}")
        logging.info(f"📄 Đã lưu báo cáo markdown: {markdown_file}")
        
        return report_file, markdown_file
    
    def run(self):
        """Chạy toàn bộ quy trình tính toán phí giao hàng PRODUCTION"""
        try:
            # 1. Kết nối database
            if not self.connect_database():
                logging.error("❌ Không thể kết nối database. Dừng thực thi.")
                return False
            
            # 2. Tạo backup
            if not self.create_backup_table():
                logging.error("❌ Không thể tạo backup. Dừng thực thi.")
                return False
            
            # 3. Bắt đầu transaction
            self.connection.start_transaction()
            logging.info("🔄 Bắt đầu transaction")
            
            # 4. Xử lý shipping_fees
            if not self.process_shipping_fees():
                self.connection.rollback()
                logging.error("❌ Lỗi xử lý shipping_fees, rollback transaction")
                return False
            
            # 5. Xử lý delivery_fees
            if not self.process_delivery_fees():
                self.connection.rollback()
                logging.error("❌ Lỗi xử lý delivery_fees, rollback transaction")
                return False
            
            # 6. Commit transaction
            self.connection.commit()
            logging.info("✅ COMMIT TRANSACTION THÀNH CÔNG!")
            
            # 7. Lưu báo cáo
            report_file, markdown_file = self.save_execution_report()
            
            logging.info("🎉 === HOÀN THÀNH PRODUCTION DEPLOYMENT ===")
            logging.info(f"📊 Tổng kết:")
            logging.info(f"   - Order items: {self.stats['order_items_updated']:,}/{self.stats['order_items_processed']:,}")
            logging.info(f"   - Deliveries: {self.stats['deliveries_updated']:,}/{self.stats['deliveries_processed']:,}")
            
            return True
            
        except Exception as e:
            logging.error(f"❌ Lỗi nghiêm trọng trong quá trình xử lý: {e}")
            if self.connection:
                self.connection.rollback()
                logging.error("🔄 Đã rollback transaction")
            return False
        finally:
            self.disconnect_database()

def main():
    """Hàm main cho production"""
    print("🚀 === PRODUCTION DEPLOYMENT - TÍNH TOÁN PHÍ GIAO HÀNG ===")
    print("⚠️  CẢNH BÁO: Script này sẽ cập nhật DATABASE PRODUCTION!")
    print()
    print("Thông tin kết nối:")
    print(f"   Host: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"   Database: {DB_CONFIG['database']}")
    print(f"   User: {DB_CONFIG['user']}")
    print()
    
    # Xác nhận từ người dùng
    confirm1 = input("Bạn có chắc chắn muốn tiếp tục? (yes/no): ").strip().lower()
    if confirm1 != 'yes':
        print("❌ Đã hủy thực thi.")
        return
    
    confirm2 = input("Vui lòng gõ 'PRODUCTION' để xác nhận: ").strip()
    if confirm2 != 'PRODUCTION':
        print("❌ Xác nhận không chính xác. Đã hủy thực thi.")
        return
    
    print("🔄 Bắt đầu thực thi...")
    
    # Chạy script
    calculator = ProductionShippingFeeCalculator()
    success = calculator.run()
    
    if success:
        print(f"\n🎉 ✅ PRODUCTION DEPLOYMENT THÀNH CÔNG!")
        print(f"📄 Log file: {calculator.log_file}")
        print(f"📄 Error log file: {calculator.error_log_file}")
    else:
        print(f"\n💥 ❌ PRODUCTION DEPLOYMENT THẤT BẠI!")
        print(f"📄 Xem chi tiết trong log files:")
        print(f"   - {calculator.log_file}")
        print(f"   - {calculator.error_log_file}")

if __name__ == "__main__":
    main()

