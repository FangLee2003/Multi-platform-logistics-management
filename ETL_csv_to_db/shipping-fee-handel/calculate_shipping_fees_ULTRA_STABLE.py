#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ULTRA-STABLE SHIPPING FEE CALCULATOR - CONNECTION RECOVERY ENABLED
Expert-level reliability for production environments
Version: Ultra-Stable 3.0
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

# Import ultra-conservative configuration
from shipping_fee_config import (
    get_database_config, SHIPPING_CONSTANTS, SERVICE_TYPE_MULTIPLIERS,
    PROCESSING_CONFIG, LOGGING_CONFIG, VALIDATION_CONFIG, SECURITY_CONFIG
)

class UltraStableShippingCalculator:
    """
    Ultra-stable calculator with connection recovery and fault tolerance
    """
    
    def __init__(self, is_test: bool = False):
        self.is_test = is_test
        self.connection = None
        self.cursor = None
        self.db_config = get_database_config(is_test)
        
        # Add connection recovery settings
        self.db_config.update({
            'connect_timeout': 30,
            'read_timeout': 60, 
            'write_timeout': 60,
            'autocommit': False,
            'pool_reset_session': True
        })
        
        self.log_file, self.error_log_file = self._setup_logging()
        self.last_connection_check = datetime.now()
        self.records_since_check = 0
        
        # Statistics
        self.stats = {
            'order_items_processed': 0,
            'order_items_updated': 0,
            'order_items_errors': 0,
            'deliveries_processed': 0,
            'deliveries_updated': 0,
            'deliveries_errors': 0,
            'transactions_committed': 0,
            'connection_recoveries': 0,
            'start_time': datetime.now(),
            'end_time': None,
            'last_processed_id': 0
        }
        
        logging.info("🛡️  === ULTRA-STABLE SHIPPING FEE CALCULATOR v3.0 ===")
        logging.info(f"Mode: {'TEST' if is_test else 'PRODUCTION'}")
        logging.info(f"Ultra-conservative settings:")
        logging.info(f"  - Batch size: {PROCESSING_CONFIG['batch_size']}")
        logging.info(f"  - Chunk size: {PROCESSING_CONFIG['transaction_chunk_size']}")
        logging.info(f"  - Connection check: every {PROCESSING_CONFIG['connection_check_interval']} records")
        
    def _setup_logging(self):
        """Setup logging"""
        log_dir = "production_logs"
        os.makedirs(log_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = os.path.join(log_dir, f"ultra_stable_{timestamp}.log")
        error_log_file = os.path.join(log_dir, f"ultra_stable_errors_{timestamp}.log")
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        return log_file, error_log_file
    
    def _check_connection_health(self) -> bool:
        """Check if connection is still alive"""
        try:
            if not self.connection or not self.connection.is_connected():
                return False
            
            # Ping test
            self.cursor.execute("SELECT 1")
            self.cursor.fetchone()
            return True
            
        except Exception:
            return False
    
    def _reconnect_database(self) -> bool:
        """Reconnect to database with retry"""
        logging.warning("🔄 Attempting database reconnection...")
        
        # Close existing connections
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
        except:
            pass
        
        # Reconnect with retry
        max_retries = PROCESSING_CONFIG['max_retries']
        base_delay = PROCESSING_CONFIG['retry_delay']
        
        for attempt in range(max_retries):
            try:
                time.sleep(base_delay * (attempt + 1))  # Progressive delay
                
                self.connection = mysql.connector.connect(**self.db_config)
                self.cursor = self.connection.cursor(dictionary=True, buffered=True)
                
                # Test connection
                self.cursor.execute("SELECT 1")
                self.cursor.fetchone()
                
                self.stats['connection_recoveries'] += 1
                self.last_connection_check = datetime.now()
                
                logging.info(f"✅ Database reconnected successfully (attempt {attempt + 1})")
                return True
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Reconnection attempt {attempt + 1} failed: {e}")
                
        logging.error("💥 All reconnection attempts failed!")
        return False
    
    def _ensure_connection(self) -> bool:
        """Ensure database connection is healthy"""
        self.records_since_check += 1
        
        # Check connection periodically
        if (self.records_since_check >= PROCESSING_CONFIG['connection_check_interval'] or
            (datetime.now() - self.last_connection_check).total_seconds() > PROCESSING_CONFIG['max_connection_idle']):
            
            if not self._check_connection_health():
                logging.warning("⚠️  Connection health check failed, reconnecting...")
                if not self._reconnect_database():
                    return False
            
            self.records_since_check = 0
            self.last_connection_check = datetime.now()
        
        return True
    
    def _connect_initial(self) -> bool:
        """Initial database connection"""
        max_retries = PROCESSING_CONFIG['max_retries']
        base_delay = PROCESSING_CONFIG['retry_delay']
        
        for attempt in range(max_retries):
            try:
                self.connection = mysql.connector.connect(**self.db_config)
                self.cursor = self.connection.cursor(dictionary=True, buffered=True)
                
                # Test connection
                self.cursor.execute("SELECT 1")
                self.cursor.fetchone()
                
                logging.info(f"✅ Initial database connection successful")
                return True
                
            except mysql.connector.Error as e:
                delay = base_delay * (2 ** attempt)
                logging.error(f"❌ Connection attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    logging.info(f"⏳ Retrying in {delay:.1f} seconds...")
                    time.sleep(delay)
                    
        return False
    
    def _calculate_shipping_fee(self, weight, volume, is_fragile, service_type):
        """Calculate shipping fee with validation"""
        try:
            # Convert to Decimal
            actual_weight = Decimal(str(weight)) if weight else Decimal('0')
            volume_val = Decimal(str(volume)) if volume else Decimal('0')
            
            # Calculate shipping weight
            volume_weight = volume_val * SHIPPING_CONSTANTS['VOLUME_TO_WEIGHT_FACTOR']
            shipping_weight = max(actual_weight, volume_weight)
            
            # Calculate base fee
            base_fee = shipping_weight * SHIPPING_CONSTANTS['BASE_PRICE_PER_KG']
            
            # Apply multipliers
            fragile_multiplier = (SHIPPING_CONSTANTS['FRAGILE_MULTIPLIER'] 
                                if is_fragile else SHIPPING_CONSTANTS['NORMAL_MULTIPLIER'])
            service_multiplier = SERVICE_TYPE_MULTIPLIERS.get(service_type, Decimal('1.0'))
            
            # Calculate total
            total_fee = base_fee * fragile_multiplier * service_multiplier
            total_fee = total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            return total_fee, shipping_weight, base_fee
            
        except Exception as e:
            logging.error(f"❌ Calculation error: {e}")
            raise
    
    def _get_order_items_batch_safe(self, limit: int, last_id: int) -> List[Dict]:
        """Get order items with connection recovery"""
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
        WHERE oi.id > %s
        ORDER BY oi.id
        LIMIT %s
        """
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Ensure connection is healthy
                if not self._ensure_connection():
                    return []
                
                self.cursor.execute(query, (last_id, limit))
                results = self.cursor.fetchall()
                return results
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Query attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    if not self._reconnect_database():
                        return []
                    time.sleep(1)
                else:
                    return []
        
        return []
    
    def _update_batch_safe(self, updates: List[Tuple]) -> int:
        """Update batch with connection recovery"""
        if not updates:
            return 0
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Ensure connection
                if not self._ensure_connection():
                    return 0
                
                update_query = """
                UPDATE order_items 
                SET shipping_fee = %s, updated_at = NOW()
                WHERE id = %s
                """
                self.cursor.executemany(update_query, updates)
                return len(updates)
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Update attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    if not self._reconnect_database():
                        return 0
                    time.sleep(1)
                else:
                    return 0
        
        return 0
    
    def _process_with_recovery(self) -> bool:
        """Process with full connection recovery"""
        logging.info("🔄 Starting ultra-stable processing...")
        
        batch_size = PROCESSING_CONFIG['batch_size']
        chunk_size = PROCESSING_CONFIG['transaction_chunk_size']
        
        total_processed = 0
        total_updated = 0
        total_errors = 0
        last_id = self.stats['last_processed_id']  # Resume from last position
        
        while True:
            try:
                # Start transaction chunk
                if not self._ensure_connection():
                    logging.error("💥 Cannot establish connection")
                    break
                
                self.connection.start_transaction()
                chunk_start = datetime.now()
                chunk_processed = 0
                chunk_updated = 0
                
                # Process in small batches within chunk
                while chunk_processed < chunk_size:
                    # Get batch with recovery
                    batch_items = self._get_order_items_batch_safe(batch_size, last_id)
                    if not batch_items:
                        break
                    
                    batch_updates = []
                    
                    for item in batch_items:
                        try:
                            # Calculate fee
                            shipping_fee, weight, base_fee = self._calculate_shipping_fee(
                                weight=item['weight'],
                                volume=item['volume'],
                                is_fragile=bool(item['is_fragile']),
                                service_type=item['service_type']
                            )
                            
                            batch_updates.append((shipping_fee, item['order_item_id']))
                            
                            # Log progress for first few items
                            if total_processed < 5:
                                logging.info(f"Item {item['order_item_id']}: {shipping_fee:,} VNĐ")
                            
                        except Exception as e:
                            logging.error(f"❌ Error processing item {item['order_item_id']}: {e}")
                            total_errors += 1
                    
                    # Update with recovery
                    if batch_updates:
                        updated_count = self._update_batch_safe(batch_updates)
                        chunk_updated += updated_count
                        
                        if updated_count != len(batch_updates):
                            logging.warning(f"⚠️  Partial update: {updated_count}/{len(batch_updates)}")
                    
                    chunk_processed += len(batch_items)
                    last_id = batch_items[-1]['order_item_id']
                    self.stats['last_processed_id'] = last_id
                    
                    # Progress logging
                    if (total_processed + chunk_processed) % 1000 == 0:
                        logging.info(f"📊 Progress: {total_processed + chunk_processed:,} items, "
                                   f"Last ID: {last_id}")
                
                # Commit chunk
                if chunk_processed > 0:
                    if not self._ensure_connection():
                        logging.error("💥 Lost connection before commit")
                        break
                    
                    self.connection.commit()
                    self.stats['transactions_committed'] += 1
                    
                    chunk_time = (datetime.now() - chunk_start).total_seconds()
                    logging.info(f"✅ Chunk committed: {chunk_processed:,} processed, "
                               f"{chunk_updated:,} updated in {chunk_time:.1f}s")
                    
                    # Save progress checkpoint
                    self._save_checkpoint()
                
                total_processed += chunk_processed
                total_updated += chunk_updated
                
                # Break if no more data
                if chunk_processed == 0:
                    break
                    
                # Brief pause between chunks to reduce server load
                time.sleep(0.5)
                
            except Exception as e:
                logging.error(f"💥 Chunk processing error: {e}")
                try:
                    if self.connection:
                        self.connection.rollback()
                except:
                    pass
                
                # Try to recover and continue
                if self._reconnect_database():
                    logging.info("🔄 Recovered, continuing from last checkpoint...")
                    continue
                else:
                    logging.error("💥 Cannot recover, stopping")
                    break
        
        # Update final stats
        self.stats['order_items_processed'] = total_processed
        self.stats['order_items_updated'] = total_updated
        self.stats['order_items_errors'] = total_errors
        
        logging.info(f"📊 Final shipping fee stats:")
        logging.info(f"   Processed: {total_processed:,}")
        logging.info(f"   Updated: {total_updated:,}")
        logging.info(f"   Errors: {total_errors:,}")
        logging.info(f"   Recoveries: {self.stats['connection_recoveries']:,}")
        
        return total_errors == 0 and total_updated > 0
    
    def _save_checkpoint(self):
        """Save progress checkpoint"""
        checkpoint = {
            'last_processed_id': self.stats['last_processed_id'],
            'timestamp': datetime.now().isoformat(),
            'processed': self.stats['order_items_processed'],
            'updated': self.stats['order_items_updated']
        }
        
        with open('shipping_fee_checkpoint.json', 'w') as f:
            json.dump(checkpoint, f, indent=2)
    
    def _load_checkpoint(self) -> int:
        """Load last checkpoint"""
        try:
            if os.path.exists('shipping_fee_checkpoint.json'):
                with open('shipping_fee_checkpoint.json', 'r') as f:
                    checkpoint = json.load(f)
                    last_id = checkpoint.get('last_processed_id', 0)
                    logging.info(f"📋 Resuming from checkpoint: last_id = {last_id}")
                    return last_id
        except Exception as e:
            logging.warning(f"⚠️  Cannot load checkpoint: {e}")
        
        return 0
    
    def _process_delivery_fees_safe(self) -> bool:
        """Process delivery fees with connection recovery"""
        logging.info("🚚 Processing delivery fees with recovery...")
        
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
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not self._ensure_connection():
                    return False
                
                self.connection.start_transaction()
                self.cursor.execute(query)
                deliveries = self.cursor.fetchall()
                
                if not deliveries:
                    logging.info("ℹ️  No deliveries to process")
                    return True
                
                # Process deliveries
                delivery_updates = []
                for delivery in deliveries:
                    try:
                        delivery_fee = Decimal(str(delivery['total_shipping_fee']))
                        delivery_updates.append((delivery_fee, delivery['delivery_id']))
                    except Exception as e:
                        logging.error(f"❌ Error processing delivery {delivery['delivery_id']}: {e}")
                
                # Update with recovery
                if delivery_updates:
                    updated_count = self._update_deliveries_safe(delivery_updates)
                    
                    if updated_count > 0:
                        self.connection.commit()
                        self.stats['deliveries_processed'] = len(deliveries)
                        self.stats['deliveries_updated'] = updated_count
                        
                        logging.info(f"✅ Delivery fees updated: {updated_count:,}/{len(deliveries):,}")
                        return True
                    else:
                        self.connection.rollback()
                        return False
                
                return True
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Delivery processing attempt {attempt + 1} failed: {e}")
                try:
                    if self.connection:
                        self.connection.rollback()
                except:
                    pass
                
                if attempt < max_retries - 1:
                    if not self._reconnect_database():
                        return False
                    time.sleep(2)
                else:
                    return False
        
        return False
    
    def _update_deliveries_safe(self, updates: List[Tuple]) -> int:
        """Update deliveries with recovery"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not self._ensure_connection():
                    return 0
                
                update_query = """
                UPDATE deliveries 
                SET delivery_fee = %s, updated_at = NOW()
                WHERE id = %s
                """
                self.cursor.executemany(update_query, updates)
                return len(updates)
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Delivery update attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    if not self._reconnect_database():
                        return 0
                    time.sleep(1)
                else:
                    return 0
        
        return 0
    
    def _create_backup_safe(self) -> bool:
        """Create backup with recovery"""
        if not PROCESSING_CONFIG['enable_backup']:
            return True
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not self._ensure_connection():
                    return False
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                
                # Backup queries
                backup_queries = [
                    f"CREATE TABLE order_items_backup_{timestamp} AS SELECT * FROM order_items",
                    f"CREATE TABLE deliveries_backup_{timestamp} AS SELECT * FROM deliveries"
                ]
                
                for query in backup_queries:
                    self.cursor.execute(query)
                
                self.connection.commit()
                logging.info(f"✅ Backup created: *_backup_{timestamp}")
                return True
                
            except mysql.connector.Error as e:
                logging.error(f"❌ Backup attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    if not self._reconnect_database():
                        return False
                    time.sleep(2)
                else:
                    return False
        
        return False
    
    def run(self) -> bool:
        """Run ultra-stable calculation"""
        try:
            # Load checkpoint if exists
            self.stats['last_processed_id'] = self._load_checkpoint()
            
            # Connect
            if not self._connect_initial():
                logging.error("💥 Cannot establish initial connection")
                return False
            
            # Create backup
            if not self._create_backup_safe():
                logging.error("💥 Backup failed, aborting for safety")
                return False
            
            # Process shipping fees
            if not self._process_with_recovery():
                logging.error("💥 Shipping fee processing failed")
                return False
            
            # Process delivery fees
            if not self._process_delivery_fees_safe():
                logging.error("💥 Delivery fee processing failed")
                return False
            
            # Clean up checkpoint
            try:
                os.remove('shipping_fee_checkpoint.json')
            except:
                pass
            
            # Generate final report
            self._generate_final_report()
            
            logging.info("🎉 === ULTRA-STABLE PROCESSING COMPLETED ===")
            return True
            
        except Exception as e:
            logging.error(f"💥 Critical system error: {e}")
            return False
        finally:
            try:
                if self.cursor:
                    self.cursor.close()
                if self.connection:
                    self.connection.close()
            except:
                pass
    
    def _generate_final_report(self):
        """Generate comprehensive final report"""
        self.stats['end_time'] = datetime.now()
        execution_time = self.stats['end_time'] - self.stats['start_time']
        
        report = f"""# ULTRA-STABLE SHIPPING FEE CALCULATION REPORT

## Execution Summary
- **Start:** {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **End:** {self.stats['end_time'].strftime('%Y-%m-%d %H:%M:%S')}
- **Duration:** {execution_time.total_seconds():.1f} seconds
- **Mode:** {'TEST' if self.is_test else 'PRODUCTION'}

## Results
- **Order Items Processed:** {self.stats['order_items_processed']:,}
- **Order Items Updated:** {self.stats['order_items_updated']:,}
- **Deliveries Updated:** {self.stats['deliveries_updated']:,}
- **Transactions Committed:** {self.stats['transactions_committed']:,}
- **Connection Recoveries:** {self.stats['connection_recoveries']:,}
- **Errors:** {self.stats['order_items_errors']:,}

## Performance
- **Records/Second:** {self.stats['order_items_processed'] / max(execution_time.total_seconds(), 1):.2f}
- **Success Rate:** {(self.stats['order_items_updated'] / max(self.stats['order_items_processed'], 1) * 100):.2f}%

## Reliability Features Used
- ✅ Connection health monitoring
- ✅ Automatic reconnection
- ✅ Progress checkpoints
- ✅ Transaction chunking
- ✅ Error recovery
- ✅ Conservative batch sizes

## Status
{'✅ SUCCESS - All processing completed' if self.stats['order_items_errors'] == 0 else '⚠️ PARTIAL SUCCESS - Some errors occurred'}
"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = f"production_logs/ultra_stable_report_{timestamp}.md"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logging.info(f"📄 Final report saved: {report_file}")

def main():
    """Main function"""
    print("🛡️  === ULTRA-STABLE SHIPPING FEE CALCULATOR ===")
    print("🔧 Expert-grade reliability features:")
    print("   ✅ Connection recovery & health monitoring")
    print("   ✅ Progress checkpoints & resume capability")
    print("   ✅ Ultra-conservative batch sizes")
    print("   ✅ Automatic reconnection on failures")
    print("   ✅ Transaction chunking")
    print()
    
    # Check for existing checkpoint
    if os.path.exists('shipping_fee_checkpoint.json'):
        print("📋 Found existing checkpoint - can resume from last position")
        resume = input("Resume from checkpoint? (y/n): ").strip().lower()
        if resume != 'y':
            try:
                os.remove('shipping_fee_checkpoint.json')
                print("🗑️  Checkpoint cleared, starting fresh")
            except:
                pass
    
    print("Choose mode:")
    print("1. Test mode (fastroute_test)")
    print("2. Production mode (fastroute)")
    
    choice = input("Enter choice (1/2): ").strip()
    
    if choice == '1':
        is_test = True
        print("🧪 TEST MODE")
    elif choice == '2':
        is_test = False
        print("🚀 PRODUCTION MODE")
        
        confirm = input("Type 'ULTRA-STABLE-PRODUCTION' to confirm: ").strip()
        if confirm != 'ULTRA-STABLE-PRODUCTION':
            print("❌ Confirmation failed")
            return
    else:
        print("❌ Invalid choice")
        return
    
    print("\n🔄 Starting ultra-stable processing...")
    
    calculator = UltraStableShippingCalculator(is_test=is_test)
    success = calculator.run()
    
    if success:
        print(f"\n🎉 ✅ ULTRA-STABLE PROCESSING COMPLETED!")
        print(f"📊 Processed: {calculator.stats['order_items_processed']:,}")
        print(f"📊 Updated: {calculator.stats['order_items_updated']:,}")
        print(f"📊 Recoveries: {calculator.stats['connection_recoveries']:,}")
        print(f"📄 Log: {calculator.log_file}")
    else:
        print(f"\n⚠️  PROCESSING INCOMPLETE")
        print(f"📊 Processed: {calculator.stats['order_items_processed']:,}")
        print(f"📋 Checkpoint saved - can resume later")
        print(f"📄 Log: {calculator.log_file}")

if __name__ == "__main__":
    main()

