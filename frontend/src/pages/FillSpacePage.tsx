import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { fetchSpaces, fetchSpaceSummary, createSpace } from '../lib/spaces';
import { api } from '../lib/api';
import { formatCurrency } from '../utils/format';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils/errors';
import { fetchClientsOptions, createQuickClient } from '../lib/clients';
import { fetchServicesOptions } from '../lib/services';
import { fetchVehiclesByClient, createQuickVehicle } from '../lib/vehicles';
import { maskMoneyInput, moneyToNumber } from '../utils/money';

type ServiceItem = { serviceId: string; serviceName: string; preco: string; quantidade: number };

export function FillSpacePage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [spaceId, setSpaceId] = useState('');
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryTime, setEntryTime] = useState('09:00');
  const [exitDate, setExitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exitTime, setExitTime] = useState('11:00');
  const [newSpace, setNewSpace] = useState({ name: '', type: 'GERAL' });
  const [quickClient, setQuickClient] = useState({ nome: '', whatsapp: '' });
  const [quickVehicle, setQuickVehicle] = useState({ plate: '', brand: '', model: '', year: '' });
  const [items, setItems] = useState<ServiceItem[]>([]);

  const { data: spaces } = useQuery({ queryKey: ['spaces'], queryFn: fetchSpaces });
  const { data: summary } = useQuery({ queryKey: ['spaces-summary'], queryFn: fetchSpaceSummary });
  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => fetchClientsOptions() });
  const { data: services } = useQuery({ queryKey: ['services-options'], queryFn: () => fetchServicesOptions() });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-by-client', clientId],
    queryFn: () => fetchVehiclesByClient(clientId),
    enabled: !!clientId,
  });

  const totalGross = useMemo(
    () => items.reduce((sum, i) => sum + moneyToNumber(i.preco) * i.quantidade, 0),
    [items],
  );

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    if (!vehicleSearch) return vehicles;
    const term = vehicleSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plate?.toLowerCase().includes(term) ||
        v.brand?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term),
    );
  }, [vehicles, vehicleSearch]);

  const createSpaceMutation = useMutation({
    mutationFn: () => createSpace({ name: newSpace.name, type: newSpace.type }),
    onSuccess: () => {
      toast.show('Vaga criada!', 'success');
      setNewSpace({ name: '', type: 'GERAL' });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces-summary'] });
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao criar vaga'), 'error'),
  });

  const createClientMutation = useMutation({
    mutationFn: () => createQuickClient({ nomeCompleto: quickClient.nome, whatsapp: quickClient.whatsapp }),
    onSuccess: (data) => {
      setClientId(data.id);
      setVehicleId('');
      queryClient.invalidateQueries({ queryKey: ['clients-options'] });
      toast.show('Cliente criado com sucesso', 'success');
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao criar cliente'), 'error'),
  });

  const createVehicleMutation = useMutation({
    mutationFn: () =>
      createQuickVehicle(clientId, {
        plate: quickVehicle.plate,
        brand: quickVehicle.brand || undefined,
        model: quickVehicle.model || undefined,
        year: quickVehicle.year ? Number(quickVehicle.year) : undefined,
        type: 'CAR',
      }),
    onSuccess: (veh) => {
      setVehicleId(veh.id);
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-client', clientId] });
      toast.show('Veiculo criado', 'success');
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao criar veiculo'), 'error'),
  });

  const openOccMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/work-orders', {
        clienteId: clientId,
        veiculoId: vehicleId || undefined,
        status: 'IN_PROGRESS',
        dataAbertura: `${entryDate}T${entryTime}:00Z`,
        itens: items.map((i) => ({
          servicoId: i.serviceId,
          quantidade: i.quantidade,
          precoUnitario: moneyToNumber(i.preco),
        })),
      });
      const targetWorkOrderId = data.id;

      await api.post('/spaces/occupations', {
        spaceId,
        workOrderId: targetWorkOrderId,
        expectedEndAt: `${exitDate}T${exitTime}:00Z`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces-summary'] });
      toast.show('Vaga preenchida!', 'success');
      setItems([]);
      setClientId('');
      setVehicleId('');
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao preencher vaga'), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) {
      toast.show('Selecione uma vaga.', 'error');
      return;
    }
    if (!clientId) {
      toast.show('Selecione um cliente.', 'error');
      return;
    }
    if (!vehicleId) {
      toast.show('Selecione ou crie um veiculo.', 'error');
      return;
    }
    if (items.length === 0) {
      toast.show('Adicione pelo menos um servico.', 'error');
      return;
    }
    openOccMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Preencher vaga</h1>
      <p className="text-sm text-slate-600">Informe os dados para preencher a vaga.</p>

      {(!spaces || spaces.length === 0) && (
        <Card>
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Cadastrar vaga rapidamente</p>
            <Input
              label="Nome da vaga"
              placeholder="Ex: Box 1"
              value={newSpace.name}
              onChange={(e) => setNewSpace((p) => ({ ...p, name: e.target.value }))}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Tipo</p>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newSpace.type}
                onChange={(e) => setNewSpace((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="LAVAGEM">Lavagem</option>
                <option value="POLIMENTO">Polimento</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={() => newSpace.name && createSpaceMutation.mutate()}
              disabled={!newSpace.name || createSpaceMutation.isPending}
            >
              {createSpaceMutation.isPending ? 'Salvando...' : 'Adicionar vaga'}
            </Button>
            <p className="text-xs text-slate-500">Depois de criar, a vaga aparecerá na lista para selecionar.</p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Vaga</p>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                disabled={!spaces || spaces.length === 0}
              >
                <option value="">Selecionar vaga</option>
                {spaces?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type ?? 'Geral'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Cliente</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do cliente"
                  value={quickClient.nome}
                  onChange={(e) => setQuickClient((f) => ({ ...f, nome: e.target.value }))}
                />
                <Button
                  type="button"
                  intent="secondary"
                  onClick={() => quickClient.nome && createClientMutation.mutate()}
                  disabled={!quickClient.nome}
                >
                  Criar novo cliente
                </Button>
              </div>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setVehicleId('');
                }}
              >
                <option value="">Selecionar cliente</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {clientId && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">Veiculo</p>
                <Input
                  placeholder="Buscar por marca, modelo ou placa"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Placa"
                    value={quickVehicle.plate}
                    onChange={(e) => setQuickVehicle((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                  />
                  <Input
                    placeholder="Marca"
                    value={quickVehicle.brand}
                    onChange={(e) => setQuickVehicle((f) => ({ ...f, brand: e.target.value }))}
                  />
                  <Input
                    placeholder="Modelo"
                    value={quickVehicle.model}
                    onChange={(e) => setQuickVehicle((f) => ({ ...f, model: e.target.value }))}
                  />
                  <Input
                    placeholder="Ano"
                    value={quickVehicle.year}
                    onChange={(e) => setQuickVehicle((f) => ({ ...f, year: e.target.value }))}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    intent="secondary"
                    onClick={() => quickVehicle.plate && createVehicleMutation.mutate()}
                    disabled={!quickVehicle.plate}
                  >
                    Criar veiculo
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredVehicles?.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setVehicleId(v.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        vehicleId === v.id ? 'border-primary bg-primary/10' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="font-semibold">{v.plate}</div>
                      <div>{v.brand || 'Marca'} - {v.model || 'Modelo'}</div>
                      <div>{v.year || 'Ano'}</div>
                    </button>
                  ))}
                  {filteredVehicles && filteredVehicles.length === 0 && (
                    <p className="text-xs text-slate-500">Nenhum veiculo encontrado.</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Servicos</p>
              {services && services.length > 0 && (
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => {
                    const chosen = services.find((s) => s.id === e.target.value);
                    if (chosen) {
                      setItems((prev) => [
                        ...prev,
                        { serviceId: chosen.id, serviceName: chosen.name, preco: maskMoneyInput(String(chosen.basePrice || 0)), quantidade: 1 },
                      ]);
                    }
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">Adicionar servico</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.basePrice)}
                    </option>
                  ))}
                </select>
              )}
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={`${item.serviceId}-${idx}`}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:gap-3"
                  >
                    <div className="flex-1 text-sm text-slate-700">{item.serviceName}</div>
                    <Input
                      label="Preco"
                      inputMode="decimal"
                      value={item.preco}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, preco: maskMoneyInput(e.target.value, true) } : it)),
                        )
                      }
                      className="w-32"
                    />
                    <Input
                      label="Qtd"
                      type="number"
                      value={item.quantidade}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, quantidade: Number(e.target.value) || 1 } : it)),
                        )
                      }
                      className="w-20"
                    />
                    <Button intent="ghost" type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Dia entrada" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
              <Input label="Hora entrada" type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} required />
              <Input label="Dia saída" type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} required />
              <Input label="Hora saída" type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Campos opcionais</p>
              <div className="flex flex-wrap gap-2">
                {['Desconto', 'Observacoes', 'Tag', 'Pagamento', 'Produtos'].map((field) => (
                  <span
                    key={field}
                    className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    + {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Resumo da vaga">
          <div className="space-y-2 text-sm text-slate-700">
            <p>Vaga: {spaces?.find((s) => s.id === spaceId)?.name ?? '-'}</p>
            <p>Cliente: {clientId ? clients?.find((c) => c.id === clientId)?.name : '-'}</p>
            <p>
              Veiculo:{' '}
              {vehicleId
                ? vehicles?.find((v) => v.id === vehicleId)?.plate ||
                  `${vehicles?.find((v) => v.id === vehicleId)?.brand ?? ''} ${vehicles?.find((v) => v.id === vehicleId)?.model ?? ''}`
                : '-'}
            </p>
            <p>
              Entrada: {entryDate} {entryTime}
            </p>
            <p>
              Saída: {exitDate} {exitTime}
            </p>
            <p>Sub-total: {formatCurrency(totalGross)}</p>
            <p>Total em servicos: {formatCurrency(totalGross)}</p>
            <p>
              Ocupadas hoje: {summary?.ocupadas ?? 0} / {summary?.totalVagas ?? 0}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={openOccMutation.isPending || !spaces || spaces.length === 0}>
              {openOccMutation.isPending ? 'Salvando...' : 'Adicionar vaga'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
