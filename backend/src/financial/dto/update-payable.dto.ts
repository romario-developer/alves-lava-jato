import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PayableCategory, FinancialStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdatePayableDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsEnum(PayableCategory)
  categoria?: PayableCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorPrevisto?: number;

  @IsOptional()
  @IsDateString()
  dataVencimento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorPago?: number;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @IsString()
  fornecedor?: string;

  @IsOptional()
  @IsEnum(FinancialStatus)
  status?: FinancialStatus;
}
