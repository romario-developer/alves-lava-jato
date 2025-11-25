import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AddPaymentDto {
  @IsEnum(PaymentMethod)
  metodo: PaymentMethod;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  valor: number;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numeroParcela?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalParcelas?: number;
}
