/**
 * ASISTEN - Electron Main Process
 * Loads the Express server directly in-process and opens a BrowserWindow
 */

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const PORT = process.env.APP_PORT || 3000;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/**
 * Determine the app root directory (works both packaged and dev)
 */
function getAppRoot() {
  if (app.isPackaged) {
    // Packaged: resources/app.asar/src/main/main.js → resources/app.asar
    return path.join(__dirname, '../..');
  }
  // Development: src/main/main.js → project root
  return path.join(__dirname, '../..');
}

/**
 * Start the Express server by requiring it directly
 */
function startServer() {
  return new Promise((resolve, reject) => {
    try {
      const appRoot = getAppRoot();

      // Set env vars before requiring server
      process.env.NODE_ENV = 'production';
      process.env.APP_PORT = String(PORT);

      // Load .env manually if dotenv/config hasn't been loaded
      const envPath = path.join(appRoot, '.env');
      if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        // Override port in case .env had a different one
        process.env.APP_PORT = String(PORT);
      }

      // For Electron packaged app, set DATABASE_URL to absolute path
      if (app.isPackaged) {
        const userDataPath = app.getPath('userData');

        // Load config.json to check for custom DATA_PATH
        let customDataPath = null;
        const configPath = path.join(userDataPath, 'config.json');
        if (fs.existsSync(configPath)) {
          try {
            const configRaw = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(configRaw);
            if (config.dataPath && fs.existsSync(config.dataPath)) {
              customDataPath = config.dataPath;
              console.log('Using custom DATA_PATH from config.json:', customDataPath);
            } else if (config.dataPath) {
              console.warn('Custom DATA_PATH from config.json not found, using default:', config.dataPath);
            }
          } catch (err) {
            console.error('Error reading config.json:', err);
          }
        }

        const effectiveDataPath = customDataPath || userDataPath;
        const dbDir = path.join(effectiveDataPath, 'data');
        const dbPath = path.join(dbDir, 'database.db');
        const srcDbPath = path.join(appRoot, 'prisma', 'database.db');

        // Ensure data directory exists
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }

        // Copy database to userData on first run
        if (!fs.existsSync(dbPath) && fs.existsSync(srcDbPath)) {
          fs.copyFileSync(srcDbPath, dbPath);
          console.log('Copied database to:', dbPath);
        }

        process.env.DATABASE_URL = `file:${dbPath}`;

        // Set upload path
        const uploadPath = path.join(effectiveDataPath, 'uploads');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        process.env.DATA_PATH = effectiveDataPath;
        // Always keep original userData path for config.json
        process.env.USER_DATA_PATH = userDataPath;

        // Template paths
        const templatePath = path.join(effectiveDataPath, 'templates');
        const templateBackupPath = path.join(effectiveDataPath, 'templates_backup');
        if (!fs.existsSync(templatePath)) fs.mkdirSync(templatePath, { recursive: true });
        if (!fs.existsSync(templateBackupPath)) fs.mkdirSync(templateBackupPath, { recursive: true });

        // Copy templates from app bundle on first run
        const srcTemplatePath = path.join(appRoot, 'template_word');
        const altTemplatePath = path.join(process.resourcesPath || '', 'template_word');
        const templateSrc = fs.existsSync(srcTemplatePath) ? srcTemplatePath : (fs.existsSync(altTemplatePath) ? altTemplatePath : null);

        if (templateSrc) {
          const existingTemplates = fs.readdirSync(templatePath).filter(f => f.endsWith('.docx'));
          if (existingTemplates.length === 0) {
            const srcFiles = fs.readdirSync(templateSrc).filter(f => f.endsWith('.docx'));
            for (const file of srcFiles) {
              fs.copyFileSync(path.join(templateSrc, file), path.join(templatePath, file));
            }
            console.log('Copied', srcFiles.length, 'templates to:', templatePath);
          }
          const existingBackup = fs.readdirSync(templateBackupPath).filter(f => f.endsWith('.docx'));
          if (existingBackup.length === 0) {
            const srcFiles = fs.readdirSync(templateSrc).filter(f => f.endsWith('.docx'));
            for (const file of srcFiles) {
              fs.copyFileSync(path.join(templateSrc, file), path.join(templateBackupPath, file));
            }
            console.log('Copied', srcFiles.length, 'templates to backup:', templateBackupPath);
          }
        }

        process.env.TEMPLATE_PATH = templatePath;
        process.env.TEMPLATE_BACKUP_PATH = templateBackupPath;
      }

      // Resolve frontend static path for Electron
      if (app.isPackaged) {
        // extraResources puts frontend/dist at: resources/frontend/dist
        const resourcesPath = path.join(process.resourcesPath, 'frontend', 'dist');
        // Also check app.asar path
        const asarFrontendPath = path.join(appRoot, '..', 'frontend', 'dist');

        if (fs.existsSync(resourcesPath)) {
          process.env.FRONTEND_DIST_PATH = resourcesPath;
        } else if (fs.existsSync(asarFrontendPath)) {
          process.env.FRONTEND_DIST_PATH = asarFrontendPath;
        }
      }

      // Require the compiled server
      const serverPath = path.join(appRoot, 'dist', 'server.js');
      console.log('Loading server from:', serverPath);

      require(serverPath);

      // Give the server a moment to start listening
      setTimeout(() => {
        console.log('Server should be ready on port', PORT);
        resolve();
      }, 2000);

    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../build/icon.png'),
    show: false,
    title: 'ASISTEN',
  });

  // Load the Express server URL
  const url = `http://localhost:${PORT}`;
  console.log('Loading URL:', url);
  mainWindow.loadURL(url);

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Retry loading if server wasn't ready
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load, retrying in 2s...', errorDescription);
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.loadURL(url);
      }
    }, 2000);
  });
}

// ==================== Application Lifecycle ====================

app.whenReady().then(async () => {
  console.log('ASISTEN Electron starting...');
  console.log('App path:', app.getAppPath());
  console.log('Is packaged:', app.isPackaged);

  try {
    await startServer();
    console.log('Server started, creating window...');
    createWindow();
  } catch (error) {
    console.error('Failed to start server:', error);
    dialog.showErrorBox(
      'Server Error',
      `Gagal menjalankan server: ${error.message}\n\nAplikasi akan ditutup.`
    );
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
