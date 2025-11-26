import { api } from './api';
import type { Payable, Receivable } from '../types';

type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; perPage: number; total: number };
};

export async function fetchPayables(params?: { page?: number; perPage?: number; start?: string; end?: string; status?: string }) {
  const { data } = await api.get<PaginatedResponse<Payable>>('/financial/payables', { params });
  return data;
}

export async function fetchReceivables(params?: {
  page?: number;
  perPage?: number;
  start?: string;
  end?: string;
  status?: string;
}) {
  const { data } = await api.get<PaginatedResponse<Receivable>>('/financial/receivables', { params });
  return data;
}

export async function fetchCashflow(params?: { start?: string; end?: string }) {
  const { data } = await api.get<{
    periodo: any;
    entradasRecebidas: number;
    saidasPagas: number;
    saldo: number;
    entradasPrevistas: number;
    saidasPrevistas: number;
    saldoPrevisto: number;
  }>('/financial/cashflow', { params });
  return data;
}

export async function createPayable(payload: {
  descricao: string;
  categoria?: string;
  valorPrevisto: number;
  dataVencimento: string;
  valorPago?: number;
  dataPagamento?: string;
  fornecedor?: string;
}) {
  const { data } = await api.post('/financial/payables', payload);
  return data;
}

export async function createReceivable(payload: {
  valorPrevisto: number;
  dataPrevista: string;
  valorRecebido?: number;
  dataRecebimento?: string;
  clienteId?: string;
  osId?: string;
}) {
  const { data } = await api.post('/financial/receivables', payload);
  return data;
}

export async function updatePayable(id: string, payload: Partial<{
  descricao: string;
  categoria?: string;
  valorPrevisto: number;
  dataVencimento: string;
  valorPago?: number;
  dataPagamento?: string;
  fornecedor?: string;
  status?: string;
}>) {
  const { data } = await api.patch(`/financial/payables/${id}`, payload);
  return data;
}

export async function updateReceivable(id: string, payload: Partial<{
  valorPrevisto: number;
  dataPrevista: string;
  valorRecebido?: number;
  dataRecebimento?: string;
  clienteId?: string;
  status?: string;
}>) {
  const { data } = await api.patch(`/financial/receivables/${id}`, payload);
  return data;
}
