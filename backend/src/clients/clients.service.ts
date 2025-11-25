import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        companyId,
        name: dto.nomeCompleto,
        whatsapp: dto.whatsapp,
        phone: dto.telefone,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        street: dto.rua,
        number: dto.numero,
        district: dto.bairro,
        city: dto.cidade,
        state: dto.uf,
        zip: dto.cep,
        notes: dto.observacoes,
        tags: dto.tags ?? [],
      },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const perPage = pagination.perPage ?? 20;
    const search = pagination.search;

    const where = {
      companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { whatsapp: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { vehicles: { some: { plate: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          { tags: { has: search } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          whatsapp: true,
          phone: true,
          email: true,
          tags: true,
          createdAt: true,
          vehicles: {
            select: { id: true, plate: true, brand: true, model: true, color: true },
            take: 2,
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total },
    };
  }

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
      include: {
        vehicles: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    await this.ensureClient(companyId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        name: dto.nomeCompleto,
        whatsapp: dto.whatsapp,
        phone: dto.telefone,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        street: dto.rua,
        number: dto.numero,
        district: dto.bairro,
        city: dto.cidade,
        state: dto.uf,
        zip: dto.cep,
        notes: dto.observacoes,
        tags: dto.tags,
      },
    });
  }

  async addVehicle(companyId: string, clientId: string, dto: CreateVehicleDto) {
    await this.ensureClient(companyId, clientId);
    return this.prisma.vehicle.create({
      data: {
        companyId,
        clientId,
        type: dto.tipo,
        plate: dto.placa,
        brand: dto.marca,
        model: dto.modelo,
        year: dto.ano,
        color: dto.cor,
        vin: dto.chassi,
        notes: dto.observacoes,
      },
    });
  }

  async updateVehicle(companyId: string, clientId: string, vehicleId: string, dto: UpdateVehicleDto) {
    await this.ensureClient(companyId, clientId);
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, companyId, clientId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        type: dto.tipo ?? vehicle.type,
        plate: dto.placa ?? vehicle.plate,
        brand: dto.marca ?? vehicle.brand,
        model: dto.modelo ?? vehicle.model,
        year: dto.ano ?? vehicle.year,
        color: dto.cor ?? vehicle.color,
        vin: dto.chassi ?? vehicle.vin,
        notes: dto.observacoes ?? vehicle.notes,
      },
    });
  }

  async listVehicles(companyId: string, clientId: string) {
    await this.ensureClient(companyId, clientId);
    return this.prisma.vehicle.findMany({
      where: { companyId, clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureClient(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }
}
