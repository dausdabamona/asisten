const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Import database and APIs
const DatabaseManager = require('./src/main/database.js');
const PegawaiApi = require('./src/main/api/pegawaiApi');
const SatkerApi = require('./src/main/api/satkerApi');

let mainWindow;
let db;

async function initializeDatabase() {
  console.log('🗄️  Initializing database...');
  db = new DatabaseManager();
  await db.initialize();
  console.log('✅ Database initialized');
  
  // Initialize APIs
  console.log('📡 Registering APIs...');
  const pegawaiApi = new PegawaiApi(db);
  const satkerApi = new SatkerApi(db);
  console.log('✅ APIs registered');
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'src/preload/preload.js');
  
  console.log('🔍 Checking preload script...');
  if (!fs.existsSync(preloadPath)) {
    console.error('❌ Preload script not found at:', preloadPath);
    process.exit(1);
  } else {
    console.log('✅ Preload script found at:', preloadPath);
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false // Development only
    }
  });
  
  mainWindow.webContents.openDevTools();
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded');
    
    // Check if electronAPI is available
    mainWindow.webContents.executeJavaScript(`
      console.log('=== CHECKING electronAPI FROM MAIN ===');
      console.log('typeof window.electronAPI:', typeof window.electronAPI);
      if (window.electronAPI) {
        console.log('✅ electronAPI keys:', Object.keys(window.electronAPI));
      }
      typeof window.electronAPI;
    `).then(result => {
      console.log('electronAPI type from renderer:', result);
    });
  });
  
  // Load static HTML file
  const htmlPath = path.join(__dirname, 'test-static.html');
  console.log('📄 Loading HTML from:', htmlPath);
  mainWindow.loadFile(htmlPath);
}

app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();
  
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
