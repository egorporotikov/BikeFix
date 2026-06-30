export interface RepairRequest {
  id: string;
  requester_profile_id: string;
  requester_name?: string;
  title: string;
  description: string;
  address: string;
  category: string;
  image_url: string | null;
  status: string;
  mechanic_profile_id: string | null;
  mechanic_name?: string;
  mechanic_profile_image_url?: string | null;
  is_verified?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  repair_request_id: string;
  mechanic_profile_id: string;
  mechanic_name: string;
  mechanic_profile_image_url?: string | null;
  mechanic_is_verified: boolean;
  price: number;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MechanicProfile {
  id: string;
  username?: string;
  email?: string | null;
  name?: string;
  city?: string;
  bio?: string | null;
  profile_image_url?: string | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  completed_jobs_count?: number | null;
  is_verified?: boolean | null;
  reviews?: ReviewDetail[] | null;
}

export interface ReviewDetail {
  id: string;
  rating: number;
  comment?: string | null;
  user_name?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username?: string;
  email?: string | null;
  role?: string | null;
  name?: string | null;
  city?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
}

export interface Review {
  id: string;
  mechanic_profile_id: string;
  user_profile_id: string;
  repair_request_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  user_username?: string;
}

export interface MechanicStats {
  completed_jobs_count: number;
  average_rating?: number | null;
  total_reviews: number;
}

export interface Message {
  id: string;
  request_id: string;
  sender_profile_id: string;
  sender_role: 'user' | 'mechanic' | string;
  content: string;
  created_at: string;
}

export interface Chat {
  id: string;
  repair_request_id?: string | null;
  requester_profile_id?: string | null;
  mechanic_profile_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_profile_id: string;
  sender_role: 'user' | 'mechanic' | string;
  sender_name?: string;
  is_verified?: boolean | null;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_profile_id: string;
  sender_profile_id?: string;
  type: string;
  title: string;
  body?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}
