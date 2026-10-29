import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './DTO/create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, createOrderDto: CreateOrderDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: createOrderDto.courseId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        price: true,
      },
    });
    if (!course) {
      throw new NotFoundException('Published course not found');
    }
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this course');
    }
    if (Number(course.price) <= 0) {
      throw new BadRequestException(
        'Free courses should use a separate enrollment flow',
      );
    }

    const order = await this.prisma.order.create({
      data: {
        student: { connect: { id: studentId } },
        totalAmount: course.price,
        currency: 'EGP',
        items: {
          create: {
            course: {
              connect: { id: course.id },
            },
            price: course.price,
          },
        },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        items: {
          select: {
            courseId: true,
            price: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  async findAllOrders(studentId: string) {
    const orders = await this.prisma.order.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        items: {
          select: {
            courseId: true,
            price: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return {
      orders,
      summary: {
        ordersCount: orders.length,
        totalAmount,
        currency: 'EGP',
      },
    };
  }

  async cancelOrder(studentId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.studentId !== studentId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    if (order.status !== 'PENDING') {
      throw new ConflictException(
        `Cannot cancel an order with status ${order.status}`,
      );
    }
    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        studentId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });
    if (result.count === 0) {
      throw new ConflictException(
        'Order status changed; it can no longer be cancelled',
      );
    }
    // Cancel any pending payments associated with this order.
    await this.prisma.payment.updateMany({
      where: {
        orderId,
        status: 'PENDING',
      },
      data: {
        status: 'FAILED',
      },
    });

    return {
      message: 'Order cancelled successfully',
      orderId,
      status: 'CANCELLED',
    };
  }
}
