import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { fetchClientsOptions, createQuickClient } from '../lib/clients';
import { fetchServicesOptions } from '../lib/services';
import { createAppointment } from '../lib/appointments';
import { formatCurrency } from '../utils/format';
import { useSearchParams } from 'react-router-dom';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils/errors';
import { maskMoneyInput, moneyToNumber } from '../utils/money';

export function NewAppointmentPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const toast = useToastStore();
  const defaultDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('10:00');
  const [clientId, setClientId] = useState('');
  const [servicesSelected, setServicesSelected] = useState<{ id: string; name: string }[]>([]);
  const [discountValue, setDiscountValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [quickClient, setQuickClient] = useState({ nome: '', whatsapp: '' });

  const { data: clients } = useQuery({ queryKey: ['clients-options'], queryFn: () => fetchClientsOptions() });
  const {
    data: services,
    isLoading: loadingServices,
    error: servicesError,
  } = useQuery({ queryKey: ['services-options'], queryFn: () => fetchServicesOptions() });

  const totalGross = servicesSelected.reduce((sum, srv) => {
    const s = services?.find((sv) => sv.id === srv.id);
    return sum + Number(s?.basePrice ?? 0);
  }, 0);
  const discountValueNum = moneyToNumber(discountValue);
  const discountPercentNum = moneyToNumber(discountPercent);
  const discountFromPercent = (discountPercentNum / 100) * totalGross;
  const totalDiscount = discountValueNum + discountFromPercent;
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

  const createAppointmentMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        clienteId: clientId,
        servicoIds: servicesSelected.map((s) => s.id),
        dataHoraInicio: `${date}T${timeStart}:00Z`,
        dataHoraFim: `${date}T${timeEnd}:00Z`,
        observacoes: '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.show('Agendamento cadastrado!', 'success');
    },
    onError: (err: any) => toast.show(getErrorMessage(err, 'Erro ao salvar agendamento.'), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.show('Selecione um cliente para agendar.', 'error');
      return;
    }
    createAppointmentMutation.mutate();
  };

  useEffect(() => {
    if (searchParams.get('date')) {
      setDate(searchParams.get('date') as string);
    }
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Adicionar agendamento</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <Input
                label="Hora inicial"
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
              />
            </div>
            <Input label="Hora final" type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Cliente (obrigatorio)</p>
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
                    const chosen = services?.find((s) => s.id === e.target.value);
                    if (chosen && !servicesSelected.find((s) => s.id === chosen.id)) {
                      setServicesSelected((prev) => [...prev, { id: chosen.id, name: chosen.name }]);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">Adicionar servico</option>
                  {services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {formatCurrency(s.basePrice)}
                    </option>
                  ))}
                </select>
              )}
              <div className="space-y-1 text-sm text-slate-700">
                {servicesSelected.map((srv, idx) => (
                  <div
                    key={`${srv.id}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-2"
                  >
                    <span>{srv.name}</span>
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => setServicesSelected((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remover
                    </button>
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
          </div>
        </Card>

        <Card title="Resumo do agendamento">
          <p className="text-sm text-slate-600">Confira antes de salvar</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Data: {date}</p>
            <p>
              Horario: {timeStart} - {timeEnd}
            </p>
            <p>Servicos: {servicesSelected.length}</p>
            <p>Sub-total: {formatCurrency(totalGross)}</p>
            <p>Descontos: {formatCurrency(totalDiscount)}</p>
            <p>Total: {formatCurrency(totalNet)}</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="submit" disabled={createAppointmentMutation.isPending}>
              {createAppointmentMutation.isPending ? 'Salvando...' : 'Adicionar agendamento'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
