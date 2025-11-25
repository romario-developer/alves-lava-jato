import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentCompany() companyId: string, @Query() query: PaginationDto) {
    return this.clientsService.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.clientsService.findOne(companyId, id);
  }

  @Post()
  create(@CurrentCompany() companyId: string, @Body() body: CreateClientDto) {
    return this.clientsService.create(companyId, body);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: UpdateClientDto,
  ) {
    return this.clientsService.update(companyId, id, body);
  }

  @Get(':id/vehicles')
  listVehicles(@CurrentCompany() companyId: string, @Param('id') clientId: string) {
    return this.clientsService.listVehicles(companyId, clientId);
  }

  @Post(':id/vehicles')
  addVehicle(
    @CurrentCompany() companyId: string,
    @Param('id') clientId: string,
    @Body() body: CreateVehicleDto,
  ) {
    return this.clientsService.addVehicle(companyId, clientId, body);
  }

  @Patch(':id/vehicles/:vehicleId')
  updateVehicle(
    @CurrentCompany() companyId: string,
    @Param('id') clientId: string,
    @Param('vehicleId') vehicleId: string,
    @Body() body: UpdateVehicleDto,
  ) {
    return this.clientsService.updateVehicle(companyId, clientId, vehicleId, body);
  }
}
