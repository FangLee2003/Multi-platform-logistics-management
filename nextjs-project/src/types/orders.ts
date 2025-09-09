export interface TrackingInfo {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  address: string;
  items: OrderItem[];
  itemCount: number;
  shippingFee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  trackingHistory: TrackingInfo[];
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  weight: number;
  height: number;
  width: number;
  length: number;
}

export interface OrderForm {
  shipping_address: string;
  description?: string;
  notes?: string;
  items: OrderItem[];
  is_fragile: boolean;
  service_type: "SECOND_CLASS" | "STANDARD" | "FIRST_CLASS";
}


export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled";
