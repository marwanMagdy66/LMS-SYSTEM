import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyEnrollments(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                sections: true,
              },
            },
          },
        },
      },
    });

    return {
      enrollments,
      total: enrollments.length,
    };
  }

  async findOneEnrollment(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      select: {
        id: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found for this course');
    }
    return enrollment;
  }

  
async findCourseContent(studentId: string, courseId: string) {
  const enrollment = await this.prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          sections: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              position: true,
              lessons: {
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  title: true,
                  position: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new NotFoundException(
      'Enrollment not found for this course',
    );
  }

  return enrollment.course;
}

}
