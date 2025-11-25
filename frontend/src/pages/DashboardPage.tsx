import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Appointment, WorkOrder } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

type WorkOrdersResponse = { data: WorkOrder[]; meta: { total: number } };

export function DashboardPage() {
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
    <div className="space-y-6">
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
  );
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}
