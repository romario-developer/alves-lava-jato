import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { WorkOrderStatus } from '@prisma/client';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateWorkOrderDto, responsibleId?: string) {
    await this.ensureClient(companyId, dto.clienteId);
    if (dto.veiculoId) {
      await this.ensureVehicle(companyId, dto.veiculoId);
    }

    const serviceIds = dto.itens.map((i) => i.servicoId);
    const countServices = await this.prisma.service.count({
      where: { id: { in: serviceIds }, companyId },
    });
    if (countServices !== serviceIds.length) {
      throw new NotFoundException('Algum servico nao pertence a empresa');
    }

    const sequential = await this.nextSequential(companyId);
    const totals = this.calculateTotals(dto);

    return this.prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          companyId,
          sequential,
          clientId: dto.clienteId,
          vehicleId: dto.veiculoId,
          status: dto.status ?? WorkOrderStatus.BUDGET,
          totalGross: totals.totalGross,
          discountTotal: totals.discountTotal,
          totalNet: totals.totalNet,
          paymentTerm: dto.formaRecebimento,
          openedAt: dto.dataAbertura ? new Date(dto.dataAbertura) : undefined,
          responsibleId,
          items: {
            create: dto.itens.map((item) => ({
              serviceId: item.servicoId,
              quantity: item.quantidade,
              unitPrice: item.precoUnitario,
              discount: item.desconto ?? 0,
              total: item.quantidade * item.precoUnitario - (item.desconto ?? 0),
            })),
          },
          payments: dto.pagamentos
            ? {
                create: dto.pagamentos.map((p) => ({
                  companyId,
                  method: p.metodo,
                  amount: p.valor,
                  paidAt: p.dataPagamento ? new Date(p.dataPagamento) : new Date(),
                  installmentNumber: p.numeroParcela,
                  totalInstallments: p.totalParcelas,
                })),
              }
            : undefined,
        },
        include: {
          items: { include: { service: true } },
          payments: true,
          client: true,
          vehicle: true,
        },
      });

      return workOrder;
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, status?: WorkOrderStatus) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const search = pagination.search;

    const where: any = { companyId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { sequential: Number(search) || undefined },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.workOrder.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { openedAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, whatsapp: true } },
          vehicle: { select: { id: true, plate: true, model: true, brand: true } },
          items: { include: { service: true } },
          payments: true,
        },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return { data, meta: { page, perPage, total } };
  }

  async findOne(companyId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        vehicle: true,
        items: { include: { service: true } },
        payments: true,
        followUps: true,
      },
    });
    if (!workOrder) throw new NotFoundException('OS nao encontrada');
    return workOrder;
  }

  async delete(companyId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, companyId },
    });
    if (!workOrder) throw new NotFoundException('OS nao encontrada');
    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      throw new ForbiddenException('Nao e possivel excluir uma OS concluida');
    }
    await this.prisma.workOrder.delete({ where: { id } });
    return { deleted: true };
  }

  async updateStatus(companyId: string, id: string, dto: UpdateWorkOrderStatusDto) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, companyId },
      include: { items: { include: { service: true } } },
    });
    if (!workOrder) throw new NotFoundException('OS nao encontrada');

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: dto.status,
        closedAt: dto.status === WorkOrderStatus.COMPLETED ? new Date() : workOrder.closedAt,
      },
    });

    if (dto.status === WorkOrderStatus.COMPLETED) {
      await this.createFollowUps(companyId, workOrder);
    }

    return updated;
  }

  async addPayment(companyId: string, id: string, dto: AddPaymentDto) {
    await this.ensureWorkOrder(companyId, id);
    return this.prisma.payment.create({
      data: {
        companyId,
        workOrderId: id,
        method: dto.metodo,
        amount: dto.valor,
        paidAt: dto.dataPagamento ? new Date(dto.dataPagamento) : new Date(),
        installmentNumber: dto.numeroParcela,
        totalInstallments: dto.totalParcelas,
      },
    });
  }

  private async ensureClient(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client) throw new NotFoundException('Cliente nao encontrado');
  }

  private async ensureVehicle(companyId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } });
    if (!vehicle) throw new NotFoundException('Veiculo nao encontrado');
  }

  private async ensureWorkOrder(companyId: string, id: string) {
    const workOrder = await this.prisma.workOrder.findFirst({ where: { id, companyId } });
    if (!workOrder) throw new NotFoundException('OS nao encontrada');
  }

  private async nextSequential(companyId: string) {
    const result = await this.prisma.workOrder.aggregate({
      where: { companyId },
      _max: { sequential: true },
    });
    return (result._max.sequential ?? 0) + 1;
  }

  private calculateTotals(dto: CreateWorkOrderDto) {
    const totalGross = dto.itens.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0);
    const discountTotal = dto.itens.reduce((sum, item) => sum + (item.desconto ?? 0), 0);
    const totalNet = totalGross - discountTotal;
    return { totalGross, discountTotal, totalNet };
  }

  private async createFollowUps(companyId: string, workOrder: any) {
    const followUpItems = workOrder.items
      .filter((item: any) => item.service.followUpEnabled && item.service.followUpDays)
      .map((item: any) => ({
        companyId,
        clientId: workOrder.clientId,
        workOrderId: workOrder.id,
        serviceId: item.serviceId,
        contactAt: new Date(Date.now() + item.service.followUpDays * 24 * 60 * 60 * 1000),
        status: 'PENDING' as const,
      }));

    if (followUpItems.length) {
      await this.prisma.followUp.createMany({ data: followUpItems });
    }
  }
}
