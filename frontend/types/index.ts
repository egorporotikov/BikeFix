export interface RepairRequest {
  id: number;
  user_id: number | null;
  photo_url: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  request_id: number;
  mechanic_id: number;
  price: number;
  message: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: number;
  request_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  created_at: string;
}
