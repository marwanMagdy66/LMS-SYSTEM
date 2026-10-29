import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SectionsService } from './sections.service.js';
import { CreateSectionDto } from './DTO/create-section.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UpdateSectionsDto } from './DTO/update-section.dto.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('courses/:courseId/sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @Roles('INSTRUCTOR', 'ADMIN')
  create(
    @Param('courseId') courseId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sectionsService.create(
      courseId,
      createSectionDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Get()
  findAllSectionsByCourse(@Param('courseId') courseId: string) {
    return this.sectionsService.findAllSectionsByCourse(courseId);
  }

  @Patch(':sectionId')
  @Roles('INSTRUCTOR', 'ADMIN')
  update(
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sectionsService.update(
      sectionId,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':sectionId')
  @Roles('INSTRUCTOR', 'ADMIN')
  delete(
    @Param('sectionId') sectionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sectionsService.delete(
      sectionId,
      req.user.userId,
      req.user.role,
    );
  }
}
