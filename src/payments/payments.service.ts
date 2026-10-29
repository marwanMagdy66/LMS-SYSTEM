
import {
    BadRequestException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { PaymobService } from './paymob.service.js';
  
  @Injectable()
  export class PaymentsService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly paymobService: PaymobService,
      private readonly configService: ConfigService,
    ) {}
  
    async createPayment(studentId: string, orderId: string) {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, studentId },
        include: {
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          payments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          student: {
            select: {
              email: true,
              name: true,
              phone: true,
            },
          },
        },
      });
  
      if (!order) {
        throw new NotFoundException('Order not found');
      }
  
      if (order.status !== 'PENDING') {
        throw new BadRequestException(
          'Only pending orders can be paid',
        );
      }
  
      if (order.items.length === 0) {
        throw new BadRequestException('Order has no items');
      }
  
      const amount = Number(order.totalAmount);
  
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Invalid order amount');
      }
  
      const existingPayment = order.payments[0];
  
      if (existingPayment?.paymobIntentionId) {
        throw new BadRequestException(
          'A payment session has already been initiated for this order',
        );
      }
  
      // لو فيه سجل معلق من محاولة فشلت قبل إنشاء الـ Intention،
      // نغلقه ونبدأ محاولة جديدة.
      if (existingPayment) {
        await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'FAILED' },
        });
      }
  
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          status: 'PENDING',
        },
      });
  
      const notificationUrl =
        this.configService.getOrThrow<string>(
          'PAYMOB_NOTIFICATION_URL',
        );
  
      try {
        const checkout = await this.paymobService.createIntention({
          orderId: order.id,
          amount,
          currency: order.currency,
          courseTitle: order.items
            .map((item) => item.course.title)
            .join(', '),
          email: order.student.email,
          phoneNumber: order.student.phone ?? '01000000000',
          notificationUrl,
        });
  
        // حفظ مراجع Paymob لربط إشعار الدفع بالسجل الصحيح.
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymobIntentionId: checkout.intentionId,
            paymobOrderId: String(checkout.paymobOrderId),
          },
        });
  
        return {
          paymentId: payment.id,
          orderId: order.id,
          amount,
          currency: order.currency,
          checkoutUrl: checkout.checkoutUrl,
        };
      } catch {
        // لا نترك محاولة فاشلة معلقة.
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
  
        throw new ServiceUnavailableException(
          'Unable to initialize payment. Please try again later.',
        );
      }
    }
  }
  