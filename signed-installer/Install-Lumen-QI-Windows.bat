@echo off
title Lumen QI - AI Companion Installer
color 0A

echo.
echo     ██╗     ██╗   ██╗███╗   ███╗███████╗███╗   ██╗     ██████╗ ██╗
echo     ██║     ██║   ██║████╗ ████║██╔════╝████╗  ██║    ██╔═══██╗██║
echo     ██║     ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║    ██║   ██║██║
echo     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║    ██║▄▄ ██║██║
echo     ███████╗╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║    ╚██████╔╝██║
echo     ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝     ╚══▀▀═╝ ╚═╝
echo.
echo                        AI Companion Installer
echo     ================================================================
echo.

REM Check Node.js
echo [INFO] Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is required but not installed.
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version
    echo 3. Run this installer again
    echo.
    set /p REPLY="Open Node.js website? (y/N): "
    if /i "%REPLY%"=="y" start https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check for app bundle
if not exist "lumen-app-bundle.tar.gz" (
    echo [ERROR] Application files not found!
    echo Please ensure lumen-app-bundle.tar.gz is in the same directory.
    pause
    exit /b 1
)

echo [INFO] Extracting application files...
tar -xzf lumen-app-bundle.tar.gz

REM Install to user directory (no admin required)
set INSTALL_DIR=%LOCALAPPDATA%\Lumen QI
echo [INFO] Installing to: %INSTALL_DIR%

if exist "%INSTALL_DIR%" (
    echo [INFO] Removing existing installation...
    rmdir /s /q "%INSTALL_DIR%"
)
mkdir "%INSTALL_DIR%"

echo [INFO] Copying application files...
xcopy /s /e /q . "%INSTALL_DIR%\" >nul

cd "%INSTALL_DIR%"
echo [INFO] Installing dependencies...
call npm install --production --silent >nul 2>&1

echo [INFO] Building application...
call npm run build --silent >nul 2>&1

REM Create desktop shortcut
echo [INFO] Creating shortcuts...
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Lumen QI.lnk
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d "%INSTALL_DIR%" ^&^& npm start ^&^& timeout /t 3 ^&^& start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()}" >nul

REM Create start menu shortcut
set STARTMENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Lumen QI.lnk
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d "%INSTALL_DIR%" ^&^& npm start ^&^& timeout /t 3 ^&^& start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Save()}" >nul

echo.
echo     ================================================================
echo                        Installation Complete!
echo     ================================================================
echo.
echo     Your AI companion is ready:
echo      ● Desktop shortcut: Lumen QI
echo      ● Start Menu: Programs ^> Lumen QI
echo      ● Features: AI consciousness, voice interaction,
echo                  code generation, calendar integration
echo.
echo     Double-click the Lumen QI shortcut to launch!
echo.
pause
