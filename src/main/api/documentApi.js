/**
 * Document API - Document Management and Generation
 *
 * Handles file attachments and professional PDF document generation
 */

const BaseApi = require('./baseApi');
const { attachmentSchemas, createValidator } = require('./validator');
const { FileError, BusinessError, ERROR_CODES } = require('../utils/errorHandler');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const DocumentGenerator = require('../services/documentGenerator');

// Allowed file types
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

class DocumentApi extends BaseApi {
  constructor(database) {
    super(database, 'document');

    // Create validators
    this.validateCreate = createValidator(attachmentSchemas.create);
    this.validateFilter = createValidator(attachmentSchemas.filter);

    // Document storage path
    this.documentsPath = null;

    // Document generator (initialized lazily)
    this._documentGenerator = null;
  }

  /**
   * Get or create document generator instance
   */
  get documentGenerator() {
    if (!this._documentGenerator && this.db) {
      this._documentGenerator = new DocumentGenerator(this.db);
    }
    return this._documentGenerator;
  }

  /**
   * Initialize document storage
   */
  initializeStorage() {
    if (this.documentsPath) return;

    try {
      const userDataPath = app.getPath('userData');
      this.documentsPath = path.join(userDataPath, 'documents');

      if (!fs.existsSync(this.documentsPath)) {
        fs.mkdirSync(this.documentsPath, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Failed to initialize document storage', { error });
    }
  }

  /**
   * Upload and save an attachment
   */
  create(data) {
    return this.execute(() => {
      this.initializeStorage();

      // Validate input
      const validated = this.validateCreate(data);

      // Validate that exactly one parent is specified
      const parents = [validated.request_id, validated.contract_id, validated.payment_id]
        .filter(p => p !== null && p !== undefined);

      if (parents.length !== 1) {
        throw new BusinessError(
          ERROR_CODES.VALIDATION_FAILED,
          'Attachment must be linked to exactly one request, contract, or payment',
          { request_id: validated.request_id, contract_id: validated.contract_id, payment_id: validated.payment_id }
        );
      }

      // Validate file size
      if (validated.file_size && validated.file_size > MAX_FILE_SIZE) {
        throw FileError.sizeExceeded(MAX_FILE_SIZE, validated.file_size);
      }

      // Validate mime type
      if (validated.mime_type && !ALLOWED_MIME_TYPES[validated.mime_type]) {
        throw FileError.typeNotAllowed(validated.mime_type, Object.keys(ALLOWED_MIME_TYPES));
      }

      return this.db.createAttachment(validated);
    }, { action: 'create', file_type: data.file_type });
  }

  /**
   * Get attachments with optional filters
   */
  getAll(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter(filters);
      return this.db.getAttachments(validated);
    }, { action: 'getAll', filters });
  }

  /**
   * Get attachments for a request
   */
  getByRequest(requestId) {
    return this.execute(() => {
      return this.db.getAttachments({ request_id: requestId });
    }, { action: 'getByRequest', requestId });
  }

  /**
   * Get attachments for a contract
   */
  getByContract(contractId) {
    return this.execute(() => {
      return this.db.getAttachments({ contract_id: contractId });
    }, { action: 'getByContract', contractId });
  }

  /**
   * Get attachments for a payment
   */
  getByPayment(paymentId) {
    return this.execute(() => {
      return this.db.getAttachments({ payment_id: paymentId });
    }, { action: 'getByPayment', paymentId });
  }

  /**
   * Delete an attachment
   */
  delete(id) {
    return this.execute(() => {
      return this.db.deleteAttachment(id);
    }, { action: 'delete', id });
  }

