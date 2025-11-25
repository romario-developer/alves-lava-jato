import { Body, Controller, Get, Patch, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentCompany() companyId: string) {
    return this.companiesService.findById(companyId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCompanyDto,
  ) {
    this.ensureManager(user);
    return this.companiesService.update(companyId, dto);
  }

  private ensureManager(user: any) {
    if (!['OWNER', 'MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Apenas gestores/owner podem alterar dados da empresa');
    }
  }
}
