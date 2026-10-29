import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSectionDto } from './DTO/create-section.dto.js';
import { connect } from 'http2';
import { UpdateSectionsDto } from './DTO/update-section.dto.js';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}
  //create section
  async create(
    courseId: string,
    createSectionDto: CreateSectionDto,
    userId: string,
    role: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only manage sections of your own courses',
      );
    }
    return this.prisma.section.create({
      data: {
        title: createSectionDto.title,
        position: createSectionDto.position,
        course: {
          connect: { id: courseId },
        },
      },
    });
  }

  //find all sections by course

  async findAllSectionsByCourse(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        status: 'PUBLISHED',
      },
    });
    if (!course) {
      throw new NotFoundException('Published course not found');
    }
    return this.prisma.section.findMany({
      where: {
        courseId,
      },
      orderBy: {
        position: 'asc',
      },
      select: {
        id: true,
        title: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }


  //update section
  
async update(
    sectionId: string,
    updateSectionDto: UpdateSectionsDto,
    userId: string,
    role: string,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
  
    if (!section) {
      throw new NotFoundException('Section not found');
    }
  
    if (role !== 'ADMIN' && section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only manage sections of your own courses',
      );
    }
  
    return this.prisma.section.update({
      where: { id: sectionId },
      data: updateSectionDto,
    });
  }
  

  //delete sections
  async delete(
    sectionId: string,
    userId: string,
    role: string,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
  
    if (!section) {
      throw new NotFoundException('Section not found');
    }
  
    if (role !== 'ADMIN' && section.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only manage sections of your own courses',
      );
    }
  
    return this.prisma.section.delete({
      where: { id: sectionId },
    });
  }
  
}
