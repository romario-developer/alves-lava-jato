import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(
    @CurrentCompany() companyId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.appointmentsService.findAll(companyId, start, end);
  }

  @Post()
  create(@CurrentCompany() companyId: string, @Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(companyId, body);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(companyId, id, body);
  }
}
