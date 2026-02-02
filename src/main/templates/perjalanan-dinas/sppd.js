/**
 * SPPD Generator (Surat Perintah Perjalanan Dinas)
 * Dokumen perjalanan dinas dengan halaman depan & belakang
 * 
 * @file src/main/templates/perjalanan-dinas/sppd.js
 */

const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer, createPageBreak } = require('../helpers/doc-helper');
const { createSimpleTable } = require('../helpers/table-helper');
const { formatTanggalPanjang } = require('../helpers/format-helper');

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
   * Build SPPD content (2 pages)
   */
  buildContent(data) {
    const { satker, st, pelaksana, pejabat } = data;
    // Ambil pelaksana pertama (SPPD per orang)
    const p = Array.isArray(pelaksana) ? pelaksana[0] : pelaksana;
    const elements = [];

    // ============================================================
    // HALAMAN 1: SPPD DEPAN
    // ============================================================

    // Header
    elements.push(
      createParagraph('SURAT PERINTAH PERJALANAN DINAS (SPPD)', {
        align: 'center',
        bold: true,
        size: 26,
        spaceAfter: 60,
      })
    );

    elements.push(
      createParagraph(`Nomor: ${st.nomor_sppd || st.nomor}`, {
        align: 'center',
        spaceAfter: 180,
      })
    );

    // Tabel isi SPPD
    const sppdData = [
      ['1', 'Pejabat Pembuat Komitmen', pejabat.ppk?.nama || pejabat.kpa?.nama || '-'],
      [
        '2',
        'Nama pegawai yang diperintahkan',
        p.nama,
      ],
      [
        '3',
        'a. Pangkat dan Golongan\nb. Jabatan\nc. Tingkat Biaya Perjalanan Dinas',
        `${p.pangkat || '-'} / ${p.golongan || '-'}\n${p.jabatan || '-'}\nTingkat ${getTingkatBiaya(p.golongan)}`,
      ],
      ['4', 'Maksud Perjalanan Dinas', st.maksud_tujuan],
      ['5', 'Alat angkutan yang digunakan', st.moda_transport || 'Darat/Udara'],
      [
        '6',
        'a. Tempat berangkat\nb. Tempat tujuan',
        `${st.kota_asal || satker.kota}\n${st.kota_tujuan}`,
      ],
      [
        '7',
        'a. Lamanya Perjalanan Dinas\nb. Tanggal berangkat\nc. Tanggal harus kembali',
        `${st.lama_hari} hari\n${formatTanggalPanjang(st.tanggal_berangkat)}\n${formatTanggalPanjang(st.tanggal_kembali)}`,
      ],
      ['8', 'Pengikut', '-'],
      [
        '9',
        'Pembebanan Anggaran\na. Instansi\nb. Akun',
        `\n${satker.nama}\n${st.kode_akun || '524111'}`,
      ],
      ['10', 'Keterangan lain-lain', st.keterangan || '-'],
    ];

    elements.push(
      createSimpleTable(sppdData, [400, 3200, 4800], { hasHeader: false })
    );

    elements.push(...createSpacer(1));

    // Tanda tangan PPK (halaman depan)
    const ppkName = pejabat.ppk?.nama || pejabat.kpa?.nama || '';
    const ppkNip = pejabat.ppk?.nip || pejabat.kpa?.nip || '';

    elements.push(
      createParagraph(`Dikeluarkan di : ${satker.kota}`, {
        indentLeft: 4500,
      })
    );
    elements.push(
      createParagraph(
        `Tanggal        : ${formatTanggalPanjang(st.tanggal_dibuat || new Date())}`,
        {
          indentLeft: 4500,
          spaceAfter: 240,
        }
      )
    );

    elements.push(
      createParagraph('Pejabat Pembuat Komitmen,', {
        indentLeft: 4500,
        spaceAfter: 240,
      })
    );

    elements.push(...createSpacer(3));

    elements.push(
      createParagraph(ppkName, {
        indentLeft: 4500,
        bold: true,
        underline: true,
      })
    );
    elements.push(
      createParagraph(`NIP. ${ppkNip}`, {
        indentLeft: 4500,
      })
    );

    // ============================================================
    // PAGE BREAK - HALAMAN 2: SPPD BELAKANG
    // ============================================================
    elements.push(createPageBreak());

    // Header halaman belakang
    elements.push(
      createParagraph('II. PENGESAHAN TIBA DAN BERANGKAT', {
        bold: true,
        size: 24,
        spaceAfter: 180,
      })
    );

    // Tabel pengesahan (untuk ditandatangani di tempat tujuan)
    // 3 baris untuk 3 tempat tujuan/transit
    for (let i = 0; i < 3; i++) {
      elements.push(
        createParagraph(`${i + 1}.`, { bold: true, spaceAfter: 60 })
      );

      const pengesahanTable = [
        ['Tiba di:', '', 'Berangkat dari:', ''],
        ['Pada tanggal:', '', 'Pada tanggal:', ''],
        ['Kepala Kantor/Satuan Kerja:', '', 'Kepala Kantor/Satuan Kerja:', ''],
        ['', '', '', ''],
        ['(................................)', '', '(................................)', ''],
        ['NIP.', '', 'NIP.', ''],
      ];

      elements.push(
        createSimpleTable(pengesahanTable, [1800, 2400, 1800, 2400], {
          hasHeader: false,
          fontSize: 20,
        })
      );

      elements.push(...createSpacer(0.5));
    }

    // Catatan
    elements.push(
      createParagraph('III. CATATAN LAIN-LAIN', {
        bold: true,
        spaceAfter: 60,
      })
    );
    elements.push(
      createParagraph('_________________________________________________________________')
    );
    elements.push(
      createParagraph('_________________________________________________________________')
    );

    elements.push(...createSpacer(1));

    // Perhatian
    elements.push(
      createParagraph('IV. PERHATIAN', { bold: true, spaceAfter: 120 })
    );
    elements.push(
      createParagraph(
        'Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal tiba/berangkat, serta Bendahara Pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.',
        { align: 'justify', size: 20 }
      )
    );

    elements.push(...createSpacer(2));

    // Tanda tangan yang melakukan perjalanan (halaman belakang)
    elements.push(
      createParagraph('Telah diperiksa dengan keterangan bahwa perjalanan', {
        indentLeft: 4500,
      })
    );
    elements.push(
      createParagraph('tersebut di atas benar dilakukan atas perintahnya dan', {
        indentLeft: 4500,
      })
    );
    elements.push(
      createParagraph('semata-mata untuk kepentingan jabatan dalam waktu', {
        indentLeft: 4500,
      })
    );
    elements.push(
      createParagraph('yang sesingkat-singkatnya.', {
        indentLeft: 4500,
        spaceAfter: 240,
      })
    );

    elements.push(
      createParagraph('Pejabat Pembuat Komitmen,', {
        indentLeft: 4500,
        spaceAfter: 240,
      })
    );

    elements.push(...createSpacer(3));

    elements.push(
      createParagraph(ppkName, {
        indentLeft: 4500,
        bold: true,
        underline: true,
      })
    );
    elements.push(
      createParagraph(`NIP. ${ppkNip}`, {
        indentLeft: 4500,
      })
    );

    return elements;
  }

  /**
   * Dapatkan filename yang disarankan
   */
  getSuggestedFilename(data) {
    const nomor = (data.st.nomor_sppd || data.st.nomor).replace(/\//g, '-');
    const nama = data.pelaksana?.[0]?.nama?.split(' ')[0] || 'Pelaksana';
    return `SPPD_${nomor}_${nama}.docx`;
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

module.exports = { SPPDGenerator };
