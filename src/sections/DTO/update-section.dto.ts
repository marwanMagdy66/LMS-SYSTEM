import { PartialType } from "@nestjs/mapped-types";
import { CreateCourseDto } from "../../courses/DTO/create-course.dto.js";

export class UpdateSectionsDto extends PartialType(CreateCourseDto){}