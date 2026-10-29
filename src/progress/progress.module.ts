import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service.js';
import { ProgressController } from './progress.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
