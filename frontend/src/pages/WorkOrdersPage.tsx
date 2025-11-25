import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WorkOrder } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

type WorkOrdersResponse = { data: WorkOrder[]; meta: { total: number } };

export function WorkOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrdersResponse>('/work-orders');
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Ordens de Serviço</h1>
      {isLoading && <p className="text-slate-600">Carregando OS...</p>}
      <div className="space-y-3">
        {data?.data.map((order) => (
          <Card key={order.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-800">
                  #{order.sequential} • {order.client?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {order.vehicle?.plate} {order.vehicle?.model} —{' '}
                  {new Date(order.openedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge color={order.status === 'COMPLETED' ? 'green' : 'orange'}>{order.status}</Badge>
            </div>
            <p className="text-sm text-slate-700">
              Itens: {order.items.map((i) => i.service.name).join(', ') || 'Sem itens'}
            </p>
            <p className="text-sm font-semibold text-primary">
              Total líquido: R$ {order.totalNet?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        ))}
        {data?.data?.length === 0 && !isLoading && (
          <Card>
            <p className="text-sm text-slate-500">Nenhuma OS cadastrada.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
