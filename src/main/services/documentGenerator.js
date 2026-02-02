/**
 * Document Generator Service
 * Professional PDF document generation for procurement workflow
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const {
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
  getDocumentFilePath
} = require('./documentHelpers');

class DocumentGenerator {
  constructor(database, options = {}) {
    this.db = database;
    this.options = {
      basePath: options.basePath || path.join(app.getPath('userData'), 'documents'),
      logoPath: options.logoPath || null,
      institutionSettings: options.institutionSettings || {
        name: 'POLITEKNIK KELAUTAN DAN PERIKANAN SORONG',
        ministry: 'KEMENTERIAN KELAUTAN DAN PERIKANAN',
        address: 'Jl. Kapitan Pattimura, Tanjung Kasuari, Sorong Manoi',
        city: 'Sorong',
        province: 'Papua Barat Daya',
        phone: '(0951) 321234',
        email: 'poltek.sorong@kkp.go.id',
        website: 'www.polsro.ac.id',
        npwp: '00.123.456.7-891.000'
      },
      ...options
    };

    // Ensure base directory exists
    this._ensureDirectory(this.options.basePath);
  }

  /**
   * Ensure directory exists
   * @private
   */
  _ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Create a new PDF document with standard settings
   * @private
   */
  _createDocument(options = {}) {
    return new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      bufferPages: true,
      ...options
    });
  }

  /**
   * Save document to file and database
   * @private
   */
  async _saveDocument(doc, requestId, docType, docNumber) {
    return new Promise((resolve, reject) => {
      try {
        const year = new Date().getFullYear();
        const safeDocNumber = docNumber.replace(/[/\\?%*:|"<>]/g, '-');
        const dirPath = path.join(this.options.basePath, year.toString(), safeDocNumber);
        this._ensureDirectory(dirPath);

        const filename = `${docType}_${Date.now()}.pdf`;
        const filePath = path.join(dirPath, filename);

        const writeStream = fs.createWriteStream(filePath);
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
          const buffer = Buffer.concat(chunks);

          // Save to database
          try {
            if (this.db && requestId) {
              const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              this.db.prepare(`
                INSERT INTO documents (id, request_id, doc_type, doc_number, file_path, file_size, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
              `).run(docId, requestId, docType, docNumber, filePath, buffer.length);
            }
          } catch (dbError) {
            console.error('Failed to save document to database:', dbError);
          }

          resolve({
            success: true,
            filePath,
            buffer,
            size: buffer.length,
            docNumber
          });
        });

        doc.on('error', reject);
        doc.pipe(writeStream);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Kwitansi (Official Receipt)
   * @param {object} requestData - Request data
   * @returns {Promise<object>} - Generated document info
   */
  async generateKwitansi(requestData) {
    const validation = validateDocumentData(requestData, [
      'request_number', 'item_name', 'estimated_value'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const doc = this._createDocument();
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    createOfficialHeader(doc, {
      logoPath: this.options.logoPath,
      institutionName: this.options.institutionSettings.name,
      ministryName: this.options.institutionSettings.ministry,
      address: this.options.institutionSettings.address,
      phone: this.options.institutionSettings.phone,
      email: this.options.institutionSettings.email
    });

    // Document title
    doc.moveDown(1);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('KWITANSI', { align: 'center' });

    const kwitansiNumber = generateDocumentNumber('KW', requestData.sequence || 1);

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nomor: ${kwitansiNumber}`, { align: 'center' });

    doc.moveDown(2);

    // Receipt body
    const labelWidth = 150;
    const valueX = margins.left + labelWidth;

    // Sudah terima dari
    doc.font('Helvetica')
      .fontSize(10)
      .text('Sudah terima dari', margins.left, doc.y);
    doc.text(`: ${this.options.institutionSettings.name}`, valueX, doc.y - 12);
    doc.moveDown(0.5);

    // Uang sejumlah (in words)
    doc.text('Uang sejumlah', margins.left, doc.y);
    const amountWords = numberToWords(requestData.estimated_value);

    // Box for amount in words
    doc.rect(valueX, doc.y - 12, contentWidth - labelWidth, 40)
      .stroke();
    doc.fontSize(9)
      .text(amountWords, valueX + 5, doc.y - 7, {
        width: contentWidth - labelWidth - 10,
        height: 35
      });

    doc.moveDown(3);

    // Untuk pembayaran
    doc.fontSize(10)
      .text('Untuk pembayaran', margins.left, doc.y);

    const paymentPurpose = requestData.description || requestData.item_name;
    doc.text(`: ${paymentPurpose}`, valueX, doc.y - 12, {
      width: contentWidth - labelWidth
    });

    doc.moveDown(1);

    // Amount in numbers (box)
    doc.text('Terbilang', margins.left, doc.y);
    doc.rect(valueX, doc.y - 12, 200, 25)
      .fillAndStroke('#F5F5F5', '#000000');

    doc.fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(formatCurrency(requestData.estimated_value), valueX + 10, doc.y - 8);

    doc.moveDown(3);

    // Tax information
    if (requestData.include_tax !== false) {
      const tax = calculateTax(requestData.estimated_value, {
        includePPN: requestData.include_ppn !== false,
        includePPh: requestData.include_pph !== false
      });

      doc.font('Helvetica')
        .fontSize(9)
        .text('Potongan Pajak:', margins.left, doc.y);

      if (tax.pph > 0) {
        doc.text(`  - PPh Pasal 22 (1.5%): ${formatCurrency(tax.pph)}`, margins.left, doc.y + 2);
      }
      if (tax.ppn > 0) {
        doc.text(`  - PPN (11%): ${formatCurrency(tax.ppn)}`, margins.left, doc.y + 2);
      }
      doc.text(`  - Total Potongan: ${formatCurrency(tax.totalTax)}`, margins.left, doc.y + 2);
      doc.text(`  - Jumlah Bersih: ${formatCurrency(tax.netAmount)}`, margins.left, doc.y + 2);

      doc.moveDown(2);
    }

    // Signatures
    const sigY = doc.y + 20;

    // Left signature (Penerima)
    doc.fontSize(10)
      .text(`${this.options.institutionSettings.city}, ${formatDate(new Date())}`, margins.left, sigY, { width: 200 });
    doc.text('Yang Menerima,', margins.left, doc.y + 5, { width: 200 });
    doc.moveDown(4);
    doc.text('(_____________________)', margins.left, doc.y, { width: 200 });
    doc.fontSize(9)
      .text('Materai Rp 10.000', margins.left, doc.y + 2, { width: 200 });

    // Right signature (Pembayar)
    doc.fontSize(10)
      .text('Yang Membayar,', pageWidth - margins.right - 200, sigY + 17, { width: 200, align: 'center' });
    doc.moveDown(4);
    doc.text(requestData.ppk_name || '(_____________________)', pageWidth - margins.right - 200, doc.y, { width: 200, align: 'center' });
    doc.fontSize(9)
      .text(`NIP. ${requestData.ppk_nip || '___________________'}`, pageWidth - margins.right - 200, doc.y + 2, { width: 200, align: 'center' });

    // Watermark if draft
    if (requestData.status === 'draft') {
      addWatermark(doc, 'DRAFT', { opacity: 0.2 });
    }

    return this._saveDocument(doc, requestData.id, 'kwitansi', kwitansiNumber);
  }

  /**
   * Generate SPP (Surat Permintaan Pembayaran)
   * @param {object} requestData - Request data
   * @returns {Promise<object>} - Generated document info
   */
  async generateSPP(requestData) {
    const validation = validateDocumentData(requestData, [
      'request_number', 'item_name', 'estimated_value', 'budget_code'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const doc = this._createDocument();
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    createOfficialHeader(doc, {
      logoPath: this.options.logoPath,
      institutionName: this.options.institutionSettings.name,
      ministryName: this.options.institutionSettings.ministry,
      address: this.options.institutionSettings.address,
      phone: this.options.institutionSettings.phone,
      email: this.options.institutionSettings.email
    });

    const sppNumber = generateDocumentNumber('SPP', requestData.sequence || 1);

    // Document title
    doc.moveDown(1);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('SURAT PERMINTAAN PEMBAYARAN', { align: 'center' });

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nomor: ${sppNumber}`, { align: 'center' });

    doc.moveDown(2);

    // SPP Details Table
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('I. DATA UMUM', margins.left, doc.y);

    doc.moveDown(0.5);

    const tableData = {
      headers: ['No', 'Uraian', 'Keterangan'],
      columnWidths: [40, 150, contentWidth - 190],
      rows: [
        ['1', 'Nomor Pengajuan', requestData.request_number],
        ['2', 'Tanggal Pengajuan', formatDate(requestData.created_at || new Date())],
        ['3', 'Nama Barang/Jasa', requestData.item_name],
        ['4', 'Unit Pengusul', requestData.unit || '-'],
        ['5', 'Kode Anggaran', requestData.budget_code],
        ['6', 'Tahun Anggaran', new Date().getFullYear().toString()],
        ['7', 'Jumlah (Rp)', formatCurrency(requestData.estimated_value)],
        ['8', 'Terbilang', numberToWords(requestData.estimated_value)]
      ]
    };

    createTable(doc, tableData);

    doc.moveDown(1);

    // Purpose
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('II. TUJUAN PEMBAYARAN', margins.left, doc.y);

    doc.moveDown(0.5);
    doc.font('Helvetica')
      .fontSize(10)
      .text(requestData.description || requestData.item_name, margins.left, doc.y, {
        width: contentWidth,
        align: 'justify'
      });

    doc.moveDown(1);

    // Attachments checklist
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('III. LAMPIRAN', margins.left, doc.y);

    doc.moveDown(0.5);
    doc.font('Helvetica')
      .fontSize(10);

    const attachments = [
      { name: 'Nota Dinas Permintaan', required: true },
      { name: 'Kwitansi', required: true },
      { name: 'Faktur/Invoice', required: true },
      { name: 'Bukti Serah Terima Barang', required: requestData.tier !== 'tier1' },
      { name: 'Surat Perjanjian/Kontrak', required: requestData.tier === 'tier3' },
      { name: 'Berita Acara Pemeriksaan', required: requestData.tier !== 'tier1' },
      { name: 'Foto Dokumentasi', required: false }
    ];

    attachments.forEach((att, idx) => {
      const checkbox = att.required ? '[ ]' : '[  ]';
      const required = att.required ? ' *' : '';
      doc.text(`${idx + 1}. ${checkbox} ${att.name}${required}`, margins.left + 10, doc.y + 2);
    });

    doc.moveDown(0.5);
    doc.fontSize(8)
      .fillColor('#666666')
      .text('* Wajib dilampirkan', margins.left + 10, doc.y);

    doc.moveDown(2);

    // Declaration
    doc.fillColor('#000000')
      .font('Helvetica')
      .fontSize(10)
      .text(
        'Dengan ini saya menyatakan bahwa permintaan pembayaran ini sesuai dengan peraturan yang berlaku dan dokumen pendukung telah lengkap.',
        margins.left, doc.y, { width: contentWidth, align: 'justify' }
      );

    doc.moveDown(2);

    // Signatures
    const sigStartY = doc.y;
    const sigWidth = (contentWidth - 40) / 3;

    // Pemohon
    doc.fontSize(10)
      .text('Pemohon,', margins.left, sigStartY, { width: sigWidth, align: 'center' });
    doc.moveDown(4);
    doc.text(requestData.requester_name || '(_____________________)', margins.left, doc.y, { width: sigWidth, align: 'center' });
    doc.fontSize(9)
      .text(`NIP. ${requestData.requester_nip || '_________________'}`, margins.left, doc.y + 2, { width: sigWidth, align: 'center' });

    // Verifikator
    doc.fontSize(10)
      .text('Diverifikasi oleh,', margins.left + sigWidth + 20, sigStartY, { width: sigWidth, align: 'center' });
    doc.y = sigStartY + 50;
    doc.text('Bendahara Pengeluaran', margins.left + sigWidth + 20, doc.y, { width: sigWidth, align: 'center' });
    doc.fontSize(9)
      .text('NIP. _________________', margins.left + sigWidth + 20, doc.y + 2, { width: sigWidth, align: 'center' });

    // PPSPM
    doc.fontSize(10)
      .text('Disetujui oleh,', pageWidth - margins.right - sigWidth, sigStartY, { width: sigWidth, align: 'center' });
    doc.y = sigStartY + 50;
    doc.text('PPSPM', pageWidth - margins.right - sigWidth, doc.y, { width: sigWidth, align: 'center' });
    doc.fontSize(9)
      .text('NIP. _________________', pageWidth - margins.right - sigWidth, doc.y + 2, { width: sigWidth, align: 'center' });

    // Watermark if draft
    if (requestData.status === 'draft') {
      addWatermark(doc, 'DRAFT', { opacity: 0.2 });
    }

    // Page numbers
    addPageNumbers(doc);

    return this._saveDocument(doc, requestData.id, 'spp', sppNumber);
  }

  /**
   * Generate SPM (Surat Perintah Membayar)
   * @param {object} requestData - Request data
   * @returns {Promise<object>} - Generated document info
   */
  async generateSPM(requestData) {
    const validation = validateDocumentData(requestData, [
      'request_number', 'item_name', 'estimated_value'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const doc = this._createDocument();
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    createOfficialHeader(doc, {
      logoPath: this.options.logoPath,
      institutionName: this.options.institutionSettings.name,
      ministryName: this.options.institutionSettings.ministry,
      address: this.options.institutionSettings.address,
      phone: this.options.institutionSettings.phone,
      email: this.options.institutionSettings.email
    });

    const spmNumber = generateDocumentNumber('SPM', requestData.sequence || 1);

    // Document title
    doc.moveDown(1);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('SURAT PERINTAH MEMBAYAR', { align: 'center' });

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nomor: ${spmNumber}`, { align: 'center' });

    doc.moveDown(1);

    // Kepada
    doc.fontSize(10)
      .text('Kepada Yth.', margins.left, doc.y);
    doc.text('Kepala Kantor Pelayanan Perbendaharaan Negara (KPPN)', margins.left, doc.y + 2);
    doc.text('di Sorong', margins.left, doc.y + 2);

    doc.moveDown(1.5);

    // Body text
    doc.font('Helvetica')
      .fontSize(10)
      .text(
        'Berdasarkan Surat Permintaan Pembayaran (SPP) yang telah diverifikasi dan disetujui, dengan ini diperintahkan untuk membayar kepada:',
        margins.left, doc.y, { width: contentWidth, align: 'justify' }
      );

    doc.moveDown(1);

    // Payment details
    const paymentDetails = {
      headers: ['No', 'Uraian', 'Keterangan'],
      columnWidths: [40, 150, contentWidth - 190],
      rows: [
        ['1', 'Nomor SPP', requestData.spp_number || '-'],
        ['2', 'Tanggal SPP', formatDate(requestData.spp_date || new Date())],
        ['3', 'Penerima Pembayaran', requestData.vendor_name || requestData.recipient_name || '-'],
        ['4', 'Bank Tujuan', requestData.bank_name || '-'],
        ['5', 'Nomor Rekening', requestData.bank_account || '-'],
        ['6', 'Nama Rekening', requestData.bank_account_name || '-']
      ]
    };

    createTable(doc, paymentDetails);

    doc.moveDown(1);

    // Amount breakdown
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .text('RINCIAN PEMBAYARAN', margins.left, doc.y);

    doc.moveDown(0.5);

    const tax = calculateTax(requestData.estimated_value, {
      includePPN: requestData.include_ppn !== false,
      includePPh: requestData.include_pph !== false
    });

    const amountDetails = {
      headers: ['No', 'Uraian', 'Jumlah (Rp)'],
      columnWidths: [40, contentWidth - 180, 140],
      rows: [
        ['1', 'Nilai Bruto', formatCurrency(requestData.estimated_value, false)],
        ['2', 'PPh Pasal 22 (1.5%)', `(${formatCurrency(tax.pph, false)})`],
        ['3', 'PPN (11%)', formatCurrency(tax.ppn, false)],
        ['', 'JUMLAH BERSIH', formatCurrency(tax.netAmount, false)]
      ]
    };

    createTable(doc, amountDetails);

    doc.moveDown(0.5);

    // Amount in words
    doc.font('Helvetica')
      .fontSize(10)
      .text(`Terbilang: ${numberToWords(tax.netAmount)}`, margins.left, doc.y, {
        width: contentWidth
      });

    doc.moveDown(2);

    // Authorization
    doc.text(
      'Demikian Surat Perintah Membayar ini dibuat untuk dilaksanakan sebagaimana mestinya.',
      margins.left, doc.y, { width: contentWidth, align: 'justify' }
    );

    doc.moveDown(2);

    // Signature
    const sigX = pageWidth - margins.right - 220;
    doc.text(`${this.options.institutionSettings.city}, ${formatDate(new Date())}`, sigX, doc.y, { width: 220 });
    doc.text('Pejabat Penandatangan SPM', sigX, doc.y + 5, { width: 220 });
    doc.moveDown(4);
    doc.font('Helvetica-Bold')
      .text(requestData.ppspm_name || '(_____________________)', sigX, doc.y, { width: 220 });
    doc.font('Helvetica')
      .fontSize(9)
      .text(`NIP. ${requestData.ppspm_nip || '___________________'}`, sigX, doc.y + 2, { width: 220 });

    // Watermark if draft
    if (requestData.status === 'draft') {
      addWatermark(doc, 'DRAFT', { opacity: 0.2 });
    }

    addPageNumbers(doc);

    return this._saveDocument(doc, requestData.id, 'spm', spmNumber);
  }

  /**
   * Generate Contract document
   * @param {object} contractData - Contract data
   * @param {string} tier - Tier level (tier1, tier2, tier3)
   * @returns {Promise<object>} - Generated document info
   */
  async generateContract(contractData, tier = 'tier1') {
    const validation = validateDocumentData(contractData, [
      'contract_number', 'vendor_name', 'contract_value'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const doc = this._createDocument();
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    createOfficialHeader(doc, {
      logoPath: this.options.logoPath,
      institutionName: this.options.institutionSettings.name,
      ministryName: this.options.institutionSettings.ministry,
      address: this.options.institutionSettings.address,
      phone: this.options.institutionSettings.phone,
      email: this.options.institutionSettings.email
    });

    // Document title based on tier
    let title, subtitle;
    switch (tier) {
      case 'tier1':
        title = 'SURAT PESANAN';
        subtitle = 'PENGADAAN BARANG/JASA';
        break;
      case 'tier2':
        title = 'SURAT PERJANJIAN';
        subtitle = 'PENGADAAN BARANG/JASA';
        break;
      case 'tier3':
        title = 'KONTRAK PENGADAAN';
        subtitle = 'BARANG/JASA PEMERINTAH';
        break;
      default:
        title = 'SURAT PERJANJIAN';
        subtitle = 'PENGADAAN BARANG/JASA';
    }

    doc.moveDown(1);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text(title, { align: 'center' });

    doc.fontSize(12)
      .text(subtitle, { align: 'center' });

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nomor: ${contractData.contract_number}`, { align: 'center' });

    doc.moveDown(1);

    // Introduction
    doc.font('Helvetica')
      .fontSize(10)
      .text(
        `Pada hari ini, ${formatDate(new Date(), 'formal')}, kami yang bertanda tangan di bawah ini:`,
        margins.left, doc.y, { width: contentWidth }
      );

    doc.moveDown(1);

    // Party 1 (Institution)
    doc.font('Helvetica-Bold')
      .text('PIHAK PERTAMA:', margins.left, doc.y);

    doc.font('Helvetica')
      .fontSize(10);

    const party1Details = [
      ['Nama', contractData.ppk_name || '___________________'],
      ['Jabatan', 'Pejabat Pembuat Komitmen (PPK)'],
      ['Instansi', this.options.institutionSettings.name],
      ['Alamat', this.options.institutionSettings.address]
    ];

    party1Details.forEach(([label, value]) => {
      doc.text(`${label.padEnd(15)}: ${value}`, margins.left + 20, doc.y + 2);
    });

    doc.text('Selanjutnya disebut PIHAK PERTAMA', margins.left, doc.y + 10);

    doc.moveDown(1);

    // Party 2 (Vendor)
    doc.font('Helvetica-Bold')
      .text('PIHAK KEDUA:', margins.left, doc.y);

    doc.font('Helvetica')
      .fontSize(10);

    const party2Details = [
      ['Nama', contractData.vendor_contact_person || '___________________'],
      ['Jabatan', contractData.vendor_position || 'Direktur'],
      ['Perusahaan', contractData.vendor_name],
      ['Alamat', contractData.vendor_address || '___________________'],
      ['NPWP', contractData.vendor_npwp || '___________________']
    ];

    party2Details.forEach(([label, value]) => {
      doc.text(`${label.padEnd(15)}: ${value}`, margins.left + 20, doc.y + 2);
    });

    doc.text('Selanjutnya disebut PIHAK KEDUA', margins.left, doc.y + 10);

    doc.moveDown(1);

    // Agreement intro
    doc.text(
      `Kedua belah pihak sepakat untuk mengadakan ${tier === 'tier1' ? 'pembelian' : 'perjanjian'} dengan ketentuan sebagai berikut:`,
      margins.left, doc.y, { width: contentWidth }
    );

    doc.moveDown(1);

    // Articles
    let articleNum = 1;

    // Article 1: Scope
    doc.font('Helvetica-Bold')
      .text(`Pasal ${articleNum++}`, margins.left, doc.y);
    doc.text('RUANG LINGKUP PEKERJAAN', margins.left, doc.y + 2);

    doc.font('Helvetica')
      .fontSize(10)
      .text(
        contractData.scope || contractData.item_name || 'Pengadaan barang/jasa sesuai spesifikasi teknis terlampir.',
        margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
      );

    doc.moveDown(1);

    // Article 2: Value
    doc.font('Helvetica-Bold')
      .text(`Pasal ${articleNum++}`, margins.left, doc.y);
    doc.text('NILAI KONTRAK', margins.left, doc.y + 2);

    doc.font('Helvetica')
      .fontSize(10)
      .text(
        `Nilai kontrak adalah sebesar ${formatCurrency(contractData.contract_value)} (${numberToWords(contractData.contract_value)}).`,
        margins.left, doc.y + 5, { width: contentWidth }
      );

    doc.moveDown(1);

    // Article 3: Payment
    doc.font('Helvetica-Bold')
      .text(`Pasal ${articleNum++}`, margins.left, doc.y);
    doc.text('CARA PEMBAYARAN', margins.left, doc.y + 2);

    doc.font('Helvetica')
      .fontSize(10);

    const paymentMethod = contractData.payment_method || 'transfer';
    let paymentText;

    switch (paymentMethod) {
      case 'termin':
        paymentText = `Pembayaran dilakukan secara bertahap (termin) sesuai dengan progres pekerjaan:\n${contractData.payment_terms || '- Termin 1: 30%\n- Termin 2: 40%\n- Termin 3: 30%'}`;
        break;
      case 'cash':
        paymentText = 'Pembayaran dilakukan secara tunai setelah pekerjaan selesai dan diterima dengan baik.';
        break;
      default:
        paymentText = 'Pembayaran dilakukan melalui transfer bank ke rekening PIHAK KEDUA setelah pekerjaan selesai dan diterima dengan baik.';
    }

    doc.text(paymentText, margins.left, doc.y + 5, { width: contentWidth, align: 'justify' });

    doc.moveDown(1);

    // Article 4: Timeline
    doc.font('Helvetica-Bold')
      .text(`Pasal ${articleNum++}`, margins.left, doc.y);
    doc.text('JANGKA WAKTU', margins.left, doc.y + 2);

    doc.font('Helvetica')
      .fontSize(10)
      .text(
        `Jangka waktu pelaksanaan pekerjaan adalah ${contractData.duration_days || 30} (${numberToWords(contractData.duration_days || 30).replace(' rupiah', '')}) hari kalender, terhitung sejak ${formatDate(contractData.start_date || new Date())} sampai dengan ${formatDate(contractData.end_date || new Date())}.`,
        margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
      );

    doc.moveDown(1);

    // Additional articles for tier 2 and 3
    if (tier !== 'tier1') {
      // Article: Guarantees
      doc.font('Helvetica-Bold')
        .text(`Pasal ${articleNum++}`, margins.left, doc.y);
      doc.text('JAMINAN', margins.left, doc.y + 2);

      doc.font('Helvetica')
        .fontSize(10)
        .text(
          'PIHAK KEDUA wajib menyerahkan jaminan pelaksanaan sebesar 5% dari nilai kontrak dan jaminan pemeliharaan sebesar 5% dari nilai kontrak.',
          margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
        );

      doc.moveDown(1);

      // Article: Penalties
      doc.font('Helvetica-Bold')
        .text(`Pasal ${articleNum++}`, margins.left, doc.y);
      doc.text('SANKSI DAN DENDA', margins.left, doc.y + 2);

      doc.font('Helvetica')
        .fontSize(10)
        .text(
          'Apabila PIHAK KEDUA terlambat dalam penyelesaian pekerjaan, maka dikenakan denda sebesar 1/1000 (satu per seribu) dari nilai kontrak untuk setiap hari keterlambatan, maksimal 5% dari nilai kontrak.',
          margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
        );

      doc.moveDown(1);
    }

    // Tier 3 specific articles
    if (tier === 'tier3') {
      // Article: Dispute Resolution
      doc.font('Helvetica-Bold')
        .text(`Pasal ${articleNum++}`, margins.left, doc.y);
      doc.text('PENYELESAIAN PERSELISIHAN', margins.left, doc.y + 2);

      doc.font('Helvetica')
        .fontSize(10)
        .text(
          'Apabila terjadi perselisihan dalam pelaksanaan kontrak ini, kedua belah pihak sepakat untuk menyelesaikan secara musyawarah mufakat. Apabila tidak tercapai kesepakatan, maka akan diselesaikan melalui Pengadilan Negeri Sorong.',
          margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
        );

      doc.moveDown(1);

      // Article: Force Majeure
      doc.font('Helvetica-Bold')
        .text(`Pasal ${articleNum++}`, margins.left, doc.y);
      doc.text('KEADAAN KAHAR (FORCE MAJEURE)', margins.left, doc.y + 2);

      doc.font('Helvetica')
        .fontSize(10)
        .text(
          'Keadaan kahar adalah keadaan di luar kekuasaan kedua belah pihak yang mengakibatkan tidak dapat dilaksanakannya kewajiban masing-masing pihak, meliputi namun tidak terbatas pada: bencana alam, perang, huru-hara, kebijakan pemerintah, dan wabah penyakit.',
          margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
        );

      doc.moveDown(1);
    }

    // Final article: Closing
    doc.font('Helvetica-Bold')
      .text(`Pasal ${articleNum}`, margins.left, doc.y);
    doc.text('PENUTUP', margins.left, doc.y + 2);

    doc.font('Helvetica')
      .fontSize(10)
      .text(
        `${tier === 'tier1' ? 'Surat Pesanan' : tier === 'tier2' ? 'Surat Perjanjian' : 'Kontrak'} ini dibuat dan ditandatangani oleh kedua belah pihak pada hari dan tanggal tersebut di atas, dalam rangkap 2 (dua) yang keduanya mempunyai kekuatan hukum yang sama.`,
        margins.left, doc.y + 5, { width: contentWidth, align: 'justify' }
      );

    doc.moveDown(2);

    // Signatures
    const sigY = doc.y;
    const sigWidth = (contentWidth - 40) / 2;

    // Party 1
    doc.fontSize(10)
      .text('PIHAK PERTAMA', margins.left, sigY, { width: sigWidth, align: 'center' });
    doc.text(this.options.institutionSettings.name, margins.left, doc.y + 2, { width: sigWidth, align: 'center' });
    doc.moveDown(4);
    doc.font('Helvetica-Bold')
      .text(contractData.ppk_name || '(_____________________)', margins.left, doc.y, { width: sigWidth, align: 'center' });
    doc.font('Helvetica')
      .fontSize(9)
      .text(`NIP. ${contractData.ppk_nip || '___________________'}`, margins.left, doc.y + 2, { width: sigWidth, align: 'center' });

    // Party 2
    doc.fontSize(10)
      .text('PIHAK KEDUA', pageWidth - margins.right - sigWidth, sigY, { width: sigWidth, align: 'center' });
    doc.text(contractData.vendor_name, pageWidth - margins.right - sigWidth, sigY + 12, { width: sigWidth, align: 'center' });
    doc.y = sigY + 60;
    doc.font('Helvetica-Bold')
      .text(contractData.vendor_contact_person || '(_____________________)', pageWidth - margins.right - sigWidth, doc.y, { width: sigWidth, align: 'center' });
    doc.font('Helvetica')
      .fontSize(9)
      .text(contractData.vendor_position || 'Direktur', pageWidth - margins.right - sigWidth, doc.y + 2, { width: sigWidth, align: 'center' });

    // Watermark if draft
    if (contractData.status === 'draft') {
      addWatermark(doc, 'DRAFT', { opacity: 0.2 });
    }

    addPageNumbers(doc);

    return this._saveDocument(doc, contractData.request_id, 'contract', contractData.contract_number);
  }

  /**
   * Generate BAST (Berita Acara Serah Terima)
   * @param {object} contractData - Contract data with delivery info
   * @returns {Promise<object>} - Generated document info
   */
  async generateBAST(contractData) {
    const validation = validateDocumentData(contractData, [
      'contract_number', 'vendor_name'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const doc = this._createDocument();
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header
    createOfficialHeader(doc, {
      logoPath: this.options.logoPath,
      institutionName: this.options.institutionSettings.name,
      ministryName: this.options.institutionSettings.ministry,
      address: this.options.institutionSettings.address,
      phone: this.options.institutionSettings.phone,
      email: this.options.institutionSettings.email
    });

    const bastNumber = generateDocumentNumber('BAST', contractData.sequence || 1);

    // Document title
    doc.moveDown(1);
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('BERITA ACARA SERAH TERIMA', { align: 'center' });

    doc.fontSize(12)
      .text('HASIL PEKERJAAN', { align: 'center' });

    doc.fontSize(10)
      .font('Helvetica')
      .text(`Nomor: ${bastNumber}`, { align: 'center' });

    doc.moveDown(1);

    // Introduction
    doc.font('Helvetica')
      .fontSize(10)
      .text(
        `Pada hari ini, ${formatDate(new Date(), 'formal')}, bertempat di ${this.options.institutionSettings.city}, kami yang bertanda tangan di bawah ini:`,
        margins.left, doc.y, { width: contentWidth }
      );

    doc.moveDown(1);

    // Party 1 (Receiver)
    doc.text('1. ', margins.left, doc.y);
    doc.text(`Nama        : ${contractData.receiver_name || '___________________'}`, margins.left + 20, doc.y);
    doc.text(`Jabatan     : ${contractData.receiver_position || 'Pejabat Penerima Hasil Pekerjaan'}`, margins.left + 20, doc.y + 2);
    doc.text(`Instansi    : ${this.options.institutionSettings.name}`, margins.left + 20, doc.y + 2);
    doc.text('Selanjutnya disebut PIHAK PERTAMA (Penerima)', margins.left + 20, doc.y + 10);

    doc.moveDown(1);

    // Party 2 (Deliverer)
    doc.text('2. ', margins.left, doc.y);
    doc.text(`Nama        : ${contractData.vendor_contact_person || '___________________'}`, margins.left + 20, doc.y);
    doc.text(`Jabatan     : ${contractData.vendor_position || 'Direktur'}`, margins.left + 20, doc.y + 2);
    doc.text(`Perusahaan  : ${contractData.vendor_name}`, margins.left + 20, doc.y + 2);
    doc.text('Selanjutnya disebut PIHAK KEDUA (Penyedia)', margins.left + 20, doc.y + 10);

    doc.moveDown(1);

    // Reference
    doc.text('Berdasarkan:', margins.left, doc.y);
    doc.text(`- Kontrak/Surat Perjanjian Nomor: ${contractData.contract_number}`, margins.left + 10, doc.y + 2);
    doc.text(`- Tanggal: ${formatDate(contractData.contract_date || new Date())}`, margins.left + 10, doc.y + 2);

    doc.moveDown(1);

    // Statement
    doc.text(
      'Dengan ini menyatakan bahwa PIHAK KEDUA telah menyerahkan kepada PIHAK PERTAMA hasil pekerjaan sebagai berikut:',
      margins.left, doc.y, { width: contentWidth }
    );

    doc.moveDown(1);

    // Items table
    const items = contractData.items || [
      { description: contractData.item_name || 'Barang/Jasa', quantity: 1, unit: 'Paket' }
    ];

    const itemsTable = {
      headers: ['No', 'Uraian', 'Volume', 'Satuan', 'Keterangan'],
      columnWidths: [30, contentWidth - 220, 60, 60, 70],
      rows: items.map((item, idx) => [
        idx + 1,
        item.description,
        item.quantity,
        item.unit,
        item.condition || 'Baik'
      ])
    };

    createTable(doc, itemsTable);

    doc.moveDown(1);

    // Inspection result
    doc.font('Helvetica-Bold')
      .text('HASIL PEMERIKSAAN:', margins.left, doc.y);

    doc.font('Helvetica')
      .moveDown(0.5);

    const inspectionResult = contractData.inspection_result || 'sesuai';
    const inspectionText = inspectionResult === 'sesuai'
      ? 'Setelah dilakukan pemeriksaan, hasil pekerjaan dinyatakan SESUAI dengan spesifikasi teknis dan ketentuan dalam kontrak.'
      : `Setelah dilakukan pemeriksaan, ditemukan kekurangan/ketidaksesuaian sebagai berikut:\n${contractData.deficiencies || '-'}`;

    doc.text(inspectionText, margins.left, doc.y, { width: contentWidth, align: 'justify' });

    doc.moveDown(1);

    // Warranty info
    if (contractData.warranty_period) {
      doc.font('Helvetica-Bold')
        .text('MASA GARANSI:', margins.left, doc.y);

      doc.font('Helvetica')
        .text(
          `Masa garansi adalah ${contractData.warranty_period} bulan terhitung sejak tanggal Berita Acara ini ditandatangani, yaitu sampai dengan ${formatDate(new Date(Date.now() + contractData.warranty_period * 30 * 24 * 60 * 60 * 1000))}.`,
          margins.left, doc.y + 5, { width: contentWidth }
        );

      doc.moveDown(1);
    }

    // Conclusion
    doc.text(
      'Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
      margins.left, doc.y, { width: contentWidth, align: 'justify' }
    );

    doc.moveDown(2);

    // Signatures
    const sigY = doc.y;
    const sigWidth = (contentWidth - 40) / 2;

    // PIHAK KEDUA (Yang Menyerahkan)
    doc.fontSize(10)
      .text('PIHAK KEDUA', margins.left, sigY, { width: sigWidth, align: 'center' });
    doc.text('Yang Menyerahkan,', margins.left, doc.y + 2, { width: sigWidth, align: 'center' });
    doc.moveDown(4);
    doc.font('Helvetica-Bold')
      .text(contractData.vendor_contact_person || '(_____________________)', margins.left, doc.y, { width: sigWidth, align: 'center' });
    doc.font('Helvetica')
      .fontSize(9)
      .text(contractData.vendor_position || 'Direktur', margins.left, doc.y + 2, { width: sigWidth, align: 'center' });

    // PIHAK PERTAMA (Yang Menerima)
    doc.fontSize(10)
      .text('PIHAK PERTAMA', pageWidth - margins.right - sigWidth, sigY, { width: sigWidth, align: 'center' });
    doc.text('Yang Menerima,', pageWidth - margins.right - sigWidth, sigY + 12, { width: sigWidth, align: 'center' });
    doc.y = sigY + 60;
    doc.font('Helvetica-Bold')
      .text(contractData.receiver_name || '(_____________________)', pageWidth - margins.right - sigWidth, doc.y, { width: sigWidth, align: 'center' });
    doc.font('Helvetica')
      .fontSize(9)
      .text(`NIP. ${contractData.receiver_nip || '___________________'}`, pageWidth - margins.right - sigWidth, doc.y + 2, { width: sigWidth, align: 'center' });

    // Watermark
    if (contractData.status === 'draft') {
      addWatermark(doc, 'DRAFT', { opacity: 0.2 });
    }

    addPageNumbers(doc);

    return this._saveDocument(doc, contractData.request_id, 'bast', bastNumber);
  }

  /**
   * Generate multiple documents in batch
   * @param {array} requests - Array of request data
   * @param {string} docType - Document type to generate
   * @param {function} progressCallback - Progress callback function
   * @returns {Promise<array>} - Array of generated document results
   */
  async generateBatch(requests, docType, progressCallback = null) {
    const results = [];
    const total = requests.length;
    let completed = 0;

    // Process in chunks for better performance
    const chunkSize = 5;
    const chunks = [];

    for (let i = 0; i < requests.length; i += chunkSize) {
      chunks.push(requests.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (request) => {
        try {
          let result;

          switch (docType) {
            case 'kwitansi':
              result = await this.generateKwitansi(request);
              break;
            case 'spp':
              result = await this.generateSPP(request);
              break;
            case 'spm':
              result = await this.generateSPM(request);
              break;
            case 'contract':
              result = await this.generateContract(request, request.tier);
              break;
            case 'bast':
              result = await this.generateBAST(request);
              break;
            default:
              throw new Error(`Unknown document type: ${docType}`);
          }

          completed++;
          if (progressCallback) {
            progressCallback({
              completed,
              total,
              current: request.request_number || request.contract_number,
              percentage: Math.round((completed / total) * 100)
            });
          }

          return {
            success: true,
            requestId: request.id,
            ...result
          };
        } catch (error) {
          completed++;
          if (progressCallback) {
            progressCallback({
              completed,
              total,
              current: request.request_number || request.contract_number,
              percentage: Math.round((completed / total) * 100),
              error: error.message
            });
          }

          return {
            success: false,
            requestId: request.id,
            error: error.message
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Get list of generated documents for a request
   * @param {string} requestId - Request ID
   * @returns {array} - List of documents
   */
  getDocuments(requestId) {
    if (!this.db) return [];

    try {
      return this.db.prepare(`
        SELECT * FROM documents
        WHERE request_id = ?
        ORDER BY created_at DESC
      `).all(requestId);
    } catch (error) {
      console.error('Failed to get documents:', error);
      return [];
    }
  }

  /**
   * Delete a generated document
   * @param {string} documentId - Document ID
   * @returns {boolean} - Success status
   */
  deleteDocument(documentId) {
    if (!this.db) return false;

    try {
      const doc = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

      if (doc && doc.file_path && fs.existsSync(doc.file_path)) {
        fs.unlinkSync(doc.file_path);
      }

      this.db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }
}

module.exports = DocumentGenerator;
