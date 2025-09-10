#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuration for Shipping Fee Calculation System
Secure configuration with environment variables
"""

import os
from decimal import Decimal
from typing import Dict, Any

# Database Configuration - SECURE with environment variables
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'server.aptech.io'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'user': os.getenv('DB_USER', 'fastroute_user'),
    'password': os.getenv('DB_PASSWORD', 'fastroute_password'),
    'database': os.getenv('DB_NAME', 'fastroute'),
    'charset': 'utf8mb4',
    'autocommit': False,
    'connect_timeout': 60,
    'read_timeout': 300,
    'write_timeout': 300
}

# Test Database Configuration
TEST_DATABASE_CONFIG = {
    **DATABASE_CONFIG,
    'database': os.getenv('TEST_DB_NAME', 'fastroute_test')
}

# Shipping Fee Calculation Constants
SHIPPING_CONSTANTS = {
    'BASE_PRICE_PER_KG': Decimal('15000'),
    'FRAGILE_MULTIPLIER': Decimal('1.3'),
    'NORMAL_MULTIPLIER': Decimal('1.0'),
    'VOLUME_TO_WEIGHT_FACTOR': Decimal('200')
}

# Service Type Multipliers
SERVICE_TYPE_MULTIPLIERS = {
    'SECOND_CLASS': Decimal('0.8'),
    'STANDARD': Decimal('1.0'),
    'FIRST_CLASS': Decimal('1.3'),
    'EXPRESS': Decimal('1.8')
}

# Processing Configuration - ULTRA CONSERVATIVE FOR STABILITY
PROCESSING_CONFIG = {
    'batch_size': int(os.getenv('BATCH_SIZE', 100)),  # Much smaller batches
    'max_retries': int(os.getenv('MAX_RETRIES', 5)),  # More retries
    'retry_delay': float(os.getenv('RETRY_DELAY', 2.0)),  # Longer delay
    'transaction_chunk_size': int(os.getenv('TRANSACTION_CHUNK_SIZE', 1000)),  # Smaller chunks
    'max_transaction_time': int(os.getenv('MAX_TRANSACTION_TIME', 60)),  # Shorter timeout
    'enable_backup': os.getenv('ENABLE_BACKUP', 'true').lower() == 'true',
    'backup_chunk_size': int(os.getenv('BACKUP_CHUNK_SIZE', 5000)),
    'connection_check_interval': int(os.getenv('CONNECTION_CHECK_INTERVAL', 100)),  # Check every 100 records
    'max_connection_idle': int(os.getenv('MAX_CONNECTION_IDLE', 30))  # Reconnect after 30s idle
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'max_log_size': int(os.getenv('MAX_LOG_SIZE', 10485760)),  # 10MB
    'backup_count': int(os.getenv('LOG_BACKUP_COUNT', 5))
}

# Validation Configuration
VALIDATION_CONFIG = {
    'max_weight': Decimal(os.getenv('MAX_WEIGHT', '10000')),  # kg
    'max_volume': Decimal(os.getenv('MAX_VOLUME', '100')),    # m³
    'min_weight': Decimal(os.getenv('MIN_WEIGHT', '0')),
    'min_volume': Decimal(os.getenv('MIN_VOLUME', '0')),
    'max_shipping_fee': Decimal(os.getenv('MAX_SHIPPING_FEE', '100000000'))  # 100M VND
}

# Security Configuration
SECURITY_CONFIG = {
    'hide_credentials_in_logs': True,
    'require_confirmation': True,
    'max_failed_attempts': 3
}

def get_database_config(is_test: bool = False) -> Dict[str, Any]:
    """Get database configuration"""
    return TEST_DATABASE_CONFIG if is_test else DATABASE_CONFIG

def validate_config():
    """Validate configuration"""
    required_env_vars = ['DB_PASSWORD']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {missing_vars}")
    
    return True