  /**
   * Save file from buffer/base64
   */
  saveFile(fileData, fileName, options = {}) {
    return this.execute(() => {
      this.initializeStorage();

      const { subFolder = 'general' } = options;
      const folderPath = path.join(this.documentsPath, subFolder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Generate unique filename
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      const uniqueName = `${baseName}-${Date.now()}${ext}`;
      const filePath = path.join(folderPath, uniqueName);

      // Convert base64 to buffer if needed
      let buffer;
      if (typeof fileData === 'string') {
        // Assume base64
        const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        buffer = fileData;
      }

      // Write file
      fs.writeFileSync(filePath, buffer);

      return {
        filePath,
        fileName: uniqueName,
        originalName: fileName,
        fileSize: buffer.length
      };
    }, { action: 'saveFile', fileName });
  }

  /**
   * Read file contents
   */
  readFile(filePath) {
    return this.execute(() => {
      if (!fs.existsSync(filePath)) {
        throw FileError.notFound(filePath);
      }

      const buffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);

      return {
        buffer,
        size: stats.size,
        modified: stats.mtime
      };
    }, { action: 'readFile', filePath });
  }

  /**
   * Delete file from disk
   */
  deleteFile(filePath) {
    return this.execute(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { deleted: true, filePath };
      }
      return { deleted: false, filePath };
    }, { action: 'deleteFile', filePath });
  }

  // ==================== PDF Generation ====================

  /**
   * Generate procurement request PDF
   */
  generateRequestPdf(requestId) {
    return this.execute(() => {
      const PDFDocument = require('pdfkit');

      const request = this.db.getRequestWithDetails(requestId);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Request not found',
          { requestId }
        );
      }

      this.initializeStorage();

      const pdfPath = path.join(
        this.documentsPath,
        'generated',
        `request-${request.request_number.replace(/\//g, '-')}.pdf`
      );

      // Ensure directory exists
      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text('NOTA DINAS PERMINTAAN PENGADAAN', { align: 'center' });

      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
        .text(`Nomor: ${request.request_number}`, { align: 'center' });

      doc.moveDown(2);

      // Request details
      const details = [
        ['Tanggal', new Date(request.created_at).toLocaleDateString('id-ID')],
        ['Tier', request.tier.toUpperCase()],
        ['Unit', request.unit],
        ['Nama Barang/Jasa', request.item_name],
        ['Deskripsi', request.description || '-'],
        ['Spesifikasi', request.specifications || '-'],
        ['Jumlah', request.quantity || 1],
        ['Perkiraan Nilai', `Rp ${Number(request.estimated_value).toLocaleString('id-ID')}`],
        ['Kode Anggaran', request.budget_code],
        ['Status', request.status.toUpperCase()],
        ['Urgensi', request.urgency.toUpperCase()]
      ];

      for (const [label, value] of details) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(String(value));
        doc.moveDown(0.5);
      }

      // Approval history
      if (request.approvals && request.approvals.length > 0) {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Riwayat Persetujuan');
        doc.moveDown(0.5);

        for (const approval of request.approvals) {
          doc.fontSize(10).font('Helvetica')
            .text(`Step ${approval.step_number}: ${approval.approver_role} - ${approval.action || 'Pending'}`)
            .text(`   ${approval.comments || '-'}`, { color: 'gray' });
          doc.moveDown(0.3);
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica')
        .text(`Dokumen ini digenerate otomatis pada ${new Date().toLocaleString('id-ID')}`, {
          align: 'center',
          color: 'gray'
        });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filePath: pdfPath,
            fileName: path.basename(pdfPath),
            requestNumber: request.request_number
          });
        });
        stream.on('error', reject);
      });
    }, { action: 'generateRequestPdf', requestId });
  }

  /**
   * Generate contract PDF
   */
  generateContractPdf(contractId) {
    return this.execute(() => {
      const PDFDocument = require('pdfkit');

      const contract = this.db.getContractById(contractId);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Contract not found',
          { contractId }
        );
      }

      const vendor = this.db.getVendorById(contract.vendor_id);

      this.initializeStorage();

      const pdfPath = path.join(
        this.documentsPath,
        'generated',
        `contract-${contract.contract_number.replace(/\//g, '-')}.pdf`
      );

      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text('SURAT PERINTAH KERJA (SPK)', { align: 'center' });

      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
        .text(`Nomor: ${contract.contract_number}`, { align: 'center' });

      doc.moveDown(2);

      // Contract details
      const details = [
        ['Request Number', contract.request_number || '-'],
        ['Item', contract.item_name || '-'],
        ['Vendor', vendor ? vendor.name : '-'],
        ['NPWP Vendor', vendor ? vendor.npwp || '-' : '-'],
        ['Nilai Kontrak', `Rp ${Number(contract.contract_value).toLocaleString('id-ID')}`],
        ['Metode Pembayaran', contract.payment_method],
        ['Tanggal Mulai', contract.start_date],
        ['Tanggal Selesai', contract.end_date],
        ['Status', contract.status.toUpperCase()]
      ];

      for (const [label, value] of details) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(String(value));
        doc.moveDown(0.5);
      }

      // Payment terms
      if (contract.payment_terms) {
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Ketentuan Pembayaran');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(contract.payment_terms);
      }

      // Signature area
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica')
        .text('Pihak Pertama', 100)
        .text('Pihak Kedua', 400);

      doc.moveDown(3);
      doc.text('____________________', 100)
        .text('____________________', 400);

      doc.text('PPK', 100)
        .text(vendor ? vendor.name : 'Vendor', 400);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filePath: pdfPath,
            fileName: path.basename(pdfPath),
            contractNumber: contract.contract_number
          });
        });
        stream.on('error', reject);
      });
    }, { action: 'generateContractPdf', contractId });
  }

  /**
   * Generate payment voucher PDF
   */
  generatePaymentVoucherPdf(paymentId) {
    return this.execute(() => {
      const PDFDocument = require('pdfkit');

      const payment = this.db.getPaymentById(paymentId);
      if (!payment) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Payment not found',
          { paymentId }
        );
      }

      const contract = this.db.getContractById(payment.contract_id);
      const vendor = contract ? this.db.getVendorById(contract.vendor_id) : null;

      this.initializeStorage();

      const pdfPath = path.join(
        this.documentsPath,
        'generated',
        `payment-${payment.payment_number.replace(/\//g, '-')}-${paymentId.slice(0, 8)}.pdf`
      );

      const pdfDir = path.dirname(pdfPath);
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text('KUITANSI PEMBAYARAN', { align: 'center' });

      doc.moveDown(2);

      // Payment details
      const details = [
        ['Nomor Pembayaran', payment.payment_number],
        ['Nomor Kontrak', payment.contract_number || '-'],
        ['Vendor', vendor ? vendor.name : '-'],
        ['Jumlah', `Rp ${Number(payment.amount).toLocaleString('id-ID')}`],
        ['Tanggal Jatuh Tempo', payment.due_date || '-'],
        ['Tanggal Pembayaran', payment.payment_date || '-'],
        ['Metode', payment.payment_method || '-'],
        ['No. Referensi', payment.reference_number || '-'],
        ['Status', payment.status.toUpperCase()]
      ];

      for (const [label, value] of details) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(String(value));
        doc.moveDown(0.5);
      }

      // Notes
      if (payment.notes) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('Catatan:');
        doc.fontSize(10).font('Helvetica').text(payment.notes);
      }

      // Signature
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica')
        .text('Yang Menerima,', 100)
        .text('Yang Membayar,', 350);

      doc.moveDown(3);
      doc.text('____________________', 100)
        .text('____________________', 350);

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          resolve({
            filePath: pdfPath,
            fileName: path.basename(pdfPath),
            paymentNumber: payment.payment_number
          });
        });
        stream.on('error', reject);
      });
    }, { action: 'generatePaymentVoucherPdf', paymentId });
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return this.execute(() => {
      this.initializeStorage();

      const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {}
      };

      const walkDir = (dir) => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const fileStat = fs.statSync(filePath);

          if (fileStat.isDirectory()) {
            walkDir(filePath);
          } else {
            stats.totalFiles++;
            stats.totalSize += fileStat.size;

            const ext = path.extname(file).toLowerCase();
            stats.byType[ext] = (stats.byType[ext] || 0) + 1;
          }
        }
      };

      walkDir(this.documentsPath);

      return stats;
    }, { action: 'getStorageStats' });
  }

  // ==================== Professional Document Generation ====================

  /**
   * Generate Kwitansi (Official Receipt)
   * @param {string} requestId - Request ID
   * @param {object} options - Additional options
   */
  generateKwitansi(requestId, options = {}) {
    return this.execute(async () => {
      const request = this.db.getRequestWithDetails(requestId);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Request not found',
          { requestId }
        );
      }

      const requestData = {
        ...request,
        ...options,
        id: requestId,
        sequence: options.sequence || await this._getNextSequence('kwitansi')
      };

      return this.documentGenerator.generateKwitansi(requestData);
    }, { action: 'generateKwitansi', requestId });
  }

  /**
   * Generate SPP (Surat Permintaan Pembayaran)
   * @param {string} requestId - Request ID
   * @param {object} options - Additional options
   */
  generateSPP(requestId, options = {}) {
    return this.execute(async () => {
      const request = this.db.getRequestWithDetails(requestId);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Request not found',
          { requestId }
        );
      }

      const requestData = {
        ...request,
        ...options,
        id: requestId,
        sequence: options.sequence || await this._getNextSequence('spp')
      };

      return this.documentGenerator.generateSPP(requestData);
    }, { action: 'generateSPP', requestId });
  }

  /**
   * Generate SPM (Surat Perintah Membayar)
   * @param {string} requestId - Request ID
   * @param {object} options - Additional options (bank details, tax info)
   */
  generateSPM(requestId, options = {}) {
    return this.execute(async () => {
      const request = this.db.getRequestWithDetails(requestId);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Request not found',
          { requestId }
        );
      }

      // Get related contract and vendor if available
      let contract = null;
      let vendor = null;

      try {
        const contracts = this.db.prepare(`
          SELECT * FROM contracts WHERE request_id = ? ORDER BY created_at DESC LIMIT 1
        `).all(requestId);

        if (contracts.length > 0) {
          contract = contracts[0];
          vendor = this.db.getVendorById(contract.vendor_id);
        }
      } catch (e) {
        // Contract might not exist
      }

      const requestData = {
        ...request,
        ...options,
        id: requestId,
        sequence: options.sequence || await this._getNextSequence('spm'),
        vendor_name: vendor?.name || options.vendor_name,
        bank_name: vendor?.bank_name || options.bank_name,
        bank_account: vendor?.bank_account || options.bank_account,
        bank_account_name: vendor?.bank_account_name || options.bank_account_name
      };

      return this.documentGenerator.generateSPM(requestData);
    }, { action: 'generateSPM', requestId });
  }

  /**
   * Generate Contract document
   * @param {string} contractId - Contract ID
   * @param {object} options - Additional options
   */
  generateContractDoc(contractId, options = {}) {
    return this.execute(async () => {
      const contract = this.db.getContractById(contractId);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Contract not found',
          { contractId }
        );
      }

      const vendor = this.db.getVendorById(contract.vendor_id);
      const request = contract.request_id
        ? this.db.getRequestWithDetails(contract.request_id)
        : null;

      const contractData = {
        ...contract,
        ...options,
        vendor_name: vendor?.name,
        vendor_npwp: vendor?.npwp,
        vendor_address: vendor?.address,
        vendor_contact_person: options.vendor_contact_person || vendor?.name,
        vendor_position: options.vendor_position || 'Direktur',
        item_name: request?.item_name || contract.notes,
        tier: request?.tier || options.tier || 'tier2'
      };

      return this.documentGenerator.generateContract(contractData, contractData.tier);
    }, { action: 'generateContractDoc', contractId });
  }

  /**
   * Generate BAST (Berita Acara Serah Terima)
   * @param {string} contractId - Contract ID
   * @param {object} options - Additional options (inspection result, items)
   */
  generateBAST(contractId, options = {}) {
    return this.execute(async () => {
      const contract = this.db.getContractById(contractId);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Contract not found',
          { contractId }
        );
      }

      const vendor = this.db.getVendorById(contract.vendor_id);
      const request = contract.request_id
        ? this.db.getRequestWithDetails(contract.request_id)
        : null;

      const contractData = {
        ...contract,
        ...options,
        request_id: contract.request_id,
        vendor_name: vendor?.name,
        vendor_contact_person: options.vendor_contact_person || vendor?.name,
        vendor_position: options.vendor_position || 'Direktur',
        item_name: request?.item_name || contract.notes,
        contract_date: contract.signed_date || contract.start_date,
        sequence: options.sequence || await this._getNextSequence('bast')
      };

      return this.documentGenerator.generateBAST(contractData);
    }, { action: 'generateBAST', contractId });
  }

  /**
   * Generate multiple documents in batch
   * @param {array} items - Array of { id, type } objects
   * @param {function} progressCallback - Progress callback
   */
  generateBatch(items, progressCallback = null) {
    return this.execute(async () => {
      const results = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let result;

        try {
          switch (item.type) {
            case 'kwitansi':
              result = await this.generateKwitansi(item.id, item.options || {});
              break;
            case 'spp':
              result = await this.generateSPP(item.id, item.options || {});
              break;
            case 'spm':
              result = await this.generateSPM(item.id, item.options || {});
              break;
            case 'contract':
              result = await this.generateContractDoc(item.id, item.options || {});
              break;
            case 'bast':
              result = await this.generateBAST(item.id, item.options || {});
              break;
            default:
              throw new Error(`Unknown document type: ${item.type}`);
          }

          results.push({ success: true, id: item.id, type: item.type, ...result });
        } catch (error) {
          results.push({ success: false, id: item.id, type: item.type, error: error.message });
        }

        if (progressCallback) {
          progressCallback({
            completed: i + 1,
            total: items.length,
            percentage: Math.round(((i + 1) / items.length) * 100),
            current: item
          });
        }
      }

      return results;
    }, { action: 'generateBatch', count: items.length });
  }

  /**
   * Get generated documents for a request
   * @param {string} requestId - Request ID
   */
  getGeneratedDocuments(requestId) {
    return this.execute(() => {
      return this.documentGenerator.getDocuments(requestId);
    }, { action: 'getGeneratedDocuments', requestId });
  }

  /**
   * Delete a generated document
   * @param {string} documentId - Document ID
   */
  deleteGeneratedDocument(documentId) {
    return this.execute(() => {
      return this.documentGenerator.deleteDocument(documentId);
    }, { action: 'deleteGeneratedDocument', documentId });
  }

  /**
   * Open document folder in file explorer
   * @param {string} requestId - Optional request ID to open specific folder
   */
  openFolder(requestId = null) {
    return this.execute(() => {
      const { shell } = require('electron');
      this.initializeStorage();

      let folderPath = this.documentsPath;

      if (requestId) {
        const year = new Date().getFullYear();
        // Try to find documents for this request
        try {
          const docs = this.documentGenerator.getDocuments(requestId);
          if (docs && docs.length > 0 && docs[0].file_path) {
            folderPath = path.dirname(docs[0].file_path);
          }
        } catch (e) {
          // Use default path
        }
      }

      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      shell.openPath(folderPath);
      return { success: true, path: folderPath };
    }, { action: 'openFolder', requestId });
  }

  /**
   * Get next sequence number for document type
   * @private
   */
  async _getNextSequence(docType) {
    try {
      const year = new Date().getFullYear();
      const result = this.db.prepare(`
        SELECT COUNT(*) as count FROM documents
        WHERE doc_type = ? AND strftime('%Y', created_at) = ?
      `).get(docType, year.toString());

      return (result?.count || 0) + 1;
    } catch (e) {
      return 1;
    }
  }
}

// Export singleton instance
module.exports = new DocumentApi(null);
module.exports.DocumentApi = DocumentApi;
