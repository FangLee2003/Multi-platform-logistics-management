"use client";

import { useState } from "react";
import { MdMap, MdChecklist, MdInfo } from "react-icons/md";
import TrackingMap from "./TrackingMap";
import OrderChecklist from "./OrderChecklist";
import { TrackingResult } from "../types/tracking";

interface ComprehensiveTrackingProps {
  trackingResult: TrackingResult;
}

type TabType = 'map' | 'checklist' | 'info';

export default function ComprehensiveTracking({ trackingResult }: ComprehensiveTrackingProps) {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'checklist', label: 'Tiến trình', icon: <MdChecklist /> },
    { id: 'map', label: 'Bản đồ', icon: <MdMap /> },
    { id: 'info', label: 'Chi tiết', icon: <MdInfo /> },
  ];

  const formatDate = (isoString: string) =>
    isoString
      ? new Date(isoString).toLocaleString("vi-VN", {
          year: "numeric",
          month: "2-digit", 
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipping':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Order Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Theo dõi đơn hàng #{trackingResult.code}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Cập nhật thời gian thực về tình trạng giao hàng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(trackingResult.status)}`}>
              {trackingResult.status}
            </div>
            {trackingResult.estimatedDelivery && (
              <div className="text-xs text-gray-500">
                Dự kiến: {formatDate(trackingResult.estimatedDelivery)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-700 bg-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <OrderChecklist 
              orderId={trackingResult.code}
              orderStatus={trackingResult.status}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="h-[500px]">
              <TrackingMap 
                orderId={trackingResult.code}
                trackingData={{
                  latitude: trackingResult.latitude || 0,
                  longitude: trackingResult.longitude || 0,
                  from: trackingResult.from,
                  to: trackingResult.to,
                  storeLatitude: trackingResult.storeLatitude,
                  storeLongitude: trackingResult.storeLongitude,
                  destinationLatitude: trackingResult.destinationLatitude,
                  destinationLongitude: trackingResult.destinationLongitude,
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Route Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Điểm xuất phát
                </h4>
                <p className="text-green-700 text-sm">{trackingResult.from}</p>
                {trackingResult.storeLatitude && trackingResult.storeLongitude && (
                  <p className="text-xs text-green-600 mt-2">
                    GPS: {trackingResult.storeLatitude.toFixed(6)}, {trackingResult.storeLongitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Điểm giao hàng
                </h4>
                <p className="text-red-700 text-sm">{trackingResult.to}</p>
                {trackingResult.destinationLatitude && trackingResult.destinationLongitude && (
                  <p className="text-xs text-red-600 mt-2">
                    GPS: {trackingResult.destinationLatitude.toFixed(6)}, {trackingResult.destinationLongitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Thông tin đơn hàng</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold ml-2">#{trackingResult.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">Trạng thái hiện tại:</span>
                  <span className={`font-semibold ml-2 px-2 py-1 rounded text-xs ${getStatusColor(trackingResult.status)}`}>
                    {trackingResult.status}
                  </span>
                </div>
                {trackingResult.estimatedDelivery && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Thời gian dự kiến giao:</span>
                    <span className="font-semibold ml-2">{formatDate(trackingResult.estimatedDelivery)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Support Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Hỗ trợ khách hàng</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <p className="font-medium">📞 Hotline</p>
                  <p>1900-xxx-xxx</p>
                </div>
                <div>
                  <p className="font-medium">📧 Email</p>
                  <p>support@fastroute.com</p>
                </div>
                <div>
                  <p className="font-medium">⏰ Giờ hỗ trợ</p>
                  <p>24/7</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}