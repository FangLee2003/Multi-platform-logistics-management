#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PRODUCTION SHIPPING FEE CALCULATOR - SECURITY & RELIABILITY FIXED
Tác giả: DataCo Team + Security Expert Review
Phiên bản: Production 2.0 - SECURE & RELIABLE
"""

import mysql.connector
import logging
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import sys
import os
import json
import time
from typing import List, Tuple, Optional, Dict, Any

# Import secure configuration
from shipping_fee_config import (
    get_database_config, SHIPPING_CONSTANTS, SERVICE_TYPE_MULTIPLIERS,
    PROCESSING_CONFIG, LOGGING_CONFIG, VALIDATION_CONFIG, SECURITY_CONFIG
)

class SecureShippingFeeCalculator:
    """
    Production-grade shipping fee calculator with:
    - Secure configuration management
    - Chunked transactions to prevent timeouts
    - Comprehensive error handling
    - Proper backup mechanisms
    - Input validation
    """
    
    def __init__(self, is_test: bool = False):
        self.is_test = is_test
        self.connection = None
        self.cursor = None
        self.db_config = get_database_config(is_test)
        
        # Setup secure logging
        self.log_file, self.error_log_file = self._setup_secure_logging()
        
        # Statistics tracking
        self.stats = {
            'order_items_processed': 0,
            'order_items_updated': 0,
            'order_items_errors': 0,
            'deliveries_processed': 0,
            'deliveries_updated': 0,
            'deliveries_errors': 0,
            'transactions_committed': 0,
            'start_time': datetime.now(),
            'end_time': None
        }
        
        # Security: Don't log credentials
        safe_db_info = {k: v for k, v in self.db_config.items() if k != 'password'}
        
        logging.info("=== SECURE PRODUCTION SHIPPING FEE CALCULATOR ===")
        logging.info(f"Database: {safe_db_info.get('database')}")
        logging.info(f"Host: {safe_db_info.get('host')}:{safe_db_info.get('port')}")
        logging.info(f"Mode: {'TEST' if is_test else 'PRODUCTION'}")
        logging.info(f"Transaction chunk size: {PROCESSING_CONFIG['transaction_chunk_size']:,}")
        logging.info(f"Batch size: {PROCESSING_CONFIG['batch_size']:,}")
        
    def _setup_secure_logging(self) -> Tuple[str, str]:
        """Setup secure logging with rotation"""
        log_dir = "production_logs"
        os.makedirs(log_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = os.path.join(log_dir, f"shipping_fee_secure_{timestamp}.log")
        error_log_file = os.path.join(log_dir, f"shipping_fee_errors_{timestamp}.log")
        
        # Main logger
        logging.basicConfig(
            level=getattr(logging, LOGGING_CONFIG['level']),
            format=LOGGING_CONFIG['format'],
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        # Separate error logger
        error_logger = logging.getLogger('error')
        error_handler = logging.FileHandler(error_log_file, encoding='utf-8')
        error_handler.setLevel(logging.ERROR)
        error_formatter = logging.Formatter('%(asctime)s - ERROR - %(message)s')
        error_handler.setFormatter(error_formatter)
        error_logger.addHandler(error_handler)
        
        return log_file, error_log_file
    
    def _connect_database_with_retry(self) -> bool:
        """Connect to database with exponential backoff retry"""
        max_retries = PROCESSING_CONFIG['max_retries']
        base_delay = PROCESSING_CONFIG['retry_delay']
        
        for attempt in range(max_retries):
            try:
                self.connection = mysql.connector.connect(**self.db_config)
                self.cursor = self.connection.cursor(dictionary=True, buffered=True)
                
                # Test connection
                self.cursor.execute("SELECT 1")
                self.cursor.fetchone()
                
                logging.info(f"✅ Database connection successful (attempt {attempt + 1})")
                return True
                
            except mysql.connector.Error as e:
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                logging.error(f"❌ Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
                    logging.info(f"⏳ Retrying in {delay:.1f} seconds...")
                    time.sleep(delay)
                else:
                    logging.error("💥 All connection attempts failed!")
                    
        return False
    
    def _disconnect_database(self):
        """Safely disconnect from database"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            logging.info("✅ Database disconnected safely")
        except Exception as e:
            logging.error(f"⚠️  Error during disconnection: {e}")
    
    def _create_secure_backup(self) -> bool:
        """Create comprehensive backup with proper naming"""
        if not PROCESSING_CONFIG['enable_backup']:
            logging.info("📋 Backup disabled by configuration")
            return True
            
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # FIXED: Backup ALL records, not just those with fees
            backup_queries = [
                f"""
                CREATE TABLE order_items_backup_{timestamp} AS 
                SELECT * FROM order_items
                """,
                f"""
                CREATE TABLE deliveries_backup_{timestamp} AS 
                SELECT * FROM deliveries
                """
            ]
            
            for query in backup_queries:
                self.cursor.execute(query)
            
            self.connection.commit()
            logging.info(f"✅ Backup tables created: order_items_backup_{timestamp}, deliveries_backup_{timestamp}")
            return True
            
        except mysql.connector.Error as e:
            logging.error(f"❌ Backup creation failed: {e}")
            return False
    
    def _validate_input(self, weight: Optional[float], volume: Optional[float], 
                       service_type: str) -> bool:
        """Validate input parameters"""
        try:
            # Validate weight
            if weight is not None:
                weight_decimal = Decimal(str(weight))
                if not (VALIDATION_CONFIG['min_weight'] <= weight_decimal <= VALIDATION_CONFIG['max_weight']):
                    return False
            
            # Validate volume
            if volume is not None:
                volume_decimal = Decimal(str(volume))
                if not (VALIDATION_CONFIG['min_volume'] <= volume_decimal <= VALIDATION_CONFIG['max_volume']):
                    return False
            
            # Validate service type
            if service_type not in SERVICE_TYPE_MULTIPLIERS:
                logging.warning(f"⚠️  Unknown service type: {service_type}, using default multiplier")
            
            return True
            
        except (ValueError, TypeError) as e:
            logging.error(f"❌ Input validation error: {e}")
            return False
    
    def _calculate_shipping_fee(self, weight: Optional[float], volume: Optional[float], 
                              is_fragile: bool, service_type: str) -> Tuple[Decimal, Decimal, Decimal]:
        """Calculate shipping fee with validation"""
        
        # Input validation
        if not self._validate_input(weight, volume, service_type):
            raise ValueError("Invalid input parameters")
        
        # Convert to Decimal for precision
        actual_weight = Decimal(str(weight)) if weight else Decimal('0')
        volume_val = Decimal(str(volume)) if volume else Decimal('0')
        
        # Calculate shipping weight
        volume_weight = volume_val * SHIPPING_CONSTANTS['VOLUME_TO_WEIGHT_FACTOR']
        shipping_weight = max(actual_weight, volume_weight)
        
        # Calculate base fee
        base_fee = shipping_weight * SHIPPING_CONSTANTS['BASE_PRICE_PER_KG']
        
        # Apply fragile multiplier
        fragile_multiplier = (SHIPPING_CONSTANTS['FRAGILE_MULTIPLIER'] 
                            if is_fragile else SHIPPING_CONSTANTS['NORMAL_MULTIPLIER'])
        
        # Apply service type multiplier
        service_multiplier = SERVICE_TYPE_MULTIPLIERS.get(service_type, Decimal('1.0'))
        
        # Calculate total fee
        total_fee = base_fee * fragile_multiplier * service_multiplier
        total_fee = total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Validate result
        if total_fee > VALIDATION_CONFIG['max_shipping_fee']:
            logging.warning(f"⚠️  Shipping fee {total_fee} exceeds maximum allowed")
        
        return total_fee, shipping_weight, base_fee
    
    def _get_order_items_chunk(self, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Get order items with optimized query"""
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
        FORCE INDEX (PRIMARY)
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id  
        JOIN deliveries d ON o.id = d.order_id
        WHERE oi.id > %s
        ORDER BY oi.id
        LIMIT %s
        """
        
        try:
            self.cursor.execute(query, (offset, limit))
            results = self.cursor.fetchall()
            return results
        except mysql.connector.Error as e:
            logging.error(f"❌ Query failed (offset={offset}): {e}")
            return []
    
    def _update_shipping_fees_batch(self, updates: List[Tuple[Decimal, int]]) -> int:
        """Update shipping fees with error handling"""
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
            logging.error(f"❌ Batch update failed: {e}")
            return 0
    
    def _process_shipping_fees_chunked(self) -> bool:
        """Process shipping fees with chunked transactions"""
        logging.info("🔄 Starting chunked shipping fee processing...")
        
        batch_size = PROCESSING_CONFIG['batch_size']
        chunk_size = PROCESSING_CONFIG['transaction_chunk_size']
        
        total_processed = 0
        total_updated = 0
        total_errors = 0
        chunk_start_time = datetime.now()
        
        # Start with offset 0, use cursor-based pagination
        last_id = 0
        
        while True:
            try:
                # Start transaction for this chunk
                self.connection.start_transaction()
                chunk_processed = 0
                chunk_updated = 0
                chunk_errors = 0
                
                # Process batches within this transaction chunk
                while chunk_processed < chunk_size:
                    # Get batch data
                    batch_items = self._get_order_items_chunk(batch_size, last_id)
                    if not batch_items:
                        break
                    
                    batch_updates = []
                    
                    for item in batch_items:
                        try:
                            # Calculate shipping fee
                            shipping_fee, shipping_weight, base_fee = self._calculate_shipping_fee(
                                weight=item['weight'],
                                volume=item['volume'], 
                                is_fragile=bool(item['is_fragile']),
                                service_type=item['service_type']
                            )
                            
                            batch_updates.append((shipping_fee, item['order_item_id']))
                            
                            # Log first few items for verification
                            if total_processed < 5:
                                logging.info(f"Item {item['order_item_id']}: {shipping_fee:,} VNĐ "
                                           f"(Weight: {shipping_weight}kg, Service: {item['service_type']})")
                            
                        except Exception as e:
                            logging.error(f"❌ Error processing item {item['order_item_id']}: {e}")
                            chunk_errors += 1
                    
                    # Update batch
                    if batch_updates:
                        updated_count = self._update_shipping_fees_batch(batch_updates)
                        chunk_updated += updated_count
                        
                        if updated_count != len(batch_updates):
                            logging.warning(f"⚠️  Partial batch update: {updated_count}/{len(batch_updates)}")
                    
                    chunk_processed += len(batch_items)
                    last_id = batch_items[-1]['order_item_id']  # Cursor-based pagination
                    
                    # Progress logging
                    if (total_processed + chunk_processed) % 5000 == 0:
                        logging.info(f"📊 Progress: {total_processed + chunk_processed:,} items processed...")
                
                # Commit transaction chunk
                if chunk_processed > 0:
                    self.connection.commit()
                    self.stats['transactions_committed'] += 1
                    
                    chunk_time = (datetime.now() - chunk_start_time).total_seconds()
                    logging.info(f"✅ Chunk committed: {chunk_processed:,} processed, "
                               f"{chunk_updated:,} updated in {chunk_time:.1f}s")
                
                total_processed += chunk_processed
                total_updated += chunk_updated
                total_errors += chunk_errors
                chunk_start_time = datetime.now()
                
                # Break if no more data
                if chunk_processed == 0:
                    break
                    
            except mysql.connector.Error as e:
                logging.error(f"❌ Transaction chunk failed: {e}")
                try:
                    self.connection.rollback()
                    logging.info("🔄 Transaction chunk rolled back")
                except:
                    pass
                return False
            
            except Exception as e:
                logging.error(f"💥 Unexpected error in chunk processing: {e}")
                try:
                    self.connection.rollback()
                except:
                    pass
                return False
        
        # Update statistics
        self.stats['order_items_processed'] = total_processed
        self.stats['order_items_updated'] = total_updated
        self.stats['order_items_errors'] = total_errors
        
        logging.info(f"✅ Shipping fee processing completed:")
        logging.info(f"   📊 Processed: {total_processed:,} items")
        logging.info(f"   ✅ Updated: {total_updated:,} items")
        logging.info(f"   ❌ Errors: {total_errors:,} items")
        logging.info(f"   🔄 Transactions: {self.stats['transactions_committed']:,}")
        
        return total_errors == 0
    
    def _process_delivery_fees(self) -> bool:
        """Process delivery fees with error handling"""
        logging.info("🚚 Processing delivery fees...")
        
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
            self.connection.start_transaction()
            
            self.cursor.execute(query)
            deliveries = self.cursor.fetchall()
            
            if not deliveries:
                logging.warning("⚠️  No deliveries found to process")
                return True
            
            delivery_updates = []
            processed = 0
            errors = 0
            
            for delivery in deliveries:
                try:
                    delivery_fee = Decimal(str(delivery['total_shipping_fee']))
                    delivery_updates.append((delivery_fee, delivery['delivery_id']))
                    processed += 1
                    
                    # Log first few for verification
                    if processed <= 5:
                        logging.info(f"Delivery {delivery['delivery_id']}: {delivery_fee:,} VNĐ "
                                   f"({delivery['item_count']} items)")
                        
                except Exception as e:
                    logging.error(f"❌ Error processing delivery {delivery['delivery_id']}: {e}")
                    errors += 1
            
            # Update all deliveries
            if delivery_updates:
                update_query = """
                UPDATE deliveries 
                SET delivery_fee = %s, updated_at = NOW()
                WHERE id = %s
                """
                self.cursor.executemany(update_query, delivery_updates)
                self.connection.commit()
                
                updated_count = len(delivery_updates)
                logging.info(f"✅ Delivery fee processing completed:")
                logging.info(f"   📊 Processed: {processed:,} deliveries")
                logging.info(f"   ✅ Updated: {updated_count:,} deliveries")
                logging.info(f"   ❌ Errors: {errors:,} deliveries")
                
                self.stats['deliveries_processed'] = processed
                self.stats['deliveries_updated'] = updated_count
                self.stats['deliveries_errors'] = errors
                
                return errors == 0
            
            return False
            
        except mysql.connector.Error as e:
            logging.error(f"❌ Delivery fee processing failed: {e}")
            try:
                self.connection.rollback()
            except:
                pass
            return False
    
    def _save_execution_report(self) -> Tuple[str, str]:
        """Save comprehensive execution report"""
        self.stats['end_time'] = datetime.now()
        execution_time = self.stats['end_time'] - self.stats['start_time']
        
        report = {
            'execution_info': {
                'start_time': self.stats['start_time'].isoformat(),
                'end_time': self.stats['end_time'].isoformat(),
                'execution_time_seconds': execution_time.total_seconds(),
                'database': self.db_config['database'],
                'mode': 'TEST' if self.is_test else 'PRODUCTION',
                'version': 'Production 2.0 - SECURE & RELIABLE'
            },
            'processing_stats': {
                'order_items_processed': self.stats['order_items_processed'],
                'order_items_updated': self.stats['order_items_updated'],
                'order_items_errors': self.stats['order_items_errors'],
                'deliveries_processed': self.stats['deliveries_processed'],
                'deliveries_updated': self.stats['deliveries_updated'],
                'deliveries_errors': self.stats['deliveries_errors'],
                'transactions_committed': self.stats['transactions_committed']
            },
            'configuration': {
                'batch_size': PROCESSING_CONFIG['batch_size'],
                'transaction_chunk_size': PROCESSING_CONFIG['transaction_chunk_size'],
                'base_price_per_kg': str(SHIPPING_CONSTANTS['BASE_PRICE_PER_KG']),
                'service_multipliers': {k: str(v) for k, v in SERVICE_TYPE_MULTIPLIERS.items()}
            }
        }
        
        # Save JSON report
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f"production_logs/shipping_fee_report_secure_{timestamp}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # Save markdown summary
        success_rate_items = (self.stats['order_items_updated'] / 
                            max(self.stats['order_items_processed'], 1) * 100)
        success_rate_deliveries = (self.stats['deliveries_updated'] / 
                                 max(self.stats['deliveries_processed'], 1) * 100)
        
        markdown_content = f"""# SHIPPING FEE CALCULATION REPORT - SECURE VERSION

## Execution Summary
- **Start Time:** {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **End Time:** {self.stats['end_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **Duration:** {execution_time.total_seconds():.1f} seconds
- **Mode:** {'TEST' if self.is_test else 'PRODUCTION'}
- **Version:** Production 2.0 - SECURE & RELIABLE

## Processing Results
### Order Items (shipping_fee)
- **Processed:** {self.stats['order_items_processed']:,}
- **Updated:** {self.stats['order_items_updated']:,}
- **Errors:** {self.stats['order_items_errors']:,}
- **Success Rate:** {success_rate_items:.2f}%

### Deliveries (delivery_fee)
- **Processed:** {self.stats['deliveries_processed']:,}
- **Updated:** {self.stats['deliveries_updated']:,}
- **Errors:** {self.stats['deliveries_errors']:,}
- **Success Rate:** {success_rate_deliveries:.2f}%

## Technical Details
- **Transactions Committed:** {self.stats['transactions_committed']:,}
- **Batch Size:** {PROCESSING_CONFIG['batch_size']:,}
- **Transaction Chunk Size:** {PROCESSING_CONFIG['transaction_chunk_size']:,}
- **Base Price:** {SHIPPING_CONSTANTS['BASE_PRICE_PER_KG']:,} VNĐ/kg

## Security Features Applied
- ✅ Secure credential management
- ✅ Chunked transactions (no timeouts)
- ✅ Comprehensive backup
- ✅ Input validation
- ✅ Error handling with retry
- ✅ No credential logging
"""
        
        markdown_file = f"production_logs/shipping_fee_report_secure_{timestamp}.md"
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        logging.info(f"📄 Reports saved:")
        logging.info(f"   JSON: {report_file}")
        logging.info(f"   Markdown: {markdown_file}")
        
        return report_file, markdown_file
    
    def run(self) -> bool:
        """Execute the complete shipping fee calculation process"""
        try:
            # 1. Connect to database
            if not self._connect_database_with_retry():
                logging.error("💥 Cannot proceed without database connection")
                return False
            
            # 2. Create backup
            if not self._create_secure_backup():
                logging.error("💥 Backup creation failed, aborting for safety")
                return False
            
            # 3. Process shipping fees with chunked transactions
            if not self._process_shipping_fees_chunked():
                logging.error("💥 Shipping fee processing failed")
                return False
            
            # 4. Process delivery fees
            if not self._process_delivery_fees():
                logging.error("💥 Delivery fee processing failed")
                return False
            
            # 5. Generate reports
            report_file, markdown_file = self._save_execution_report()
            
            # 6. Success summary
            logging.info("🎉 === SECURE PRODUCTION DEPLOYMENT COMPLETED ===")
            logging.info(f"✅ Order Items: {self.stats['order_items_updated']:,}/{self.stats['order_items_processed']:,}")
            logging.info(f"✅ Deliveries: {self.stats['deliveries_updated']:,}/{self.stats['deliveries_processed']:,}")
            logging.info(f"✅ Transactions: {self.stats['transactions_committed']:,}")
            
            return True
            
        except Exception as e:
            logging.error(f"💥 Critical error in main process: {e}")
            return False
        finally:
            self._disconnect_database()

def main():
    """Main function with enhanced security"""
    print("🛡️  === SECURE SHIPPING FEE CALCULATOR v2.0 ===")
    print("✅ Security fixes applied:")
    print("   🔐 Secure credential management")
    print("   🔄 Chunked transactions (no timeout)")
    print("   💾 Comprehensive backup")
    print("   ✅ Input validation")
    print("   🚫 No credential logging")
    print()
    
    # Environment check
    if not os.getenv('DB_PASSWORD'):
        print("⚠️  WARNING: DB_PASSWORD environment variable not set!")
        print("Using default password from config. Set export DB_PASSWORD=your_password for security.")
        print()
    
    print("Choose execution mode:")
    print("1. Test mode (fastroute_test database)")
    print("2. Production mode (fastroute database)")
    
    choice = input("Enter choice (1/2): ").strip()
    
    if choice == '1':
        is_test = True
        print("🧪 Running in TEST mode...")
    elif choice == '2':
        is_test = False
        print("🚀 Running in PRODUCTION mode...")
        
        # Production confirmation
        print("\n⚠️  PRODUCTION MODE CONFIRMATION")
        confirm1 = input("Type 'yes' to confirm production deployment: ").strip().lower()
        if confirm1 != 'yes':
            print("❌ Cancelled.")
            return
        
        confirm2 = input("Type 'PRODUCTION' to final confirm: ").strip()
        if confirm2 != 'PRODUCTION':
            print("❌ Final confirmation failed. Cancelled.")
            return
    else:
        print("❌ Invalid choice.")
        return
    
    print("\n🔄 Starting secure shipping fee calculation...")
    
    # Execute
    calculator = SecureShippingFeeCalculator(is_test=is_test)
    success = calculator.run()
    
    if success:
        print(f"\n🎉 ✅ DEPLOYMENT SUCCESSFUL!")
        print(f"📊 Items processed: {calculator.stats['order_items_processed']:,}")
        print(f"📊 Items updated: {calculator.stats['order_items_updated']:,}")
        print(f"📊 Deliveries updated: {calculator.stats['deliveries_updated']:,}")
        print(f"📊 Transactions: {calculator.stats['transactions_committed']:,}")
        print(f"📄 Log: {calculator.log_file}")
    else:
        print(f"\n💥 ❌ DEPLOYMENT FAILED!")
        print(f"📄 Check logs: {calculator.log_file}")
        print(f"📄 Error log: {calculator.error_log_file}")

if __name__ == "__main__":
    main()

