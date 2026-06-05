import type { Message, Offer, RepairRequest } from "@/types";

const BASE_URL = "http://localhost:8000";

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  return response.json();
}

export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${BASE_URL}/upload/upload-photo`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

export async function createRepairRequest(data: Omit<RepairRequest, "id" | "created_at" | "updated_at" | "status">): Promise<RepairRequest> {
  const response = await fetch(`${BASE_URL}/repair-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function listRepairRequests(): Promise<RepairRequest[]> {
  const response = await fetch(`${BASE_URL}/repair-requests`);
  return handleResponse(response);
}

export async function getRepairRequest(id: string | number): Promise<RepairRequest> {
  const response = await fetch(`${BASE_URL}/repair-requests/${id}`);
  return handleResponse(response);
}

export async function createOffer(requestId: string | number, data: Omit<Offer, "id" | "status" | "created_at" | "request_id">): Promise<Offer> {
  const response = await fetch(`${BASE_URL}/repair-requests/${requestId}/offers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function listOffers(requestId: string | number): Promise<Offer[]> {
  const response = await fetch(`${BASE_URL}/repair-requests/${requestId}/offers`);
  return handleResponse(response);
}

export async function sendMessage(data: Omit<Message, "id" | "created_at">): Promise<Message> {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function listMessages(requestId: string | number): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/messages/${requestId}`);
  return handleResponse(response);
}
