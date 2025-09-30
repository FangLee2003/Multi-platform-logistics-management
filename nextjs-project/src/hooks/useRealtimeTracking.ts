"use client";

import { useState, useEffect, useCallback } from "react";

interface UseRealtimeTrackingOptions {
  orderId: string;
  enabled: boolean;
  pollingInterval?: number; // milliseconds
}

interface TrackingData {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  location?: string;
  status?: string;
  driverName?: string;
  vehicleInfo?: string;
}

export function useRealtimeTracking({ 
  orderId, 
  enabled, 
  pollingInterval = 30000 // 30 seconds default
}: UseRealtimeTrackingOptions) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrackingData = useCallback(async () => {
    if (!orderId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/tracking/order/${orderId}/current`);

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        setLastUpdated(new Date());
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching realtime tracking:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled && orderId) {
      fetchTrackingData();
    }
  }, [fetchTrackingData, enabled, orderId]);

  // Polling
  useEffect(() => {
    if (!enabled || !orderId) return;

    const interval = setInterval(fetchTrackingData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchTrackingData, enabled, orderId, pollingInterval]);

  return {
    trackingData,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchTrackingData
  };
}