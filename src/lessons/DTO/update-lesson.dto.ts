import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonsDto } from './create-lesson.dto.js';

export class UpdateLessonDto extends PartialType(CreateLessonsDto) {}
