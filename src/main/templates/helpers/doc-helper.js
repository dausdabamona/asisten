/**
 * Document Helper
 * Utility functions untuk membuat elemen dokumen
 */

const { Document, Packer, Paragraph, TextRun, PageBreak, UnderlineType, AlignmentType } = require('docx');

/**
 * Buat dokumen baru
 * @param {Array} sections - Array dari document sections
 * @returns {Document}
 */
function createDocument(sections) {
  return new Document({
    sections: sections || []
  });
}

/**
 * Buat paragraph dengan text run
 * @param {Object} options
 *   - text: string or array of objects {text, bold, italic, underline, size, color}
 *   - align: 'left'|'center'|'right'|'justify'
 *   - spacing: {before, after, line}
 *   - indent: {firstLine, left, right}
 * @returns {Paragraph}
 */
function createParagraph(options = {}) {
  const {
    text = '',
    align = AlignmentType.LEFT,
    spacing = {},
    indent = {},
    style = 'Normal'
  } = options;

  const forceSingleSpacing = options.forceSingleSpacing !== false;
  const resolvedSpacing = forceSingleSpacing
    ? { before: 240, after: 240, line: 240 }
    : {
        before: spacing.before ?? options.spaceBefore ?? 0,
        after: spacing.after ?? options.spaceAfter ?? 0,
        line: spacing.line ?? options.line ?? 240
      };

  let runs = [];

  if (typeof text === 'string') {
    runs = [new TextRun({
      text: text,
      size: options.size ? options.size * 2 : 22
    })];
  } else if (Array.isArray(text)) {
    runs = text.map(t => new TextRun({
      text: t.text || '',
      bold: t.bold || false,
      italics: t.italic || false,
      underline: t.underline ? { type: UnderlineType.SINGLE } : undefined,
      size: (t.size || 11) * 2,
      color: t.color || '000000'
    }));
  }

  return new Paragraph({
    text: text && typeof text === 'string' ? text : undefined,
    children: typeof text !== 'string' ? runs : undefined,
    alignment: align,
    spacing: {
      before: resolvedSpacing.before,
      after: resolvedSpacing.after,
      line: resolvedSpacing.line,
      lineRule: 'auto'
    },
    indent: {
      firstLine: indent.firstLine || 0,
      left: indent.left || 0,
      right: indent.right || 0
    },
    style: style
  });
}

/**
 * Buat spacer (paragraph kosong untuk spacing)
 * @param {number} count - Jumlah line
 * @returns {Array<Paragraph>}
 */
function createSpacer(count = 1) {
  const spacers = [];
  for (let i = 0; i < count; i++) {
    spacers.push(new Paragraph({
      text: ''
    }));
  }
  return spacers;
}

/**
 * Buat page break
 * @returns {Paragraph}
 */
function createPageBreak() {
  return new Paragraph({
    pageBreakBefore: true
  });
}

/**
 * Dapatkan alignment enum dari string
 * @param {string} align - 'left'|'center'|'right'|'justify'
 * @returns {AlignmentType}
 */
function getAlignment(align) {
  const alignMap = {
    'left': AlignmentType.LEFT,
    'center': AlignmentType.CENTER,
    'right': AlignmentType.RIGHT,
    'justify': AlignmentType.JUSTIFIED
  };
  return alignMap[align] || AlignmentType.LEFT;
}

/**
 * Simpan dokumen ke file
 * @param {Document} doc
 * @param {string} filePath
 * @returns {Promise<void>}
 */
async function saveDocument(doc, filePath) {
  const fs = require('fs').promises;
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);
}

/**
 * Generate buffer dari dokumen
 * @param {Document} doc
 * @returns {Promise<Buffer>}
 */
async function generateBuffer(doc) {
  return await Packer.toBuffer(doc);
}

module.exports = {
  createDocument,
  createParagraph,
  createSpacer,
  createPageBreak,
  getAlignment,
  saveDocument,
  generateBuffer
};
