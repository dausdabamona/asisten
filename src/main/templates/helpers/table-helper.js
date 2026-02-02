/**
 * Table Helper
 * Utility functions untuk membuat tabel
 */

const { Table, TableRow, TableCell, Paragraph, TextRun, BorderStyle, WidthType, VerticalAlign, AlignmentType } = require('docx');

// Konstanta border untuk tabel
const BORDERS = {
  SINGLE: {
    top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' }
  },
  NONE: {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
    insideHorizontal: { style: BorderStyle.NONE, size: 0 },
    insideVertical: { style: BorderStyle.NONE, size: 0 }
  }
};

/**
 * Buat tabel sederhana dengan data
 * @param {Array} headers - Array header strings
 * @param {Array} rows - Array of arrays berisi data
 * @param {Object} options
 *   - width: '100%' (default)
 *   - borders: BORDERS.SINGLE or BORDERS.NONE
 *   - headerBackground: hex color (default 'D9E1F2')
 * @returns {Table}
 */
function createSimpleTable(headers, rows, options = {}) {
  const {
    width = '100%',
    borders = BORDERS.SINGLE,
    headerBackground = 'D9E1F2'
  } = options;

  // Header row
  const headerCells = headers.map(header => 
    new TableCell({
      children: [new Paragraph({
        text: header,
        bold: true,
        alignment: AlignmentType.CENTER
      })],
      shading: {
        fill: headerBackground,
        type: 'clear'
      },
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100
      }
    })
  );

  const headerRow = new TableRow({
    children: headerCells,
    height: { value: 400, rule: 'auto' }
  });

  // Data rows
  const dataRows = rows.map(row => {
    const cells = row.map(cell => 
      new TableCell({
        children: [new Paragraph({
          text: String(cell || ''),
          alignment: AlignmentType.LEFT
        })],
        margins: {
          top: 80,
          bottom: 80,
          left: 100,
          right: 100
        }
      })
    );
    return new TableRow({
      children: cells
    });
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [headerRow, ...dataRows],
    borders: borders
  });
}

/**
 * Buat tabel key-value (2 kolom)
 * @param {Array} data - Array of {key, value} objects
 * @param {Object} options
 *   - keyWidth: 30 (default percentage)
 *   - valueWidth: 70
 *   - borders: BORDERS.SINGLE
 * @returns {Table}
 */
function createKeyValueTable(data, options = {}) {
  const {
    keyWidth = 30,
    valueWidth = 70,
    borders = BORDERS.SINGLE
  } = options;

  const rows = data.map(item => {
    const keyCell = new TableCell({
      children: [new Paragraph({
        text: item.key,
        bold: true
      })],
      width: {
        size: keyWidth,
        type: WidthType.PERCENTAGE
      },
      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100
      }
    });

    const valueCell = new TableCell({
      children: [new Paragraph({
        text: String(item.value || '')
      })],
      width: {
        size: valueWidth,
        type: WidthType.PERCENTAGE
      },
      margins: {
        top: 100,
        bottom: 100,
        left: 100,
        right: 100
      }
    });

    return new TableRow({
      children: [keyCell, valueCell]
    });
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: rows,
    borders: borders
  });
}

/**
 * Buat tabel tanda tangan (signature table)
 * @param {Array} signatories - Array of {label, name, title, nip} objects
 * @param {number} columnCount - Jumlah kolom (default 2)
 * @returns {Table}
 */
function createSignatureTable(signatories, columnCount = 2) {
  const cells = signatories.map(sig => {
    const cellContent = [
      new Paragraph({
        text: sig.label || '',
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240, line: 240 }
      }),
      new Paragraph({
        text: '',
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240, line: 240 }
      }),
      new Paragraph({
        text: sig.name || '',
        bold: true,
        alignment: AlignmentType.CENTER
      })
    ];

    if (sig.title) {
      cellContent.push(new Paragraph({
        text: sig.title,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240, line: 240 }
      }));
    }

    if (sig.nip) {
      cellContent.push(new Paragraph({
        text: `NIP: ${sig.nip}`,
        alignment: AlignmentType.CENTER
      }));
    }

    return new TableCell({
      children: cellContent,
      borders: BORDERS.NONE,
      margins: {
        top: 100,
        bottom: 100,
        left: 50,
        right: 50
      }
    });
  });

  // Fill remaining cells if signatories < columnCount
  while (cells.length < columnCount) {
    cells.push(new TableCell({
      children: [new Paragraph({ text: '' })],
      borders: BORDERS.NONE
    }));
  }

  // Split into rows of columnCount
  const rows = [];
  for (let i = 0; i < cells.length; i += columnCount) {
    rows.push(new TableRow({
      children: cells.slice(i, i + columnCount)
    }));
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: rows,
    borders: BORDERS.NONE
  });
}

module.exports = {
  BORDERS,
  createSimpleTable,
  createKeyValueTable,
  createSignatureTable
};
