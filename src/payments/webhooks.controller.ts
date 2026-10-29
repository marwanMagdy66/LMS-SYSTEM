
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Query,
  } from '@nestjs/common';
  import { WebhooksService } from './webhooks.service.js';
  
  @Controller('webhooks')
  export class WebhooksController {
    constructor(
      private readonly webhooksService: WebhooksService,
    ) {}
  
    @Post('paymob')
    @HttpCode(HttpStatus.OK)
    handlePaymobCallback(
      @Body() payload: Record<string, unknown>,
      @Query('hmac') hmac: string,
    ) {
      return this.webhooksService.handlePaymobCallback(
        payload,
        hmac,
      );
    }
  }
  