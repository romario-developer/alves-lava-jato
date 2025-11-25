import { VehicleType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsEnum(VehicleType)
  @IsOptional()
  tipo?: VehicleType = VehicleType.CAR;

  @IsNotEmpty()
  @IsString()
  placa: string;

  @IsNotEmpty()
  @IsString()
  marca: string;

  @IsNotEmpty()
  @IsString()
  modelo: string;

  @IsOptional()
  @IsNumber()
  ano?: number;

  @IsOptional()
  @IsString()
  cor?: string;

  @IsOptional()
  @IsString()
  chassi?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
