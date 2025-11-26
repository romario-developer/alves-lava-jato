import { Controller, Get, Param, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { FollowUpStatus } from '@prisma/client';
import { UpdateFollowUpStatusDto } from './dto/update-followup-status.dto';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get()
  list(
    @CurrentCompany() companyId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('status') status?: FollowUpStatus,
  ) {
    return this.followUpsService.list(companyId, { start, end, status });
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentCompany() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpStatusDto,
  ) {
    return this.followUpsService.updateStatus(companyId, id, dto);
  }
}
