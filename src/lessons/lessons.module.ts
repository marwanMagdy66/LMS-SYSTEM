import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service.js';
import { LessonsController } from './lessons.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports:[PrismaModule,StorageModule],
  providers: [LessonsService],
  controllers: [LessonsController]
})
export class LessonsModule {}
