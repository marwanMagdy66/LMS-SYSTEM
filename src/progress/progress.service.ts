import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async completeLesson(studentId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        section: {
          select: {
            courseId: true,
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: lesson.section.courseId,
        },
      },
      select: {
        id: true,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to complete its lessons',
      );
    }
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
      create: {
        studentId,
        lessonId,
      },
      update: {},
      select: {
        id: true,
        lessonId: true,
        completedAt: true,
      },
    });

    return {
      message: 'Lesson marked as completed',
      progress,
    };
  }


  async findMyProgress(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            sections: {
              select: {
                lessons: {
                  select: {
                    id: true,
                    progress: {
                      where: { studentId },
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  
    return enrollments.map(({ course }) => {
      const lessons = course.sections.flatMap(
        (section) => section.lessons,
      );
  
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(
        (lesson) => lesson.progress.length > 0,
      ).length;
  
      const progressPercentage =
        totalLessons === 0
          ? 0
          : Math.round((completedLessons / totalLessons) * 100);
  
      return {
        courseId: course.id,
        courseTitle: course.title,
        totalLessons,
        completedLessons,
        progressPercentage,
      };
    });
  }
  
}