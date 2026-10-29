
import {
    Controller,
    Param,
    Post,
    Req,
    UseGuards,
    Request,
    Get,
  } from '@nestjs/common';
  import { UserRole } from '@prisma/client';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
  import { RolesGuard } from '../auth/guards/roles.guard.js';
  import { Roles } from '../auth/decorators/roles.decorator.js';
  import { ProgressService } from './progress.service.js';
  
  interface AuthenticatedRequest  {
    user: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
  
  @Controller('progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  export class ProgressController {
    constructor(
      private readonly progressService: ProgressService,
    ) {}
  
    @Post(':lessonId/complete')
    completeLesson(
      @Request() req: AuthenticatedRequest,
      @Param('lessonId') lessonId: string,
    ) {
      return this.progressService.completeLesson(
        req.user.userId,
        lessonId,
      );
    }

    @Get()
    findMyProgress(@Request() req:AuthenticatedRequest){
        return this.progressService.findMyProgress(
            req.user.userId,
          );
        
    }
  }
  