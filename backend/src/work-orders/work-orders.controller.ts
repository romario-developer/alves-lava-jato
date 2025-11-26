import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Delete } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { WorkOrderStatus } from '@prisma/client';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@Controller('work-orders')
@UseGuards(JwtAuthGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  findAll(
    @CurrentCompany() companyId: string,
    @Query() query: PaginationDto,
    @Query('status') status?: WorkOrderStatus,
  ) {
    return this.workOrdersService.findAll(companyId, query, status);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.workOrdersService.findOne(companyId, id);
  }

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any,
    @Body() body: CreateWorkOrderDto,
  ) {
    return this.workOrdersService.create(companyId, body, user.userId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(companyId, id, body);
  }

  @Post(':id/payments')
  addPayment(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: AddPaymentDto,
  ) {
    return this.workOrdersService.addPayment(companyId, id, body);
  }

  @Delete(':id')
  delete(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.workOrdersService.delete(companyId, id);
  }
}
