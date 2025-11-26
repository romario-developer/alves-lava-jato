import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { OpenOccupationDto } from './dto/open-occupation.dto';
import { CloseOccupationDto } from './dto/close-occupation.dto';
import { SpaceOccupationStatus } from '@prisma/client';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  createSpace(companyId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        companyId,
        name: dto.nome,
        type: dto.tipo,
        status: dto.status ?? 'AVAILABLE',
      },
    });
  }

  listSpaces(companyId: string) {
    return this.prisma.space.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async updateSpace(companyId: string, id: string, dto: UpdateSpaceDto) {
    await this.ensureSpace(companyId, id);
    return this.prisma.space.update({
      where: { id },
      data: {
        name: dto.nome,
        type: dto.tipo,
        status: dto.status,
      },
    });
  }

  async deleteSpace(companyId: string, id: string) {
    await this.ensureSpace(companyId, id);
    return this.prisma.space.delete({ where: { id } });
  }

  async openOccupation(companyId: string, dto: OpenOccupationDto) {
    await this.ensureSpace(companyId, dto.spaceId);
    return this.prisma.spaceOccupation.create({
      data: {
        companyId,
        spaceId: dto.spaceId,
        workOrderId: dto.workOrderId,
        appointmentId: dto.appointmentId,
        expectedEndAt: dto.expectedEndAt ? new Date(dto.expectedEndAt) : undefined,
        status: SpaceOccupationStatus.IN_PROGRESS,
      },
    });
  }

  async closeOccupation(companyId: string, id: string, dto: CloseOccupationDto) {
    const occ = await this.prisma.spaceOccupation.findFirst({ where: { id, companyId } });
    if (!occ) throw new NotFoundException('Ocupação não encontrada');
    return this.prisma.spaceOccupation.update({
      where: { id },
      data: {
        status: SpaceOccupationStatus.COMPLETED,
        endedAt: dto.endedAt ? new Date(dto.endedAt) : new Date(),
      },
    });
  }

  async summaryToday(companyId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [spaces, occupations] = await this.prisma.$transaction([
      this.prisma.space.count({ where: { companyId } }),
      this.prisma.spaceOccupation.findMany({
        where: { companyId, startedAt: { gte: start, lte: end } },
      }),
    ]);

    const ocupadas = occupations.filter((o) => o.status === SpaceOccupationStatus.IN_PROGRESS).length;
    const concluidas = occupations.filter((o) => o.status === SpaceOccupationStatus.COMPLETED).length;

    return {
      totalVagas: spaces,
      ocupadas,
      concluidas,
    };
  }

  async listOccupationsToday(companyId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.spaceOccupation.findMany({
      where: { companyId, startedAt: { gte: start, lte: end } },
      orderBy: { startedAt: 'asc' },
      include: {
        space: { select: { id: true, name: true, type: true } },
        workOrder: {
          select: {
            id: true,
            sequential: true,
            status: true,
            client: { select: { id: true, name: true } },
          },
        },
        appointment: {
          select: {
            id: true,
            startAt: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  private async ensureSpace(companyId: string, id: string) {
    const space = await this.prisma.space.findFirst({ where: { id, companyId } });
    if (!space) throw new NotFoundException('Vaga/box não encontrado');
    return space;
  }
}
