'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import type { CourseDetail, LessonDto } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface QuestionDto {
  id: string;
  text: string;
  createdAt: string;
  user: { fullName: string };
  answers: { id: string; text: string; createdAt: string }[];
}

export default function LessonPlayerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<(LessonDto & { module: { course: { id: string; title: string } } }) | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState('');
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: lessonData } = await api.get(`/lessons/${params.id}`);
      setLesson(lessonData);

      const [{ data: courseData }, { data: tokenData }, { data: questionsData }] = await Promise.all([
        api.get(`/courses/${lessonData.module.course.id}`),
        api.post(`/lessons/${params.id}/video-token`).catch(() => ({ data: null })),
        api.get(`/lessons/${params.id}/questions`),
      ]);
      setCourse(courseData);
      if (tokenData) {
        setVideoUrl(tokenData.url);
        setWatermark(tokenData.watermark?.text ?? '');
      }
      setQuestions(questionsData);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Darsni yuklashda xatolik'));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const flatLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
  const currentIndex = flatLessons.findIndex((l) => l.id === params.id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  async function markComplete() {
    setCompleting(true);
    try {
      await api.post(`/lessons/${params.id}/complete`);
      setCompleted(true);
      toast.success('Dars belgilandi!');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  }

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    const { data } = await api.post(`/lessons/${params.id}/questions`, { text: questionText });
    setQuestions([{ ...data, user: { fullName: 'Siz' }, answers: [] }, ...questions]);
    setQuestionText('');
  }

  if (loading) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <Skeleton className="aspect-video w-full rounded-xl" />
      </AppShell>
    );
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {lesson?.module.course.id && (
            <Link
              href={`/courses/${lesson.module.course.id}`}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {lesson.module.course.title}
            </Link>
          )}
          <h1 className="mb-4 text-xl font-bold tracking-tight">{lesson?.title}</h1>

          {videoUrl ? (
            <ProtectedVideoPlayer src={videoUrl} watermarkText={watermark} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-muted-foreground">
              Video mavjud emas
            </div>
          )}

          {lesson?.description && <p className="mt-4 text-sm text-muted-foreground">{lesson.description}</p>}

          {lesson?.materials && lesson.materials.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Materiallar</h3>
              <ul className="space-y-1">
                {lesson.materials.map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {m.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {prevLesson && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/lessons/${prevLesson.id}`)}>
                  <ChevronLeft className="h-4 w-4" /> Oldingi
                </Button>
              )}
              {nextLesson && (
                <Button variant="outline" size="sm" onClick={() => router.push(`/lessons/${nextLesson.id}`)}>
                  Keyingi <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              onClick={markComplete}
              loading={completing}
              disabled={completed}
              variant={completed ? 'secondary' : 'default'}
              className={completed ? 'bg-success/10 text-success hover:bg-success/10' : ''}
            >
              {completed ? "✓ Bajarildi" : "Darsni o'zlashtirdim"}
            </Button>
          </div>

          <div className="mt-10">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <MessageSquare className="h-4 w-4" /> Savol-javob
            </h3>
            <form onSubmit={askQuestion} className="mb-4 flex gap-2">
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Savolingizni yozing..."
              />
              <Button type="submit">Yuborish</Button>
            </form>
            <div className="space-y-3">
              {questions.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{q.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{q.text}</p>
                    {q.answers.map((a) => (
                      <div key={a.id} className="mt-2 rounded-md bg-accent p-2 text-sm text-accent-foreground">
                        👨‍🏫 {a.text}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              {questions.length === 0 && <p className="text-sm text-muted-foreground">Hali savollar yo&apos;q.</p>}
            </div>
          </div>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Kurs dasturi</h3>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto">
                {course?.modules.map((m) => (
                  <div key={m.id}>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{m.title}</p>
                    {m.lessons.map((l) => (
                      <Link
                        key={l.id}
                        href={`/lessons/${l.id}`}
                        className={
                          l.id === params.id
                            ? 'block rounded-md bg-accent px-2 py-1.5 text-sm font-medium text-accent-foreground'
                            : 'block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent'
                        }
                      >
                        {l.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
