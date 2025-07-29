const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;

// Start backend server for production
function startBackendServer() {
  if (backendProcess) return;
  
  const serverPath = path.join(__dirname, 'dist/index.js');
  if (fs.existsSync(serverPath)) {
    backendProcess = spawn('node', [serverPath], {
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'inherit'
    });
    
    backendProcess.on('error', (error) => {
      console.error('Backend server error:', error);
    });
    
    console.log('Lumen QI backend server started');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'resources/icon.png'),
    title: 'Lumen QI - AI Companion',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0a0a0a',
    show: false,
    autoHideMenuBar: true,
    // macOS specific
    vibrancy: process.platform === 'darwin' ? 'ultra-dark' : undefined,
    transparent: process.platform === 'darwin',
    hasShadow: true
  });

  // Start backend in production
  if (!isDev) {
    startBackendServer();
    // Wait for server to start
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5000');
    }, 3000);
  } else {
    mainWindow.loadURL('http://localhost:5000');
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('Lumen QI Desktop Application Started');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) {
      backendProcess.kill();
    }
  });

  // Prevent external navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5000') {
      event.preventDefault();
    }
  });
}

// IPC handlers for native features
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

console.log('Lumen QI - Native Desktop Application');
