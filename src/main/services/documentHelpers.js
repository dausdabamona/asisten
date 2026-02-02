/**
 * Document Helper Utilities
 * Helper functions for PDF document generation
 */

/**
 * Convert number to Indonesian words (Terbilang)
 * @param {number} amount - The number to convert
 * @returns {string} - Number in Indonesian words
 */
function numberToWords(amount) {
  if (amount === 0) return 'nol';
  if (amount < 0) return 'minus ' + numberToWords(Math.abs(amount));

  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  function terbilang(n) {
    if (n < 12) {
      return satuan[n];
    } else if (n < 20) {
      return satuan[n - 10] + ' belas';
    } else if (n < 100) {
      return satuan[Math.floor(n / 10)] + ' puluh' + (n % 10 !== 0 ? ' ' + satuan[n % 10] : '');
    } else if (n < 200) {
      return 'seratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
    } else if (n < 1000) {
      return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
    } else if (n < 2000) {
      return 'seribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
    } else if (n < 1000000) {
      return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
    } else if (n < 1000000000) {
      return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '');
    } else if (n < 1000000000000) {
      return terbilang(Math.floor(n / 1000000000)) + ' miliar' + (n % 1000000000 !== 0 ? ' ' + terbilang(n % 1000000000) : '');
    } else {
      return terbilang(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 !== 0 ? ' ' + terbilang(n % 1000000000000) : '');
    }
  }

  const result = terbilang(Math.floor(amount));
  return result.charAt(0).toUpperCase() + result.slice(1) + ' rupiah';
}

/**
 * Format date in Indonesian format
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'full', 'short', 'numeric', 'formal'
 * @returns {string} - Formatted date string
 */
function formatDate(date, format = 'full') {
  const d = new Date(date);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const dayName = days[d.getDay()];

  switch (format) {
    case 'full':
      return `${day} ${months[month]} ${year}`;
    case 'formal':
      return `${dayName}, ${day} ${months[month]} ${year}`;
    case 'short':
      return `${day} ${shortMonths[month]} ${year}`;
    case 'numeric':
      return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return `${day} ${months[month]} ${year}`;
  }
}

/**
 * Format currency in Indonesian Rupiah format
 * @param {number} amount - Amount to format
 * @param {boolean} withSymbol - Include Rp symbol
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, withSymbol = true) {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  return withSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Add watermark to PDF document
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} text - Watermark text
 * @param {object} options - Watermark options
 */
function addWatermark(doc, text, options = {}) {
  const {
    color = '#CCCCCC',
    opacity = 0.3,
    fontSize = 60,
    angle = -45
  } = options;

  doc.save();

  // Set opacity
  doc.fillOpacity(opacity);
  doc.fillColor(color);
  doc.fontSize(fontSize);

  // Get page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Calculate center position
  const textWidth = doc.widthOfString(text);
  const x = (pageWidth - textWidth) / 2;
  const y = pageHeight / 2;

  // Rotate and draw watermark
  doc.translate(pageWidth / 2, pageHeight / 2);
  doc.rotate(angle);
  doc.text(text, -textWidth / 2, -fontSize / 2, { lineBreak: false });

  doc.restore();
}

/**
 * Add page numbers to PDF document
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {object} options - Page number options
 */
function addPageNumbers(doc, options = {}) {
  const {
    format = 'Halaman {current} dari {total}',
    position = 'bottom',
    align = 'center',
    fontSize = 10,
    marginBottom = 30
  } = options;

  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const text = format
      .replace('{current}', i + 1)
      .replace('{total}', range.count);

    doc.fontSize(fontSize);
    doc.fillColor('#666666');

    let x;
    const textWidth = doc.widthOfString(text);
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;

    switch (align) {
      case 'left':
        x = margins.left;
        break;
      case 'right':
        x = pageWidth - margins.right - textWidth;
        break;
      case 'center':
      default:
        x = (pageWidth - textWidth) / 2;
    }

    const y = position === 'top'
      ? margins.top - 20
      : doc.page.height - marginBottom;

    doc.text(text, x, y, { lineBreak: false });
  }
}

