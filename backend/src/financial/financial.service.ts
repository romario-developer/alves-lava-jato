import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { FinancialStatus, PayableCategory, Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

type PeriodFilter = { start?: string; end?: string };

@Injectable()
export class FinancialService {
  constructor(private readonly prisma: PrismaService) {}

  // Contas a pagar
  async listPayables(companyId: string, pagination: PaginationDto, period?: PeriodFilter, status?: FinancialStatus) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const where: Prisma.AccountPayableWhereInput = {
      companyId,
      ...(status && { status }),
      ...(period?.start && period.end && { dueDate: { gte: new Date(period.start), lte: new Date(period.end) } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.accountPayable.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.accountPayable.count({ where }),
    ]);

    return { data, meta: { page, perPage, total } };
  }

  createPayable(companyId: string, dto: CreatePayableDto) {
    return this.prisma.accountPayable.create({
      data: {
        companyId,
        description: dto.descricao,
        category: dto.categoria ?? PayableCategory.FIXED,
        expected: dto.valorPrevisto,
        paid: dto.valorPago,
        dueDate: new Date(dto.dataVencimento),
        paidDate: dto.dataPagamento ? new Date(dto.dataPagamento) : undefined,
        supplier: dto.fornecedor,
        status: this.computePayableStatus(dto),
      },
    });
  }

  async updatePayable(companyId: string, id: string, dto: UpdatePayableDto) {
    const payable = await this.ensurePayable(companyId, id);
    return this.prisma.accountPayable.update({
      where: { id },
      data: {
        description: dto.descricao ?? payable.description,
        category: dto.categoria ?? payable.category,
        expected: dto.valorPrevisto ?? payable.expected,
        paid: dto.valorPago ?? payable.paid,
        dueDate: dto.dataVencimento ? new Date(dto.dataVencimento) : payable.dueDate,
        paidDate: dto.dataPagamento ? new Date(dto.dataPagamento) : payable.paidDate,
        supplier: dto.fornecedor ?? payable.supplier,
        status: dto.status ?? this.computePayableStatus({ ...dto, valorPago: Number(dto.valorPago ?? payable.paid ?? 0) }),
      },
    });
  }

  // Contas a receber
  async listReceivables(
    companyId: string,
    pagination: PaginationDto,
    period?: PeriodFilter,
    status?: FinancialStatus,
  ) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const where: Prisma.AccountReceivableWhereInput = {
      companyId,
      ...(status && { status }),
      ...(period?.start &&
        period.end && {
          expectedDate: { gte: new Date(period.start), lte: new Date(period.end) },
        }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.accountReceivable.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { expectedDate: 'asc' },
        include: {
          client: { select: { id: true, name: true } },
          workOrder: { select: { id: true, sequential: true } },
        },
      }),
      this.prisma.accountReceivable.count({ where }),
    ]);

    return { data, meta: { page, perPage, total } };
  }

  createReceivable(companyId: string, dto: CreateReceivableDto) {
    return this.prisma.accountReceivable.create({
      data: {
        companyId,
        clientId: dto.clienteId,
        workOrderId: dto.osId,
        expected: dto.valorPrevisto,
        expectedDate: new Date(dto.dataPrevista),
        received: dto.valorRecebido,
        receivedDate: dto.dataRecebimento ? new Date(dto.dataRecebimento) : undefined,
        status: this.computeReceivableStatus(dto),
      },
      include: { client: true, workOrder: true },
    });
  }

  async updateReceivable(companyId: string, id: string, dto: UpdateReceivableDto) {
    const receivable = await this.ensureReceivable(companyId, id);
    return this.prisma.accountReceivable.update({
      where: { id },
      data: {
        expected: dto.valorPrevisto ?? receivable.expected,
        expectedDate: dto.dataPrevista ? new Date(dto.dataPrevista) : receivable.expectedDate,
        received: dto.valorRecebido ?? receivable.received,
        receivedDate: dto.dataRecebimento ? new Date(dto.dataRecebimento) : receivable.receivedDate,
        status:
          dto.status ??
          this.computeReceivableStatus({
            ...dto,
            valorRecebido: Number(dto.valorRecebido ?? receivable.received ?? 0),
          }),
        clientId: dto.clienteId ?? receivable.clientId,
      },
      include: { client: true, workOrder: true },
    });
  }

  async cashflow(companyId: string, period?: PeriodFilter) {
    const dateFilter =
      period?.start && period.end
        ? { gte: new Date(period.start), lte: new Date(period.end) }
        : undefined;

    const [payments, payables, receivables] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({
        where: { companyId, ...(dateFilter && { paidAt: dateFilter }) },
        _sum: { amount: true },
      }),
      this.prisma.accountPayable.aggregate({
        where: { companyId, ...(dateFilter && { dueDate: dateFilter }) },
        _sum: { expected: true, paid: true },
      }),
      this.prisma.accountReceivable.aggregate({
        where: { companyId, ...(dateFilter && { expectedDate: dateFilter }) },
        _sum: { expected: true, received: true },
      }),
    ]);

    const entradas = Number(payments._sum.amount ?? 0) + Number(receivables._sum.received ?? 0);
    const saidas = Number(payables._sum.paid ?? 0);
    const previstoEntradas = Number(receivables._sum.expected ?? 0);
    const previstoSaidas = Number(payables._sum.expected ?? 0);

    return {
      periodo: dateFilter ? period : 'completo',
      entradasRecebidas: entradas,
      saidasPagas: saidas,
      saldo: entradas - saidas,
      entradasPrevistas: previstoEntradas,
      saidasPrevistas: previstoSaidas,
      saldoPrevisto: previstoEntradas - previstoSaidas,
    };
  }

  // Helpers
  private async ensurePayable(companyId: string, id: string) {
    const payable = await this.prisma.accountPayable.findFirst({ where: { id, companyId } });
    if (!payable) throw new NotFoundException('Conta a pagar não encontrada');
    return payable;
  }

  private async ensureReceivable(companyId: string, id: string) {
    const receivable = await this.prisma.accountReceivable.findFirst({ where: { id, companyId } });
    if (!receivable) throw new NotFoundException('Conta a receber não encontrada');
    return receivable;
  }

  private computePayableStatus(dto: Partial<CreatePayableDto>) {
    if (dto.valorPago && dto.valorPago > 0) return FinancialStatus.PAID;
    return FinancialStatus.PENDING;
  }

  private computeReceivableStatus(dto: Partial<CreateReceivableDto | UpdateReceivableDto>) {
    if (dto.valorRecebido && dto.valorRecebido > 0) return FinancialStatus.RECEIVED;
    return FinancialStatus.PENDING;
  }
}
