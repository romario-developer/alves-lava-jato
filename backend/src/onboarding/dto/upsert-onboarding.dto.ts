import { IsArray, ArrayNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertOnboardingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ramoAtuacao: string[];

  @IsOptional()
  @IsString()
  qtdFuncionarios?: string;

  @IsOptional()
  @IsString()
  faturamentoMensal?: string;

  @IsOptional()
  @IsString()
  prioridade?: string;

  @IsOptional()
  @IsString()
  comoConheceu?: string;
}
