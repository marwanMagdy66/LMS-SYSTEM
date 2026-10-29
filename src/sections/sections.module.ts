import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller.js';
import { SectionsService } from './sections.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports:[PrismaModule],
  controllers: [SectionsController],
  providers: [SectionsService]
})
export class SectionsModule {}
