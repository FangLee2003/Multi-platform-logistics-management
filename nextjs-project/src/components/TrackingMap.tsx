"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface TrackingMapProps {
  orderId: string;
  trackingData?: {
    latitude: number;
    longitude: number;
    from?: string;
    to?: string;
    storeLatitude?: number;
    storeLongitude?: number;
    destinationLatitude?: number;
    destinationLongitude?: number;
  };
}

export default function TrackingMap({ orderId, trackingData }: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const MAPBOX_TOKEN = 
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    "pk.eyJ1IjoieHVhbmh1eTEiLCJhIjoiY21lN3liN21tMDlzaTJtbXF3MjU0Z2JzaSJ9.vmH3qH_f7qf1ewBC_pJoSg";

  // Initialize map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [106.660172, 10.762622], // Ho Chi Minh City default
        zoom: 12,
      });

      map.current.on("load", () => {
        setIsLoaded(true);
      });

      map.current.on("error", (error) => {
        console.error("TrackingMap error:", error);
      });
    } catch (error) {
      console.error("TrackingMap initialization error:", error);
    }

    return () => {
      // Cleanup markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsLoaded(false);
    };
  }, [MAPBOX_TOKEN]);

  // Update map with tracking data
  useEffect(() => {
    if (!map.current || !isLoaded || !trackingData) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const { 
      latitude, 
      longitude, 
      storeLatitude, 
      storeLongitude, 
      destinationLatitude, 
      destinationLongitude 
    } = trackingData;

    // Add current position marker (truck/driver)
    let vehicleLat = latitude;
    let vehicleLng = longitude;
    let isActualVehicle = true;
    // Nếu không có vị trí xe, dùng vị trí điểm xuất phát
    if (!(latitude && longitude) && storeLatitude && storeLongitude) {
      vehicleLat = storeLatitude;
      vehicleLng = storeLongitude;
      isActualVehicle = false;
    }
    if (vehicleLat && vehicleLng) {
      const vehicleEl = document.createElement("div");
      vehicleEl.style.width = "32px";
      vehicleEl.style.height = "32px";
      vehicleEl.style.display = "flex";
      vehicleEl.style.alignItems = "center";
      vehicleEl.style.justifyContent = "center";
      vehicleEl.style.fontSize = "24px";
      vehicleEl.style.background = "rgba(255,255,255,0.9)";
      vehicleEl.style.borderRadius = "50%";
      vehicleEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      vehicleEl.innerHTML = "🚚";

      const vehicleMarker = new mapboxgl.Marker(vehicleEl)
        .setLngLat([vehicleLng, vehicleLat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h4 class="font-bold text-blue-600">${isActualVehicle ? "Vị trí hiện tại" : "Vị trí xe (mặc định tại điểm xuất phát)"}</h4>
              <p class="text-sm">Đơn hàng: ${orderId}</p>
              <p class="text-xs text-gray-600">GPS: ${vehicleLat.toFixed(6)}, ${vehicleLng.toFixed(6)}</p>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current.push(vehicleMarker);
    }

    // Add store marker (start point)
    if (storeLatitude && storeLongitude) {
      const storeEl = document.createElement("div");
      storeEl.style.width = "24px";
      storeEl.style.height = "24px";
      storeEl.style.background = "#22c55e";
      storeEl.style.border = "3px solid #fff";
      storeEl.style.borderRadius = "50%";
      storeEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";

      const storeMarker = new mapboxgl.Marker(storeEl)
        .setLngLat([storeLongitude, storeLatitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h4 class="font-bold text-green-600">Điểm xuất phát</h4>
              <p class="text-sm">${trackingData.from || 'Cửa hàng'}</p>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current.push(storeMarker);
    }

    // Add destination marker (end point)
    if (destinationLatitude && destinationLongitude) {
      const destEl = document.createElement("div");
      destEl.style.width = "24px";
      destEl.style.height = "24px";
      destEl.style.background = "#ef4444";
      destEl.style.border = "3px solid #fff";
      destEl.style.borderRadius = "50%";
      destEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";

      const destMarker = new mapboxgl.Marker(destEl)
        .setLngLat([destinationLongitude, destinationLatitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h4 class="font-bold text-red-600">Điểm giao hàng</h4>
              <p class="text-sm">${trackingData.to || 'Địa chỉ giao hàng'}</p>
            </div>
          `)
        )
        .addTo(map.current);

      markers.current.push(destMarker);
    }

    // Draw route if we have both start and end points
    if (storeLatitude && storeLongitude && destinationLatitude && destinationLongitude) {
      fetchAndDrawRoute([storeLongitude, storeLatitude], [destinationLongitude, destinationLatitude]);
    }

    // Determine map center and zoom
    if (latitude && longitude) {
      // If we have vehicle position, center on it
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        speed: 1.2,
      });
    } else if (storeLatitude && storeLongitude) {
      // If no vehicle position, center on store (pickup point)
      map.current.flyTo({
        center: [storeLongitude, storeLatitude],
        zoom: 13,
        speed: 1.2,
      });
    }

    // Fit map to show all markers if multiple markers exist
    if (markers.current.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        const lngLat = marker.getLngLat();
        bounds.extend(lngLat);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [trackingData, isLoaded, orderId]);

  // Fetch and draw route
  const fetchAndDrawRoute = async (start: [number, number], end: [number, number]) => {
    if (!map.current) return;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          
          // Remove existing route layer
          if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
          }
          if (map.current.getSource('route')) {
            map.current.removeSource('route');
          }

          // Add route source and layer
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-gray-200 relative">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-50">
          <div className="text-gray-600 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm">Đang tải bản đồ...</div>
          </div>
        </div>
      )}
      
      {isLoaded && !trackingData?.latitude && !trackingData?.longitude && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-40">
          <div className="text-gray-500 text-center p-4">
            <div className="text-4xl mb-2">📍</div>
            <div className="text-sm">Chưa có dữ liệu vị trí</div>
            <div className="text-xs text-gray-400 mt-1">Bản đồ sẽ hiển thị khi có thông tin GPS</div>
          </div>
        </div>
      )}
    </div>
  );
}