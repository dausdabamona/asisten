/**
 * Kop Surat Helper
 * Utility functions untuk membuat kop surat pemerintah
 */

const { Table, TableRow, TableCell, Paragraph, TextRun, AlignmentType, BorderStyle, WidthType } = require('docx');
const { formatTanggalHari } = require('./format-helper');

const BORDERS_NONE = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
  insideHorizontal: { style: BorderStyle.NONE, size: 0 },
  insideVertical: { style: BorderStyle.NONE, size: 0 }
};

/**
 * Buat kop surat pemerintah
 * @param {Object} options
 *   - ministri: string (nama kementerian)
 *   - institusi: string (nama institusi)
 *   - subunit: string (nama sub-unit)
 *   - alamat: string (alamat lengkap)
 *   - telepon: string (nomor telepon)
 *   - email: string (email)
 *   - website: string (website)
 * @returns {Array<Paragraph>}
 */
function createKopSurat(options = {}) {
  const {
    ministri = 'KEMENTERIAN ...',
    institusi = 'Nama Institusi',
    subunit = 'Nama Sub-Unit',
    alamat = '',
    telepon = '',
    email = '',
    website = ''
  } = options;

  const content = [];

  // Ministri/Kementerian (center, bold, 12pt)
  content.push(new Paragraph({
    text: ministri,
    bold: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 240 }
  }));

  // Institusi (center, bold, 12pt)
  content.push(new Paragraph({
    text: institusi,
    bold: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 240 }
  }));

  // Sub Unit (center, 11pt)
  content.push(new Paragraph({
    text: subunit,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 240 }
  }));

  // Alamat, Telepon, Email, Website (center, 9pt)
  const contactInfo = [];
  if (alamat) contactInfo.push(alamat);
  if (telepon) contactInfo.push(`Telp. ${telepon}`);
  if (email) contactInfo.push(`Email: ${email}`);
  if (website) contactInfo.push(`Website: ${website}`);

  if (contactInfo.length > 0) {
    content.push(new Paragraph({
      text: contactInfo.join(' | '),
      size: 18,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: 240 }
    }));
  }

  // Garis separator (horizontal line)
  content.push(new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.DOUBLE,
        size: 12,
        color: '000000'
      }
    },
    spacing: { before: 240, after: 240, line: 240 }
  }));

  return content;
}

/**
 * Buat tempat dan tanggal
 * @param {Object} options
 *   - tempat: string (tempat pengeluaran)
 *   - tanggal: Date or string (tanggal pengeluaran)
 * @returns {Paragraph}
 */
function createTempatTanggal(options = {}) {
  const {
    tempat = 'Jakarta',
    tanggal = new Date()
  } = options;

  return new Paragraph({
    text: `${tempat}, ${formatTanggalHari(tanggal)}`,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 240, after: 240, line: 240 }
  });
}

/**
 * Buat tanda tangan single (untuk dokumen pendek)
 * @param {Object} options
 *   - label: string (e.g., 'Mengetahui' atau 'Untuk')
 *   - nama: string (nama pejabat)
 *   - title: string (jabatan pejabat)
 *   - nip: string (NIP pejabat)
 * @returns {Array<Paragraph>}
 */
function createTandaTanganSingle(options = {}) {
  const {
    label = 'Mengetahui',
    nama = 'Nama Pejabat',
    title = 'Jabatan',
    nip = 'NIP'
  } = options;

  return [
    new Paragraph({
      text: label,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: 240 }
    }),
    new Paragraph({
      text: '',
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: 240 }
    }),
    new Paragraph({
      text: nama,
      bold: true,
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({
      text: title,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: 240 }
    }),
    new Paragraph({
      text: `NIP ${nip}`,
      alignment: AlignmentType.CENTER
    })
  ];
}

/**
 * Buat tanda tangan ganda (untuk dokumen resmi)
 * @param {Array} signatories - Array of {label, nama, title, nip}
 * @returns {Table}
 */
function createTandaTanganGanda(signatories = []) {
  if (signatories.length === 0) {
    signatories = [
      {
        label: 'Mengetahui',
        nama: 'Kepala Bagian',
        title: 'Jabatan',
        nip: '0000000000000000'
      },
      {
        label: 'Menyetujui',
        nama: 'Pejabat Pembuat',
        title: 'Jabatan',
        nip: '0000000000000000'
      }
    ];
  }

  const cells = signatories.map(sig => {
    return new TableCell({
      children: [
        new Paragraph({
          text: sig.label,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240, line: 240 }
        }),
        new Paragraph({
          text: '',
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240, line: 240 }
        }),
        new Paragraph({
          text: sig.nama,
          bold: true,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: sig.title,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240, line: 240 }
        }),
        new Paragraph({
          text: `NIP ${sig.nip}`,
          alignment: AlignmentType.CENTER
        })
      ],
      borders: BORDERS_NONE,
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });
  });

  // Fill remaining cells (max 2 columns)
  while (cells.length < 2) {
    cells.push(new TableCell({
      children: [new Paragraph({ text: '' })],
      borders: BORDERS_NONE
    }));
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [new TableRow({
      children: cells.slice(0, 2)
    })],
    borders: BORDERS_NONE
  });
}

module.exports = {
  createKopSurat,
  createTempatTanggal,
  createTandaTanganSingle,
  createTandaTanganGanda
};
