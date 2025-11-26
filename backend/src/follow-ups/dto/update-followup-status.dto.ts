import { FollowUpStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateFollowUpStatusDto {
  @IsEnum(FollowUpStatus)
  status: FollowUpStatus;
}
