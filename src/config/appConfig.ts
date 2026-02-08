/**
 * ASISTEN - Application Config (config.json)
 * Load/save user-configurable settings like DATA_PATH
 * Config file location: userData (Electron) or project root (dev)
 */

import path from 'path';
import fs from 'fs';

export interface AppConfig {
  dataPath?: string;
}

const DEFAULT_CONFIG: AppConfig = {};

/**
 * Get config file path.
 * In Electron packaged app: userData/config.json (always original userData, not custom DATA_PATH)
 * In dev: project root/config.json
 */
function getConfigPath(): string {
  // Use original userData path (set by main.js) - never the custom DATA_PATH
  if (process.env.USER_DATA_PATH) {
    return path.join(process.env.USER_DATA_PATH, 'config.json');
  }
  // Fallback for dev: use DATA_PATH or project root
  if (process.env.DATA_PATH) {
    return path.join(process.env.DATA_PATH, 'config.json');
  }
  return path.join(__dirname, '../../config.json');
}

/**
 * Load config from config.json
 */
export function getConfig(): AppConfig {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.error('[CONFIG] Error loading config.json:', error);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save config to config.json
 */
export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log('[CONFIG] Config saved to:', configPath);
}
