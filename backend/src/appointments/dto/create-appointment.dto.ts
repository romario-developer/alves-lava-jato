import { AppointmentOrigin, AppointmentStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  clienteId: string;

  @IsOptional()
  @IsString()
  veiculoId?: string;

  @IsArray()
  servicoIds: string[];

  @IsDateString()
  dataHoraInicio: string;

  @IsDateString()
  dataHoraFim: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(AppointmentOrigin)
  origem?: AppointmentOrigin;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  responsavelId?: string;
}
