import { api } from './api';

export async function createWorkOrder(payload: any) {
  const { data } = await api.post('/work-orders', payload);
  return data;
}
