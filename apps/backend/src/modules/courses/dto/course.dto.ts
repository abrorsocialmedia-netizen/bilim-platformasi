import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isCertified?: boolean;

  @IsOptional()
  @IsBoolean()
  aiQaEnabled?: boolean;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class UpdateCourseDto extends CreateCourseDto {
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateModuleDto {
  @IsString()
  courseId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateLessonDto {
  @IsString()
  moduleId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoRef?: string;

  @IsOptional()
  @IsInt()
  durationSec?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoRef?: string;

  @IsOptional()
  @IsInt()
  durationSec?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateMaterialDto {
  @IsString()
  lessonId: string;

  @IsString()
  title: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class RequestUploadUrlDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;

  @IsString()
  folder: 'videos' | 'materials' | 'certificates';
}
