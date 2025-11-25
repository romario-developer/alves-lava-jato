import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentCompany } from '../common/decorators/current-company.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentCompany() companyId: string, @Query() query: PaginationDto) {
    return this.usersService.findAll(companyId, query);
  }

  @Get(':id')
  findOne(@CurrentCompany() companyId: string, @Param('id') id: string) {
    return this.usersService.findOne(companyId, id);
  }

  @Post()
  create(
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any,
    @Body() body: CreateUserDto,
  ) {
    this.ensureManager(user);
    return this.usersService.create(companyId, body);
  }

  @Patch(':id')
  update(
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    this.ensureManager(user);
    return this.usersService.update(companyId, id, body);
  }

  private ensureManager(user: any) {
    if (!['OWNER', 'MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Apenas gestores/owner podem gerenciar usuários');
    }
  }
}
