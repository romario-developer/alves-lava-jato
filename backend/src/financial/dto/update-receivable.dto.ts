import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FinancialStatus } from '@prisma/client';

export class UpdateReceivableDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorPrevisto?: number;

  @IsOptional()
  @IsDateString()
  dataPrevista?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorRecebido?: number;

  @IsOptional()
  @IsDateString()
  dataRecebimento?: string;

  @IsOptional()
  @IsEnum(FinancialStatus)
  status?: FinancialStatus;

  @IsOptional()
  @IsString()
  clienteId?: string;
}
