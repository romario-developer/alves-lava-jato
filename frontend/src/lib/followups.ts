import { api } from './api';
import type { FollowUp } from '../types';

export async function fetchFollowUps(params?: { start?: string; end?: string; status?: string }) {
  const { data } = await api.get<FollowUp[]>('/follow-ups', { params });
  return data;
}

export async function updateFollowUpStatus(id: string, status: string) {
  const { data } = await api.patch(`/follow-ups/${id}/status`, { status });
  return data;
}
