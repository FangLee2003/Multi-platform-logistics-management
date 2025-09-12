/**
 * Geocoding API để lấy tọa độ từ địa chỉ
 */

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

/**
 * Lấy tọa độ từ địa chỉ sử dụng OpenStreetMap Nominatim API
 * @param address Địa chỉ cần lấy tọa độ
 * @returns Promise<Coordinates> Tọa độ latitude và longitude
 */
export async function getCoordinatesFromAddress(
  address: string
): Promise<Coordinates> {
  if (!address.trim()) {
    return { latitude: null, longitude: null };
  }

  try {
    // Sử dụng Nominatim API từ OpenStreetMap (free)
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;

    console.log("Geocoding request URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "FastRoute-App/1.0", // Nominatim yêu cầu User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Geocoding response:", data);

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat) || null,
        longitude: parseFloat(result.lon) || null,
      };
    } else {
      console.warn("No geocoding results found for:", address);
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error("Error in geocoding:", error);
    return { latitude: null, longitude: null };
  }
}

/**
 * Lấy địa chỉ từ tọa độ (reverse geocoding)
 * @param latitude Vĩ độ
 * @param longitude Kinh độ
 * @returns Promise<string> Địa chỉ từ tọa độ
 */
export async function getAddressFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "FastRoute-App/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return "";
  }
}
