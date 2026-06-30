import type { Message, Offer, RepairRequest, Chat, ChatMessage, MechanicProfile, Review, MechanicStats, Profile, Notification } from "@/types";
import apiClient from '@/lib/apiClient';

export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("photo", file);
  return apiClient.post('/upload/upload-photo', formData);
}

export async function createRepairRequest(data: {
  title: string;
  description: string;
  address: string;
  category: string;
  image_url?: string | null;
}): Promise<RepairRequest> {
  return apiClient.post('/repair-requests/create', data);
}

export async function listRepairRequests(): Promise<RepairRequest[]> {
  return apiClient.get('/repair-requests');
}

export async function getUserRepairRequests(): Promise<RepairRequest[]> {
  return apiClient.get('/repair-requests/user');
}

export async function getMechanicRepairRequests(): Promise<RepairRequest[]> {
  return apiClient.get('/repair-requests/mechanic');
}

export async function getRepairRequest(id: string | number): Promise<RepairRequest> {
  return apiClient.get(`/repair-requests/${id}`);
}

export async function createOffer(requestId: string | number, data: {
  price: number;
  message: string;
}): Promise<Offer> {
  return apiClient.post(`/repair-requests/${requestId}/offers`, data);
}

export async function listOffers(requestId: string | number): Promise<Offer[]> {
  return apiClient.get(`/repair-requests/${requestId}/offers`);
}

export async function getMechanicProfile(mechanicId: string | number): Promise<MechanicProfile> {
  return apiClient.get(`/mechanics/${mechanicId}`);
}

export async function getMechanicReviews(mechanicId: string | number): Promise<Review[]> {
  return apiClient.get(`/mechanics/${mechanicId}/reviews`);
}

export async function getCurrentProfile(): Promise<Profile> {
  return apiClient.get('/profiles/me');
}

export async function updateProfile(data: {
  name?: string | null;
  city?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
}): Promise<Profile> {
  return apiClient.patch('/profiles/update', data);
}

export async function uploadAvatar(file: File): Promise<Profile> {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiClient.post('/profiles/upload-avatar', formData);
}

export async function getMechanicStats(mechanicId: string | number): Promise<MechanicStats> {
  return apiClient.get(`/mechanics/${mechanicId}/stats`);
}

export async function createReview(data: { request_id: string; rating: number; comment?: string | null }): Promise<Review> {
  return apiClient.post('/reviews/create', data);
}

export async function selectOffer(requestId: string | number, offerId: string | number): Promise<Offer> {
  return apiClient.post(`/repair-requests/${requestId}/offers/${offerId}/select`, {});
}

export async function completeRepairRequest(requestId: string | number): Promise<RepairRequest> {
  return apiClient.patch(`/repair-requests/${requestId}/complete`);
}

export async function getChatByRequestId(requestId: string): Promise<Chat> {
  return apiClient.get(`/chats/request/${requestId}`);
}

export async function createChat(requestId: string, mechanicProfileId?: string): Promise<Chat> {
  return apiClient.post('/chats/create', { request_id: requestId, mechanic_profile_id: mechanicProfileId });
}

export async function listChatMessages(chatId: string): Promise<ChatMessage[]> {
  return apiClient.get(`/chats/${chatId}/messages`);
}

export async function sendChatMessage(chatId: string, data: {
  content: string;
}): Promise<ChatMessage> {
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request_id: chatId,
      text: data.content,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.error || parsed.message || parsed.detail || JSON.stringify(parsed);
    } catch {
      // Keep the raw response text.
    }
    throw new Error(detail || response.statusText);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as ChatMessage;
  }
}

export async function getNotifications(): Promise<Notification[]> {
  return apiClient.get('/notifications/me');
}

export async function getUnreadNotificationsCount(): Promise<{ unread_count: number }> {
  return apiClient.get('/notifications/me/unread-count');
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  return apiClient.patch(`/notifications/${notificationId}/mark-read`);
}

