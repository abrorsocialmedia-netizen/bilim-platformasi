'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseDetail } from '@/lib/types';

export default function AdminCourseEditorPage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState('');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get(`/admin/courses/${params.id}`)
      .then(({ data }) => setCourse(data))
      .catch((err) => setError(apiErrorMessage(err)));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish() {
    if (!course) return;
    const path = course.status === 'published' ? 'unpublish' : 'publish';
    await api.patch(`/admin/courses/${course.id}/${path}`);
    load();
  }

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    await api.post('/admin/modules', { courseId: params.id, title: newModuleTitle, order: course?.modules.length ?? 0 });
    setNewModuleTitle('');
    load();
  }

  async function deleteModule(moduleId: string) {
    await api.delete(`/admin/modules/${moduleId}`);
    load();
  }

  async function addLesson(moduleId: string, e: React.FormEvent) {
    e.preventDefault();
    const title = newLessonTitle[moduleId];
    if (!title?.trim()) return;
    await api.post('/admin/lessons', { moduleId, title });
    setNewLessonTitle({ ...newLessonTitle, [moduleId]: '' });
    load();
  }

  async function deleteLesson(lessonId: string) {
    await api.delete(`/admin/lessons/${lessonId}`);
    load();
  }

  async function uploadVideo(lessonId: string, file: File) {
    setUploading(lessonId);
    try {
      const { data } = await api.post(`/admin/lessons/${lessonId}/upload-url`, {
        filename: file.name,
        contentType: file.type || 'video/mp4',
        folder: 'videos',
      });
      await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type || 'video/mp4' } });
      await api.patch(`/admin/lessons/${lessonId}`, { videoRef: data.key });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Video yuklashda xatolik'));
    } finally {
      setUploading(null);
    }
  }

  async function uploadMaterial(lessonId: string, file: File) {
    setUploading(lessonId);
    try {
      const { data } = await api.post(`/admin/lessons/${lessonId}/upload-url`, {
        filename: file.name,
        contentType: file.type || 'application/pdf',
        folder: 'materials',
      });
      await axios.put(data.uploadUrl, file, { headers: { 'Content-Type': file.type || 'application/pdf' } });
      await api.post('/admin/materials', { lessonId, title: file.name, fileUrl: data.key, type: 'pdf' });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Fayl yuklashda xatolik'));
    } finally {
      setUploading(null);
    }
  }

  if (error) {
    return (
      <AppShell roles={['admin']}>
        <p className="text-red-600">{error}</p>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell roles={['admin']}>
        <p className="text-gray-400">Yuklanmoqda...</p>
      </AppShell>
    );
  }

  return (
    <AppShell roles={['admin']}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
              course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {course.status === 'published' ? 'Nashr etilgan' : 'Qoralama'}
          </span>
        </div>
        <button onClick={togglePublish} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
          {course.status === 'published' ? "Nashrdan olib tashlash" : 'Nashr qilish'}
        </button>
      </div>

      <div className="space-y-6">
        {course.modules.map((m) => (
          <div key={m.id} className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
              <span className="font-medium">{m.title}</span>
              <button onClick={() => deleteModule(m.id)} className="text-xs text-red-600 hover:underline">
                Modulni o&apos;chirish
              </button>
            </div>
            <div className="divide-y">
              {m.lessons.map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{l.title}</span>
                    <button onClick={() => deleteLesson(l.id)} className="text-xs text-red-600 hover:underline">
                      O&apos;chirish
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>{l.videoRef ? '✅ Video yuklangan' : '⬜ Video yo\'q'}</span>
                    <label className="cursor-pointer text-indigo-600 hover:underline">
                      {uploading === l.id ? 'Yuklanmoqda...' : 'Video yuklash'}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadVideo(l.id, e.target.files[0])}
                      />
                    </label>
                    <label className="cursor-pointer text-indigo-600 hover:underline">
                      PDF qo&apos;shish
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadMaterial(l.id, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => addLesson(m.id, e)} className="flex gap-2 border-t p-3">
              <input
                placeholder="Yangi dars nomi"
                className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                value={newLessonTitle[m.id] ?? ''}
                onChange={(e) => setNewLessonTitle({ ...newLessonTitle, [m.id]: e.target.value })}
              />
              <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
                Qo&apos;shish
              </button>
            </form>
          </div>
        ))}
      </div>

      <form onSubmit={addModule} className="mt-6 flex gap-2">
        <input
          placeholder="Yangi modul nomi (masalan, 1-KUN)"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
        />
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Modul qo&apos;shish</button>
      </form>
    </AppShell>
  );
}
