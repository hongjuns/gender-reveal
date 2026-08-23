import { apiClient } from './client';
import type {
  CreateCommentResult,
  GenderRevealCommentRecord,
  ListCommentsResult,
} from '@/types/genderReveal';

export interface CreateEventCommentInput {
  senderName: string;
  content: string;
}

export async function listEventComments(eventId: string): Promise<ListCommentsResult> {
  const response = await apiClient.get<{ comments: GenderRevealCommentRecord[] }>(
    `/events/${eventId}/comments`,
    {
      validateStatus: (status) => status === 200 || status === 404 || status === 410,
    },
  );

  if (response.status === 404) {
    return { status: 'not_found' };
  }
  if (response.status === 410) {
    return { status: 'expired' };
  }
  return { status: 'ok', comments: response.data.comments };
}

export async function createEventComment(
  eventId: string,
  input: CreateEventCommentInput,
): Promise<CreateCommentResult> {
  const response = await apiClient.post<GenderRevealCommentRecord>(
    `/events/${eventId}/comments`,
    input,
    {
      validateStatus: (status) =>
        status === 201 || status === 400 || status === 404 || status === 410,
    },
  );

  if (response.status === 404) {
    return { status: 'not_found' };
  }
  if (response.status === 410) {
    return { status: 'expired' };
  }
  if (response.status === 400) {
    return { status: 'invalid', message: '이름과 내용을 다시 확인해주세요.' };
  }
  return { status: 'ok', comment: response.data };
}
