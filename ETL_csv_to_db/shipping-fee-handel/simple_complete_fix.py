    #!/usr/bin/env python3
"""
SIMPLE & COMPLETE SHIPPING FEE FIX
Expert 20-year solution - No transaction conflicts
"""

import mysql.connector
from decimal import Decimal, ROUND_HALF_UP

# Config
DB_CONFIG = {
    'host': 'server.aptech.io',
    'port': 3307,
    'database': 'fastroute_test',
    'user': 'fastroute_user',
    'password': 'fastroute_password',
    'charset': 'utf8mb4'
}

def calculate_fee(weight, volume, is_fragile, service_type):
    """Calculate shipping fee"""
    weight = Decimal(str(weight)) if weight else Decimal('0')
    volume = Decimal(str(volume)) if volume else Decimal('0')
    
    # Shipping weight
    volume_weight = volume * Decimal('200')
    shipping_weight = max(weight, volume_weight)
    
    # Base fee
    base_fee = shipping_weight * Decimal('15000')
    
    # Multipliers
    fragile_mult = Decimal('1.3') if is_fragile else Decimal('1.0')
    
    service_mults = {
        'SECOND_CLASS': Decimal('0.8'),
        'STANDARD': Decimal('1.0'), 
        'FIRST_CLASS': Decimal('1.3'),
        'EXPRESS': Decimal('1.8')
    }
    service_mult = service_mults.get(service_type, Decimal('1.0'))
    
    total = base_fee * fragile_mult * service_mult
    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def main():
    print("🔧 SIMPLE COMPLETE FIX - Expert 20-year solution")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected")
        
        # Step 1: Create missing orders
        print("🔧 Creating missing orders...")
        cursor.execute("""
        INSERT IGNORE INTO orders (id, external_id, status_id, total_amount, description, created_at, updated_at)
        SELECT DISTINCT 
            oi.order_id, oi.order_id, 1, 0.00, 'Auto-created', NOW(), NOW()
        FROM order_items oi
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.id IS NULL
        """)
        orders_created = cursor.rowcount
        conn.commit()
        print(f"✅ Orders created: {orders_created:,}")
        
        # Step 2: Create missing deliveries  
        print("🚚 Creating missing deliveries...")
        cursor.execute("""
        INSERT IGNORE INTO deliveries (order_id, service_type, transport_mode, order_date, late_delivery_risk, vehicle_id, created_at, updated_at)
        SELECT o.id, 'STANDARD', 'ROAD', NOW(), 0, 1, NOW(), NOW()
        FROM orders o
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE d.id IS NULL
        """)
        deliveries_created = cursor.rowcount
        conn.commit()
        print(f"✅ Deliveries created: {deliveries_created:,}")
        
        # Step 3: Calculate shipping fees
        print("💰 Calculating shipping fees...")
        
        cursor.execute("""
        SELECT 
            oi.id, p.weight, p.volume, p.is_fragile,
            COALESCE(d.service_type, 'STANDARD') as service_type
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE oi.shipping_fee IS NULL
        """)
        
        items = cursor.fetchall()
        print(f"📋 Processing {len(items):,} items...")
        
        # Update in batches
        for i in range(0, len(items), 1000):
            batch = items[i:i+1000]
            updates = []
            
            for item in batch:
                fee = calculate_fee(
                    item['weight'], 
                    item['volume'],
                    bool(item['is_fragile']),
                    item['service_type']
                )
                updates.append((fee, item['id']))
            
            cursor.executemany("""
            UPDATE order_items SET shipping_fee = %s, updated_at = NOW() WHERE id = %s
            """, updates)
            conn.commit()
            
            print(f"📊 Updated {i + len(batch):,} items...")
        
        print(f"✅ Shipping fees calculated: {len(items):,}")
        
        # Step 4: Calculate delivery fees
        print("🚚 Calculating delivery fees...")
        
        cursor.execute("""
        SELECT d.id, SUM(oi.shipping_fee) as total_fee
        FROM deliveries d
        JOIN orders o ON d.order_id = o.id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.shipping_fee IS NOT NULL
        GROUP BY d.id
        """)
        
        deliveries = cursor.fetchall()
        
        delivery_updates = [(d['total_fee'], d['id']) for d in deliveries]
        
        cursor.executemany("""
        UPDATE deliveries SET delivery_fee = %s, updated_at = NOW() WHERE id = %s
        """, delivery_updates)
        conn.commit()
        
        print(f"✅ Delivery fees calculated: {len(delivery_updates):,}")
        
        # Final check
        cursor.execute("SELECT COUNT(*) as count FROM order_items WHERE shipping_fee IS NULL")
        remaining = cursor.fetchone()['count']
        
        print(f"\n📊 FINAL RESULT:")
        print(f"   Remaining NULL shipping_fees: {remaining:,}")
        print(f"   Orders created: {orders_created:,}")
        print(f"   Deliveries created: {deliveries_created:,}")
        
        if remaining == 0:
            print("\n🎉 ✅ COMPLETE SUCCESS!")
            print("All order_items now have shipping_fee!")
        else:
            print(f"\n⚠️  Still {remaining:,} items need attention")
        
        return remaining == 0
        
    except Exception as e:
        print(f"💥 Error: {e}")
        return False
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

if __name__ == "__main__":
    main()
