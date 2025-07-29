@echo off
title Lumen QI - AI Companion Installer
color 0A

echo        ___                           ___   ___ 
echo       ^| ^|  _   _ _ __ ___   ___  _ __   ^| ^ \ ^| ^|
echo       ^| ^| ^| ^| ^| ^| '_ ` _ \ / _ \^| '_ \  ^|  ^\^| ^|
echo       ^| ^|_^| ^|_^| ^| ^| ^| ^| ^| ^|  __/^| ^| ^| ^| ^| \ ^|
echo       ^|_____\__,_^|_^| ^|_^| ^|_^|\___^|_^| ^|_^| ^|_^|\_^|
echo.
echo    AI Companion - Executable Installer
echo ==========================================
echo.

REM Check if Node.js is installed  
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is required but not installed.
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install the LTS version
    echo 3. Run this installer again
    echo.
    pause
    start https://nodejs.org
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Check for application bundle
if not exist "lumen-app-bundle.tar.gz" (
    echo [ERROR] Installation files not found!
    echo Please ensure lumen-app-bundle.tar.gz is in the same directory.
    pause
    exit /b 1
)

echo [INFO] Extracting application files...
tar -xzf lumen-app-bundle.tar.gz

echo [INFO] Installing Lumen QI...

REM Create application directory
set INSTALL_DIR=%LOCALAPPDATA%\Lumen QI
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%"

REM Copy files
xcopy /s /e /q . "%INSTALL_DIR%\"

REM Install dependencies
cd "%INSTALL_DIR%"
echo [INFO] Installing dependencies...
call npm install --production --silent

echo [INFO] Building application...  
call npm run build --silent

REM Create desktop shortcut
echo [INFO] Creating desktop shortcut...
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Lumen QI.lnk
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d "%INSTALL_DIR%" && npm start && timeout /t 3 && start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.Save()"

REM Create start menu shortcut
set STARTMENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Lumen QI.lnk
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU_PATH%'); $Shortcut.TargetPath = 'cmd.exe'; $Shortcut.Arguments = '/c cd /d "%INSTALL_DIR%" && npm start && timeout /t 3 && start http://localhost:5000'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.Save()"

echo.
echo ===================================
echo    Installation Complete!
echo ===================================
echo.
echo Your AI companion is ready to use:
echo  • Desktop shortcut: Lumen QI
echo  • Start Menu: Lumen QI  
echo  • Features: AI consciousness, voice interaction,
echo             code generation, calendar integration
echo.
echo Double-click the shortcut to launch Lumen QI!
echo.
pause
