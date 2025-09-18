import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useDispatcherContext } from "../../contexts/DispatcherContext";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapboxTrackingMap() {
  const { selectedOrder } = useDispatcherContext();
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);

  type Route = {
    geometry: {
      coordinates: [number, number][];
    };
    legs: Array<{
      steps: Array<{
        maneuver: {
          location: [number, number];
        };
      }>;
    }>;
    distance: number;
    duration: number;
    // ...other Mapbox route fields
  };
  const [route, setRoute] = useState<Route | null>(null);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [vehiclePos, setVehiclePos] = useState<[number, number] | null>(null);
  const realTruckMarker = useRef<mapboxgl.Marker | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const waypointMarkers = useRef<mapboxgl.Marker[]>([]);

  // Đoạn đường đã đi qua: từ start đến vị trí xe hiện tại, lấy theo các waypoint
  // Nếu có vehiclePos và waypoint, lấy các waypoint từ start đến gần vehiclePos nhất
  const getTraveledPath = () => {
    if (!start || !vehiclePos || waypoints.length === 0) return [];
    // Tìm index gần nhất với vehiclePos
    let minIdx = 0;
    let minDist = Number.POSITIVE_INFINITY;
    waypoints.forEach((pt, idx) => {
      const d = Math.hypot(pt[0] - vehiclePos[0], pt[1] - vehiclePos[1]);
      if (d < minDist) {
        minDist = d;
        minIdx = idx;
      }
    });
    // Lấy các điểm từ đầu đến vị trí gần nhất
    return waypoints.slice(0, minIdx + 1);
  };
  const MAPBOX_TOKEN =
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    "pk.eyJ1IjoieHVhbmh1eTEiLCJhIjoiY21lN3liN21tMDlzaTJtbXF3MjU0Z2JzaSJ9.vmH3qH_f7qf1ewBC_pJoSg";

  // Fetch vehicle position every 5s
  useEffect(() => {
    // Get vehicle ID from selectedOrder
    const vehicleId = selectedOrder?.vehicle?.id;
    
    console.log('🔍 MapboxTrackingMap: selectedOrder changed:', selectedOrder);
    console.log('🔍 MapboxTrackingMap: vehicleId found:', vehicleId);
    
    if (!vehicleId) return;

    // Function để lưu vị trí xe vào tracking database
    const saveVehicleLocationToTracking = async (vehicleId: number, coords: [number, number]) => {
      try {
        // Lấy deliveryId từ orderId trước khi lưu tracking
        let deliveryId = null;
        if (selectedOrder?.id) {
          try {
            const deliveryResponse = await fetch(`http://localhost:8080/api/deliveries/order/${selectedOrder.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (deliveryResponse.ok) {
              const deliveries = await deliveryResponse.json();
              if (deliveries && deliveries.length > 0) {
                deliveryId = deliveries[0].id;
                console.log('🔍 MapboxTrackingMap: Found deliveryId:', deliveryId, 'for orderId:', selectedOrder.id);
              } else {
                console.warn('❌ MapboxTrackingMap: No delivery found for orderId:', selectedOrder.id, '- deliveries:', deliveries);
              }
            } else {
              console.warn('❌ MapboxTrackingMap: Could not find delivery for orderId:', selectedOrder.id, '- status:', deliveryResponse.status);
            }
          } catch (error) {
            console.error('❌ MapboxTrackingMap: Error fetching delivery:', error);
          }
        }

        if (!deliveryId) {
          console.warn('⚠️ MapboxTrackingMap: No delivery found, attempting to create one...');
          
          // Tự động tạo delivery cho order này
          try {
            const createDeliveryData = {
              orderId: selectedOrder.id,
              vehicleId: vehicleId,
              driverId: selectedOrder.vehicle?.currentDriver?.id,
              transportMode: 'ROAD',
              serviceType: 'STANDARD',
              scheduleDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              deliveryNotes: `Auto-created delivery for tracking - Order #${selectedOrder.id}`
            };
            
            console.log('🔧 MapboxTrackingMap: Creating delivery:', createDeliveryData);
            
            const createResponse = await fetch('http://localhost:8080/api/deliveries', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(createDeliveryData)
            });
            
            if (createResponse.ok) {
              const newDelivery = await createResponse.json();
              deliveryId = newDelivery.id;
              console.log('✅ MapboxTrackingMap: Delivery created successfully with ID:', deliveryId);
            } else {
              const errorText = await createResponse.text();
              console.error('❌ MapboxTrackingMap: Failed to create delivery:', createResponse.status, errorText);
              return;
            }
          } catch (createError) {
            console.error('❌ MapboxTrackingMap: Error creating delivery:', createError);
            return;
          }
        }
        
        if (!deliveryId) {
          console.error('❌ MapboxTrackingMap: Still no deliveryId after creation attempt');
          return;
        }

        const trackingData = {
          vehicleId: vehicleId,
          deliveryId: deliveryId, // Sử dụng deliveryId thay vì orderId
          latitude: coords[1], // latitude
          longitude: coords[0], // longitude
          location: selectedOrder?.store?.storeName ? `At store: ${selectedOrder.store.storeName}` : 'At pickup location',
          notes: `Vehicle positioned at store for order #${selectedOrder?.id}`
        };
        
        console.log('🔍 MapboxTrackingMap: Saving vehicle location to tracking:', trackingData);
        
        // Kiểm tra xem đã có tracking record cho vehicle+delivery này chưa
        let existingTrackingId = null;
        try {
          const checkResponse = await fetch(`http://localhost:8080/api/tracking/vehicle/${vehicleId}/delivery/${deliveryId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (checkResponse.ok) {
            const existingTracking = await checkResponse.json();
            if (existingTracking && existingTracking.id) {
              existingTrackingId = existingTracking.id;
              console.log('🔍 MapboxTrackingMap: Found existing tracking ID:', existingTrackingId);
            }
          }
        } catch (checkError) {
          console.log('🔍 MapboxTrackingMap: No existing tracking found, will create new');
        }
        
        // Quyết định POST (tạo mới) hay PUT (cập nhật)
        const isUpdate = existingTrackingId !== null;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate 
          ? `http://localhost:8080/api/tracking/vehicle-location/${existingTrackingId}`
          : 'http://localhost:8080/api/tracking/vehicle-location';
          
        console.log(`🔍 MapboxTrackingMap: ${isUpdate ? 'Updating' : 'Creating'} tracking record...`);
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(trackingData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ MapboxTrackingMap: Vehicle location ${isUpdate ? 'updated' : 'saved'} successfully:`, result);
        } else {
          const errorText = await response.text();
          console.log(`❌ MapboxTrackingMap: Failed to ${isUpdate ? 'update' : 'save'} tracking data:`, response.status, errorText);
        }
      } catch (error) {
        console.error('❌ MapboxTrackingMap: Error saving tracking data:', error);
      }
    };

    const useStoreCoordinatesAsDefault = () => {
      // Chỉ sử dụng tọa độ thực tế của store để hiển thị map, KHÔNG lưu tracking
      if (selectedOrder?.store?.latitude && selectedOrder?.store?.longitude) {
        const storeCoords: [number, number] = [selectedOrder.store.longitude, selectedOrder.store.latitude];
        console.log('🔍 MapboxTrackingMap: Using actual store coordinates for display only:', storeCoords);
        console.log('🔍 MapboxTrackingMap: Store info:', selectedOrder.store);
        // CHỈ set position để hiển thị trên map, KHÔNG lưu vào database
        setVehiclePos(storeCoords);
        if (map.current) {
          map.current.flyTo({
            center: storeCoords,
            speed: 1.2,
            curve: 1.5,
          });
        }
      } else {
        // Không có tọa độ store thì không cập nhật vị trí xe, chỉ log cảnh báo
        console.warn('⚠️ MapboxTrackingMap: Store does not have coordinates, cannot set vehicle position!');
      }
    };
    
    const fetchVehiclePos = async () => {
      console.log('🔍 MapboxTrackingMap: Fetching position for vehicleId:', vehicleId);
      
      try {
        // Thử lấy tracking data từ Spring Boot API
        const apiUrl = `http://localhost:8080/api/tracking/vehicle/${vehicleId}/current`;
        console.log('🔍 MapboxTrackingMap: API URL:', apiUrl);
        
        const res = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('🔍 MapboxTrackingMap: API response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('🔍 MapboxTrackingMap: vehicle position data from API:', data);
          
          if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
            const coords: [number, number] = [data.longitude, data.latitude];
            console.log('🔍 MapboxTrackingMap: Setting vehicle position:', coords);
            setVehiclePos(coords);
            if (map.current) {
              map.current.flyTo({
                center: coords,
                speed: 1.2,
                curve: 1.5,
              });
            }
            return; // Thành công, không cần fallback
          } else {
            console.log('🔍 MapboxTrackingMap: No valid coordinates in API response');
          }
        } else {
          console.log('🔍 MapboxTrackingMap: API response not ok:', res.status);
          const errorText = await res.text();
          console.log('🔍 MapboxTrackingMap: Error response:', errorText);
        }
      } catch (err) {
        console.error("Error fetching vehicle position from API:", err);
      }
      
      // Fallback: Sử dụng tọa độ store và lưu vào tracking
      console.log('🔍 MapboxTrackingMap: Using store coordinates as fallback');
      useStoreCoordinatesAsDefault();
    };
    
    // Luôn cập nhật vehicle position với store coordinates khi chọn order mới
    console.log('🔍 MapboxTrackingMap: Updating vehicle position with store coordinates');
    useStoreCoordinatesAsDefault();
    
    fetchVehiclePos();
    const interval = setInterval(fetchVehiclePos, 3600000); // 1 tiếng
    return () => clearInterval(interval);
  }, [selectedOrder]);

  // Debug selectedOrder changes
  useEffect(() => {
    console.log('MapboxTrackingMap: selectedOrder changed:', selectedOrder);
    console.log('MapboxTrackingMap: Vehicle info:', selectedOrder?.vehicle);
    console.log('MapboxTrackingMap: Vehicle ID:', selectedOrder?.vehicle?.id);
    console.log('MapboxTrackingMap: Current driver:', selectedOrder?.vehicle?.currentDriver);
  }, [selectedOrder]);

  // Draw vehicle marker
  useEffect(() => {
      // Chỉ hiển thị marker xe nếu có tài xế
      if (!map.current || !vehiclePos || !isLoaded) return;
      
      // Check if current driver exists
      const currentDriver = selectedOrder?.vehicle?.currentDriver;
      
      if (!currentDriver) {
        // Nếu không có tài xế, xóa marker nếu có
        if (realTruckMarker.current) {
          realTruckMarker.current.remove();
          realTruckMarker.current = null;
        }
        return;
      }
      if (!realTruckMarker.current) {
        const truckEl = document.createElement("div");
        truckEl.style.width = "32px";
        truckEl.style.height = "32px";
        truckEl.style.display = "flex";
        truckEl.style.alignItems = "center";
        truckEl.style.justifyContent = "center";
        truckEl.style.fontSize = "28px";
        truckEl.style.background = "rgba(255,255,255,0.85)";
        truckEl.style.borderRadius = "50%";
        truckEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        truckEl.innerHTML = "🚚";
        realTruckMarker.current = new mapboxgl.Marker(truckEl)
          .setLngLat(vehiclePos)
          .addTo(map.current);
      } else {
        realTruckMarker.current.setLngLat(vehiclePos);
      }
    }, [vehiclePos, isLoaded, selectedOrder]);

  // Đã xóa code vẽ waypoint markers (các chấm xanh và xám)

  // Update route when selectedOrder changes
  useEffect(() => {
    // Nếu không có selectedOrder hoặc selectedOrder không có assignedVehicle, xóa route
  if (!selectedOrder || !selectedOrder.vehicle) {
      setStart(null);
      setEnd(null);
      setRoute(null);
      setWaypoints([]);
      setVehiclePos(null);

      // Xóa route khỏi map nếu tồn tại (an toàn)
      if (map.current) {
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }
        if (map.current.getLayer('traveled-path-layer')) {
          map.current.removeLayer('traveled-path-layer');
        }
        if (map.current.getSource('traveled-path')) {
          map.current.removeSource('traveled-path');
        }
      }

      // Xóa markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      // Xóa vehicle marker
      if (realTruckMarker.current) {
        realTruckMarker.current.remove();
        realTruckMarker.current = null;
      }

      return;
    }

  if (selectedOrder && selectedOrder.vehicle && selectedOrder.store && selectedOrder.address) {
      const store = selectedOrder.store;
      const address = selectedOrder.address;
      if (
        store.latitude &&
        store.longitude &&
        address.latitude &&
        address.longitude
      ) {
        const startCoord: [number, number] = [store.longitude, store.latitude];
        const endCoord: [number, number] = [
          address.longitude,
          address.latitude,
        ];
        setStart(startCoord);
        setEnd(endCoord);
        // Fetch route from Mapbox Directions API
        const fetchRoute = async () => {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoord.join(
            ","
          )};${endCoord.join(
            ","
          )}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
          try {
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (data.routes && data.routes[0]) {
                setRoute(data.routes[0]);
                setWaypoints(data.routes[0].geometry.coordinates);
              }
            }
          } catch (err) {
            console.error("Error fetching route:", err);
          }
        };
        fetchRoute();
      }
    }
  }, [selectedOrder]);

  // Draw start/end markers, route line, và traveled path (màu xám)
  useEffect(() => {
    if (!map.current || !start || !end || !route) return;
    // Remove old markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    // Start marker
    const startEl = document.createElement("div");
    startEl.style.width = "16px";
    startEl.style.height = "16px";
    startEl.style.background = "#22c55e";
    startEl.style.border = "2px solid #fff";
    startEl.style.borderRadius = "50%";
    startEl.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
    const startMarker = new mapboxgl.Marker(startEl)
      .setLngLat(start)
      .addTo(map.current);
    markers.current.push(startMarker);
    // End marker
    const endEl = document.createElement("div");
    endEl.style.width = "16px";
    endEl.style.height = "16px";
    endEl.style.background = "#ef4444";
    endEl.style.border = "2px solid #fff";
    endEl.style.borderRadius = "50%";
    endEl.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
    const endMarker = new mapboxgl.Marker(endEl)
      .setLngLat(end)
      .addTo(map.current);
    markers.current.push(endMarker);
    // Draw route line
    const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: route.geometry.coordinates,
      },
      properties: {},
    };
    if (map.current.getSource("route")) {
      (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData(
        routeFeature
      );
    } else {
      map.current.addSource("route", {
        type: "geojson",
        data: routeFeature,
      });
      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#3b82f6", "line-width": 5 },
      });
    }

    // Draw traveled path (gray)
    const traveledPath = getTraveledPath();
    const traveledFeature: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: traveledPath,
      },
      properties: {},
    };
    if (map.current.getSource("traveled-path")) {
      (
        map.current.getSource("traveled-path") as mapboxgl.GeoJSONSource
      ).setData(traveledFeature);
    } else if (traveledPath.length > 1) {
      map.current.addSource("traveled-path", {
        type: "geojson",
        data: traveledFeature,
      });
      map.current.addLayer({
        id: "traveled-path-layer",
        type: "line",
        source: "traveled-path",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#888", "line-width": 5, "line-opacity": 0.7 },
      });
    }
  }, [route, start, end, vehiclePos, waypoints]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [106.660172, 10.762622],
        zoom: 12,
      });
      map.current.on("load", () => setIsLoaded(true));
      map.current.on("error", (error) => {
        console.error("MapboxTrackingMap: Map error:", error);
      });
    } catch (error) {
      console.error("MapboxTrackingMap: Initialization error:", error);
    }
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      waypointMarkers.current.forEach((m) => m.remove());
      waypointMarkers.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsLoaded(false);
    };
  }, [MAPBOX_TOKEN]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 h-full min-h-[300px] w-full flex flex-col">
  {selectedOrder && selectedOrder.vehicle && selectedOrder.vehicle.currentDriver && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-semibold text-blue-900 mb-1">
            Đơn hàng #{selectedOrder.id}
          </div>
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              <span>
                <strong>Từ:</strong> {selectedOrder.store?.storeName} -{" "}
                {selectedOrder.store?.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
              <span>
                <strong>Đến:</strong> {selectedOrder.address?.address}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
              <span>
                <strong>Xe:</strong> {selectedOrder.vehicle?.licensePlate || "(Không rõ biển số)"}
                {" | "}
                <strong>Tài xế:</strong> {selectedOrder.vehicle.currentDriver.fullName}
              </span>
            </div>
          </div>
          {route &&
            typeof route.distance === "number" &&
            typeof route.duration === "number" && (
              <div className="mt-2 text-xs text-blue-600">
                <strong>Khoảng cách:</strong>{" "}
                {(route.distance / 1000).toFixed(1)} km |
                <strong> Thời gian:</strong> {(() => {
                  const totalMinutes = Math.round(route.duration / 60);
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  if (hours > 0) {
                    return `${hours}h ${minutes}p`;
                  } else {
                    return `${minutes} phút`;
                  }
                })()}
              </div>
            )}
        </div>
      )}
  {selectedOrder && !selectedOrder.vehicle && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-1">
            Đơn hàng #{selectedOrder.id}
          </div>
          <div className="text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span>
              <span>Đơn hàng này chưa được gán xe</span>
            </div>
          </div>
        </div>
      )}
      {!selectedOrder && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            Chọn một đơn hàng để xem lộ trình trên bản đồ
          </div>
        </div>
      )}
      <div
        ref={mapContainer}
        className="flex-1 min-h-[250px] h-[350px] w-full rounded-lg border-2 border-blue-500 relative overflow-hidden"
        style={{
          minHeight: "250px",
          height: "350px",
          width: "100%",
          position: "relative",
          border: "2px solid blue",
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading map...
            </div>
          </div>
        )}
      </div>

      {/* Hiển thị danh sách waypoint nếu có */}
      {/* {waypoints.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <div className="font-bold">Danh sách waypoint:</div>
          <ul className="text-xs">
            {waypoints.map((wp, idx) => (
              <li key={idx}>{wp.join(', ')}</li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
}
