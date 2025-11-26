import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, WorkOrderStatus, FinancialStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(companyId: string) {
    const today = new Date();
    const startDay = new Date(today);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(today);
    endDay.setHours(23, 59, 59, 999);

    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      paymentsMonth,
      paymentsToday,
      payablesToday,
      receivablesToday,
      budgetsMonth,
      occupationsToday,
      followUpsToday,
      topClients,
      company,
    ] = await this.prisma.$transaction([
      this.prisma.payment.groupBy({
        by: ['method'],
        where: { companyId, paidAt: { gte: startMonth, lte: endMonth } },
        orderBy: { method: 'asc' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { companyId, paidAt: { gte: startDay, lte: endDay } },
        _sum: { amount: true },
      }),
      this.prisma.accountPayable.aggregate({
        where: { companyId, dueDate: { gte: startDay, lte: endDay }, status: FinancialStatus.PAID },
        _sum: { paid: true },
      }),
      this.prisma.accountReceivable.aggregate({
        where: { companyId, expectedDate: { gte: startDay, lte: endDay }, status: FinancialStatus.RECEIVED },
        _sum: { received: true },
      }),
      this.prisma.workOrder.findMany({
        where: { companyId, openedAt: { gte: startMonth, lte: endMonth }, status: { in: [WorkOrderStatus.BUDGET, WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED] } },
        select: { status: true },
      }),
      this.prisma.spaceOccupation.findMany({
        where: { companyId, startedAt: { gte: startDay, lte: endDay } },
      }),
      this.prisma.followUp.findMany({
        where: { companyId, contactAt: { gte: startDay, lte: endDay } },
        select: { status: true },
      }),
      this.prisma.workOrder.groupBy({
        by: ['clientId'],
        where: { companyId, status: WorkOrderStatus.COMPLETED },
        orderBy: { _sum: { totalNet: 'desc' } },
        _sum: { totalNet: true },
        _count: { _all: true },
        take: 5,
      }),
      this.prisma.company.findUnique({ where: { id: companyId }, select: { nomeFantasia: true, createdAt: true } }),
    ]);

    const paymentMethods: Record<string, number> = {
      DEBIT: 0,
      CREDIT: 0,
      PIX: 0,
      CASH: 0,
      BOLETO: 0,
      TRANSFER: 0,
      OTHER: 0,
    };
    paymentsMonth.forEach((p) => {
      const sum = Number(p._sum?.amount ?? 0);
      if (p.method === PaymentMethod.DEBIT) paymentMethods.DEBIT += sum;
      if (p.method === PaymentMethod.CREDIT) paymentMethods.CREDIT += sum;
      if (p.method === PaymentMethod.PIX) paymentMethods.PIX += sum;
      if (p.method === PaymentMethod.CASH) paymentMethods.CASH += sum;
      if (p.method === PaymentMethod.BOLETO) paymentMethods.BOLETO += sum;
      if (p.method === PaymentMethod.OTHER) paymentMethods.OTHER += sum;
    });
    paymentMethods.TRANSFER = paymentMethods.OTHER;
    const vendasPagasMes = Object.values(paymentMethods).reduce((a, b) => a + b, 0);

    const orcamentosPendentes = budgetsMonth.filter((b) => b.status === WorkOrderStatus.BUDGET).length;
    const orcamentosAprovados = budgetsMonth.filter((b) => b.status === WorkOrderStatus.COMPLETED).length;

    const ocupadas = occupationsToday.filter((o) => o.status === 'IN_PROGRESS').length;
    const concluidas = occupationsToday.filter((o) => o.status === 'COMPLETED').length;

    const followPending = followUpsToday.filter((f) => f.status === 'PENDING').length;
    const followDone = followUpsToday.filter((f) => f.status === 'DONE').length;

    const topClientesDetalhe = await Promise.all(
      topClients.map(async (c) => {
        const client = await this.prisma.client.findUnique({ where: { id: c.clientId }, select: { name: true } });
        return {
          id: c.clientId,
          nome: client?.name ?? 'Cliente',
          total: Number(c._sum?.totalNet ?? 0),
          servicos: (c._count as any)?._all ?? 0,
        };
      }),
    );

    return {
      vendasPagasMes: {
        total: vendasPagasMes,
        porMetodo: {
          debito: paymentMethods.DEBIT,
          credito: paymentMethods.CREDIT,
          pix: paymentMethods.PIX,
          dinheiro: paymentMethods.CASH,
          boleto: paymentMethods.BOLETO,
          transferencia: paymentMethods.TRANSFER,
        },
      },
      financeiroHoje: {
        entradas: Number(paymentsToday._sum.amount ?? 0) + Number(receivablesToday._sum.received ?? 0),
        saidas: Number(payablesToday._sum.paid ?? 0),
        saldo: Number(paymentsToday._sum.amount ?? 0) + Number(receivablesToday._sum.received ?? 0) - Number(payablesToday._sum.paid ?? 0),
        faturasCartao: 0,
      },
      orcamentosMes: {
        pendentes: orcamentosPendentes,
        aprovados: orcamentosAprovados,
      },
      vagasHoje: {
        total: await this.prisma.space.count({ where: { companyId } }),
        ocupadas,
        concluidas,
      },
      posVendaHoje: {
        pendentes: followPending,
        realizadas: followDone,
      },
      topClientes: topClientesDetalhe,
      empresa: {
        nome: company?.nomeFantasia,
        assinatura: 'Teste grátis',
        desde: company?.createdAt,
      },
    };
  }
}
