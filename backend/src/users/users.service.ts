import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailExists = await this.prisma.user.findFirst({
      where: { companyId, email: dto.email },
    });
    if (emailExists) {
      throw new ForbiddenException('E-mail já utilizado na empresa');
    }

    return this.prisma.user.create({
      data: {
        companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        role: dto.role,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        active: true,
        createdAt: true,
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
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { whatsapp: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsapp: true,
          role: true,
          active: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(companyId: string, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let password: string | undefined;
    if (dto.password) {
      password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        role: dto.role ?? user.role,
        active: dto.active ?? user.active,
        ...(password ? { password } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return updated;
  }
}
