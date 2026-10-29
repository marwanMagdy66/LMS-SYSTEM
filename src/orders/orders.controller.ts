import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateOrderDto } from './DTO/create-order.dto.js';
import { OrdersService } from './orders.service.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req: AuthenticatedRequest) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get()
  findAllOrders(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAllOrders(req.user.userId);
  }
  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.ordersService.cancelOrder(req.user.userId, id);
  }
}
