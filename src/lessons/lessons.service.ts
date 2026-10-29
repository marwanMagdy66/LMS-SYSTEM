import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLessonsDto } from './DTO/create-lesson.dto.js';
import { UpdateLessonDto } from './DTO/update-lesson.dto.js';
import { StorageService } from '../storage/storage.service.js';
import { randomUUID } from 'crypto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService,
    private readonly storageService:StorageService
  ) {}


  async create(
    sectionId: string,
    courseId: string,
    createLessonsDto: CreateLessonsDto,
    userId: string,
    role: string,
    file: Express.Multer.File,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
  
    if (!section || section.courseId !== courseId) {
      throw new NotFoundException(
        'Section not found in this course',
      );
    }
  
    if (
      role !== 'ADMIN' &&
      section.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only add lessons to your own courses',
      );
    }
  
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
  
    // Generate the lesson ID before uploading the video.
    const lessonId = randomUUID();
  
    // Organize the video using the instructor, course,
    // section, and lesson IDs.
    const publicId =
      `lms/instructors/${section.course.instructorId}` +
      `/courses/${courseId}` +
      `/sections/${sectionId}` +
      `/lessons/${lessonId}`;
  
    const uploadedVideo = await this.storageService.uploadVideo(
      file,
      publicId,
    );
  
    try {
      return await this.prisma.lesson.create({
        data: {
          id: lessonId,
          title: createLessonsDto.title,
          position: createLessonsDto.position,
          videoUrl: uploadedVideo.secureUrl,
          videoPublicId: uploadedVideo.publicId,
          section: {
            connect: { id: sectionId },
          },
        },
        select: {
          id: true,
          title: true,
          position: true,
          videoUrl: true,
          videoPublicId: true,
          sectionId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      try {
        await this.storageService.deleteVideo(
          uploadedVideo.publicId,
        );
      } catch {
        // Preserve the original database error.
      }
  
      throw error;
    }
  }
  
  
async findAllLessonsBySection(
    courseId: string,
    sectionId: string,
  ) {
    const section = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        courseId,
        course: {
          status: 'PUBLISHED',
        },
      },
    });
  
    if (!section) {
      throw new NotFoundException(
        'Section not found in this published course',
      );
    }
  
    return this.prisma.lesson.findMany({
      where: {
        sectionId,
      },
      orderBy: {
        position: 'asc',
      },
      select: {
        id: true,
        title: true,
        position: true,
        sectionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  

  async update(
    courseId: string,
    sectionId: string,
    lessonId: string,
    dto: UpdateLessonDto,
    userId: string,
    role: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        sectionId,
        section: {
          courseId,
        },
      },
      include: {
        section: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found in this section and course',
      );
    }

    if (
      role !== 'ADMIN' &&
      lesson.section.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only manage lessons of your own courses',
      );
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto,
      select: {
        id: true,
        title: true,
        position: true,
        sectionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(
    courseId: string,
    sectionId: string,
    lessonId: string,
    userId: string,
    role: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        sectionId,
        section: {
          courseId,
        },
      },
      include: {
        section: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(
        'Lesson not found in this section and course',
      );
    }

    if (
      role !== 'ADMIN' &&
      lesson.section.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only manage lessons of your own courses',
      );
    }

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });

    return { message: 'Lesson deleted successfully' };
  }
}
