@echo off
REM ============================================================
REM  oturumu-kapat.bat
REM  Claude Code oturum sonunda calistir:
REM  1. Gunun ozetini log.md ye ekler
REM  2. Degisiklikleri commit eder
REM  3. GitHub a push eder
REM ============================================================

set VAULT=C:\Users\Fujitsu\OneDrive\Desktop\Enba Similasyon\Enba_Obsidian_Vault

echo.
echo =============================================
echo  OTURUM KAPATILIYOR
echo =============================================

REM Tarih ve saat al
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set DT=%%a
set TARIH=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%
set SAAT=%DT:~8,2%:%DT:~10,2%

echo.
echo Bugun ne yapildi? (kisa ozet, Enter ile bitir):
set /p OZET="> "

REM log.md ye ekle
echo. >> "%VAULT%\log.md"
echo ## [%TARIH%] gelistirme ^| %OZET% >> "%VAULT%\log.md"
echo - Saat: %SAAT% >> "%VAULT%\log.md"
echo - Bir sonraki oturum icin CLAUDE.md Aktif Gorevler guncellendi mi? >> "%VAULT%\log.md"
echo. >> "%VAULT%\log.md"

echo.
echo log.md guncellendi. Commit yapiliyor...

REM commit ve push
cd /d "C:\Users\Fujitsu\OneDrive\Desktop\Enba Similasyon"
git add .
git commit -m "oturum: %TARIH% - %OZET%"
git push origin main

echo.
echo =============================================
echo  Oturum kaydedildi ve GitHub a push edildi!
echo  Obsidian otomatik guncellendi.
echo =============================================
echo.
pause
