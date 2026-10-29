import {
  Controller,
  Param,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateLessonsDto } from './DTO/create-lesson.dto.js';
import { LessonsService } from './lessons.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateLessonDto } from './DTO/update-lesson.dto.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('courses/:courseId/sections/:sectionId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles('INSTRUCTOR', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('video/')) {
          return callback(
            new BadRequestException('Only video files are allowed'),
            false,
          );
        }
  
        callback(null, true);
      },
    }),
  )
  create(
    @Param('sectionId') sectionId: string,
    @Param('courseId') courseId: string,
    @Request() req: AuthenticatedRequest,
    @Body() createLessonsDto: CreateLessonsDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonsService.create(
      sectionId,
      courseId,
      createLessonsDto,
      req.user.userId,
      req.user.role,
      file
    );
  }

  @Get()
  findBySection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.lessonsService.findAllLessonsBySection(courseId, sectionId);
  }

  @Patch(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  update(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.lessonsService.update(
      courseId,
      sectionId,
      lessonId,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':lessonId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  delete(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.lessonsService.delete(
      courseId,
      sectionId,
      lessonId,
      req.user.userId,
      req.user.role,
    );
  }
}
