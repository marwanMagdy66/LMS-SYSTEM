import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCourseDto } from './DTO/create-course.dto.js';
import { UpdateCourseDto } from './DTO/update-course.dto.js';
import { CoursesQuaryDto } from './DTO/courses-query.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}
  //create course
  async create(createCourseDto: CreateCourseDto, instructorId: string) {
    return this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        description: createCourseDto.description ?? '',
        price: createCourseDto.price,
        instructor: {
          connect: { id: instructorId },
        },
      },
    });
  }
  //find all courses
  async findAllPublished(query: CoursesQuaryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: 'PUBLISHED' as const,
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.course.count({
        where,
      }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //find course by id
  async findPublishedById(id: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  //publish course
  async publish(id: string, userId: string, role: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          select: {
            id: true,
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only publish your own courses');
    }

    if (course.sections.length === 0) {
      throw new BadRequestException(
        'You must add at least one section before publishing',
      );
    }
    const sectionWithoutLessons = course.sections.some(
      (section) => section._count.lessons === 0,
    );

    if (sectionWithoutLessons) {
      throw new BadRequestException(
        'Every section must contain at least one lesson before publishing',
      );
    }
    return this.prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
    });
  }


  //verify Instructor Owner

  
  async verifyInstructorOwnership(
    courseId: string,
    instructorId: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'You can only upload videos to your own courses',
      );
    }

    return course;
  }

  //update course
  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
    role: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: {
        id,
      },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  //delete course
  async delete(id: string, userId: string, role: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
