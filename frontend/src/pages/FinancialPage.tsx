import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  fetchCashflow,
  fetchPayables,
  fetchReceivables,
  createPayable,
  createReceivable,
  updatePayable,
  updateReceivable,
} from '../lib/financial';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/format';
import type { Payable, Receivable } from '../types';
import { fetchFollowUps, updateFollowUpStatus } from '../lib/followups';

export function FinancialPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ start: '', end: '', status: '' });
  const [payableModal, setPayableModal] = useState(false);
  const [receivableModal, setReceivableModal] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);

  const { data: cashflow, isLoading: loadingCashflow } = useQuery({
    queryKey: ['cashflow', filters.start, filters.end],
    queryFn: () => fetchCashflow({ start: filters.start || undefined, end: filters.end || undefined }),
  });

  const { data: payables, isLoading: loadingPayables } = useQuery({
    queryKey: ['payables', filters],
    queryFn: () => fetchPayables({
      perPage: 10,
      start: filters.start || undefined,
      end: filters.end || undefined,
      status: filters.status || undefined,
    }),
  });

  const { data: receivables, isLoading: loadingReceivables } = useQuery({
    queryKey: ['receivables', filters],
    queryFn: () => fetchReceivables({
      perPage: 10,
      start: filters.start || undefined,
      end: filters.end || undefined,
      status: filters.status || undefined,
    }),
  });

  const { data: followUps } = useQuery({
    queryKey: ['followups', filters.start, filters.end],
    queryFn: () => fetchFollowUps({
      start: filters.start || undefined,
      end: filters.end || undefined,
      status: 'PENDING',
    }),
  });

  const payableMutation = useMutation({
    mutationFn: (payload: any) => (editingPayable ? updatePayable(editingPayable.id, payload) : createPayable(payload)),
    onSuccess: () => {
      setPayableModal(false);
      setEditingPayable(null);
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });

  const receivableMutation = useMutation({
    mutationFn: (payload: any) =>
      editingReceivable ? updateReceivable(editingReceivable.id, payload) : createReceivable(payload),
    onSuccess: () => {
      setReceivableModal(false);
      setEditingReceivable(null);
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
    },
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateFollowUpStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followups'] }),
  });

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Financeiro</h1>
        <p className="text-sm text-slate-500">Visão rápida de fluxo de caixa, contas a pagar e a receber.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Saldo recebido"
          value={cashflow?.saldo ?? 0}
          loading={loadingCashflow}
          highlight
        />
        <SummaryCard
          title="Saldo previsto"
          value={cashflow?.saldoPrevisto ?? 0}
          loading={loadingCashflow}
          highlight
          muted
        />
        <SummaryCard
          title="Entradas previstas"
          value={cashflow?.entradasPrevistas ?? 0}
          loading={loadingCashflow}
        />
        <SummaryCard
          title="Saídas previstas"
          value={-(cashflow?.saidasPrevistas ?? 0)}
          loading={loadingCashflow}
        />
        <SummaryCard
          title="Entradas recebidas"
          value={cashflow?.entradasRecebidas ?? 0}
          loading={loadingCashflow}
        />
        <SummaryCard
          title="Saídas pagas"
          value={-(cashflow?.saidasPagas ?? 0)}
          loading={loadingCashflow}
        />
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Input
          label="Início"
          type="date"
          value={filters.start}
          onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
          className="w-44"
        />
        <Input
          label="Fim"
          type="date"
          value={filters.end}
          onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
          className="w-44"
        />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="RECEIVED">Recebido</option>
          </select>
        </label>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button intent="secondary" onClick={() => setPayableModal(true)}>
            + Conta a pagar
          </Button>
          <Button onClick={() => setReceivableModal(true)}>+ Conta a receber</Button>
        </div>
      </Card>

      <Card title="Alertas de Pós-venda (pendentes)">
        <div className="space-y-2">
          {followUps?.length ? (
            followUps.map((f) => (
              <div key={f.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {f.client.name} • Serviço: {f.service?.name ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Contato em: {formatDate(f.contactAt)} • OS #{f.workOrder.sequential}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => followUpMutation.mutate({ id: f.id, status: 'DONE' })}
                  >
                    Concluído
                  </Button>
                  <Button size="sm" intent="ghost" onClick={() => followUpMutation.mutate({ id: f.id, status: 'NO_RESPONSE' })}>
                    Não respondeu
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhum follow-up pendente no período.</p>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Contas a receber (10 mais próximas)">
          {loadingReceivables && <p className="text-sm text-slate-500">Carregando...</p>}
          <div className="space-y-3">
            {receivables?.data?.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.client?.name ?? 'Cliente não informado'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Vencimento: {formatDate(item.expectedDate)} • OS #{item.workOrder?.sequential ?? '-'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge color={item.status === 'RECEIVED' ? 'green' : 'orange'}>{item.status}</Badge>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(item.received ?? item.expected)}
                  </p>
                  <div className="mt-1 flex gap-2 justify-end">
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => {
                        setEditingReceivable(item);
                        setReceivableModal(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {receivables?.data?.length === 0 && !loadingReceivables && (
              <p className="text-sm text-slate-500">Nenhuma conta a receber cadastrada.</p>
            )}
          </div>
        </Card>

        <Card title="Contas a pagar (10 mais próximas)">
          {loadingPayables && <p className="text-sm text-slate-500">Carregando...</p>}
          <div className="space-y-3">
            {payables?.data?.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    Vencimento: {formatDate(item.dueDate)} • {item.supplier ?? 'Fornecedor não informado'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge color={item.status === 'PAID' ? 'green' : 'orange'}>{item.status}</Badge>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(item.paid ?? item.expected)}
                  </p>
                  <div className="mt-1 flex gap-2 justify-end">
                    <Button
                      size="sm"
                      intent="ghost"
                      onClick={() => {
                        setEditingPayable(item);
                        setPayableModal(true);
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {payables?.data?.length === 0 && !loadingPayables && (
              <p className="text-sm text-slate-500">Nenhuma conta a pagar cadastrada.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
    <PayableModal
      open={payableModal}
      onClose={() => {
        setPayableModal(false);
        setEditingPayable(null);
      }}
      loading={payableMutation.isPending}
      initial={editingPayable ?? undefined}
      onSubmit={(payload) => payableMutation.mutate(payload)}
    />
    <ReceivableModal
      open={receivableModal}
      onClose={() => {
        setReceivableModal(false);
        setEditingReceivable(null);
      }}
      loading={receivableMutation.isPending}
      initial={editingReceivable ?? undefined}
      onSubmit={(payload) => receivableMutation.mutate(payload)}
    />
    </>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  highlight,
  muted,
}: {
  title: string;
  value: number;
  loading?: boolean;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <Card className={muted ? 'bg-slate-50' : highlight ? 'bg-white' : 'bg-white'}>
      <p className="text-sm text-slate-500">{title}</p>
      {loading ? (
        <p className="mt-2 text-lg text-slate-400">Carregando...</p>
      ) : (
        <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(value)}</p>
      )}
    </Card>
  );
}

type PayableForm = {
  descricao: string;
  categoria?: string;
  valorPrevisto: number;
  dataVencimento: string;
  valorPago?: number;
  dataPagamento?: string;
  fornecedor?: string;
  status?: string;
};

function PayableModal({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PayableForm) => void;
  initial?: Payable;
  loading?: boolean;
}) {
  const [form, setForm] = useState<PayableForm>(() => ({
    descricao: initial?.description ?? '',
    categoria: initial?.category ?? 'FIXED',
    valorPrevisto: initial?.expected ?? 0,
    dataVencimento: initial?.dueDate?.slice(0, 10) ?? '',
    valorPago: initial?.paid ?? undefined,
    dataPagamento: initial?.paidDate?.slice(0, 10) ?? '',
    fornecedor: initial?.supplier ?? '',
    status: initial?.status ?? undefined,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PayableForm = {
      ...form,
      valorPrevisto: Number(form.valorPrevisto),
      valorPago: form.valorPago ? Number(form.valorPago) : undefined,
      dataPagamento: form.dataPagamento || undefined,
      fornecedor: form.fornecedor || undefined,
      status: form.status || undefined,
    };
    onSubmit(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar conta a pagar' : 'Nova conta a pagar'}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          label="Descrição"
          required
          value={form.descricao}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor previsto"
            type="number"
            required
            value={form.valorPrevisto}
            onChange={(e) => setForm((f) => ({ ...f, valorPrevisto: Number(e.target.value) }))}
          />
          <Input
            label="Data de vencimento"
            type="date"
            required
            value={form.dataVencimento}
            onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor pago"
            type="number"
            value={form.valorPago ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, valorPago: e.target.value ? Number(e.target.value) : undefined }))}
          />
          <Input
            label="Data de pagamento"
            type="date"
            value={form.dataPagamento ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, dataPagamento: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Categoria</span>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            >
              <option value="FIXED">Fixa</option>
              <option value="VARIABLE">Variável</option>
            </select>
          </label>
          <Input
            label="Fornecedor"
            value={form.fornecedor ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, fornecedor: e.target.value }))}
          />
        </div>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={form.status ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value || undefined }))}
          >
            <option value="">Auto (por pagamento)</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type ReceivableForm = {
  valorPrevisto: number;
  dataPrevista: string;
  valorRecebido?: number;
  dataRecebimento?: string;
  clienteId?: string;
  osId?: string;
  status?: string;
};

function ReceivableModal({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ReceivableForm) => void;
  initial?: Receivable;
  loading?: boolean;
}) {
  const [form, setForm] = useState<ReceivableForm>(() => ({
    valorPrevisto: initial?.expected ?? 0,
    dataPrevista: initial?.expectedDate?.slice(0, 10) ?? '',
    valorRecebido: initial?.received ?? undefined,
    dataRecebimento: initial?.receivedDate?.slice(0, 10) ?? '',
    clienteId: initial?.client?.id ?? '',
    osId: initial?.workOrder?.id ?? '',
    status: initial?.status ?? undefined,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ReceivableForm = {
      ...form,
      valorPrevisto: Number(form.valorPrevisto),
      valorRecebido: form.valorRecebido ? Number(form.valorRecebido) : undefined,
      dataRecebimento: form.dataRecebimento || undefined,
      clienteId: form.clienteId || undefined,
      osId: form.osId || undefined,
      status: form.status || undefined,
    };
    onSubmit(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar conta a receber' : 'Nova conta a receber'}>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor previsto"
            type="number"
            required
            value={form.valorPrevisto}
            onChange={(e) => setForm((f) => ({ ...f, valorPrevisto: Number(e.target.value) }))}
          />
          <Input
            label="Data prevista"
            type="date"
            required
            value={form.dataPrevista}
            onChange={(e) => setForm((f) => ({ ...f, dataPrevista: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor recebido"
            type="number"
            value={form.valorRecebido ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, valorRecebido: e.target.value ? Number(e.target.value) : undefined }))
            }
          />
          <Input
            label="Data de recebimento"
            type="date"
            value={form.dataRecebimento ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, dataRecebimento: e.target.value }))}
          />
        </div>
        <Input
          label="Cliente (opcional - id)"
          value={form.clienteId ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}
        />
        <Input
          label="OS (opcional - id)"
          value={form.osId ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, osId: e.target.value }))}
        />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={form.status ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value || undefined }))}
          >
            <option value="">Auto (por recebimento)</option>
            <option value="PENDING">Pendente</option>
            <option value="RECEIVED">Recebido</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
