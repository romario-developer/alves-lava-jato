import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PayableCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePayableDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsOptional()
  @IsEnum(PayableCategory)
  categoria?: PayableCategory = PayableCategory.FIXED;

  @Type(() => Number)
  @IsNumber()
  valorPrevisto: number;

  @IsDateString()
  dataVencimento: string;

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
}
