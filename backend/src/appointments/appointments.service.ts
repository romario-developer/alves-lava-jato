import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentOrigin, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAppointmentDto) {
    await this.ensureClient(companyId, dto.clienteId);
    if (dto.veiculoId) {
      await this.ensureVehicle(companyId, dto.veiculoId);
    }

    if (dto.servicoIds?.length) {
      const count = await this.prisma.service.count({
        where: { id: { in: dto.servicoIds }, companyId },
      });
      if (count !== dto.servicoIds.length) {
        throw new NotFoundException('Algum serviço não pertence à empresa');
      }
    }

    return this.prisma.appointment.create({
      data: {
        companyId,
        clientId: dto.clienteId,
        vehicleId: dto.veiculoId,
        startAt: new Date(dto.dataHoraInicio),
        endAt: new Date(dto.dataHoraFim),
        status: dto.status ?? AppointmentStatus.SCHEDULED,
        origin: dto.origem ?? AppointmentOrigin.MANUAL,
        notes: dto.observacoes,
        responsibleId: dto.responsavelId,
        services: {
          createMany: {
            data: dto.servicoIds?.map((id) => ({ serviceId: id })) ?? [],
          },
        },
      },
      include: {
        client: true,
        vehicle: true,
        services: { include: { service: true } },
      },
    });
  }

  async findAll(companyId: string, start?: string, end?: string) {
    const where: any = { companyId };
    if (start && end) {
      where.startAt = { gte: new Date(start) };
      where.endAt = { lte: new Date(end) };
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        client: { select: { id: true, name: true, whatsapp: true } },
        vehicle: { select: { id: true, plate: true, model: true, brand: true } },
        services: { include: { service: true } },
        workOrder: { select: { id: true, status: true } },
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, companyId } });
    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.servicoIds) {
        await tx.appointmentService.deleteMany({ where: { appointmentId: id } });
        if (dto.servicoIds.length) {
          await tx.appointmentService.createMany({
            data: dto.servicoIds.map((serviceId) => ({ appointmentId: id, serviceId })),
          });
        }
      }

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          startAt: dto.dataHoraInicio ? new Date(dto.dataHoraInicio) : appointment.startAt,
          endAt: dto.dataHoraFim ? new Date(dto.dataHoraFim) : appointment.endAt,
          status: dto.status ?? appointment.status,
          notes: dto.observacoes ?? appointment.notes,
        },
        include: {
          client: true,
          vehicle: true,
          services: { include: { service: true } },
        },
      });

      return updated;
    });
  }

  private async ensureClient(companyId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  private async ensureVehicle(companyId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }
  }
}
