/**
 * ASISTEN - Template Manager Routes
 * Manage Word document templates: list, edit, upload, download, reset
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import multer from 'multer';
import { STORAGE } from '../config/storage';
import { DOCS_BY_TAHAP, ALL_DOCS, TEMPLATE_VARIABLES } from '../config/templateConfig';

const router = Router();

// Multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .docx yang diperbolehkan'));
    }
  },
});

/**
 * Ensure templates are copied from app bundle to user data path
 * Called once on first access
 */
function ensureTemplatesCopied() {
  const templatePath = STORAGE.TEMPLATE_PATH;
  const backupPath = STORAGE.TEMPLATE_BACKUP_PATH;

  // Find source templates (bundled with app)
  const possibleSources = [
    path.join(__dirname, '../../template_word'),
    path.join((process as any).resourcesPath || '', 'template_word'),
  ];

  let sourcePath = '';
  for (const src of possibleSources) {
    if (fs.existsSync(src)) {
      sourcePath = src;
      break;
    }
  }

  if (!sourcePath) {
    console.warn('[TEMPLATE] No source template directory found');
    return;
  }

  // Copy to template path if empty
  if (!fs.existsSync(templatePath) || fs.readdirSync(templatePath).filter(f => f.endsWith('.docx')).length === 0) {
    fs.mkdirSync(templatePath, { recursive: true });
    const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.docx'));
    for (const file of files) {
      fs.copyFileSync(path.join(sourcePath, file), path.join(templatePath, file));
    }
    console.log(`[TEMPLATE] Copied ${files.length} templates to ${templatePath}`);
  }

  // Copy to backup path if empty (for reset feature)
  if (!fs.existsSync(backupPath) || fs.readdirSync(backupPath).filter(f => f.endsWith('.docx')).length === 0) {
    fs.mkdirSync(backupPath, { recursive: true });
    const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.docx'));
    for (const file of files) {
      fs.copyFileSync(path.join(sourcePath, file), path.join(backupPath, file));
    }
    console.log(`[TEMPLATE] Copied ${files.length} templates to backup ${backupPath}`);
  }
}

// Run on module load
ensureTemplatesCopied();

/**
 * Extract text paragraphs from a .docx file
 */
function extractParagraphs(docxPath: string): { index: number; text: string; variables: string[] }[] {
  const content = fs.readFileSync(docxPath);
  const zip = new PizZip(content);
  const xml = zip.file('word/document.xml')?.asText();
  if (!xml) return [];

  const paragraphs: { index: number; text: string; variables: string[] }[] = [];

  // Match <w:p> elements (paragraphs)
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let match;
  let idx = 0;

  while ((match = pRegex.exec(xml)) !== null) {
    const pXml = match[0];

    // Extract all text from <w:t> elements within this paragraph
    const textParts: string[] = [];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pXml)) !== null) {
      textParts.push(tMatch[1]);
    }

    const fullText = textParts.join('');
    if (fullText.trim()) {
      // Find {{ }} variables
      const varRegex = /\{\{([^}]+)\}\}/g;
      const variables: string[] = [];
      let varMatch;
      while ((varMatch = varRegex.exec(fullText)) !== null) {
        variables.push(varMatch[1].trim());
      }

      paragraphs.push({ index: idx, text: fullText, variables });
    }
    idx++;
  }

  return paragraphs;
}

/**
 * Update paragraph text in a .docx file
 * Strategy: for each paragraph, replace the combined text in the first <w:t> and clear the rest
 */
