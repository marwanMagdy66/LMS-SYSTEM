import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateCourseDto } from './DTO/create-course.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CoursesService } from './courses.service.js';
import { UpdateCourseDto } from './DTO/update-course.dto.js';
import { CoursesQuaryDto } from './DTO/courses-query.dto.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  //create course
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR', 'ADMIN')
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.coursesService.create(createCourseDto, req.user.userId);
  }

  //find all courses
  @Get()
  findAllPublished(@Query()query:CoursesQuaryDto) {
    return this.coursesService.findAllPublished(query);
  }

  //find course by id
  @Get(':id')
  findPublishedById(@Param('id') id: string) {
    return this.coursesService.findPublishedById(id);
  }


  // Publish course
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'INSTRUCTOR')
  publish(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.coursesService.publish(
      id,
      req.user.userId,
      req.user.role,
    );
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'INSTRUCTOR')
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.coursesService.update(
      id,
      updateCourseDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'INSTRUCTOR')
  delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.coursesService.delete(id, req.user.userId, req.user.role);
  }
}
