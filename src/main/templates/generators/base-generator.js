/**
 * Base Document Generator
 * Abstract base class untuk semua document generators
 */

const { Document } = require('docx');
const { generateBuffer, saveDocument } = require('../helpers/doc-helper');
const DOC_CONFIG = require('../config/doc-config');

class BaseGenerator {
  /**
   * Constructor
   * @param {Object} data - Data untuk document generation
   * @param {Object} options - Options tambahan
   */
  constructor(data = {}, options = {}) {
    this.data = data;
    this.options = {
      pageSize: DOC_CONFIG.DEFAULT_PAGE,
      margins: DOC_CONFIG.DEFAULT_MARGIN,
      ...options
    };
    this.document = null;
  }

  /**
   * Validasi data sebelum generate
   * Override di subclass untuk validasi spesifik
   * @throws {Error} Jika data invalid
   */
  validate() {
    if (!this.data) {
      throw new Error('Data is required for document generation');
    }
  }

  /**
   * Build content dokumen
   * ABSTRACT: Override di subclass
   * @returns {Array<Section>}
   */
  buildContent() {
    throw new Error('buildContent() must be implemented in subclass');
  }

  /**
   * Generate dokumen
   * @param {Object} options - Override options
   * @returns {Document}
   */
  generate(options = {}) {
    // Merge options
    const finalOptions = { ...this.options, ...options };

    // Validasi data
    this.validate();

    // Build sections
    const sections = this.buildContent();

    // Create document
    this.document = new Document({
      sections: sections
    });

    return this.document;
  }

  /**
   * Generate dan simpan ke file
   * @param {string} filePath - Path file output
   * @param {Object} options - Override options
   * @returns {Promise<void>}
   */
  async generateAndSave(filePath, options = {}) {
    const doc = this.generate(options);
    await saveDocument(doc, filePath);
  }

  /**
   * Generate dan return sebagai buffer
   * @param {Object} options - Override options
   * @returns {Promise<Buffer>}
   */
  async generateBuffer(options = {}) {
    const doc = this.generate(options);
    return await generateBuffer(doc);
  }

  /**
   * Dapatkan suggested filename berdasarkan data
   * Override di subclass untuk custom naming
   * @returns {string}
   */
  getSuggestedFilename() {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `dokumen-${timestamp}.docx`;
  }

  /**
   * Get page size configuration
   * @returns {Object} {width, height}
   */
  getPageSize() {
    const pageSize = this.options.pageSize || DOC_CONFIG.DEFAULT_PAGE;
    return DOC_CONFIG.PAGE[pageSize] || DOC_CONFIG.PAGE[DOC_CONFIG.DEFAULT_PAGE];
  }

  /**
   * Get margins configuration
   * @returns {Object} {top, right, bottom, left}
   */
  getMargins() {
    const margin = this.options.margins || DOC_CONFIG.DEFAULT_MARGIN;
    return DOC_CONFIG.MARGINS[margin] || DOC_CONFIG.MARGINS[DOC_CONFIG.DEFAULT_MARGIN];
  }
}

module.exports = BaseGenerator;
