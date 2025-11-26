import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { fetchSpaces, fetchSpaceSummary, fetchSpaceOccupationsToday, closeOccupation } from '../lib/spaces';
import { formatDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function SpacesPage() {
  const queryClient = useQueryClient();
  const { data: spaces, isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
  });

  const { data: summary } = useQuery({
    queryKey: ['spaces-summary'],
    queryFn: fetchSpaceSummary,
  });

  const { data: occupations } = useQuery({
    queryKey: ['spaces-occupations-today'],
    queryFn: fetchSpaceOccupationsToday,
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeOccupation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces-occupations-today'] });
      queryClient.invalidateQueries({ queryKey: ['spaces-summary'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Vagas / Espaço</h1>
          <p className="text-sm text-slate-500">Controle rápido de boxes ocupados e concluídos.</p>
        </div>
        {summary && (
          <Badge color="gray">
            {summary.ocupadas} ocupadas / {summary.totalVagas} vagas
          </Badge>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-slate-500">Carregando vagas...</p>}
        {spaces?.map((space) => (
          <Card key={space.id} title={space.name}>
            <p className="text-sm text-slate-600">Tipo: {space.type || 'Geral'}</p>
            <p className="text-sm text-slate-600">Status: {space.status || 'Disponível'}</p>
          </Card>
        ))}
        {spaces?.length === 0 && !isLoading && <p className="text-sm text-slate-500">Nenhuma vaga cadastrada.</p>}
      </div>

      <Card title="Ocupações de hoje">
        <div className="space-y-2">
          {occupations?.map((occ) => (
            <div key={occ.id} className="flex flex-col rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="font-semibold">{occ.space.name}</span>
                <Badge color={occ.status === 'IN_PROGRESS' ? 'orange' : 'green'}>{occ.status}</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Início: {formatDate(occ.startedAt)} | Prev. saída: {occ.expectedEndAt ? formatDate(occ.expectedEndAt) : '—'}
              </p>
              {occ.workOrder && (
                <p className="text-xs text-slate-600">
                  OS #{occ.workOrder.sequential} • {occ.workOrder.client?.name ?? 'Sem cliente'}
                </p>
              )}
              {occ.appointment && (
                <p className="text-xs text-slate-600">
                  Agendamento: {formatDate(occ.appointment.startAt)} • {occ.appointment.client?.name ?? 'Cliente'}
                </p>
              )}
              {occ.status === 'IN_PROGRESS' && (
                <div className="mt-2 flex justify-end">
                  <Button size="sm" intent="secondary" onClick={() => closeMutation.mutate(occ.id)}>
                    Concluir vaga
                  </Button>
                </div>
              )}
            </div>
          ))}
          {occupations?.length === 0 && <p className="text-sm text-slate-500">Nenhuma ocupação hoje.</p>}
        </div>
      </Card>
    </div>
  );
}
