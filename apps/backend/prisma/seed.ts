import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('parol123', 10);

  // --- Admin (markaz egasi) ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.uz' },
    update: {},
    create: {
      fullName: 'Markaz Egasi',
      email: 'admin@lms.uz',
      phone: '+998901112233',
      passwordHash,
      role: 'admin',
      emailVerified: true,
      status: 'approved',
    },
  });
  await prisma.userStats.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id } });

  // --- O'qituvchi ---
  const teacher = await prisma.user.upsert({
    where: { email: 'ustoz@lms.uz' },
    update: {},
    create: {
      fullName: 'Aziz Ustoz',
      email: 'ustoz@lms.uz',
      phone: '+998901112244',
      passwordHash,
      role: 'teacher',
      emailVerified: true,
      status: 'approved',
    },
  });
  await prisma.userStats.upsert({ where: { userId: teacher.id }, update: {}, create: { userId: teacher.id } });

  // --- O'quvchi ---
  const student = await prisma.user.upsert({
    where: { email: 'student@lms.uz' },
    update: {},
    create: {
      fullName: 'Dilnoza Karimova',
      email: 'student@lms.uz',
      phone: '+998901112255',
      passwordHash,
      role: 'student',
      emailVerified: true,
      status: 'approved',
    },
  });
  await prisma.userStats.upsert({ where: { userId: student.id }, update: {}, create: { userId: student.id } });

  // --- Config ---
  await prisma.instanceConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, brandName: "Bilim Platformasi" },
  });

  // --- Kurs ---
  const existingCourse = await prisma.course.findFirst({ where: { title: 'Kosmetologiya asoslari' } });
  const course =
    existingCourse ??
    (await prisma.course.create({
      data: {
        title: 'Kosmetologiya asoslari',
        description: "Boshlang'ich kosmetolog uchun to'liq kurs: teri turlari, tozalash, protseduralar.",
        isFree: false,
        price: 1500000,
        durationDays: 120,
        isCertified: true,
        status: 'published',
        teacherId: teacher.id,
        modules: {
          create: [
            {
              title: '1-KUN: Kirish',
              order: 1,
              lessons: {
                create: [
                  { title: 'Kosmetologiyaga kirish', order: 1, description: 'Kasb haqida umumiy tushuncha', durationSec: 600 },
                  { title: 'Teri anatomiyasi', order: 2, description: 'Teri qatlamlari va vazifalari', durationSec: 900 },
                ],
              },
            },
            {
              title: '2-KUN: Amaliyot',
              order: 2,
              lessons: {
                create: [
                  { title: 'Teri tozalash texnikasi', order: 1, description: 'Bosqichma-bosqich tozalash', durationSec: 1200 },
                  { title: 'Niqoblar', order: 2, description: 'Teri turiga qarab niqob tanlash', durationSec: 800 },
                ],
              },
            },
          ],
        },
      },
    }));

  // Ikkinchi kurs (bepul)
  const existingFree = await prisma.course.findFirst({ where: { title: 'Sun\'iy intellekt asoslari' } });
  if (!existingFree) {
    await prisma.course.create({
      data: {
        title: "Sun'iy intellekt asoslari",
        description: "AI va mashinali o'qitish bo'yicha bepul kirish kursi.",
        isFree: true,
        price: 0,
        durationDays: 120,
        isCertified: false,
        aiQaEnabled: true,
        status: 'published',
        teacherId: teacher.id,
        modules: {
          create: [
            {
              title: '1-KUN',
              order: 1,
              lessons: { create: [{ title: 'AI nima?', order: 1, description: 'Umumiy tushuncha', durationSec: 500 }] },
            },
          ],
        },
      },
    });
  }

  // --- Demo o'quvchini kursga faol yozish ---
  const enrollment = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
      status: 'active',
      startDate: new Date(),
      expiresAt: new Date(Date.now() + 120 * 86400000),
      approvedById: admin.id,
      approvedAt: new Date(),
      progressPercent: 0,
    },
  });

  console.log('Seed tayyor.');
  console.log('  Admin:    admin@lms.uz / parol123');
  console.log('  Ustoz:    ustoz@lms.uz / parol123');
  console.log('  Student:  student@lms.uz / parol123');
  console.log(`  Kurslar:  2 ta (biri sertifikatli), o'quvchi "${course.title}" ga yozilgan (enrollment ${enrollment.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
