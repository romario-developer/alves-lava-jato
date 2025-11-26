import { api } from './api';
import type { OnboardingStatus } from '../types';

export async function fetchOnboarding() {
  const { data } = await api.get<OnboardingStatus>('/onboarding/me');
  return data;
}

export async function saveOnboarding(payload: {
  ramoAtuacao: string[];
  qtdFuncionarios?: string;
  faturamentoMensal?: string;
  prioridade?: string;
  comoConheceu?: string;
}) {
  const { data } = await api.post('/onboarding', payload);
  return data as OnboardingStatus;
}
