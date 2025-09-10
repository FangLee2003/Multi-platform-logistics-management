#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COMPLETE SHIPPING FEE CALCULATION - HANDLES ALL EDGE CASES
Expert solution for orphaned records + complete fee calculation
"""

import mysql.connector
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import sys
import os

# Database config
DB_CONFIG = {
    'host': 'server.aptech.io',
    'port': 3307,
    'database': 'fastroute_test',
    'user': 'fastroute_user',
    'password': 'fastroute_password',
    'charset': 'utf8mb4',
    'autocommit': False
}

# Constants
BASE_PRICE_PER_KG = Decimal('15000')
VOLUME_TO_WEIGHT_FACTOR = Decimal('200')
FRAGILE_MULTIPLIER = Decimal('1.3')
NORMAL_MULTIPLIER = Decimal('1.0')

SERVICE_TYPE_MULTIPLIERS = {
    'SECOND_CLASS': Decimal('0.8'),
    'STANDARD': Decimal('1.0'),
    'FIRST_CLASS': Decimal('1.3'),
    'EXPRESS': Decimal('1.8')
}

def setup_logging():
    """Setup logging"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = f"complete_fix_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_file

def calculate_shipping_fee(weight, volume, is_fragile, service_type):
    """Calculate shipping fee"""
    actual_weight = Decimal(str(weight)) if weight else Decimal('0')
    volume_val = Decimal(str(volume)) if volume else Decimal('0')
    
    # Shipping weight = max(actual, volume converted)
    volume_weight = volume_val * VOLUME_TO_WEIGHT_FACTOR
    shipping_weight = max(actual_weight, volume_weight)
    
    # Base fee
    base_fee = shipping_weight * BASE_PRICE_PER_KG
    
    # Multipliers
    fragile_multiplier = FRAGILE_MULTIPLIER if is_fragile else NORMAL_MULTIPLIER
    service_multiplier = SERVICE_TYPE_MULTIPLIERS.get(service_type, Decimal('1.0'))
    
    # Total fee
    total_fee = base_fee * fragile_multiplier * service_multiplier
    return total_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def main():
    """Main function"""
    log_file = setup_logging()
    
    logging.info("🔧 === COMPLETE SHIPPING FEE CALCULATION ===")
    logging.info("Expert solution for data integrity + fee calculation")
    
    try:
        # Connect
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        logging.info("✅ Database connected")
        
        # Step 1: Create missing orders for orphaned order_items
        logging.info("🔧 Step 1: Creating missing orders...")
        
        create_orders_query = """
        INSERT IGNORE INTO orders (id, external_id, status_id, total_amount, description, created_at, updated_at)
        SELECT DISTINCT 
            oi.order_id,
            oi.order_id,
            1,
            0.00,
            'Auto-created for orphaned order_items',
            NOW(),
            NOW()
        FROM order_items oi
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.id IS NULL
        """
        
        cursor.execute(create_orders_query)
        orders_created = cursor.rowcount
        logging.info(f"✅ Created {orders_created:,} missing orders")
        
        # Step 2: Create missing deliveries
        logging.info("🚚 Step 2: Creating missing deliveries...")
        
        create_deliveries_query = """
        INSERT IGNORE INTO deliveries (
            order_id, service_type, transport_mode, order_date,
            late_delivery_risk, vehicle_id, created_at, updated_at
        )
        SELECT DISTINCT
            o.id,
            'STANDARD',
            'ROAD', 
            NOW(),
            0,
            1,
            NOW(),
            NOW()
        FROM orders o
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE d.id IS NULL
        """
        
        cursor.execute(create_deliveries_query)
        deliveries_created = cursor.rowcount
        logging.info(f"✅ Created {deliveries_created:,} missing deliveries")
        
        connection.commit()
        
        # Step 3: Calculate shipping fees for ALL order_items
        logging.info("💰 Step 3: Calculating shipping fees for ALL order_items...")
        
        # Get all order_items that need shipping_fee calculation
        get_items_query = """
        SELECT 
            oi.id as order_item_id,
            oi.order_id,
            oi.product_id,
            oi.quantity,
            p.weight,
            p.volume,
            p.is_fragile,
            p.name as product_name,
            COALESCE(d.service_type, 'STANDARD') as service_type
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE oi.shipping_fee IS NULL
        ORDER BY oi.id
        """
        
        cursor.execute(get_items_query)
        all_items = cursor.fetchall()
        
        logging.info(f"📋 Found {len(all_items):,} items to process")
        
        # Process in batches
        batch_size = 1000
        total_updated = 0
        
        for i in range(0, len(all_items), batch_size):
            batch = all_items[i:i + batch_size]
            batch_updates = []
            
            for item in batch:
                try:
                    shipping_fee = calculate_shipping_fee(
                        weight=item['weight'],
                        volume=item['volume'],
                        is_fragile=bool(item['is_fragile']),
                        service_type=item['service_type']
                    )
                    
                    batch_updates.append((shipping_fee, item['order_item_id']))
                    
                except Exception as e:
                    logging.error(f"❌ Error calculating for item {item['order_item_id']}: {e}")
            
            # Update batch
            if batch_updates:
                connection.start_transaction()
                
                update_query = """
                UPDATE order_items 
                SET shipping_fee = %s, updated_at = NOW()
                WHERE id = %s
                """
                cursor.executemany(update_query, batch_updates)
                connection.commit()
                
                total_updated += len(batch_updates)
                
                if total_updated % 5000 == 0:
                    logging.info(f"📊 Updated {total_updated:,} shipping fees...")
        
        logging.info(f"✅ Total shipping fees calculated: {total_updated:,}")
        
        # Step 4: Calculate delivery fees
        logging.info("🚚 Step 4: Calculating delivery fees...")
        
        delivery_query = """
        SELECT 
            d.id as delivery_id,
            SUM(oi.shipping_fee) as total_shipping_fee,
            COUNT(oi.id) as item_count
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.shipping_fee IS NOT NULL
        GROUP BY d.id
        """
        
        cursor.execute(delivery_query)
        deliveries = cursor.fetchall()
        
        delivery_updates = []
        for delivery in deliveries:
            delivery_fee = Decimal(str(delivery['total_shipping_fee']))
            delivery_updates.append((delivery_fee, delivery['delivery_id']))
        
        # Update delivery fees
        connection.start_transaction()
        
        update_delivery_query = """
        UPDATE deliveries 
        SET delivery_fee = %s, updated_at = NOW()
        WHERE id = %s
        """
        cursor.executemany(update_delivery_query, delivery_updates)
        connection.commit()
        
        logging.info(f"✅ Delivery fees calculated: {len(delivery_updates):,}")
        
        # Final verification
        logging.info("🔍 Final verification...")
        
        cursor.execute("SELECT COUNT(*) as count FROM order_items WHERE shipping_fee IS NULL")
        remaining_null = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM order_items WHERE shipping_fee IS NOT NULL")
        with_fees = cursor.fetchone()['count']
        
        logging.info(f"📊 FINAL RESULTS:")
        logging.info(f"   Order_items with shipping_fee: {with_fees:,}")
        logging.info(f"   Order_items with NULL shipping_fee: {remaining_null:,}")
        logging.info(f"   Orders created: {orders_created:,}")
        logging.info(f"   Deliveries created: {deliveries_created:,}")
        
        if remaining_null == 0:
            logging.info("🎉 ✅ ALL ORDER_ITEMS NOW HAVE SHIPPING_FEE!")
        else:
            logging.warning(f"⚠️  Still {remaining_null:,} items without shipping_fee")
        
        # Generate summary report
        report = f"""# COMPLETE SHIPPING FEE CALCULATION REPORT

## Data Integrity Fixes
- **Missing orders created:** {orders_created:,}
- **Missing deliveries created:** {deliveries_created:,}

## Fee Calculations
- **Shipping fees calculated:** {total_updated:,}
- **Delivery fees calculated:** {len(delivery_updates):,}

## Final Status
- **Items with shipping_fee:** {with_fees:,}
- **Items without shipping_fee:** {remaining_null:,}

## Status
{'✅ COMPLETE SUCCESS - All items processed' if remaining_null == 0 else '⚠️ PARTIAL SUCCESS'}

---
*Generated by Expert Data Integrity Handler*
"""
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        with open(f"complete_fix_report_{timestamp}.md", 'w', encoding='utf-8') as f:
            f.write(report)
        
        logging.info("🎉 === COMPLETE FIX FINISHED ===")
        
        return remaining_null == 0
        
    except mysql.connector.Error as e:
        logging.error(f"💥 Database error: {e}")
        return False
    except Exception as e:
        logging.error(f"💥 Unexpected error: {e}")
        return False
    finally:
        try:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
        except:
            pass

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 ✅ COMPLETE SUCCESS!")
        print("All order_items now have shipping_fee calculated!")
    else:
        print("\n💥 ❌ PROCESS FAILED!")
        print("Check logs for details.")

