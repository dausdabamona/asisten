/**
 * Document IPC Handlers
 * IPC handlers untuk operasi dokumen dari renderer process
 */

const fs = require('fs');
const path = require('path');
const { app, ipcMain, dialog } = require('electron');

// Import generators
const { tier1Generators } = require('../templates/pengadaan/tier1');
const { tier2Generators } = require('../templates/pengadaan/tier2');
const { tier3Generators } = require('../templates/pengadaan/tier3');
const { perdinGenerators } = require('../templates/perjalanan-dinas');
const { kegiatanGenerators } = require('../templates/kegiatan');
const { pjlpGenerators } = require('../templates/pjlp');
const { keuanganGenerators } = require('../templates/keuangan');

// Konfigurasi path dokumen
const DOCS_PATH = path.join(app.getPath('documents'), 'PPK-ASISTEN', 'dokumen');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_PATH)) {
  fs.mkdirSync(DOCS_PATH, { recursive: true });
}

/**
 * Map dari nama generator ke path file
 */
const generators = {};

/**
 * Register generator
 * @param {string} name - Nama generator (e.g., 'ST', 'SPPD')
 * @param {Function} GeneratorClass - Class generator
 */
function registerGenerator(name, GeneratorClass) {
  generators[name] = GeneratorClass;
}

/**
 * IPC Handler: dokumen:generate
 * Generate dokumen dan simpan ke file
 * @param {string} generatorName - Nama generator
 * @param {Object} data - Data untuk dokumen
 * @param {Object} options - Options (fileName, savePath)
 * @returns {Object} {success, filePath, error}
 */
ipcMain.handle('dokumen:generate', async (event, generatorName, data, options = {}) => {
  try {
    const GeneratorClass = generators[generatorName];
    if (!GeneratorClass) {
      throw new Error(`Generator '${generatorName}' not registered`);
    }

    const generator = new GeneratorClass(data, options);
    const fileName = options.fileName || generator.getSuggestedFilename();
    const savePath = options.savePath || path.join(DOCS_PATH, fileName);

    await generator.generateAndSave(savePath, options);

    return {
      success: true,
      filePath: savePath,
      fileName: path.basename(savePath)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: dokumen:preview
 * Generate dokumen dan return sebagai buffer untuk preview
 * @param {string} generatorName - Nama generator
 * @param {Object} data - Data untuk dokumen
 * @param {Object} options - Options
 * @returns {Object} {success, buffer (base64), error}
 */
ipcMain.handle('dokumen:preview', async (event, generatorName, data, options = {}) => {
  try {
    const GeneratorClass = generators[generatorName];
    if (!GeneratorClass) {
      throw new Error(`Generator '${generatorName}' not registered`);
    }

    const generator = new GeneratorClass(data, options);
    const buffer = await generator.generateBuffer(options);

    return {
      success: true,
      buffer: buffer.toString('base64')
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: dokumen:open
 * Buka file dokumen dengan aplikasi default
 * @param {string} filePath - Path ke file
 * @returns {Object} {success, error}
 */
ipcMain.handle('dokumen:open', async (event, filePath) => {
  try {
    const { shell } = require('electron');
    
    // Verifikasi file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: dokumen:openFolder
 * Buka folder dokumen di file explorer
 * @param {string} folderPath - Path ke folder (default: DOCS_PATH)
 * @returns {Object} {success, error}
 */
ipcMain.handle('dokumen:openFolder', async (event, folderPath = DOCS_PATH) => {
  try {
    const { shell } = require('electron');
    
    // Verifikasi folder exists
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: dokumen:list
 * List semua dokumen di folder
 * @param {string} folderPath - Path ke folder (default: DOCS_PATH)
 * @returns {Object} {success, files, error}
 */
ipcMain.handle('dokumen:list', async (event, folderPath = DOCS_PATH) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return {
        success: true,
        files: []
      };
    }

    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.docx'))
      .map(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);

    return {
      success: true,
      files: files
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: dokumen:delete
 * Hapus file dokumen
 * @param {string} filePath - Path ke file
 * @returns {Object} {success, error}
 */
ipcMain.handle('dokumen:delete', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Inisialisasi dokumen API
 * Panggil ini dari main.js setelah semua generators terdaftar
 */
function initializeDocumentAPI() {
  // Register tier 1 generators
  Object.entries(tier1Generators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register tier 2 generators
  Object.entries(tier2Generators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register tier 3 generators
  Object.entries(tier3Generators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register perjalanan dinas generators
  Object.entries(perdinGenerators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register kegiatan generators
  Object.entries(kegiatanGenerators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register PJLP generators
  Object.entries(pjlpGenerators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  // Register keuangan generators
  Object.entries(keuanganGenerators).forEach(([name, generator]) => {
    registerGenerator(name, generator);
  });

  console.log('Document API initialized');
  console.log(`Available generators: ${Object.keys(generators).join(', ')}`);  console.log(`Total generators: ${Object.keys(generators).length}`);
}

module.exports = {
  registerGenerator,
  initializeDocumentAPI,
  DOCS_PATH,
  generators
};
