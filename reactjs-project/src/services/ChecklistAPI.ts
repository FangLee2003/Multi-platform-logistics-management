import type { TimelineStepDto } from '../types/Order';

export async function fetchOrderTimeline(orderId: string | number, token?: string): Promise<TimelineStepDto[]> {
  const authToken = token || localStorage.getItem('token') || '';
  const res = await fetch(`http://localhost:8080/api/checklist/orders/${orderId}/timeline`, {
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined,
  });
  if (!res.ok) return [];
  const data = await res.json();
  // data.timeline là mảng các bước checklist
  return Array.isArray(data.timeline) ? data.timeline : [];
}
