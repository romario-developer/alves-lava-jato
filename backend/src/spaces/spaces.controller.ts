import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { OpenOccupationDto } from './dto/open-occupation.dto';
import { CloseOccupationDto } from './dto/close-occupation.dto';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  listSpaces(@CurrentCompany() companyId: string) {
    return this.spacesService.listSpaces(companyId);
  }

  @Post()
  create(@CurrentCompany() companyId: string, @Body() dto: CreateSpaceDto) {
    return this.spacesService.createSpace(companyId, dto);
  }

  @Patch(':id')
  update(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return this.spacesService.updateSpace(companyId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.spacesService.deleteSpace(companyId, id);
  }

  @Post('occupations')
  openOccupation(@CurrentCompany() companyId: string, @Body() dto: OpenOccupationDto) {
    return this.spacesService.openOccupation(companyId, dto);
  }

  @Patch('occupations/:id/close')
  closeOccupation(@CurrentCompany() companyId: string, @Param('id') id: string, @Body() dto: CloseOccupationDto) {
    return this.spacesService.closeOccupation(companyId, id, dto);
  }

  @Get('summary/today')
  summary(@CurrentCompany() companyId: string) {
    return this.spacesService.summaryToday(companyId);
  }

  @Get('occupations/today')
  listToday(@CurrentCompany() companyId: string) {
    return this.spacesService.listOccupationsToday(companyId);
  }
}
