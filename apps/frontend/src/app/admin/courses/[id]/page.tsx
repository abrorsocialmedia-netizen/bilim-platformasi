'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { FileUp, Trash2, Upload } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseDetail } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCourseEditorPage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get(`/admin/courses/${params.id}`)
      .then(({ data }) => setCourse(data))
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish() {
    if (!course) return;
    const path = course.status === 'published' ? 'unpublish' : 'publish';
    await api.patch(`/admin/courses/${course.id}/${path}`);
    toast.success(course.status === 'published' ? 'Nashrdan olindi' : 'Nashr qilindi');
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
      toast.success('Video yuklandi');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Video yuklashda xatolik'));
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
      toast.success('Fayl yuklandi');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Fayl yuklashda xatolik'));
    } finally {
      setUploading(null);
    }
  }

  if (!course) {
    return (
      <AppShell roles={['admin']}>
        <Skeleton className="h-64 w-full rounded-xl" />
      </AppShell>
    );
  }

  return (
    <AppShell roles={['admin']}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <Badge variant={course.status === 'published' ? 'success' : 'secondary'} className="mt-1">
            {course.status === 'published' ? 'Nashr etilgan' : 'Qoralama'}
          </Badge>
        </div>
        <Button variant="outline" onClick={togglePublish}>
          {course.status === 'published' ? 'Nashrdan olib tashlash' : 'Nashr qilish'}
        </Button>
      </div>

      <div className="space-y-6">
        {course.modules.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2.5">
              <span className="font-medium">{m.title}</span>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteModule(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="divide-y">
              {m.lessons.map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{l.title}</span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteLesson(l.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant={l.videoRef ? 'success' : 'outline'}>{l.videoRef ? 'Video yuklangan' : "Video yo'q"}</Badge>
                    <label className="inline-flex cursor-pointer items-center gap-1 font-medium text-primary hover:underline">
                      <Upload className="h-3.5 w-3.5" />
                      {uploading === l.id ? 'Yuklanmoqda...' : 'Video yuklash'}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadVideo(l.id, e.target.files[0])}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1 font-medium text-primary hover:underline">
                      <FileUp className="h-3.5 w-3.5" />
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
            <CardContent className="border-t p-3">
              <form onSubmit={(e) => addLesson(m.id, e)} className="flex gap-2">
                <Input
                  placeholder="Yangi dars nomi"
                  value={newLessonTitle[m.id] ?? ''}
                  onChange={(e) => setNewLessonTitle({ ...newLessonTitle, [m.id]: e.target.value })}
                />
                <Button type="submit" size="sm">
                  Qo&apos;shish
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <form onSubmit={addModule} className="mt-6 flex gap-2">
        <Input
          placeholder="Yangi modul nomi (masalan, 1-KUN)"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
        />
        <Button type="submit">Modul qo&apos;shish</Button>
      </form>
    </AppShell>
  );
}