/**
 * Calculate tax amounts
 * @param {number} baseAmount - Base amount before tax
 * @param {object} options - Tax options
 * @returns {object} - Tax breakdown
 */
function calculateTax(baseAmount, options = {}) {
  const {
    includePPN = true,
    includePPh = true,
    pphRate = 0.015, // PPh 22 = 1.5%
    ppnRate = 0.11   // PPN = 11%
  } = options;

  const result = {
    baseAmount,
    pph: 0,
    ppn: 0,
    totalTax: 0,
    netAmount: baseAmount,
    grossAmount: baseAmount
  };

  if (includePPh) {
    result.pph = Math.round(baseAmount * pphRate);
  }

  if (includePPN) {
    result.ppn = Math.round(baseAmount * ppnRate);
  }

  result.totalTax = result.pph + result.ppn;
  result.netAmount = baseAmount - result.pph;
  result.grossAmount = baseAmount + result.ppn;

  return result;
}

/**
 * Generate document number
 * @param {string} prefix - Document prefix (e.g., 'KW', 'SPP', 'SPM')
 * @param {number} sequence - Sequence number
 * @param {object} options - Number options
 * @returns {string} - Formatted document number
 */
function generateDocumentNumber(prefix, sequence, options = {}) {
  const {
    year = new Date().getFullYear(),
    unitCode = 'PKP-SRG',
    separator = '/',
    padLength = 4
  } = options;

  const paddedSequence = sequence.toString().padStart(padLength, '0');
  return `${paddedSequence}${separator}${prefix}${separator}${unitCode}${separator}${year}`;
}

/**
 * Create standard header for official documents
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {object} settings - Header settings
 */
function createOfficialHeader(doc, settings = {}) {
  const {
    logoPath = null,
    institutionName = 'POLITEKNIK KELAUTAN DAN PERIKANAN SORONG',
    ministryName = 'KEMENTERIAN KELAUTAN DAN PERIKANAN',
    address = 'Jl. Kapitan Pattimura, Tanjung Kasuari, Sorong Manoi',
    phone = '(0951) 321234',
    email = 'poltek.sorong@kkp.go.id',
    website = 'www.polsro.ac.id'
  } = settings;

  const pageWidth = doc.page.width;
  const margins = doc.page.margins;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Logo placeholder (if logo path provided)
  if (logoPath) {
    try {
      doc.image(logoPath, margins.left, margins.top, { width: 60 });
    } catch (e) {
      // Logo not found, skip
    }
  }

  // Institution header
  const textX = logoPath ? margins.left + 70 : margins.left;

  doc.fontSize(10)
    .fillColor('#000000')
    .text(ministryName, textX, margins.top, { align: 'center', width: contentWidth });

  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text(institutionName, textX, doc.y + 2, { align: 'center', width: contentWidth });

  doc.fontSize(9)
    .font('Helvetica')
    .text(address, textX, doc.y + 2, { align: 'center', width: contentWidth });

  doc.text(`Telp: ${phone} | Email: ${email}`, textX, doc.y + 2, { align: 'center', width: contentWidth });

  // Header line
  doc.moveTo(margins.left, doc.y + 10)
    .lineTo(pageWidth - margins.right, doc.y + 10)
    .lineWidth(2)
    .stroke();

  doc.moveTo(margins.left, doc.y + 13)
    .lineTo(pageWidth - margins.right, doc.y + 13)
    .lineWidth(0.5)
    .stroke();

  doc.moveDown(2);
}

/**
 * Create signature block
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {object} signer - Signer information
 * @param {object} options - Signature block options
 */
function createSignatureBlock(doc, signer, options = {}) {
  const {
    x = null,
    y = null,
    width = 200,
    title = '',
    showDate = true,
    dateLocation = 'Sorong'
  } = options;

  const startX = x || doc.x;
  const startY = y || doc.y;

  if (showDate) {
    doc.fontSize(10)
      .text(`${dateLocation}, ${formatDate(new Date(), 'full')}`, startX, startY, { width });
  }

  if (title) {
    doc.fontSize(10)
      .text(title, startX, doc.y + 5, { width });
  }

  // Signature space
  doc.moveDown(4);

  // Name and NIP
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .text(signer.name || '___________________', startX, doc.y, { width, underline: !!signer.name });

  doc.font('Helvetica')
    .fontSize(9)
    .text(`NIP. ${signer.nip || '___________________'}`, startX, doc.y + 2, { width });
}

