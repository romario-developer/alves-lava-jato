import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Appointment, WorkOrder, OnboardingStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { fetchOnboarding, saveOnboarding } from '../lib/onboarding';
import { useAuthStore } from '../store/auth';

type WorkOrdersResponse = { data: WorkOrder[]; meta: { total: number } };

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => fetchOnboarding(),
  });

  const onboardingMutation = useMutation({
    mutationFn: (payload: any) => saveOnboarding(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      setShowOnboarding(false);
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) {
        logout();
        navigate('/login');
      }
    },
  });

  useEffect(() => {
    if (onboarding && !onboarding.completed) {
      setShowOnboarding(true);
    }
  }, [onboarding]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [osRes, appointmentsRes] = await Promise.all([
        api.get<WorkOrdersResponse>('/work-orders?perPage=5'),
        api.get<Appointment[]>('/appointments'),
      ]);
      return {
        orders: osRes.data.data ?? [],
        totalOrders: osRes.data.meta?.total ?? osRes.data.data?.length ?? 0,
        appointments: appointmentsRes.data ?? [],
      };
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments =
    data?.appointments.filter((appt) => appt.startAt.slice(0, 10) === today) ?? [];

  const openOrders = data?.orders.filter((o) => ['OPEN', 'IN_PROGRESS', 'BUDGET'].includes(o.status)) ?? [];

  if (isLoading) {
    return <p className="text-slate-600">Carregando visão geral...</p>;
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumo operacional e financeiro.</p>
        </div>
        {!loadingOnboarding && !onboarding?.completed && (
          <Button intent="ghost" size="sm" onClick={() => setShowOnboarding(true)}>
            Completar perfil
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="OS em aberto" className="bg-white">
          <p className="text-3xl font-bold text-primary">{openOrders.length}</p>
          <p className="text-sm text-slate-500">orçamentos, abertas e em execução</p>
        </Card>
        <Card title="Agendamentos de hoje">
          <p className="text-3xl font-bold text-primary">{todayAppointments.length}</p>
          <p className="text-sm text-slate-500">clientes com horário marcado</p>
        </Card>
        <Card title="OS concluídas (últimas 5)">
          <p className="text-3xl font-bold text-primary">
            {data?.orders.filter((o) => o.status === 'COMPLETED').length ?? 0}
          </p>
          <p className="text-sm text-slate-500">prontas para pós-venda</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {!loadingOnboarding && (!onboarding || onboarding.completed === false) && (
          <Card title="Complete seu perfil">
            <p className="text-sm text-slate-600">
              Conte qual é o seu negócio e prioridade. Isso ajuda a ajustar recomendações e alertas.
            </p>
            <div className="mt-3">
              <Button onClick={() => setShowOnboarding(true)}>Responder 5 perguntas</Button>
            </div>
          </Card>
        )}
        <Card title="OS recentes">
          <div className="space-y-3">
            {data?.orders.map((order) => (
              <div
                key={order.id}
                className="flex items-start justify-between rounded-xl border border-slate-100 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    #{order.sequential} • {order.client?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.vehicle?.plate} {order.vehicle?.model} —{' '}
                    {order.items.map((item) => item.service.name).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge color={order.status === 'COMPLETED' ? 'green' : 'gray'}>{order.status}</Badge>
                  <p className="text-sm font-semibold text-slate-800">
                    R$ {order.totalNet?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {data?.orders.length === 0 && <p className="text-sm text-slate-500">Nenhuma OS cadastrada.</p>}
          </div>
        </Card>

        <Card title="Agenda do dia">
          <div className="space-y-3">
            {todayAppointments.map((appt) => (
              <div key={appt.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{appt.client.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatTime(appt.startAt)} - {formatTime(appt.endAt)} •{' '}
                    {appt.services.map((s) => s.service.name).join(', ')}
                  </p>
                </div>
                <Badge color={appt.status === 'CONFIRMED' ? 'green' : 'orange'}>{appt.status}</Badge>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum agendamento para hoje.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
    <OnboardingModal
      open={showOnboarding}
      onClose={() => setShowOnboarding(false)}
      onboarding={onboarding}
      onSubmit={(payload) => onboardingMutation.mutate(payload)}
      loading={onboardingMutation.isPending}
    />
    </>
  );
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

type OnboardingForm = {
  ramoAtuacao: string[];
  qtdFuncionarios?: string;
  faturamentoMensal?: string;
  prioridade?: string;
  comoConheceu?: string;
};

function OnboardingModal({
  open,
  onClose,
  onboarding,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onboarding?: OnboardingStatus;
  onSubmit: (payload: OnboardingForm) => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<OnboardingForm>({
    ramoAtuacao: onboarding?.data?.ramoAtuacao ?? [],
    qtdFuncionarios: onboarding?.data?.qtdFuncionarios ?? '',
    faturamentoMensal: onboarding?.data?.faturamentoMensal ?? '',
    prioridade: onboarding?.data?.prioridade ?? '',
    comoConheceu: onboarding?.data?.comoConheceu ?? '',
  });

  const toggleRamo = (item: string) => {
    setForm((f) => {
      const exists = f.ramoAtuacao.includes(item);
      return {
        ...f,
        ramoAtuacao: exists ? f.ramoAtuacao.filter((r) => r !== item) : [...f.ramoAtuacao, item],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ramoAtuacao.length === 0) return;
    onSubmit({
      ...form,
      qtdFuncionarios: form.qtdFuncionarios || undefined,
      faturamentoMensal: form.faturamentoMensal || undefined,
      prioridade: form.prioridade || undefined,
      comoConheceu: form.comoConheceu || undefined,
    });
  };

  const ramos = [
    'Detalhamento premium',
    'Lavagem express',
    'Higienização de estofados',
    'Pintura / funilaria leve',
    'Polimento / vitrificação',
    'Mecânica rápida',
    'Outro',
  ];

  const faixasFuncionarios = ['1-2', '3-5', '6-10', '11-20', '20+'];
  const faixasFaturamento = ['Até 20k', '20k-50k', '50k-100k', '100k-200k', '200k+'];
  const prioridades = [
    'Aumentar ticket médio',
    'Padronizar operação',
    'Controle financeiro',
    'Retenção/pós-venda',
    'Agenda cheia',
  ];
  const origens = ['Indicação de cliente', 'Indicação de parceiro', 'Redes sociais', 'Google', 'Evento/feira', 'Outro'];

  return (
    <Modal open={open} onClose={onClose} title="Dê o primeiro passo – personalizamos seu painel" size="sm">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
        <p className="text-sm text-slate-200">
          Responda rápido para ajustar alertas, metas e prioridades. Leva menos de 1 minuto.
        </p>
      </div>
      <form className="space-y-4 pt-3" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">Ramos de atuação</p>
          <p className="text-xs text-slate-500">Escolha todas que se aplicam</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ramos.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleRamo(item)}
                className={`rounded-lg border px-3 py-2 text-sm text-left transition ${
                  form.ramoAtuacao.includes(item)
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary/50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            label="Colaboradores ativos"
            value={form.qtdFuncionarios}
            onChange={(v) => setForm((f) => ({ ...f, qtdFuncionarios: v }))}
            options={faixasFuncionarios}
          />
          <SelectField
            label="Faturamento médio mensal"
            value={form.faturamentoMensal}
            onChange={(v) => setForm((f) => ({ ...f, faturamentoMensal: v }))}
            options={faixasFaturamento}
          />
        </div>

        <SelectField
          label="Prioridade agora"
          value={form.prioridade}
          onChange={(v) => setForm((f) => ({ ...f, prioridade: v }))}
          options={prioridades}
        />

        <SelectField
          label="Como conheceu a plataforma?"
          value={form.comoConheceu}
          onChange={(v) => setForm((f) => ({ ...f, comoConheceu: v }))}
          options={origens}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" intent="ghost" onClick={onClose}>
            Depois
          </Button>
          <Button type="submit" disabled={loading || form.ramoAtuacao.length === 0}>
            {loading ? 'Enviando...' : 'Concluir'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span className="font-semibold text-slate-800">{label}</span>
      <select
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecione</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
