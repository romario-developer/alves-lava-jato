import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { UpsertOnboardingDto } from './dto/upsert-onboarding.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('me')
  getStatus(@CurrentCompany() companyId: string) {
    return this.onboardingService.getStatus(companyId);
  }

  @Post()
  upsert(@CurrentCompany() companyId: string, @Body() dto: UpsertOnboardingDto) {
    return this.onboardingService.upsert(companyId, dto);
  }
}
