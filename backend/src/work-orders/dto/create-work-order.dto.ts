import { WorkOrderStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class WorkOrderItemDto {
  @IsNotEmpty()
  @IsString()
  servicoId: string;

  @Type(() => Number)
  @IsNumber()
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  precoUnitario: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  desconto?: number;
}

class WorkOrderPaymentDto {
  @IsEnum(PaymentMethod)
  metodo: PaymentMethod;

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

export class CreateWorkOrderDto {
  @IsNotEmpty()
  @IsString()
  clienteId: string;

  @IsOptional()
  @IsString()
  veiculoId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  itens: WorkOrderItemDto[];

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  formaRecebimento?: string;

  @IsOptional()
  @IsDateString()
  dataAbertura?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderPaymentDto)
  pagamentos?: WorkOrderPaymentDto[];
}

export { WorkOrderItemDto, WorkOrderPaymentDto };
