import { IsDateString, IsOptional } from 'class-validator';

export class CloseOccupationDto {
  @IsOptional()
  @IsDateString()
  endedAt?: string;
}
