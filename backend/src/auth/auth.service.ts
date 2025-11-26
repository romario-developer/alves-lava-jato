import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './jwt-payload.interface';
import { RegisterOwnerDto } from './dto/register-owner.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string, companyId?: string) {
    let user: {
      id: string;
      companyId: string;
      role: string;
      email: string;
      name: string;
      password: string;
      active: boolean;
    } | null = null;
    if (companyId) {
      user = await this.prisma.user.findFirst({
        where: { email, companyId, active: true },
      });
      if (!user) throw new UnauthorizedException('Credenciais inválidas (empresa)');
    } else {
      const users = await this.prisma.user.findMany({
        where: { email, active: true },
      });
      if (users.length === 0) throw new UnauthorizedException('Credenciais inválidas');
      if (users.length > 1) {
        throw new UnauthorizedException('E-mail vinculado a mais de uma empresa. Informe o companyId.');
      }
      user = users[0];
    }

    const passwordMatches = await bcrypt.compare(password, user!.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user!;
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password, data.companyId);
    return this.buildTokens(user);
  }

  async refresh(data: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(data.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('Usuário inativo');
      }

      return this.buildTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private buildTokens(user: { id: string; companyId: string; role: string; email: string; name: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'dev-secret',
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '900s') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async registerOwner(dto: RegisterOwnerDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const existingOwner = await this.prisma.user.findFirst({
      where: { companyId: dto.companyId, role: 'OWNER' },
    });
    if (existingOwner) {
      throw new ForbiddenException('A empresa já possui um proprietário cadastrado');
    }

    const user = await this.prisma.user.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: 'OWNER',
        active: true,
        password: await bcrypt.hash(dto.password, 10),
      },
    });

    return this.buildTokens(user);
  }
}
