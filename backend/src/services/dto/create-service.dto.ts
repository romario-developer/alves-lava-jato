import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duracaoEstimadaMin?: number;

  @Type(() => Number)
  @IsNumber()
  precoBase: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  geraPosVenda?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  diasFollowUp?: number;
}
