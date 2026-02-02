/**
 * Surat Tugas Generator
 * Dokumen perintah untuk perjalanan dinas dari KPA/PPK
 * 
 * @file src/main/templates/perjalanan-dinas/surat-tugas.js
 */

const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { createKopSurat } = require('../helpers/kop-surat-helper');
const { createSimpleTable } = require('../helpers/table-helper');
const { formatTanggalPanjang } = require('../helpers/format-helper');

class SuratTugasGenerator extends BaseDocumentGenerator {
  constructor() {
    super('perjalanan-dinas', 'surat-tugas');
  }

  /**
   * Validasi data yang diperlukan
   */
  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.st) throw new Error('Data surat tugas diperlukan');
    if (!data.pelaksana || data.pelaksana.length === 0) throw new Error('Data pelaksana diperlukan (minimal 1)');
    if (!data.pejabat?.kpa) throw new Error('Data KPA diperlukan');
    return true;
  }

  /**
   * Build document content
   */
  buildContent(data) {
    const { satker, st, pelaksana, pejabat } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(
      createParagraph('SURAT TUGAS', {
        align: 'center',
        bold: true,
        size: 28,
        spaceAfter: 120,
      })
    );

    elements.push(
      createParagraph(`Nomor: ${st.nomor}`, {
        align: 'center',
        spaceAfter: 240,
      })
    );

    // === PEMBERI TUGAS ===
    elements.push(
      createParagraph('Yang bertanda tangan di bawah ini:', { spaceAfter: 120 })
    );

    elements.push(
      createParagraph(`Nama      : ${pejabat.kpa.nama}`, {
        indentLeft: 720,
      })
    );
    elements.push(
      createParagraph(`NIP       : ${pejabat.kpa.nip}`, {
        indentLeft: 720,
      })
    );
    elements.push(
      createParagraph(
        `Jabatan   : Kuasa Pengguna Anggaran ${satker.nama}`,
        {
          indentLeft: 720,
          spaceAfter: 240,
        }
      )
    );

    elements.push(
      createParagraph('Dengan ini menugaskan kepada:', { spaceAfter: 120 })
    );

    // === TABEL PELAKSANA ===
    const tableData = [
      ['No', 'Nama / NIP', 'Pangkat / Gol.', 'Jabatan'],
      ...pelaksana.map((p, idx) => [
        String(idx + 1),
        `${p.nama}\nNIP. ${p.nip}`,
        `${p.pangkat || '-'} / ${p.golongan || '-'}`,
        p.jabatan || '-',
      ]),
    ];

    elements.push(createSimpleTable(tableData, [500, 3500, 1800, 2000]));

    elements.push(...createSpacer(1));

    // === DETAIL TUGAS ===
    elements.push(createParagraph('Untuk:', { bold: true }));
    elements.push(
      createParagraph(`Maksud      : ${st.maksud_tujuan}`, {
        indentLeft: 720,
      })
    );
    elements.push(
      createParagraph(
        `Tujuan      : ${st.kota_tujuan}${st.provinsi_tujuan ? ', ' + st.provinsi_tujuan : ''}`,
        {
          indentLeft: 720,
        }
      )
    );
    elements.push(
      createParagraph(
        `Tanggal     : ${formatTanggalPanjang(st.tanggal_berangkat)} s.d. ${formatTanggalPanjang(st.tanggal_kembali)}`,
        {
          indentLeft: 720,
        }
      )
    );
    elements.push(
      createParagraph(
        `Lama        : ${st.lama_hari} (${terbilangHari(st.lama_hari)}) hari`,
        {
          indentLeft: 720,
        }
      )
    );

    if (st.dasar_nomor) {
      elements.push(
        createParagraph(
          `Dasar       : ${st.jenis_dasar} Nomor ${st.dasar_nomor} tanggal ${formatTanggalPanjang(st.dasar_tanggal)}`,
          {
            indentLeft: 720,
            spaceAfter: 240,
          }
        )
      );
    } else {
      elements.push(...createSpacer(1));
    }

    // === PENUTUP ===
    elements.push(
      createParagraph(
        'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan sebaik-baiknya dan penuh tanggung jawab, serta melaporkan hasilnya kepada pemberi tugas.',
        { align: 'justify', spaceAfter: 240 }
      )
    );

    // === TEMPAT DAN TANGGAL ===
    elements.push(
      createParagraph(`${satker.kota}, ${formatTanggalPanjang(st.tanggal_dibuat)}`, {
        align: 'right',
        spaceAfter: 240,
      })
    );

    // === TANDA TANGAN ===
    elements.push(
      createParagraph('Kuasa Pengguna Anggaran', {
        align: 'right',
        spaceAfter: 240,
      })
    );

    elements.push(...createSpacer(3));

    elements.push(
      createParagraph(pejabat.kpa.nama, {
        align: 'right',
        bold: true,
        underline: true,
      })
    );
    elements.push(
      createParagraph(`NIP. ${pejabat.kpa.nip}`, {
        align: 'right',
      })
    );

    return elements;
  }

  /**
   * Dapatkan filename yang disarankan
   */
  getSuggestedFilename(data) {
    const nomor = data.st.nomor.replace(/\//g, '-');
    return `Surat_Tugas_${nomor}.docx`;
  }
}

/**
 * Konversi hari ke terbilang
 */
function terbilangHari(n) {
  const satuan = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  if (n <= 11) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' belas';
  if (n < 100) {
    return (
      satuan[Math.floor(n / 10)] +
      ' puluh ' +
      (n % 10 > 0 ? satuan[n % 10] : '')
    ).trim();
  }
  return String(n);
}

module.exports = { SuratTugasGenerator };
