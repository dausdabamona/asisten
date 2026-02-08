/**
 * SPPD Generator (Surat Perjalanan Dinas) - Halaman 1
 * Format sesuai standar KKP
 *
 * @file src/main/templates/perjalanan-dinas/sppd.js
 */

const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { formatTanggalPanjang } = require('../helpers/format-helper');
const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  BorderStyle,
  WidthType,
  VerticalAlign,
  AlignmentType
} = require('docx');

// Border styles
const BORDERS_FULL = {
  top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
};

const BORDERS_NONE = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

class SPPDGenerator extends BaseDocumentGenerator {
  constructor() {
    super('perjalanan-dinas', 'sppd');
  }

  /**
   * Validasi data
   */
  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.st) throw new Error('Data surat tugas diperlukan');
    if (!data.pelaksana || data.pelaksana.length === 0)
      throw new Error('Data pelaksana diperlukan');
    if (!data.pejabat?.ppk && !data.pejabat?.kpa)
      throw new Error('Data PPK atau KPA diperlukan');
    return true;
  }

  /**
   * Build SPPD Halaman 1
   */
  buildContent(data) {
    const { satker, st, pelaksana, pejabat } = data;
    const p = Array.isArray(pelaksana) ? pelaksana[0] : pelaksana;
    const elements = [];

    const ppkName = pejabat.ppk?.nama || pejabat.kpa?.nama || '';
    const ppkNip = pejabat.ppk?.nip || pejabat.kpa?.nip || '';
    const direkturName = pejabat.direktur?.nama || pejabat.kpa?.nama || '';
    const direkturNip = pejabat.direktur?.nip || pejabat.kpa?.nip || '';

    // ============================================================
    // Header Info (Lembar ke, Kode No, Nomor)
    // ============================================================
    elements.push(
      createParagraph(`Lembar ke\t: ${st.lembar_ke || '1'}`, {
        align: 'right',
        size: 20,
      })
    );
    elements.push(
      createParagraph(`Kode No.\t:`, {
        align: 'right',
        size: 20,
      })
    );
    elements.push(
      createParagraph(`Nomor\t: ${st.nomor_sppd || st.nomor}`, {
        align: 'right',
        size: 20,
        spaceAfter: 120,
      })
    );

    // ============================================================
    // Title
    // ============================================================
    elements.push(
      createParagraph('SURAT PERJALANAN DINAS (SPD)', {
        align: 'center',
        bold: true,
        size: 26,
        spaceAfter: 180,
      })
    );

    // ============================================================
    // Main Table (Items 1-10)
    // ============================================================
    elements.push(this.createMainTable(data, p, pejabat, satker, st));

    elements.push(...createSpacer(0.5));

    // ============================================================
    // Signature PPK
    // ============================================================
    elements.push(
      createParagraph(`Dikeluarkan di\t: ${satker.kota || 'S o r o n g'}`, {
        indentLeft: 4800,
        size: 24,
      })
    );
    elements.push(
      createParagraph(`Tanggal\t\t: ${formatTanggalPanjang(st.tanggal_dibuat || new Date())}`, {
        indentLeft: 4800,
        size: 24,
      })
    );
    elements.push(
      createParagraph('Pejabat Pembuat Komitmen', {
        indentLeft: 4800,
        size: 24,
      })
    );
    // Space for signature and stamp (4 lines)
    elements.push(createParagraph('', { size: 24 }));
    elements.push(createParagraph('', { size: 24 }));
    elements.push(createParagraph('', { size: 24 }));
    elements.push(createParagraph('', { size: 24 }));
    elements.push(
      createParagraph(ppkName, {
        indentLeft: 4800,
        bold: true,
        underline: true,
        size: 24,
      })
    );
    elements.push(
      createParagraph(`NIP. ${ppkNip}`, {
        indentLeft: 4800,
        size: 24,
      })
    );

    return elements;
  }

  /**
   * Create main SPPD table (items 1-10)
   */
  createMainTable(data, p, pejabat, satker, st) {
    const ppkName = pejabat.ppk?.nama || pejabat.kpa?.nama || '-';
    const tingkatBiaya = getTingkatBiaya(p.golongan);

    // Build pengikut list
    let pengikutText = '';
    if (st.pengikut && st.pengikut.length > 0) {
      pengikutText = st.pengikut.map((pk, i) =>
        `${i+1}. ${pk.nama || '-'}\t${pk.tgl_lahir || '-'}\t${pk.keterangan || '-'}`
      ).join('\n');
    } else {
      pengikutText = '1. -\t-\t-\n2. -\t-\t-\n3. -\t-\t-\n4. -\t-\t-';
    }

    const rows = [
      this.createRow('1', 'Pejabat Pembuat Komitmen', ppkName),
      this.createRow('2', 'Nama/NIP Pegawai yang diperintahkan', `${p.nama}/${p.nip || '-'}`),
      this.createRow('3',
        'a. Pangkat dan Golongan Ruang Gaji\nb. Jabatan/Instansi\nc. Tingkat Biaya Perjalanan Dinas',
        `${p.pangkat || '-'}, ${p.golongan || '-'}\n${p.jabatan || '-'}\n" ${tingkatBiaya} "`
      ),
      this.createRow('4', 'Maksud Perjalanan Dinas', st.maksud_tujuan || '-'),
      this.createRow('5', 'Alat Angkutan yang dipergunakan', st.moda_transport || 'Transportasi Udara'),
      this.createRow('6',
        'a. Tempat Berangkat\nb. Tempat Tujuan',
        `${st.kota_asal || satker.kota || 'Sorong, Papua Barat'}\n${st.kota_tujuan || '-'}`
      ),
      this.createRow('7',
        'a. Lamanya Perjalanan Dinas\nb. Tanggal Berangkat\nc. Tanggal harus kembali/tiba di tempat baru *)',
        `${st.lama_hari || '-'} (${terbilangHari(st.lama_hari)}) Hari\n${formatTanggalSPPD(st.tanggal_berangkat)}\n${formatTanggalSPPD(st.tanggal_kembali)}`
      ),
      this.createPengikutRow(pengikutText),
      this.createRow('9',
        'Pembebanan Anggaran\na. Instansi\nb. Akun',
        `\n${satker.nama || 'Politeknik Kelautan dan Perikanan Sorong'}\n${st.kode_akun || ''}`
      ),
      this.createRow('10', 'Keterangan Lain-lain', st.keterangan || ''),
    ];

    // Add note row
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '*) Coret yang tidak perlu', italics: true, size: 18 })] })],
            columnSpan: 3,
            borders: BORDERS_NONE,
          }),
        ],
      })
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows,
    });
  }

  /**
   * Create standard row
   */
  createRow(no, label, value) {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: no, size: 22 })], alignment: AlignmentType.CENTER })],
          width: { size: 500, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: label.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })),
          width: { size: 4000, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: value.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: `: ${line}`, size: 22 })] })),
          width: { size: 5500, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
      ],
    });
  }

  /**
   * Create pengikut row with sub-headers
   */
  createPengikutRow(pengikutText) {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '8', size: 22 })], alignment: AlignmentType.CENTER })],
          width: { size: 500, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: 'Pengikut :', size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: '\tN a m a\tTanggal Lahir\tKeterangan', size: 20 })] }),
          ],
          width: { size: 4000, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: pengikutText.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 20 })] })),
          width: { size: 5500, type: WidthType.DXA },
          borders: BORDERS_FULL,
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
      ],
    });
  }

  /**
   * Create Section I table (Berangkat dari)
   */
  createSectionITable(st, satker, direkturName, direkturNip) {
    return new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: 'I. Berangkat dari', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '   (Tempat Kedudukan)', size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: '   Pada Tanggal', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '   Direktur,', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: direkturName, bold: true, underline: {}, size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: `NIP. ${direkturNip}`, size: 22 })] }),
              ],
              width: { size: 3500, type: WidthType.DXA },
              borders: BORDERS_FULL,
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: `: ${st.kota_asal || satker.kota || 'Sorong, Papua Barat'}`, size: 22 })] }),
                new Paragraph({ children: [new TextRun({ text: '', size: 20 })] }),
                new Paragraph({ children: [new TextRun({ text: ':', size: 22 })] }),
              ],
              width: { size: 3500, type: WidthType.DXA },
              borders: BORDERS_FULL,
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Dapatkan filename yang disarankan
   */
  getSuggestedFilename(data) {
    const nomor = (data.st.nomor_sppd || data.st.nomor).replace(/\//g, '-');
    const nama = data.pelaksana?.[0]?.nama?.split(' ')[0] || 'Pelaksana';
    return `SPPD_Hal1_${nomor}_${nama}.docx`;
  }
}

/**
 * Tentukan tingkat biaya berdasarkan golongan
 */
function getTingkatBiaya(golongan) {
  if (!golongan) return 'C';
  const gol = golongan.toUpperCase();
  if (gol.startsWith('IV')) return 'A';
  if (gol.startsWith('III')) return 'B';
  return 'C';
}

/**
 * Format tanggal untuk SPPD (contoh: 9-Okt-24)
 */
function formatTanggalSPPD(tanggal) {
  if (!tanggal) return '-';
  const date = new Date(tanggal);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Terbilang hari
 */
function terbilangHari(num) {
  const angka = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
  if (!num || num < 0) return '-';
  if (num <= 10) return angka[num];
  if (num < 20) return angka[num - 10] + ' belas';
  return String(num);
}

module.exports = { SPPDGenerator };
