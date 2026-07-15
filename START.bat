@echo off
chcp 65001 >nul
title LMS - O'quv Platformasi ishga tushirish
cd /d "%~dp0"

echo ================================================
echo   O'quv Platformasi (LMS) - ishga tushirish
echo ================================================
echo.

REM --- Node.js tekshiruvi ---
where node >nul 2>nul
if errorlevel 1 (
  echo [XATO] Node.js topilmadi.
  echo Iltimos, https://nodejs.org saytidan LTS versiyasini o'rnating va qaytadan urinib ko'ring.
  echo.
  pause
  exit /b 1
)
echo [OK] Node.js topildi.
echo.

REM ================= BACKEND =================
echo [1/4] Backend kutubxonalari o'rnatilmoqda (biroz vaqt oladi)...
cd apps\backend
call npm install
if errorlevel 1 goto :error

echo.
echo [2/4] Ma'lumotlar bazasi jadvallari yaratilmoqda...
call npx prisma migrate deploy
if errorlevel 1 goto :dberror
call npx prisma generate

echo.
echo [3/4] Demo ma'lumot yuklanmoqda (admin/ustoz/o'quvchi)...
call npm run seed

echo.
echo Backend alohida oynada ishga tushirilmoqda...
start "LMS Backend (3001)" cmd /k "npm run start:dev"
cd ..\..

REM ================= FRONTEND =================
echo.
echo [4/4] Frontend kutubxonalari o'rnatilmoqda...
cd apps\frontend
call npm install
if errorlevel 1 goto :error

echo.
echo Frontend alohida oynada ishga tushirilmoqda...
start "LMS Frontend (3000)" cmd /k "npm run dev"
cd ..\..

echo.
echo ================================================
echo   TAYYOR!
echo   Backend:  http://localhost:3001/api
echo   Frontend: http://localhost:3000
echo.
echo   Test akkauntlari (parol: parol123):
echo     admin@lms.uz  /  ustoz@lms.uz  /  student@lms.uz
echo ================================================
echo.
echo Brauzer 10 soniyadan keyin ochiladi...
timeout /t 10 >nul
start http://localhost:3000
echo.
echo Bu oynani yopishingiz mumkin. Serverlar alohida oynalarda ishlayapti.
pause
exit /b 0

:dberror
echo.
echo [XATO] Bazaga ulanib bo'lmadi.
echo Tekshiring: PostgreSQL ishlab turibdimi va apps\backend\.env dagi
echo DATABASE_URL to'g'rimi (lms_user / lms12345 / lms_db).
echo.
pause
exit /b 1

:error
echo.
echo [XATO] Kutubxonalarni o'rnatishda muammo bo'ldi. Internetni tekshiring.
echo.
pause
exit /b 1
