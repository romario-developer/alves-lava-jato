import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Client } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

type ClientsResponse = { data: Array<Client & { vehicles: Array<{ plate: string; model?: string }> }> };

export function ClientsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const { data } = await api.get<ClientsResponse>('/clients', {
        params: { search },
      });
      return data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Clientes</h1>
          <p className="text-sm text-slate-500">Busque por nome, placa ou telefone.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button intent="secondary" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-slate-600">Carregando clientes...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((client) => (
          <Card key={client.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-800">{client.name}</p>
                <p className="text-xs text-slate-500">
                  {client.whatsapp || client.phone || 'sem contato'} • {client.email || 'sem e-mail'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {client.tags?.map((tag) => (
                  <Badge key={tag} color="gray">
                    {tag}
                  </Badge>
                ))}
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/${client.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-secondary hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600">
              {client.vehicles?.length ? (
                client.vehicles.map((v) => (
                  <span key={v.plate} className="mr-2 inline-block rounded bg-slate-100 px-2 py-1">
                    {v.plate} {v.model}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Sem veículos cadastrados</span>
              )}
            </div>
          </Card>
        ))}
        {data?.length === 0 && !isLoading && (
          <Card>
            <p className="text-sm text-slate-500">Nenhum cliente encontrado para o filtro.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
