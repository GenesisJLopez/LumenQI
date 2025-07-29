@echo off
title Lumen QI - Native Desktop App Installer
color 0A

echo.
echo     ██████╗ ███████╗███████╗██╗  ██╗████████╗ ██████╗ ██████╗ 
echo     ██╔══██╗██╔════╝██╔════╝██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗
echo     ██║  ██║█████╗  ███████╗█████╔╝    ██║   ██║   ██║██████╔╝
echo     ██║  ██║██╔══╝  ╚════██║██╔═██╗    ██║   ██║   ██║██╔═══╝ 
echo     ██████╔╝███████╗███████║██║  ██╗   ██║   ╚██████╔╝██║     
echo     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     
echo.
echo                    Lumen QI - Native Desktop App Installer
echo     ================================================================
echo.

REM Check Node.js
echo [INFO] Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile 'nodejs.msi'; Start-Process msiexec.exe -Wait -ArgumentList '/I nodejs.msi /quiet'}"
    del nodejs.msi
)

echo [OK] Node.js ready

REM Install desktop app
echo [INFO] Installing Lumen QI Desktop Application...
set INSTALL_DIR=%LOCALAPPDATA%\Lumen QI

if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%"

REM Extract application
tar -xzf lumen-qi-desktop.tar.gz -C "%INSTALL_DIR%"

REM Create desktop shortcut to native app
echo [INFO] Creating desktop shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Lumen QI.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\Lumen QI.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.Save()}"

echo.
echo     ================================================================
echo                        Installation Complete!
echo     ================================================================
echo.
echo     Your AI companion is installed as a native desktop application:
echo      ● Desktop shortcut: Lumen QI
echo      ● Native app (no browser required)
echo      ● Full AI consciousness system
echo      ● Voice interaction and code generation
echo.
echo     Double-click the desktop shortcut to launch!
echo.
pause
