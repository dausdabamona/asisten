/**
 * Base Document Generator
 * Abstract base class untuk semua document generators
 */

const { Document } = require('docx');
const { generateBuffer, saveDocument } = require('../helpers/doc-helper');
const DOC_CONFIG = require('../config/doc-config');

/**
 * BaseDocumentGenerator - Class utama untuk document generation
 * Pattern: constructor(category, type), validate(data), buildContent(data), generate(data, filePath)
 */
class BaseDocumentGenerator {
  /**
   * Constructor
   * @param {string} category - Kategori dokumen (perjalanan-dinas, pengadaan, kegiatan, etc.)
   * @param {string} type - Tipe dokumen (sppd, surat-tugas, kwitansi, etc.)
   */
  constructor(category, type) {
    this.category = category;
    this.type = type;
    this.options = {
      pageSize: DOC_CONFIG.DEFAULT_PAGE,
      margins: DOC_CONFIG.DEFAULT_MARGIN,
    };
  }

  /**
   * Validasi data sebelum generate
   * Override di subclass untuk validasi spesifik
   * @param {Object} data - Data dokumen
   * @throws {Error} Jika data invalid
   */
  validate(data) {
    if (!data) {
      throw new Error('Data is required for document generation');
    }
  }

  /**
   * Build content dokumen - ABSTRACT METHOD
   * HARUS di-override di subclass
   * @param {Object} data - Data dokumen
   * @returns {Array<Paragraph|Table>} - Array of document elements
   */
  buildContent(data) {
    throw new Error('buildContent() must be implemented in subclass');
  }

  /**
   * Generate dokumen dan simpan ke file
   * @param {Object} data - Data dokumen
   * @param {string} filePath - Path file output
   * @returns {Promise<void>}
   */
  async generate(data, filePath) {
    // Validasi data
    this.validate(data);

    // Build content elements
    const content = this.buildContent(data);

    // Create document with section
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: DOC_CONFIG.PAGE[this.options.pageSize] || DOC_CONFIG.PAGE.A4,
            margin: DOC_CONFIG.MARGINS[this.options.margins] || DOC_CONFIG.MARGINS.NORMAL,
          },
        },
        children: content,
      }],
    });

    // Save to file
    await saveDocument(doc, filePath);
  }

  /**
   * Generate dokumen dan return sebagai buffer
   * @param {Object} data - Data dokumen
   * @returns {Promise<Buffer>}
   */
  async generateBuffer(data) {
    // Validasi data
    this.validate(data);

    // Build content elements
    const content = this.buildContent(data);

    // Create document with section
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: DOC_CONFIG.PAGE[this.options.pageSize] || DOC_CONFIG.PAGE.A4,
            margin: DOC_CONFIG.MARGINS[this.options.margins] || DOC_CONFIG.MARGINS.NORMAL,
          },
        },
        children: content,
      }],
    });

    return await generateBuffer(doc);
  }

  /**
   * Dapatkan suggested filename berdasarkan data
   * Override di subclass untuk custom naming
   * @param {Object} data - Data dokumen
   * @returns {string}
   */
  getSuggestedFilename(data) {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${this.category}-${this.type}-${timestamp}.docx`;
  }
}

/**
 * BaseGenerator - Backward compatibility class (deprecated)
 */
class BaseGenerator {
  constructor(data = {}, options = {}) {
    this.data = data;
    this.options = {
      pageSize: DOC_CONFIG.DEFAULT_PAGE,
      margins: DOC_CONFIG.DEFAULT_MARGIN,
      ...options
    };
    this.document = null;
  }

  validate() {
    if (!this.data) {
      throw new Error('Data is required for document generation');
    }
  }

  buildContent() {
    throw new Error('buildContent() must be implemented in subclass');
  }

  generate(options = {}) {
    const finalOptions = { ...this.options, ...options };
    this.validate();
    const sections = this.buildContent();
    this.document = new Document({
      sections: sections
    });
    return this.document;
  }

  async generateAndSave(filePath, options = {}) {
    const doc = this.generate(options);
    await saveDocument(doc, filePath);
  }

  async generateBuffer(options = {}) {
    const doc = this.generate(options);
    return await generateBuffer(doc);
  }

  getSuggestedFilename() {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `dokumen-${timestamp}.docx`;
  }
}

module.exports = { BaseDocumentGenerator, BaseGenerator };
