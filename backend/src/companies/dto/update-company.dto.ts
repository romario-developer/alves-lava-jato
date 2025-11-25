import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsOptional()
  @IsString()
  razaoSocial?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  themePrimary?: string;

  @IsOptional()
  @IsString()
  themeSecondary?: string;

  @IsOptional()
  @IsString()
  themeBackground?: string;
}
