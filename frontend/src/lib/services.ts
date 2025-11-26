import { api } from './api';

export type ServiceOption = {
  id: string;
  name: string;
  basePrice: number;
};

export async function fetchServicesOptions() {
  const { data } = await api.get<{ data: ServiceOption[] }>('/services', { params: { perPage: 100 } });
  return data.data;
}
