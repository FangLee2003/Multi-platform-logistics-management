export interface TimelineStepDto {
  stepOrder?: number;
  stepCode: string;
  stepName: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  actor?: {
    userId: number;
    fullName: string;
    role: string;
    phone?: string;
  };
  details?: string;
  status?: string;
}

export interface OrderTimelineResponse {
  orderId: number;
  orderCode: string;
  timeline: TimelineStepDto[];
}

// API lấy danh sách các bước checklist chuẩn từ bảng checklist step
export async function fetchChecklistSteps(token?: string): Promise<TimelineStepDto[]> {
  const authToken = token || localStorage.getItem('token') || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const res = await fetch(`${apiBaseUrl}/api/checklist/steps`, {
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined,
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// API lấy tiến trình checklist cho đơn hàng (timeline) - giống dispatcher
export async function fetchOrderChecklistProgress(orderId: string | number, token?: string): Promise<TimelineStepDto[]> {
  const authToken = token || localStorage.getItem('token') || '';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const res = await fetch(`${apiBaseUrl}/api/checklist/orders/${orderId}/timeline`, {
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined,
  });
  
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.timeline) ? data.timeline : [];
}