'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { ProtectedVideoPlayer } from '@/components/ProtectedVideoPlayer';
import type { CourseDetail, LessonDto } from '@/lib/types';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(apiErrorMessage(err, "Darsni yuklashda xatolik"));
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
    } catch (err) {
      setError(apiErrorMessage(err));
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
        <p className="text-gray-400">Yuklanmoqda...</p>
      </AppShell>
    );
  }

  if (error && !lesson) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <p className="text-red-600">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {lesson?.module.course.id && (
            <Link href={`/courses/${lesson.module.course.id}`} className="mb-3 inline-block text-sm text-indigo-600 hover:underline">
              ← {lesson.module.course.title}
            </Link>
          )}
          <h1 className="mb-4 text-xl font-bold">{lesson?.title}</h1>

          {videoUrl ? (
            <ProtectedVideoPlayer src={videoUrl} watermarkText={watermark} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 text-gray-400">
              Video mavjud emas
            </div>
          )}

          {lesson?.description && <p className="mt-4 text-sm text-gray-600">{lesson.description}</p>}

          {lesson?.materials && lesson.materials.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Materiallar</h3>
              <ul className="space-y-1">
                {lesson.materials.map((m) => (
                  <li key={m.id}>
                    <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
                      📄 {m.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              {prevLesson && (
                <button
                  onClick={() => router.push(`/lessons/${prevLesson.id}`)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  ← Oldingi
                </button>
              )}
              {nextLesson && (
                <button
                  onClick={() => router.push(`/lessons/${nextLesson.id}`)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Keyingi →
                </button>
              )}
            </div>
            <button
              onClick={markComplete}
              disabled={completing || completed}
              className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {completed ? '✓ Bajarildi' : completing ? 'Saqlanmoqda...' : "Darsni o'zlashtirdim"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-10">
            <h3 className="mb-3 text-lg font-semibold">Savol-javob</h3>
            <form onSubmit={askQuestion} className="mb-4 flex gap-2">
              <input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Savolingizni yozing..."
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
              <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Yuborish</button>
            </form>
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="rounded-md border bg-white p-3">
                  <p className="text-sm font-medium">{q.user.fullName}</p>
                  <p className="text-sm text-gray-700">{q.text}</p>
                  {q.answers.map((a) => (
                    <div key={a.id} className="mt-2 rounded-md bg-indigo-50 p-2 text-sm text-indigo-800">
                      👨‍🏫 {a.text}
                    </div>
                  ))}
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-gray-400">Hali savollar yo&apos;q.</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Kurs dasturi</h3>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">
              {course?.modules.map((m) => (
                <div key={m.id}>
                  <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{m.title}</p>
                  {m.lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/lessons/${l.id}`}
                      className={`block rounded-md px-2 py-1.5 text-sm ${
                        l.id === params.id ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {l.title}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
