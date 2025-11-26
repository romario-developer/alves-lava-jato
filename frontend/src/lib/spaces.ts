import { api } from './api';

export type Space = {
  id: string;
  name: string;
  type?: string | null;
  status?: string | null;
};

export type SpaceSummary = {
  totalVagas: number;
  ocupadas: number;
  concluidas: number;
};

export type SpaceOccupation = {
  id: string;
  status: string;
  startedAt: string;
  expectedEndAt?: string | null;
  endedAt?: string | null;
  space: { id: string; name: string; type?: string | null };
  workOrder?: { id: string; sequential: number; status: string; client?: { id: string; name: string } | null } | null;
  appointment?: { id: string; startAt: string; client?: { id: string; name: string } | null } | null;
};

export async function fetchSpaces() {
  const { data } = await api.get<Space[]>('/spaces');
  return data;
}

export async function fetchSpaceSummary() {
  const { data } = await api.get<SpaceSummary>('/spaces/summary/today');
  return data;
}

export async function fetchSpaceOccupationsToday() {
  const { data } = await api.get<SpaceOccupation[]>('/spaces/occupations/today');
  return data;
}

export async function createSpace(payload: { name: string; type?: string }) {
  const { data } = await api.post<Space>('/spaces', {
    nome: payload.name,
    tipo: payload.type,
  });
  return data;
}

export async function openOccupation(payload: { spaceId: string; workOrderId?: string; appointmentId?: string; expectedEndAt?: string }) {
  const { data } = await api.post('/spaces/occupations', payload);
  return data;
}

export async function closeOccupation(id: string, payload?: { endedAt?: string }) {
  const { data } = await api.patch(`/spaces/occupations/${id}/close`, payload ?? {});
  return data;
}
