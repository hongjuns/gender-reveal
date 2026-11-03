import { apiClient } from './client';
import type { BabyGender, GenderRevealEventRecord, GetEventResult } from '@/types/genderReveal';

export interface CreateGenderRevealEventInput {
  babyNickname: string;
  dueDate: string;
  babyGender: BabyGender;
  recipientNames: string[];
}

export interface CreatedBalloon {
  id: string;
  recipientName: string;
  shareLink: string;
}

export interface CreateGenderRevealEventResponse {
  code: string;
  manageLink: string;
  linkExpiresAt: string;
  events: CreatedBalloon[];
}

export async function createGenderRevealEvent(
  input: CreateGenderRevealEventInput,
): Promise<CreateGenderRevealEventResponse> {
  const { data } = await apiClient.post<CreateGenderRevealEventResponse>('/events', input);
  return data;
}

export async function getGenderRevealEvent(id: string): Promise<GetEventResult> {
  const response = await apiClient.get<GenderRevealEventRecord>(`/events/${id}`, {
    validateStatus: (status) => status === 200 || status === 404 || status === 410,
  });

  if (response.status === 404) {
    return { status: 'not_found' };
  }
  if (response.status === 410) {
    return { status: 'expired' };
  }
  return { status: 'ok', event: response.data };
}