function updateParagraphs(docxPath: string, updates: { index: number; text: string }[]): Buffer {
  const content = fs.readFileSync(docxPath);
  const zip = new PizZip(content);
  let xml = zip.file('word/document.xml')?.asText();
  if (!xml) throw new Error('Tidak dapat membaca document.xml');

  // Build update map
  const updateMap = new Map(updates.map(u => [u.index, u.text]));

  // Process paragraphs
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pIdx = 0;
  const replacements: { start: number; end: number; newXml: string }[] = [];

  let pMatch;
  while ((pMatch = pRegex.exec(xml)) !== null) {
    if (updateMap.has(pIdx)) {
      const newText = updateMap.get(pIdx)!;
      const pXml = pMatch[0];

      // Find all <w:r> runs that contain <w:t>
      const runs: { start: number; end: number; hasText: boolean }[] = [];
      const rRegex = /<w:r[\s>][\s\S]*?<\/w:r>/g;
      let rMatch;
      while ((rMatch = rRegex.exec(pXml)) !== null) {
        const hasText = /<w:t/.test(rMatch[0]);
        runs.push({ start: rMatch.index, end: rMatch.index + rMatch[0].length, hasText });
      }

      const textRuns = runs.filter(r => r.hasText);

      if (textRuns.length > 0) {
        // Replace text in first run's <w:t>, keep formatting from first run
        let newPXml = pXml;
        // Work backwards to not mess up indices
        for (let i = textRuns.length - 1; i >= 0; i--) {
          const run = textRuns[i];
          const runXml = pXml.substring(run.start, run.end);

          if (i === 0) {
            // First text run: replace content with new text, ensure xml:space="preserve"
            const newRunXml = runXml.replace(
              /<w:t[^>]*>[\s\S]*?<\/w:t>/,
              `<w:t xml:space="preserve">${escapeXml(newText)}</w:t>`
            );
            newPXml = newPXml.substring(0, pMatch.index + run.start) + newRunXml + newPXml.substring(pMatch.index + run.end);
          } else {
            // Subsequent text runs: clear text
            const clearedRunXml = runXml.replace(
              /<w:t[^>]*>[\s\S]*?<\/w:t>/,
              '<w:t xml:space="preserve"></w:t>'
            );
            newPXml = newPXml.substring(0, pMatch.index + run.start) + clearedRunXml + newPXml.substring(pMatch.index + run.end);
          }
        }

        // Recalculate: we modified newPXml relative to start of pXml
        // Actually simpler: rebuild
        let resultP = pXml;
        for (let i = textRuns.length - 1; i >= 0; i--) {
          const run = textRuns[i];
          const runXml = pXml.substring(run.start, run.end);

          if (i === 0) {
            const newRunXml = runXml.replace(
              /<w:t[^>]*>[\s\S]*?<\/w:t>/,
              `<w:t xml:space="preserve">${escapeXml(newText)}</w:t>`
            );
            resultP = resultP.substring(0, run.start) + newRunXml + resultP.substring(run.end);
          } else {
            const clearedRunXml = runXml.replace(
              /<w:t[^>]*>[\s\S]*?<\/w:t>/,
              '<w:t xml:space="preserve"></w:t>'
            );
            resultP = resultP.substring(0, run.start) + clearedRunXml + resultP.substring(run.end);
          }
        }

        replacements.push({
          start: pMatch.index,
          end: pMatch.index + pMatch[0].length,
          newXml: resultP,
        });
      }
    }
    pIdx++;
  }

  // Apply replacements in reverse order
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    xml = xml.substring(0, r.start) + r.newXml + xml.substring(r.end);
  }

  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== Routes ====================

