import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { CoursesModule } from './courses/courses.module.js';
import { SectionsModule } from './sections/sections.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsService } from './payments/payments.service.js';
import { PaymentsModule } from './payments/payments.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { StorageModule } from './storage/storage.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'LMS-SYSTEM',
    }),
    OrdersModule,
    UsersModule,
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CoursesModule,
    SectionsModule,
    LessonsModule,
    OrdersModule,
    PaymentsModule,
    EnrollmentsModule,
    ProgressModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
