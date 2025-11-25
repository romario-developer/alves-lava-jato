import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(
    @CurrentCompany() companyId: string,
    @Query() query: PaginationDto,
    @Query('active') active?: string,
  ) {
    const activeFlag = active === undefined ? undefined : active === 'true';
    return this.servicesService.findAll(companyId, query, activeFlag);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.servicesService.findOne(companyId, id);
  }

  @Post()
  create(@CurrentCompany() companyId: string, @Body() body: CreateServiceDto) {
    return this.servicesService.create(companyId, body);
  }

  @Patch(':id')
  update(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.servicesService.update(companyId, id, body);
  }
}
