import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import type { WorkOrder } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils/errors';
import { Modal } from '../components/ui/Modal';

type WorkOrdersResponse = { data: WorkOrder[]; meta: { total: number } };

function statusLabel(status: string) {
  const map: Record<string, string> = {
    COMPLETED: 'Concluida',
    IN_PROGRESS: 'Em execucao',
    OPEN: 'Aberta',
    CANCELED: 'Cancelada',
    BUDGET: 'Orcamento',
  };
  return map[status] ?? status;
}

export function WorkOrdersPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrdersResponse>('/work-orders');
      return data;
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/work-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.show('Registro excluido', 'success');
      setConfirmId(null);
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao excluir OS'), 'error'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Ordens de Servico</h1>
      {isLoading && <p className="text-slate-600">Carregando OS...</p>}
      <div className="space-y-3">
        {data?.data.map((order) => (
          <Card key={order.id} className="flex flex-col gap-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <span className="text-red-600">#</span>
                  {order.sequential} • {order.client?.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(order.vehicle?.plate || 'Sem placa')} {order.vehicle?.model ? `- ${order.vehicle.model}` : ''} -{' '}
                  {new Date(order.openedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge color={order.status === 'COMPLETED' ? 'green' : order.status === 'BUDGET' ? 'orange' : 'gray'}>
                {statusLabel(order.status)}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Itens:{' '}
                {order.items.map((i) => i.service.name).join(', ') || 'Sem itens'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">
                Total liquido: R$ {order.totalNet?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {order.status !== 'COMPLETED' && (
                <Button size="sm" intent="ghost" onClick={() => setConfirmId(order.id)}>
                  Excluir OS
                </Button>
              )}
            </div>
          </Card>
        ))}
        {data?.data?.length === 0 && !isLoading && (
          <Card>
            <p className="text-sm text-slate-500">Nenhuma OS cadastrada.</p>
          </Card>
        )}
      </div>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Confirmar exclusao" size="sm">
        <p className="text-sm text-slate-700">Tem certeza que deseja excluir esta OS? Essa acao nao pode ser desfeita.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button intent="secondary" onClick={() => setConfirmId(null)}>
            Cancelar
          </Button>
          <Button
            intent="danger"
            onClick={() => confirmId && deleteOrderMutation.mutate(confirmId)}
            disabled={deleteOrderMutation.isPending}
          >
            {deleteOrderMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
