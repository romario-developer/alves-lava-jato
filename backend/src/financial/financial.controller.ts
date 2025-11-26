import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { FinancialStatus } from '@prisma/client';

@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('payables')
  listPayables(
    @CurrentCompany() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('status') status?: FinancialStatus,
  ) {
    return this.financialService.listPayables(companyId, pagination, { start, end }, status);
  }

  @Post('payables')
  createPayable(@CurrentCompany() companyId: string, @Body() dto: CreatePayableDto) {
    return this.financialService.createPayable(companyId, dto);
  }

  @Patch('payables/:id')
  updatePayable(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePayableDto,
  ) {
    return this.financialService.updatePayable(companyId, id, dto);
  }

  @Get('receivables')
  listReceivables(
    @CurrentCompany() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('status') status?: FinancialStatus,
  ) {
    return this.financialService.listReceivables(companyId, pagination, { start, end }, status);
  }

  @Post('receivables')
  createReceivable(@CurrentCompany() companyId: string, @Body() dto: CreateReceivableDto) {
    return this.financialService.createReceivable(companyId, dto);
  }

  @Patch('receivables/:id')
  updateReceivable(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReceivableDto,
  ) {
    return this.financialService.updateReceivable(companyId, id, dto);
  }

  @Get('cashflow')
  cashflow(
    @CurrentCompany() companyId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.financialService.cashflow(companyId, { start, end });
  }
}
