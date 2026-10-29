
import {
    Controller,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import type { Request } from 'express';
  import { RolesGuard } from '../auth/guards/roles.guard.js';
  import { Roles } from '../auth/decorators/roles.decorator.js';
  import { PaymentsService } from './payments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
  
  interface AuthenticatedRequest extends Request {
    user: {
      userId: string;
      email: string;
      role: string;
    };
  }
  
  @Controller('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  export class PaymentsController {
    constructor(
      private readonly paymentsService: PaymentsService,
    ) {}
  
    @Post('orders/:orderId')
    createPayment(
      @Req() req: AuthenticatedRequest,
      @Param('orderId', ParseUUIDPipe) orderId: string,
    ) {
      return this.paymentsService.createPayment(
        req.user.userId,
        orderId,
      );
    }
  }
  