import {
  AddressPayload,
  ProductPayload,
  OrderPayload,
  OrderItemPayload,
  DeliveryPayload
} from "@/utils/orderFlow";

// API Base URL từ environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * Helper function để xử lý API response
 */
async function handleResponse(response: Response, endpoint: string) {
  if (!response.ok) {
    let errorMessage = `API Error (${endpoint}): ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      const errorText = await response.text().catch(() => '');
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Service cho các API calls trong order flow
 */
export class OrderFlowService {
  /**
   * Tạo address
   */
  static async createAddress(payload: AddressPayload) {
    const response = await fetch(`${API_BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'POST /api/addresses');
  }

  /**
   * Tạo product
   */
  static async createProduct(payload: ProductPayload) {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'POST /api/products');
  }

  /**
   * Tạo order
   */
  static async createOrder(payload: OrderPayload) {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'POST /api/orders');
  }

  /**
   * Tạo order item
   */
  static async createOrderItem(payload: OrderItemPayload) {
    const response = await fetch(`${API_BASE_URL}/api/order-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'POST /api/order-items');
  }

  /**
   * Tạo delivery
   */
  static async createDelivery(payload: DeliveryPayload) {
    const response = await fetch(`${API_BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response, 'POST /api/deliveries');
  }
}
