import { api } from './api';

export type ClientOption = { id: string; name: string };

export async function fetchClientsOptions(search?: string) {
  const { data } = await api.get<{ data: ClientOption[] }>('/clients', {
    params: { perPage: 50, search },
  });
  return data.data;
}

export async function createQuickClient(payload: { nomeCompleto: string; whatsapp?: string }) {
  const { data } = await api.post('/clients', payload);
  return data;
}
