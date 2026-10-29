import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { EnrollmentsService } from './enrollments.service.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  findMyEnrollments(@Request() req: AuthenticatedRequest) {
    return this.enrollmentsService.findMyEnrollments(req.user.userId);
  }

  @Get(':courseId')
  findMyEnrollment(
    @Request() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.findOneEnrollment(req.user.userId, courseId);
  }

  @Get(':courseId/content')
  findCourseContent(
    @Request() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.findCourseContent(req.user.userId, courseId);
  }
}
