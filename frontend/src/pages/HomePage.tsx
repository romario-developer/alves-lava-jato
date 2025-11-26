import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { fetchFollowUps } from '../lib/followups';
import type { Appointment } from '../types';
import { formatCurrency } from '../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDashboardOverview } from '../lib/dashboard';
import { Badge } from '../components/ui/Badge';

export function HomePage() {
  const navigate = useNavigate();
  const { data: appointmentsData } = useQuery({
    queryKey: ['home-appointments'],
    queryFn: async () => {
      const res = await api.get<Appointment[]>('/appointments');
      return res.data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: followUpsData } = useQuery({
    queryKey: ['home-followups', today],
    queryFn: () => fetchFollowUps({ start: today, end: today }),
  });

  const { data: overview } = useQuery({
    queryKey: ['home-overview'],
    queryFn: () => fetchDashboardOverview(),
  });

  const todayAppointments = (appointmentsData ?? []).filter((appt) => appt.startAt.slice(0, 10) === today);
  const followUpsToday = followUpsData ?? [];
  const followUpsPending = followUpsToday.filter((f) => f.status === 'PENDING').length;
  const followUpsDone = followUpsToday.filter((f) => f.status === 'DONE').length;

  return (
    <div className="space-y-6">
      <Hero />

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Orçamentos este mês"
          items={[
            { label: 'pendentes', value: overview?.orcamentosMes.pendentes ?? 0, color: 'text-blue-500' },
            { label: 'aprovados', value: overview?.orcamentosMes.aprovados ?? 0, color: 'text-emerald-500' },
          ]}
        />
        <SummaryCard
          title="Vagas no espaço hoje"
          items={[
            {
              label: 'vagas ocupadas',
              value: `${overview?.vagasHoje.ocupadas ?? 0} / ${overview?.vagasHoje.total ?? 0}`,
              color: 'text-amber-500',
            },
            { label: 'vagas concluídas', value: overview?.vagasHoje.concluidas ?? 0, color: 'text-emerald-500' },
          ]}
        />
        <SummaryCard
          title="Pós-vendas para hoje"
          items={[
            { label: 'contatos pendentes', value: overview?.posVendaHoje.pendentes ?? followUpsPending, color: 'text-red-500' },
            { label: 'pós-vendas realizadas', value: overview?.posVendaHoje.realizadas ?? followUpsDone, color: 'text-emerald-500' },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Resumo financeiro (hoje)">
          <div className="space-y-3">
            <FinancialRow label="Saldo" value={overview?.financeiroHoje.saldo ?? 0} />
            <FinancialRow label="Entradas hoje" value={overview?.financeiroHoje.entradas ?? 0} positive />
            <FinancialRow label="Saídas hoje" value={overview?.financeiroHoje.saidas ?? 0} />
          </div>
        </Card>

        <CalendarCard
          appointments={appointmentsData ?? []}
          todayAppointments={todayAppointments}
          onSelectDay={(isoDate) => navigate(`/appointments/new?date=${isoDate}`)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Resumo das vendas (mês)">
          <p className="text-sm text-slate-500">
            {formatCurrency(overview?.vendasPagasMes.total ?? 0)} em vendas pagas este mês
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
            <MethodRow label="Débito" value={overview?.vendasPagasMes.porMetodo.debito ?? 0} color="text-amber-600" />
            <MethodRow label="Crédito" value={overview?.vendasPagasMes.porMetodo.credito ?? 0} color="text-emerald-600" />
            <MethodRow label="Pix" value={overview?.vendasPagasMes.porMetodo.pix ?? 0} color="text-blue-600" />
            <MethodRow label="Dinheiro" value={overview?.vendasPagasMes.porMetodo.dinheiro ?? 0} color="text-red-600" />
            <MethodRow label="Boleto" value={overview?.vendasPagasMes.porMetodo.boleto ?? 0} color="text-slate-600" />
            <MethodRow label="Transferência" value={overview?.vendasPagasMes.porMetodo.transferencia ?? 0} color="text-purple-600" />
          </div>
        </Card>

        <Card title="Top 5 clientes">
          <div className="space-y-2">
            {overview?.topClientes?.length ? (
              overview.topClientes.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.nome}</p>
                    <p className="text-xs text-slate-500">{c.servicos} serviços</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(c.total)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Sem clientes suficientes ainda.</p>
            )}
          </div>
        </Card>

        <Card title="Sua empresa">
          <div className="space-y-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">{overview?.empresa.nome ?? 'Empresa'}</p>
            <p>Assinatura: {overview?.empresa.assinatura ?? 'Teste grátis'}</p>
            <p>
              Desde:{' '}
              {overview?.empresa.desde
                ? new Intl.DateTimeFormat('pt-BR').format(new Date(overview.empresa.desde))
                : '—'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agenda de hoje">
          <div className="space-y-2 text-sm text-slate-700">
            <p>Total: {todayAppointments.length}</p>
            <div className="grid grid-cols-2 gap-2">
              <Badge color="orange">Pendentes: {countStatus(todayAppointments, ['SCHEDULED', 'CONFIRMED'])}</Badge>
              <Badge color="green">Concluídos: {countStatus(todayAppointments, ['COMPLETED'])}</Badge>
              <Badge color="gray">Em andamento: {countStatus(todayAppointments, ['IN_PROGRESS'])}</Badge>
              <Badge color="gray">Cancelados: {countStatus(todayAppointments, ['CANCELED'])}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Pós-vendas de hoje">
          <div className="space-y-2 text-sm text-slate-700">
            <p>Pendentes: {overview?.posVendaHoje.pendentes ?? followUpsPending}</p>
            <p>Realizadas: {overview?.posVendaHoje.realizadas ?? followUpsDone}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Hero() {
  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-extrabold">Olá! Tudo pronto para mais um dia?</p>
          <p className="text-sm text-slate-600">Hoje é {todayStr}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Painel rápido</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <QuickAction label="Nova venda" to="/work-orders/new" />
        <QuickAction label="Novo agendamento" to="/appointments/new" />
        <QuickAction label="Novo orçamento" to="/budgets/new" />
        <QuickAction label="Preencher vaga" to="/spaces/fill" />
      </div>
    </div>
  );
}

function QuickAction({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-200"
    >
      {label}
    </Link>
  );
}

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number | string; color?: string }>;
}) {
  return (
    <Card title={title}>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
            <span className={`text-lg font-bold ${item.color ?? 'text-slate-700'}`}>{item.value}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinancialRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-slate-800'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function MethodRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${color ?? 'text-slate-800'}`}>{formatCurrency(value)}</span>
    </div>
  );
}

function countStatus(appts: Appointment[], statuses: string[]) {
  return appts.filter((a) => statuses.includes(a.status)).length;
}

function CalendarCard({
  appointments,
  todayAppointments,
  onSelectDay,
}: {
  appointments: Appointment[];
  todayAppointments: Appointment[];
  onSelectDay?: (isoDate: string) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDay = today.getDate();

  const apptsByDay = appointments.reduce<Record<number, number>>((acc, appt) => {
    const d = new Date(appt.startAt);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      acc[day] = (acc[day] ?? 0) + 1;
    }
    return acc;
  }, {});

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(today);
  const todayLabel =
    todayAppointments.length === 0
      ? 'Sem agendamentos hoje'
      : `${todayAppointments.length} agendamento(s) hoje`;

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-slate-800 capitalize">{monthLabel}</p>
          <p className="text-xs text-slate-500">{todayLabel}</p>
        </div>
        <span className="text-amber-500 text-lg">📅</span>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isToday = day === todayDay;
          const hasAppt = apptsByDay[day] > 0;
          const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <div
              key={day}
              className={`flex h-12 flex-col items-center justify-center rounded-lg border text-sm transition ${
                isToday
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              } ${hasAppt ? 'ring-1 ring-emerald-200' : ''} ${onSelectDay ? 'cursor-pointer hover:border-primary/50' : ''}`}
              onClick={() => onSelectDay?.(isoDate)}
            >
              <span>{day}</span>
              {hasAppt && <span className="text-[10px] text-emerald-600 font-semibold">●</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
