import { VehicleType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsEnum(VehicleType)
  tipo?: VehicleType;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

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
