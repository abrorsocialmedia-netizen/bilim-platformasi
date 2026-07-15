# O'quv Platformasi (LMS)

O'quv markazlari va kurs egalari uchun qayta ishlatiladigan, brendlanadigan onlayn o'quv platformasi. To'liq TZ hujjati loyihaning boshlang'ich topshirig'i sifatida ishlatilgan (`QISM 1 — PRD`, `QISM 2 — TZ`).

## Arxitektura

```
apps/
  backend/   NestJS + PostgreSQL (Prisma) + Redis + Telegraf — REST API
  frontend/  Next.js (App Router) + Tailwind CSS — o'quvchi va admin veb-interfeysi
docker-compose.yml   Postgres, Redis, MinIO (S3-mos obyekt saqlash), backend, frontend
```

Har bir mijoz uchun bitta nusxa (alohida baza + `InstanceConfig` orqali brend/domen/feature-flag sozlamalari) ko'tariladi — TZ 2.1/2.9 bo'limiga mos.

## Asosiy modullar (backend)

| Modul | Vazifasi |
|---|---|
| `auth` | Ro'yxat, email tasdiq kodi, login/refresh/logout, parolni tiklash, qurilma limiti |
| `courses` | Kurslar/modullar/darslar katalogi va admin CRUD |
| `enrollment` | Yozilish, egasi tasdig'i, 4 oylik muddat, kunlik avtoblok croni |
| `video` | Qisqa muddatli imzolangan video havola + watermark ma'lumoti |
| `progress` | Dars tugatish, progress %, sertifikat/XP trigger |
| `qa` | Ustozga savol-javob |
| `gamification` | XP, reyting, faollik issiqlik-xaritasi, streak |
| `certificates` | 100% tugatilganda avtomatik PDF sertifikat |
| `notifications` | Ichki bildirishnomalar |
| `telegram` | Bot: egasiga tasdiq so'rovi (inline tugmalar), o'quvchiga eslatmalar |
| `admin` | Brend/config/feature-flag, analitika |

## Ishga tushirish (lokal — Docker'siz)

> **Faqat PostgreSQL kerak.** Redis kodda ishlatilmaydi. MinIO/S3 esa faqat video/PDF
> yuklash uchun — usiz ilova to'liq ishlaydi (login, kurslar, progress, XP, sertifikat
> yozuvi, admin panel), faqat fayl yuklash o'chiq bo'ladi.

### 1. PostgreSQL o'rnatish va baza yaratish

**Windows:** [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) dan o'rnating.
O'rnatishda qo'ygan `postgres` superuser paroli bilan pgAdmin yoki `psql` orqali:

```sql
CREATE USER lms WITH PASSWORD 'lms_password';
CREATE DATABASE lms OWNER lms;
```

**macOS:** `brew install postgresql@16 && brew services start postgresql@16`
**Linux:** `sudo apt install postgresql && sudo -u postgres psql` (yuqoridagi SQL bilan).

### 2. Backend

```bash
cd apps/backend
cp .env.example .env          # DATABASE_URL allaqachon lokal Postgres uchun sozlangan
npm install
npx prisma migrate deploy     # jadvallarni yaratadi
npx ts-node prisma/seed.ts    # demo ma'lumot (admin/ustoz/o'quvchi + 2 kurs)
npm run start:dev             # http://localhost:3001/api
```

### 3. Frontend (yangi terminalda)

```bash
cd apps/frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Brauzerda **http://localhost:3000** ni oching. Test akkauntlari (parol: `parol123`):
`admin@lms.uz`, `ustoz@lms.uz`, `student@lms.uz`.

> `.env` dagi `DATABASE_URL` standart holatda `postgresql://lms:lms_password@localhost:5432/lms`.
> Agar boshqa parol/port ishlatsangiz, shu qatorni moslang.

> **Ixtiyoriy — video yuklash:** faqat MinIO/S3 kerak bo'lganda. `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data`
> yoki bulutli S3, keyin `lms-media` bucket yarating va `.env` dagi `S3_*` qiymatlarini moslang.

## Muhim muhit o'zgaruvchilari

Barcha o'zgaruvchilar `apps/backend/.env.example` va `apps/frontend/.env.example` fayllarida izohlangan: JWT kalitlari, video token TTL, qurilma limiti (`MAX_DEVICES_PER_USER`), default dostup muddati (`DEFAULT_ENROLLMENT_DURATION_DAYS`), SMTP, Telegram bot tokeni.

## Feature flags (`InstanceConfig.featureFlags`)

`PUT /api/admin/config` orqali boshqariladi: `aiQa`, `forum`, `onlinePayments`, `gamification`, `certificates`. v1 doirasida faqat `gamification` va `certificates` yoqilgan holatda ishlaydi; `aiQa`/`forum`/`onlinePayments` — 2-bosqich uchun joy tayyorlangan (ma'lumotlar modeli va sozlama mavjud, funksional logika yo'q).

## Video himoyasi

`POST /api/lessons/:id/video-token` — dostupni tekshiradi, obyekt-saqlashdan qisqa muddatli (`VIDEO_TOKEN_TTL_SECONDS`, standart 10 daq) imzolangan havola va watermark matnini qaytaradi. Frontendda `ProtectedVideoPlayer` komponenti watermarkni tasodifiy pozitsiyalarda ko'rsatadi, `contextmenu`ni bloklaydi, yuklab olish tugmasini o'chiradi. To'liq DRM (burned-in watermark) uchun kelajakda VdoCipher/Bunny Stream integratsiyasi tavsiya etiladi (TZ 2.5).

## Telegram bot

`TELEGRAM_BOT_TOKEN` va `TELEGRAM_OWNER_CHAT_ID` sozlansa, yangi yozilish so'rovlarida egasiga inline "Tasdiqlash/Rad etish" tugmali xabar boradi. O'quvchi profilidan "Telegramni ulash" orqali `/start <kod>` havolasi bilan akkauntini ulaydi. Webhookni ishga tushirish uchun production muhitda Telegram Bot API'ga `setWebhook` chaqirilishi va `TELEGRAM_WEBHOOK_SECRET` moslashtirilishi kerak.

## Deploy

- Backend + PostgreSQL + Redis: Docker (`docker-compose.yml`) yoki VPS.
- Video/fayllar: S3-mos obyekt saqlash + CDN.
- SSL: Let's Encrypt, kunlik DB backup tavsiya etiladi (TZ 2.9).
- Har yangi mijoz uchun: repo klon → `.env` sozlash (brend, domen, bot tokeni) → migratsiya → deploy.

## Hozircha qamrovga kirmagan (2-bosqich, TZ 1.8)

AI savol-javob (Gemini), Forum, Click/Payme onlayn to'lov, kuchaytirilgan DRM, ko'p tillilik.
