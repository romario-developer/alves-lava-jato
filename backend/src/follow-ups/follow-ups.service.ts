import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FollowUpStatus, Prisma } from '@prisma/client';
import { UpdateFollowUpStatusDto } from './dto/update-followup-status.dto';

@Injectable()
export class FollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, params: { start?: string; end?: string; status?: FollowUpStatus }) {
    const where: Prisma.FollowUpWhereInput = {
      companyId,
      ...(params.status && { status: params.status }),
      ...(params.start &&
        params.end && {
          contactAt: { gte: new Date(params.start), lte: new Date(params.end) },
        }),
    };

    return this.prisma.followUp.findMany({
      where,
      orderBy: { contactAt: 'asc' },
      include: {
        client: { select: { id: true, name: true, whatsapp: true } },
        workOrder: { select: { id: true, sequential: true } },
        service: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(companyId: string, id: string, dto: UpdateFollowUpStatusDto) {
    const follow = await this.prisma.followUp.findFirst({ where: { id, companyId } });
    if (!follow) {
      throw new NotFoundException('Follow-up não encontrado');
    }

    return this.prisma.followUp.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
