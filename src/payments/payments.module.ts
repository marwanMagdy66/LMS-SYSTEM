import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymobService } from './paymob.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PaymobHmacService } from './paymob-hmac.service.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    PaymobService,
    PaymobHmacService,
    WebhooksService,
  ],
})
export class PaymentsModule {}
