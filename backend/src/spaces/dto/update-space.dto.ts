import { IsOptional, IsString } from 'class-validator';

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
