import { Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { CoursesModule } from '../courses/courses.module.js';

@Module({
  imports: [CoursesModule],
  providers: [StorageService],
  exports:[StorageService]
})
export class StorageModule {

}
