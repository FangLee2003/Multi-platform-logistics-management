"use client";

import { useRealtimeTracking } from "../hooks/useRealtimeTracking";
import { MdRefresh, MdLocationOn, MdAccessTime, MdPerson, MdDirectionsCar } from "react-icons/md";

interface LiveTrackingStatusProps {
  orderId: string;
  enabled?: boolean;
}

export default function LiveTrackingStatus({ orderId, enabled = true }: LiveTrackingStatusProps) {
  const { trackingData, isLoading, error, lastUpdated, refetch } = useRealtimeTracking({
    orderId,
    enabled,
    pollingInterval: 30000 // 30 seconds
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-600';
    
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'text-green-600';
      case 'shipping':
      case 'in_transit':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!enabled) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          Theo dõi thời gian thực đã tắt
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500' : trackingData ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          Theo dõi trực tuyến
        </h4>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Làm mới"
        >
          <MdRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-sm font-medium">Lỗi kết nối:</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !trackingData && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm">Đang lấy thông tin tracking...</div>
          </div>
        </div>
      )}

      {/* Tracking Data */}
      {trackingData && (
        <div className="space-y-4">
          {/* Status and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MdLocationOn className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Vị trí hiện tại</span>
              </div>
              <div className="text-sm text-blue-800">
                {trackingData.location || 'Đang cập nhật...'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                GPS: {trackingData.latitude.toFixed(6)}, {trackingData.longitude.toFixed(6)}
              </div>
            </div>

            {trackingData.status && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MdAccessTime className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Trạng thái</span>
                </div>
                <div className={`text-sm font-semibold ${getStatusColor(trackingData.status)}`}>
                  {trackingData.status}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Cập nhật: {new Date(trackingData.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            )}
          </div>

          {/* Driver and Vehicle Info */}
          {(trackingData.driverName || trackingData.vehicleInfo) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trackingData.driverName && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MdPerson className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">Tài xế</span>
                  </div>
                  <div className="text-sm text-green-800 font-semibold">
                    {trackingData.driverName}
                  </div>
                </div>
              )}

              {trackingData.vehicleInfo && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MdDirectionsCar className="text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Phương tiện</span>
                  </div>
                  <div className="text-sm text-purple-800 font-semibold">
                    {trackingData.vehicleInfo}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Update Info */}
          {lastUpdated && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 text-center">
                Cập nhật lần cuối: {formatTime(lastUpdated)} • 
                <span className="ml-1">Tự động làm mới sau 30 giây</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!trackingData && !isLoading && !error && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📡</div>
          <div className="text-sm text-gray-600">Chưa có dữ liệu tracking</div>
          <div className="text-xs text-gray-400 mt-1">
            Thông tin sẽ hiển thị khi có GPS từ tài xế
          </div>
        </div>
      )}
    </div>
  );
}