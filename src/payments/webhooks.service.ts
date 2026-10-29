
import {
    Injectable,
    Logger,
    UnauthorizedException,
  } from '@nestjs/common';
  
  import { PrismaService } from '../prisma/prisma.service.js';
  
  import {
    PaymobHmacService,
    type PaymobTransaction,
  } from './paymob-hmac.service.js';
  
  interface PaymobCallback {
    type?: string;
    obj?: Partial<PaymobTransaction>;
  }
  
  @Injectable()
  export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly paymobHmacService: PaymobHmacService,
    ) {}
  
    async handlePaymobCallback(
      payload: PaymobCallback,
      receivedHmac: string,
    ) {
      const transaction = payload?.obj;
  
      if (!transaction || payload.type !== 'TRANSACTION') {
        throw new UnauthorizedException(
          'Invalid Paymob callback payload',
        );
      }
  
      // نتحقق من اكتمال البيانات قبل حساب HMAC.
      if (
        transaction.amount_cents === undefined ||
        transaction.created_at === undefined ||
        transaction.currency === undefined ||
        transaction.error_occured === undefined ||
        transaction.has_parent_transaction === undefined ||
        transaction.id === undefined ||
        transaction.integration_id === undefined ||
        transaction.is_3d_secure === undefined ||
        transaction.is_auth === undefined ||
        transaction.is_capture === undefined ||
        transaction.is_refunded === undefined ||
        transaction.is_standalone_payment === undefined ||
        transaction.is_voided === undefined ||
        transaction.order?.id === undefined ||
        transaction.owner === undefined ||
        transaction.pending === undefined ||
        transaction.source_data?.pan === undefined ||
        transaction.source_data?.sub_type === undefined ||
        transaction.source_data?.type === undefined ||
        transaction.success === undefined
      ) {
        throw new UnauthorizedException(
          'Incomplete Paymob transaction payload',
        );
      }
  
      const completeTransaction: PaymobTransaction = {
        amount_cents: transaction.amount_cents,
        created_at: transaction.created_at,
        currency: transaction.currency,
        error_occured: transaction.error_occured,
        has_parent_transaction: transaction.has_parent_transaction,
        id: transaction.id,
        integration_id: transaction.integration_id,
        is_3d_secure: transaction.is_3d_secure,
        is_auth: transaction.is_auth,
        is_capture: transaction.is_capture,
        is_refunded: transaction.is_refunded,
        is_standalone_payment: transaction.is_standalone_payment,
        is_voided: transaction.is_voided,
        order: {
          id: transaction.order.id,
        },
        owner: transaction.owner,
        pending: transaction.pending,
        source_data: {
          pan: transaction.source_data.pan,
          sub_type: transaction.source_data.sub_type,
          type: transaction.source_data.type,
        },
        success: transaction.success,
      };
  
      if (
        !this.paymobHmacService.verifyTransaction(
          completeTransaction,
          receivedHmac,
        )
      ) {
        throw new UnauthorizedException('Invalid Paymob HMAC');
      }
  
      const providerTransactionId = String(completeTransaction.id);
      const paymobOrderId = String(completeTransaction.order.id);
      const amountInPiastres = Number(completeTransaction.amount_cents);
  
      if (
        !Number.isSafeInteger(amountInPiastres) ||
        amountInPiastres <= 0
      ) {
        throw new UnauthorizedException('Invalid transaction amount');
      }
  
      const payment = await this.prisma.payment.findFirst({
        where: { paymobOrderId },
        include: {
          order: {
            include: {
              items: {
                select: { courseId: true },
              },
            },
          },
        },
      });
  
      if (!payment) {
        this.logger.warn(
          `No payment found for Paymob order ${paymobOrderId}`,
        );
        throw new UnauthorizedException('Payment not found');
      }
  
      // التعامل بأمان مع تكرار الإشعار بعد نجاح الدفع.
      if (
        payment.status === 'SUCCESS' &&
        payment.transactionReference === providerTransactionId
      ) {
        return {
          received: true,
          processed: true,
          duplicate: true,
        };
      }
  
      if (payment.status !== 'PENDING') {
        return {
          received: true,
          processed: false,
        };
      }
  
      const expectedAmountInPiastres = Math.round(
        Number(payment.amount) * 100,
      );
  
      if (
        amountInPiastres !== expectedAmountInPiastres ||
        completeTransaction.currency !== payment.order.currency
      ) {
        this.logger.error(
          `Amount/currency mismatch for payment ${payment.id}`,
        );
  
        throw new UnauthorizedException(
          'Payment details do not match',
        );
      }
  
      // لا نفعّل الكورس في حالة فشل الدفع أو استمرار المعاملة معلّقة.
      if (
        completeTransaction.success !== true ||
        completeTransaction.pending !== false ||
        completeTransaction.error_occured === true ||
        completeTransaction.is_refunded === true
      ) {
        await this.prisma.payment.updateMany({
          where: {
            id: payment.id,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
            transactionReference: providerTransactionId,
          },
        });
  
        return {
          received: true,
          processed: false,
        };
      }
  
      return this.prisma.$transaction(async (tx) => {
        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: 'PENDING',
          },
          data: {
            status: 'SUCCESS',
            transactionReference: providerTransactionId,
          },
        });
  
        if (paymentUpdate.count === 0) {
          return {
            received: true,
            processed: false,
            duplicate: true,
          };
        }
  
        const orderUpdate = await tx.order.updateMany({
          where: {
            id: payment.orderId,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
          },
        });
  
        if (orderUpdate.count === 0) {
          throw new Error(
            `Order ${payment.orderId} is not in PENDING status`,
          );
        }
  
        await tx.enrollment.createMany({
          data: payment.order.items.map((item) => ({
            studentId: payment.order.studentId,
            courseId: item.courseId,
          })),
          skipDuplicates: true,
        });
  
        return {
          received: true,
          processed: true,
        };
      });
    }
  }
  