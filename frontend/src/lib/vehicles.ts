import { api } from './api';

export type VehicleOption = {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
};

export async function fetchVehiclesByClient(clientId: string) {
  const { data } = await api.get<VehicleOption[]>(`/clients/${clientId}/vehicles`);
  return data;
}

export async function createQuickVehicle(
  clientId: string,
  payload: { plate: string; brand?: string; model?: string; year?: number; color?: string; type?: string },
) {
  const { data } = await api.post(`/clients/${clientId}/vehicles`, {
    placa: payload.plate,
    marca: payload.brand || 'N/A',
    modelo: payload.model || 'N/A',
    ano: payload.year,
    cor: payload.color,
    tipo: payload.type || 'CAR',
  });
  return data as VehicleOption;
}
