import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertOnboardingDto } from './dto/upsert-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(companyId: string) {
    const onboarding = await this.prisma.companyOnboarding.findUnique({
      where: { companyId },
    });

    return {
      completed: Boolean(onboarding?.completedAt),
      data: onboarding,
    };
  }

  async upsert(companyId: string, dto: UpsertOnboardingDto) {
    const onboarding = await this.prisma.companyOnboarding.upsert({
      where: { companyId },
      update: {
        ramoAtuacao: dto.ramoAtuacao,
        qtdFuncionarios: dto.qtdFuncionarios,
        faturamentoMensal: dto.faturamentoMensal,
        prioridade: dto.prioridade,
        comoConheceu: dto.comoConheceu,
        completedAt: new Date(),
      },
      create: {
        companyId,
        ramoAtuacao: dto.ramoAtuacao,
        qtdFuncionarios: dto.qtdFuncionarios,
        faturamentoMensal: dto.faturamentoMensal,
        prioridade: dto.prioridade,
        comoConheceu: dto.comoConheceu,
        completedAt: new Date(),
      },
    });

    return { completed: true, data: onboarding };
  }
}
