# HƯỚNG DẪN DEPLOY TÍNH TOÁN PHÍ GIAO HÀNG

## Tổng quan

Hệ thống tính toán phí giao hàng bao gồm 3 script chính:
1. **`calculate_shipping_fees.py`** - Script test và development
2. **`calculate_shipping_fees_production.py`** - Script production với đầy đủ tính năng
3. **`validate_shipping_fees.py`** - Script validation kiểm tra kết quả

## Công thức tính phí

### 1. Shipping Fee (cho mỗi order_item)

```
SHIPPING_FEE = PHÍ_CƠ_BẢN × HỆ_SỐ_RỦI_RO × HỆ_SỐ_SERVICE_TYPE
```

#### Phí cơ bản
- **Trọng lượng tính phí** = MAX(Trọng lượng thực tế, Trọng lượng quy đổi)
- **Trọng lượng quy đổi** = Volume (m³) × 200
- **Phí cơ bản** = Trọng lượng tính phí × 15,000 VNĐ/kg

#### Hệ số rủi ro
- `is_fragile = false` → 1.0
- `is_fragile = true` → 1.3

#### Hệ số Service Type
- `SECOND_CLASS` → 0.8
- `STANDARD` → 1.0
- `FIRST_CLASS` → 1.3
- `EXPRESS` → 1.8

### 2. Delivery Fee

```
DELIVERY_FEE = SUM(shipping_fee) của tất cả order_items trong cùng order
```

## Quy trình Deploy

### Bước 1: Test trên Database Test

```bash
# Chạy script test
python3 calculate_shipping_fees.py
# Chọn option 1 (TEST mode)
```

**Mục đích:** Kiểm tra logic tính toán và kết nối database

### Bước 2: Validation trên Database Test

```bash
# Chạy validation
python3 validate_shipping_fees.py
# Chọn option 1 (fastroute_test)
```

**Mục đích:** Xác minh tính chính xác của kết quả tính toán

### Bước 3: Production Deployment

```bash
# Chạy script production
python3 calculate_shipping_fees_production.py
# Nhập 'yes' để xác nhận
# Nhập 'PRODUCTION' để xác nhận cuối cùng
```

**Đặc điểm script production:**
- Tự động tạo backup tables
- Xử lý theo batch (1000 records/batch)
- Transaction safety với rollback
- Logging chi tiết
- Báo cáo tự động

### Bước 4: Validation trên Database Production

```bash
# Chạy validation
python3 validate_shipping_fees.py
# Chọn option 2 (fastroute)
```

**Mục đích:** Xác minh deployment thành công

## Cấu hình Database

### Test Database
- Host: `server.aptech.io:3307`
- Database: `fastroute_test`
- User: `fastroute_user`
- Password: `fastroute_password`

### Production Database
- Host: `server.aptech.io:3307`
- Database: `fastroute`
- User: `fastroute_user`
- Password: `fastroute_password`

## Cấu trúc Files

```
DataCo/
├── calculate_shipping_fees.py              # Script test
├── calculate_shipping_fees_production.py   # Script production
├── validate_shipping_fees.py               # Script validation
├── requirements_shipping.txt               # Dependencies
├── shipping_calculation_logs/              # Test logs
├── production_logs/                        # Production logs
├── validation_logs/                        # Validation logs
└── SHIPPING_FEE_DEPLOYMENT_GUIDE.md       # Tài liệu này
```

## Logs và Reports

### Test Logs
- Location: `shipping_calculation_logs/`
- Format: `shipping_fee_calculation_YYYYMMDD_HHMMSS.log`

### Production Logs
- Location: `production_logs/`
- Main log: `shipping_fee_production_YYYYMMDD_HHMMSS.log`
- Error log: `shipping_fee_errors_YYYYMMDD_HHMMSS.log`
- Report JSON: `shipping_fee_report_YYYYMMDD_HHMMSS.json`
- Report Markdown: `shipping_fee_report_YYYYMMDD_HHMMSS.md`

### Validation Logs
- Location: `validation_logs/`
- Format: `validation_YYYYMMDD_HHMMSS.log`

## Backup và Recovery

### Automatic Backup
Script production tự động tạo backup tables:
- `order_items_backup_YYYYMMDD_HHMMSS`
- `deliveries_backup_YYYYMMDD_HHMMSS`

### Manual Recovery (nếu cần)
```sql
-- Rollback order_items
UPDATE order_items oi
JOIN order_items_backup_YYYYMMDD_HHMMSS oib ON oi.id = oib.id
SET oi.shipping_fee = oib.shipping_fee;

-- Rollback deliveries  
UPDATE deliveries d
JOIN deliveries_backup_YYYYMMDD_HHMMSS db ON d.id = db.id
SET d.delivery_fee = db.delivery_fee;
```

## Troubleshooting

### Lỗi kết nối database
```
ERROR - Lỗi kết nối database: [Error details]
```
**Giải pháp:** Kiểm tra thông tin kết nối và network

### Lỗi transaction timeout
```
ERROR - Transaction timeout
```
**Giải pháp:** Tăng batch size hoặc chạy lại script

### Validation failed
```
ERROR - Order Item XXX: Expected YYY, Got ZZZ
```
**Giải pháp:** Kiểm tra dữ liệu products table và service_type

### Memory issues
```
ERROR - Out of memory
```
**Giải pháp:** Giảm batch size trong script production

## Performance

### Estimated Runtime
- **Test database:** ~30 giây (136K records)
- **Production database:** ~5-10 phút (tùy thuộc số lượng records)

### Resource Usage
- **RAM:** ~100-200MB
- **CPU:** Medium (batch processing)
- **Network:** Medium (database operations)

## Monitoring

### Key Metrics
1. **Processing Rate:** records/second
2. **Success Rate:** updated/processed
3. **Error Rate:** errors/total
4. **Transaction Time:** start to commit

### Health Checks
1. Kết nối database stable
2. Backup tables tạo thành công
3. Transaction commit thành công
4. Validation pass 100%

## Security

### Database Access
- Sử dụng user có quyền hạn chế
- Connection qua SSL (nếu available)
- Password không lưu trong code

### Logging
- Không log sensitive data
- Log files có proper permissions
- Error logs riêng biệt

## Rollback Plan

### Immediate Rollback
```sql
-- Nếu phát hiện lỗi ngay lập tức
ROLLBACK;
```

### Post-Deployment Rollback
1. Identify backup table name từ logs
2. Execute recovery SQL commands
3. Validate data consistency
4. Update application if needed

## Support Contacts

- **Technical Lead:** DataCo Team
- **Database Admin:** Server Admin
- **Business Owner:** Logistics Manager

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-11 | Initial deployment scripts |

---

**⚠️ LƯU Ý QUAN TRỌNG:**
1. Luôn test trước khi deploy production
2. Backup được tạo tự động nhưng nên verify
3. Monitor logs trong quá trình deploy
4. Chạy validation ngay sau deployment
5. Có kế hoạch rollback sẵn sàng

