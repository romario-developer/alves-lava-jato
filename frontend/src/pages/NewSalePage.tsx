import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { fetchClientsOptions, createQuickClient } from '../lib/clients';
import { fetchServicesOptions } from '../lib/services';
import { createWorkOrder } from '../lib/workOrders';
import { formatCurrency } from '../utils/format';
import { maskMoneyInput, moneyToNumber } from '../utils/money';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils/errors';

type ServiceItem = { serviceId: string; serviceName: string; quantidade: number; precoUnitario: number; desconto?: string };

export function NewSalePage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clientId, setClientId] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [openSale, setOpenSale] = useState(false);
  const [quickClient, setQuickClient] = useState({ nome: '', whatsapp: '' });

  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => fetchClientsOptions() });
  const {
    data: services,
    isLoading: loadingServices,
    error: servicesError,
  } = useQuery({ queryKey: ['services-options'], queryFn: () => fetchServicesOptions() });

  const addItem = (serviceId: string) => {
    const service = services?.find((s) => s.id === serviceId);
    if (!service) return;
    setItems((prev) => [
      ...prev,
      {
        serviceId,
        serviceName: service.name,
        quantidade: 1,
        precoUnitario: Number(service.basePrice ?? 0),
        desconto: '',
      },
    ]);
  };

  const totalGross = items.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0);
  const discountValueNum = moneyToNumber(discountValue);
  const discountPercentNum = moneyToNumber(discountPercent);
  const discountFromPercent = (discountPercentNum / 100) * totalGross;
  const totalDiscount =
    discountValueNum + discountFromPercent + items.reduce((sum, i) => sum + moneyToNumber(i.desconto || ''), 0);
  const totalNet = totalGross - totalDiscount;

  const createClientMutation = useMutation({
    mutationFn: () => createQuickClient({ nomeCompleto: quickClient.nome, whatsapp: quickClient.whatsapp }),
    onSuccess: (data) => {
      setClientId(data.id);
      queryClient.invalidateQueries({ queryKey: ['clients-options'] });
      toast.show('Cliente criado com sucesso', 'success');
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao criar cliente'), 'error'),
  });

  const createSaleMutation = useMutation({
    mutationFn: () =>
      createWorkOrder({
        clienteId: clientId,
        itens: items.map((i) => ({
          servicoId: i.serviceId,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          desconto: moneyToNumber(i.desconto || ''),
        })),
        status: openSale ? 'OPEN' : 'IN_PROGRESS',
        formaRecebimento: openSale ? 'Aberto' : 'A vista',
        dataAbertura: date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.show('Venda cadastrada!', 'success');
    },
    onError: (err: any) => {
      toast.show(getErrorMessage(err, 'Erro ao salvar venda. Confira cliente e servicos.'), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.show('Selecione ou crie um cliente.', 'error');
      return;
    }
    if (items.length === 0) {
      toast.show('Adicione pelo menos um servico.', 'error');
      return;
    }
    createSaleMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Cadastrar venda</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3">
            <Input label="Data da venda" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

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
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Selecionar cliente</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Servicos</p>
              {loadingServices && <p className="text-xs text-slate-500">Carregando servicos...</p>}
              {servicesError && <p className="text-xs text-red-600">Erro ao carregar servicos. Atualize.</p>}
              {services && services.length === 0 && (
                <p className="text-xs text-slate-500">Cadastre um servico na aba Servicos para adicionar aqui.</p>
              )}
              {services && services.length > 0 && (
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onChange={(e) => {
                    if (e.target.value) addItem(e.target.value);
                    e.target.value = '';
                  }}
                  required={items.length === 0}
                  disabled={!services || services.length === 0}
                >
                  <option value="">Adicionar servico</option>
                  {services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.basePrice)}
                    </option>
                  ))}
                </select>
              )}
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={`${item.serviceId}-${idx}`} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                    <span className="text-sm text-slate-700">
                      {item.serviceName} {formatCurrency(item.precoUnitario)}
                    </span>
                    <Input
                      type="number"
                      className="w-20"
                      value={item.quantidade}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, quantidade: Number(e.target.value) } : it)),
                        )
                      }
                    />
                    <Input
                      type="text"
                      className="w-28"
                      value={item.desconto || ''}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, desconto: maskMoneyInput(e.target.value, true) } : it)),
                        )
                      }
                      placeholder="Desconto R$"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Desconto (R$)"
                inputMode="decimal"
                value={discountValue}
                onChange={(e) => setDiscountValue(maskMoneyInput(e.target.value, true))}
                placeholder="0,00"
              />
              <Input
                label="Desconto (%)"
                inputMode="decimal"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(maskMoneyInput(e.target.value, true))}
                placeholder="0,00"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={openSale}
                onChange={(e) => setOpenSale(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Essa venda ficara em aberto?
            </label>
          </div>
        </Card>

        <Card title="Resumo dessa venda">
          <p className="text-sm text-slate-600">Veja o resumo antes de salvar</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Venda do dia {date}</p>
            <p>Sub-total: {formatCurrency(totalGross)}</p>
            <p>Descontos: {formatCurrency(totalDiscount)}</p>
            <p>Valor total: {formatCurrency(totalNet)}</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="submit" disabled={createSaleMutation.isPending}>
              {createSaleMutation.isPending ? 'Salvando...' : 'Adicionar venda'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