// GET /templates - List all templates per phase
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templatePath = STORAGE.TEMPLATE_PATH;
    const backupPath = STORAGE.TEMPLATE_BACKUP_PATH;
    const result: Record<string, any[]> = {};

    for (const [phase, docs] of Object.entries(DOCS_BY_TAHAP)) {
      result[phase] = [];
      for (const [key, config] of Object.entries(docs)) {
        const filePath = path.join(templatePath, config.template);
        const backupFilePath = path.join(backupPath, config.template);
        const exists = fs.existsSync(filePath);

        let fileInfo: any = {
          key,
          filename: config.template,
          name: config.name,
          exists,
          isCustom: false,
          size: 0,
          modified: null,
        };

        if (exists) {
          const stat = fs.statSync(filePath);
          fileInfo.size = stat.size;
          fileInfo.modified = stat.mtime.toISOString();

          // Check if different from backup (custom)
          if (fs.existsSync(backupFilePath)) {
            const backupStat = fs.statSync(backupFilePath);
            fileInfo.isCustom = stat.size !== backupStat.size || stat.mtime.getTime() !== backupStat.mtime.getTime();
          }
        }

        result[phase].push(fileInfo);
      }
    }

    // Also list templates that exist on disk but not in config
    const allConfigFiles = new Set(Object.values(ALL_DOCS).map(d => d.template));
    const diskFiles = fs.existsSync(templatePath)
      ? fs.readdirSync(templatePath).filter(f => f.endsWith('.docx'))
      : [];

    const uncategorized = diskFiles
      .filter(f => !allConfigFiles.has(f))
      .map(f => {
        const filePath = path.join(templatePath, f);
        const stat = fs.statSync(filePath);
        return {
          key: f.replace('.docx', ''),
          filename: f,
          name: f.replace('.docx', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          exists: true,
          isCustom: false,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      });

    if (uncategorized.length > 0) {
      result['LAINNYA'] = uncategorized;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[TEMPLATE] List error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /templates/variables - List all template variables
router.get('/variables', async (_req: Request, res: Response) => {
  res.json({ success: true, data: TEMPLATE_VARIABLES });
});

// GET /templates/:filename/download - Download template file
router.get('/:filename/download', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.join(STORAGE.TEMPLATE_PATH, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /templates/:filename/content - Get template paragraphs for editing
router.get('/:filename/content', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.join(STORAGE.TEMPLATE_PATH, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan' });
    }

    const paragraphs = extractParagraphs(filePath);
    res.json({ success: true, data: { filename: safeName, paragraphs } });
  } catch (error: any) {
    console.error('[TEMPLATE] Content read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /templates/:filename/content - Save paragraph changes
router.put('/:filename/content', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { paragraphs } = req.body; // Array of { index, text }
    const safeName = path.basename(filename);
    const filePath = path.join(STORAGE.TEMPLATE_PATH, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan' });
    }

    if (!paragraphs || !Array.isArray(paragraphs)) {
      return res.status(400).json({ success: false, error: 'Data paragraf tidak valid' });
    }

    // Backup current version before overwrite
    const prevPath = filePath + '.prev';
    fs.copyFileSync(filePath, prevPath);

    // Update paragraphs and save
    const newContent = updateParagraphs(filePath, paragraphs);
    fs.writeFileSync(filePath, newContent);

    res.json({ success: true, message: 'Template berhasil disimpan' });
  } catch (error: any) {
    console.error('[TEMPLATE] Content save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /templates/:filename/upload - Upload replacement template
router.post('/:filename/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.join(STORAGE.TEMPLATE_PATH, safeName);

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'File tidak ditemukan' });
    }

    // Validate it's a valid .docx by trying to parse
    try {
      new PizZip(req.file.buffer);
    } catch {
      return res.status(400).json({ success: false, error: 'File bukan format .docx yang valid' });
    }

    // Backup current version
    if (fs.existsSync(filePath)) {
      const prevPath = filePath + '.prev';
      fs.copyFileSync(filePath, prevPath);
    }

    // Write new file
    fs.writeFileSync(filePath, req.file.buffer);

    res.json({ success: true, message: 'Template berhasil diupload' });
  } catch (error: any) {
    console.error('[TEMPLATE] Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /templates/:filename/reset - Reset to original template
router.post('/:filename/reset', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = path.basename(filename);
    const filePath = path.join(STORAGE.TEMPLATE_PATH, safeName);
    const backupFilePath = path.join(STORAGE.TEMPLATE_BACKUP_PATH, safeName);

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ success: false, error: 'Template backup tidak ditemukan' });
    }

    // Copy backup to active
    fs.copyFileSync(backupFilePath, filePath);

    res.json({ success: true, message: 'Template berhasil direset ke versi original' });
  } catch (error: any) {
    console.error('[TEMPLATE] Reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
