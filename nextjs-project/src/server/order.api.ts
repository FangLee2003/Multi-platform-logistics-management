// src/server/order.api.ts
// Các hàm gọi API liên quan đến đơn hàng

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function getOrderTrackingApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/tracking`);
  return res;
}

// API để lấy thông tin checklist của đơn hàng
export async function getOrderChecklistApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/checklist`);
  return res;
}

// API để lấy vị trí hiện tại của đơn hàng từ tracking
export async function getOrderLocationApi(orderId: string) {
  const res = await fetch(`${API_BASE_URL}/api/tracking/order/${orderId}/current`);
  return res;
}
