import { api } from './api';

export async function createAppointment(payload: any) {
  const { data } = await api.post('/appointments', payload);
  return data;
}
