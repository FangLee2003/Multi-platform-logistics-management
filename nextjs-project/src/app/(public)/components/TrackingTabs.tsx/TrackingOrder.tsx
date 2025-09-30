"use client";

import { useState } from "react";
import { getOrderTrackingApi } from "../../../../server/order.api";
import ComprehensiveTracking from "../../../../components/ComprehensiveTracking";
import { TrackingResult } from "../../../../types/tracking";

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

interface TrackingOrderProps {
  initialTrackingCode?: string;
}

export default function TrackingOrder({
  initialTrackingCode = "",
}: TrackingOrderProps) {
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setTrackingResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await getOrderTrackingApi(trackingCode);
      if (!res.ok) {
        setTrackingResult(null);
        alert("Order not found!");
      } else {
        const order = await res.json();
        console.log('🔍 API Response Debug:', order);
        
        const trackingData = {
          code: order.orderId,
          status: order.status || "Unknown",
          from: order.storeAddress || "",
          to: order.address || "",
          estimatedDelivery: order.estimatedDelivery || "",
          latitude: order.latitude,
          longitude: order.longitude,
          storeLatitude: order.storeLatitude,
          storeLongitude: order.storeLongitude,
          destinationLatitude: order.destinationLatitude,
          destinationLongitude: order.destinationLongitude,
        };
        
        console.log('🗺️ Tracking Data to Map:', {
          orderId: order.orderId,
          storeCoords: `${order.storeLatitude}, ${order.storeLongitude}`,
          destCoords: `${order.destinationLatitude}, ${order.destinationLongitude}`,
          currentCoords: `${order.latitude}, ${order.longitude}`,
          trackingData
        });
        
        setTrackingResult(trackingData);
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      setTrackingResult(null);
      alert("An error occurred while tracking the order!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white sm:p-8 w-4xl">
      <div className="w-full max-w-4xl mx-auto">
        <form onSubmit={handleTrackingSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => {
                const val = e.target.value;
                setTrackingCode(val);
                if (!val.trim()) setTrackingResult(null);
              }}
              placeholder="Enter tracking code (e.g., FR001, FR002...)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-green-700 text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors text-sm sm:text-base font-semibold"
            >
              {isLoading ? "Searching..." : "Track"}
            </button>
          </div>
        </form>

        {trackingResult && (
          <div className="mt-8">
            <ComprehensiveTracking trackingResult={trackingResult} />
          </div>
        )}
      </div>
    </div>
  );
}


