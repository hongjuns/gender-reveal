import { apiClient } from './client';
import type {
  DeleteBalloonResult,
  ExtendBalloonResult,
  GetManagedGroupResult,
  ManagedBalloon,
  ManagedBalloonGroup,
} from '@/types/genderReveal';

function managePath(code: string) {
  return `/manage/${encodeURIComponent(code)}`;
}

export async function getManagedGroup(code: string): Promise<GetManagedGroupResult> {
  const response = await apiClient.get<ManagedBalloonGroup>(managePath(code), {
    validateStatus: (status) => status === 200 || status === 404,
  });
  if (response.status === 404) {
    return { status: 'not_found' };
  }
  return { status: 'ok', group: response.data };
}

export async function deleteBalloon(code: string, id: string): Promise<DeleteBalloonResult> {
  const response = await apiClient.delete(`${managePath(code)}/events/${encodeURIComponent(id)}`, {
    validateStatus: (status) => status === 204 || status === 404,
  });
  return response.status === 404 ? { status: 'not_found' } : { status: 'ok' };
}

export async function extendBalloon(code: string, id: string): Promise<ExtendBalloonResult> {
  const response = await apiClient.post<ManagedBalloon>(
    `${managePath(code)}/events/${encodeURIComponent(id)}/extend`,
    undefined,
    { validateStatus: (status) => status === 200 || status === 404 || status === 409 },
  );
  if (response.status === 404) {
    return { status: 'not_found' };
  }
  if (response.status === 409) {
    return { status: 'already_extended' };
  }
  return { status: 'ok', balloon: response.data };
}
