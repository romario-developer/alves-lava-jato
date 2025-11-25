import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

type Service = {
  id: string;
  name: string;
  category?: string;
  basePrice: number;
  estimatedMinutes?: number;
  active: boolean;
  followUpEnabled: boolean;
  followUpDays?: number;
};

type ServicesResponse = { data: Service[] };

export function ServicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get<ServicesResponse>('/services');
      return data.data;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Serviços</h1>
      {isLoading && <p className="text-slate-600">Carregando serviços...</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((service) => (
          <Card key={service.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-slate-800">{service.name}</p>
                <p className="text-xs text-slate-500">{service.category || 'Sem categoria'}</p>
              </div>
              <Badge color={service.active ? 'green' : 'gray'}>{service.active ? 'Ativo' : 'Inativo'}</Badge>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              <p>
                Valor base: R$ {service.basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Duração:{' '}
                {service.estimatedMinutes ?? 0} min
              </p>
              {service.followUpEnabled && (
                <p className="text-xs text-green-700">
                  Pós-venda habilitado em {service.followUpDays} dias após conclusão
                </p>
              )}
            </div>
          </Card>
        ))}
        {data?.length === 0 && !isLoading && (
          <Card>
            <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
