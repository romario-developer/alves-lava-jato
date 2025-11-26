import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceivableDto {
  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  osId?: string;

  @Type(() => Number)
  @IsNumber()
  valorPrevisto: number;

  @IsDateString()
  dataPrevista: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valorRecebido?: number;

  @IsOptional()
  @IsDateString()
  dataRecebimento?: string;
}
