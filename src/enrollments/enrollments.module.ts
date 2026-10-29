import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports:[PrismaModule],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController]
})
export class EnrollmentsModule {}
