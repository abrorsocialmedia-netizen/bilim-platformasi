export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  price: string | number;
  isFree: boolean;
  durationDays: number;
  isCertified: boolean;
  teacher: { id: string; fullName: string } | null;
  modulesCount: number;
  lessonsCount: number;
  status?: 'draft' | 'published';
}

export interface MyCourse {
  enrollmentId: string;
  status: 'pending' | 'active' | 'expired' | 'blocked' | 'rejected';
  progressPercent: number;
  startDate: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  course: { id: string; title: string; coverUrl: string | null; isCertified: boolean };
}

export interface LessonDto {
  id: string;
  title: string;
  description: string | null;
  videoRef: string | null;
  durationSec: number | null;
  order: number;
  materials?: { id: string; title: string; fileUrl: string; type: string }[];
}

export interface ModuleDto {
  id: string;
  title: string;
  order: number;
  lessons: LessonDto[];
}

export interface CourseDetail extends CourseSummary {
  modules: ModuleDto[];
}
