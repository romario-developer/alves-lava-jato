import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        companyId,
        name: dto.nome,
        description: dto.descricao,
        category: dto.categoria,
        estimatedMinutes: dto.duracaoEstimadaMin,
        basePrice: dto.precoBase,
        active: dto.ativo ?? true,
        followUpEnabled: dto.geraPosVenda ?? false,
        followUpDays: dto.diasFollowUp,
      },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, active?: boolean) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const search = pagination.search;

    const where = {
      companyId,
      ...(active !== undefined && { active }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { data, meta: { page, perPage, total } };
  }

  async findOne(companyId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, companyId } });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return service;
  }

  async update(companyId: string, id: string, dto: UpdateServiceDto) {
    await this.findOne(companyId, id);
    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.nome,
        description: dto.descricao,
        category: dto.categoria,
        estimatedMinutes: dto.duracaoEstimadaMin,
        basePrice: dto.precoBase,
        active: dto.ativo,
        followUpEnabled: dto.geraPosVenda,
        followUpDays: dto.diasFollowUp,
      },
    });
  }
}
