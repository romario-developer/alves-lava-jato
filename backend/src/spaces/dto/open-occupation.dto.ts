import { IsDateString, IsOptional, IsString } from 'class-validator';

export class OpenOccupationDto {
  @IsString()
  spaceId: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsDateString()
  expectedEndAt?: string;
}
