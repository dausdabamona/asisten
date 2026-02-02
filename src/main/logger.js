/**
 * Logger Module for PPK Assistant
 *
 * Provides structured logging with:
 * - Multiple log levels (error, warn, info, debug)
 * - Log rotation (max 10 files, 10MB each)
 * - Separate logs for main process and renderer
 * - Console and file output
 * - Timestamp and source tracking
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Log levels with numeric priority
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Configuration
const CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  logDir: null, // Set on initialization
  currentLevel: 'info',
  enableConsole: true,
  enableFile: true
};

class Logger {
  constructor(source = 'main') {
    this.source = source;
    this.initialized = false;
    this.logStreams = {};
    this.currentLogFiles = {};
  }

  /**
   * Initialize the logger
   */
  initialize() {
    if (this.initialized) return;

    try {
      // Set log directory
      const userDataPath = app.getPath('userData');
      CONFIG.logDir = path.join(userDataPath, 'logs');

      // Ensure log directory exists
      if (!fs.existsSync(CONFIG.logDir)) {
        fs.mkdirSync(CONFIG.logDir, { recursive: true });
      }

      // Set log level from environment
      if (process.env.LOG_LEVEL && LOG_LEVELS[process.env.LOG_LEVEL] !== undefined) {
        CONFIG.currentLevel = process.env.LOG_LEVEL;
      }

      // Enable debug in development
      const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
      if (isDev) {
        CONFIG.currentLevel = 'debug';
      }

      this.initialized = true;
      this.info('Logger initialized', { logDir: CONFIG.logDir, level: CONFIG.currentLevel });
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Get the current log file path for a given type
   */
  getLogFilePath(type = 'main') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(CONFIG.logDir, `${type}-${date}.log`);
  }

  /**
   * Rotate logs if necessary
   */
  rotateLogsIfNeeded(type = 'main') {
    const logPath = this.getLogFilePath(type);

    try {
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size >= CONFIG.maxFileSize) {
          // Rotate: rename current log with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedPath = logPath.replace('.log', `-${timestamp}.log`);
          fs.renameSync(logPath, rotatedPath);

          // Cleanup old logs
          this.cleanupOldLogs(type);
        }
      }
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }

  /**
   * Remove old log files beyond maxFiles limit
   */
  cleanupOldLogs(type = 'main') {
    try {
      const files = fs.readdirSync(CONFIG.logDir)
        .filter(f => f.startsWith(`${type}-`) && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(CONFIG.logDir, f),
          mtime: fs.statSync(path.join(CONFIG.logDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Remove files beyond maxFiles
      if (files.length > CONFIG.maxFiles) {
        files.slice(CONFIG.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Log cleanup failed:', error);
    }
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return {
      formatted: `[${timestamp}] [${level.toUpperCase()}] [${this.source}] ${message}${metaStr}`,
      json: {
        timestamp,
        level,
        source: this.source,
        message,
        ...meta
      }
    };
  }

  /**
   * Write log to file
   */
  writeToFile(level, formattedMessage) {
    if (!CONFIG.enableFile || !this.initialized) return;

    try {
      this.rotateLogsIfNeeded(this.source);
      const logPath = this.getLogFilePath(this.source);
      fs.appendFileSync(logPath, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Core log method
   */
  log(level, message, meta = {}) {
    // Check if level is enabled
    if (LOG_LEVELS[level] > LOG_LEVELS[CONFIG.currentLevel]) {
      return;
    }

    // Initialize if not done
    if (!this.initialized) {
      this.initialize();
    }

    const { formatted, json } = this.formatMessage(level, message, meta);

    // Console output
    if (CONFIG.enableConsole) {
      const consoleMethod = level === 'error' ? 'error' :
                           level === 'warn' ? 'warn' :
                           level === 'debug' ? 'debug' : 'log';
      console[consoleMethod](formatted);
    }

    // File output
    this.writeToFile(level, formatted);

    return json;
  }

  /**
   * Log error with stack trace
   */
  error(message, meta = {}) {
    if (meta instanceof Error) {
      meta = {
        errorName: meta.name,
        errorMessage: meta.message,
        stack: meta.stack
      };
    } else if (meta.error instanceof Error) {
      meta = {
        ...meta,
        errorName: meta.error.name,
        errorMessage: meta.error.message,
        stack: meta.error.stack
      };
      delete meta.error;
    }
    return this.log('error', message, meta);
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }

  /**
   * Create child logger with different source
   */
  child(source) {
    const childLogger = new Logger(source);
    childLogger.initialized = this.initialized;
    return childLogger;
  }

  /**
   * Get log file contents
   */
  getLogContents(type = 'main', lines = 100) {
    try {
      const logPath = this.getLogFilePath(type);
      if (!fs.existsSync(logPath)) {
        return [];
      }

      const content = fs.readFileSync(logPath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines);
    } catch (error) {
      this.error('Failed to read log file', { error });
      return [];
    }
  }

  /**
   * Get all log files info
   */
  getLogFiles() {
    try {
      return fs.readdirSync(CONFIG.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => {
          const filePath = path.join(CONFIG.logDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified - a.modified);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    try {
      const files = fs.readdirSync(CONFIG.logDir).filter(f => f.endsWith('.log'));
      files.forEach(f => fs.unlinkSync(path.join(CONFIG.logDir, f)));
      this.info('All logs cleared');
      return true;
    } catch (error) {
      this.error('Failed to clear logs', { error });
      return false;
    }
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      CONFIG.currentLevel = level;
      this.info(`Log level changed to ${level}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...CONFIG };
  }
}

// Create singleton instances
const mainLogger = new Logger('main');
const rendererLogger = new Logger('renderer');
const databaseLogger = new Logger('database');
const ipcLogger = new Logger('ipc');

// Export factory and instances
module.exports = {
  Logger,
  mainLogger,
  rendererLogger,
  databaseLogger,
  ipcLogger,
  createLogger: (source) => new Logger(source),
  LOG_LEVELS
};