/**
 * Create a table in PDF
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {object} tableData - Table data and configuration
 */
function createTable(doc, tableData) {
  const {
    headers = [],
    rows = [],
    columnWidths = [],
    startX = null,
    startY = null,
    headerBackground = '#E5E5E5',
    headerColor = '#000000',
    borderColor = '#000000',
    fontSize = 9,
    headerFontSize = 9,
    padding = 5,
    rowHeight = 20
  } = tableData;

  const x = startX || doc.page.margins.left;
  let y = startY || doc.y;

  // Calculate column widths if not provided
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const widths = columnWidths.length > 0
    ? columnWidths
    : headers.map(() => pageWidth / headers.length);

  // Draw header
  doc.fontSize(headerFontSize);
  let currentX = x;

  // Header background
  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight)
    .fill(headerBackground);

  // Header text
  headers.forEach((header, i) => {
    doc.fillColor(headerColor)
      .text(header, currentX + padding, y + padding, {
        width: widths[i] - padding * 2,
        height: rowHeight - padding * 2,
        align: 'center'
      });

    // Header border
    doc.rect(currentX, y, widths[i], rowHeight)
      .stroke(borderColor);

    currentX += widths[i];
  });

  y += rowHeight;

  // Draw rows
  doc.fontSize(fontSize);
  rows.forEach((row) => {
    currentX = x;
    const maxHeight = Math.max(rowHeight, ...row.map((cell, i) => {
      const cellText = String(cell);
      return doc.heightOfString(cellText, { width: widths[i] - padding * 2 }) + padding * 2;
    }));

    row.forEach((cell, i) => {
      doc.fillColor('#000000')
        .text(String(cell), currentX + padding, y + padding, {
          width: widths[i] - padding * 2,
          align: i === 0 ? 'left' : (typeof cell === 'number' ? 'right' : 'center')
        });

      doc.rect(currentX, y, widths[i], maxHeight)
        .stroke(borderColor);

      currentX += widths[i];
    });

    y += maxHeight;
  });

  doc.y = y + 10;
  return y;
}

/**
 * Validate document data before generation
 * @param {object} data - Document data
 * @param {array} requiredFields - Required field names
 * @returns {object} - Validation result
 */
function validateDocumentData(data, requiredFields) {
  const errors = [];
  const warnings = [];

  requiredFields.forEach(field => {
    const value = getNestedValue(data, field);
    if (value === undefined || value === null || value === '') {
      errors.push(`Field '${field}' is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get nested value from object using dot notation
 * @param {object} obj - Object to get value from
 * @param {string} path - Dot-notation path
 * @returns {any} - Value at path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) =>
    current && current[key] !== undefined ? current[key] : undefined, obj);
}

/**
 * Safe file path for document storage
 * @param {string} requestNumber - Request number
 * @param {string} docType - Document type
 * @param {string} basePath - Base path for documents
 * @returns {string} - Safe file path
 */
function getDocumentFilePath(requestNumber, docType, basePath) {
  const year = new Date().getFullYear();
  const safeRequestNumber = requestNumber.replace(/[/\\?%*:|"<>]/g, '-');
  const timestamp = Date.now();

  return {
    directory: `${basePath}/${year}/${safeRequestNumber}`,
    filename: `${docType}_${safeRequestNumber}_${timestamp}.pdf`,
    get fullPath() {
      return `${this.directory}/${this.filename}`;
    }
  };
}

module.exports = {
  numberToWords,
  formatDate,
  formatCurrency,
  addWatermark,
  addPageNumbers,
  calculateTax,
  generateDocumentNumber,
  createOfficialHeader,
  createSignatureBlock,
  createTable,
  validateDocumentData,
  getNestedValue,
  getDocumentFilePath
};
