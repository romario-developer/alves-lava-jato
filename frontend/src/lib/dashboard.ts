import { api } from './api';

export type DashboardOverview = {
  vendasPagasMes: {
    total: number;
    porMetodo: {
      debito: number;
      credito: number;
      pix: number;
      dinheiro: number;
      boleto: number;
      transferencia: number;
    };
  };
  financeiroHoje: {
    entradas: number;
    saidas: number;
    saldo: number;
    faturasCartao: number;
  };
  orcamentosMes: {
    pendentes: number;
    aprovados: number;
  };
  vagasHoje: {
    total: number;
    ocupadas: number;
    concluidas: number;
  };
  posVendaHoje: {
    pendentes: number;
    realizadas: number;
  };
  topClientes: Array<{ id: string; nome: string; total: number; servicos: number }>;
  empresa: { nome?: string | null; assinatura?: string | null; desde?: string | null };
};

export async function fetchDashboardOverview() {
  const { data } = await api.get<DashboardOverview>('/dashboard/overview');
  return data;
}
