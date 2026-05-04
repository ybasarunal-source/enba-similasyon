@echo off
REM ============================================================
REM  wiki-commit.bat — Enba Wiki otomatik commit scripti
REM  Kullanim: wiki-commit "isteğe bağlı mesaj"
REM  Varsayilan: tarihe gore otomatik mesaj
REM ============================================================

set PROJE=C:\Users\Fujitsu\OneDrive\Desktop\Enba Similasyon
set VAULT=C:\Users\Fujitsu\OneDrive\Desktop\Enba_Obsidian_Vault

REM Mesaj parametresi verilmediyse otomatik olustur
if "%~1"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set TARIH=%%c-%%b-%%a
    for /f "tokens=1-2 delims=: " %%a in ("%time%") do set SAAT=%%a:%%b
    set COMMIT_MSG=wiki: oturum guncelleme %TARIH% %SAAT%
) else (
    set COMMIT_MSG=%~1
)

echo.
echo =============================================
echo  ENBA WIKI AUTO-COMMIT
echo =============================================

REM --- 1. PROJE REPO ---
echo.
echo [1/2] Proje reposu guncelleniyor...
cd /d "%PROJE%"

git add CLAUDE.md 2>nul
git add wiki\ 2>nul
git add Enba_Obsidian_Vault\ 2>nul

git diff --cached --quiet
if %errorlevel%==0 (
    echo      Proje reposunda degisiklik yok, atlaniyor.
) else (
    git commit -m "%COMMIT_MSG%"
    git push origin main
    echo      Proje reposu guncellendi.
)

REM --- 2. VAULT KLASORU (proje icindeyse) ---
echo.
echo [2/2] Wiki vault kontrol ediliyor...
if exist "%PROJE%\Enba_Obsidian_Vault\" (
    cd /d "%PROJE%"
    git add Enba_Obsidian_Vault\
    git diff --cached --quiet
    if %errorlevel%==0 (
        echo      Vault degisikligi yok.
    ) else (
        git commit -m "wiki: vault %COMMIT_MSG%"
        git push origin main
        echo      Vault guncellendi.
    )
) else if exist "%VAULT%\" (
    echo      Vault ayri konumda: %VAULT%
    echo      Vault icin ayri git repo gerekiyor.
    echo      Obsidian Git eklentisi bunu otomatik yapar.
)

echo.
echo =============================================
echo  TAMAMLANDI: %COMMIT_MSG%
echo =============================================
echo.
pause
