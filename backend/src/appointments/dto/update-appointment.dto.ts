import { AppointmentStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsArray()
  servicoIds?: string[];

  @IsOptional()
  @IsDateString()
  dataHoraInicio?: string;

  @IsOptional()
  @IsDateString()
  dataHoraFim?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
