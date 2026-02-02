/**
 * Rincian Biaya Perjalanan Dinas Generator
 * Dokumen rincian biaya perjalanan dinas per pelaksana
 * 
 * @file src/main/templates/perjalanan-dinas/rincian-biaya.js
 */

const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { createKopSurat } = require('../helpers/kop-surat-helper');
const { createSimpleTable } = require('../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilang } = require('../helpers/format-helper');

class RincianBiayaPerdinGenerator extends BaseDocumentGenerator {
  constructor() {
    super('perjalanan-dinas', 'rincian-biaya');
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
    return true;
  }

  /**
   * Build rincian biaya content
   */
  buildContent(data) {
    const { satker, st, pelaksana, biaya, pejabat } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(
      createParagraph('RINCIAN BIAYA PERJALANAN DINAS', {
        align: 'center',
        bold: true,
        size: 28,
        spaceAfter: 240,
      })
    );

    // === INFO PERJALANAN ===
    elements.push(
      createParagraph(`Nomor Surat Tugas : ${st.nomor}`)
    );
    elements.push(
      createParagraph(`Tujuan            : ${st.kota_tujuan}`)
    );
    elements.push(
      createParagraph(
        `Tanggal           : ${formatTanggalPanjang(st.tanggal_berangkat)} s.d. ${formatTanggalPanjang(st.tanggal_kembali)}`
      )
    );
    elements.push(
      createParagraph(`Lama              : ${st.lama_hari} hari`, {
        spaceAfter: 240,
      })
    );

    // === RINCIAN PER PELAKSANA ===
    let grandTotal = 0;

    pelaksana.forEach((p, idx) => {
      const biayaPelaksana = biaya
        ? biaya.find((b) => b.pelaksana_id === p.id) || biaya[idx] || {}
        : {};

      elements.push(
        createParagraph(`${idx + 1}. ${p.nama} (${p.golongan || '-'})`, {
          bold: true,
          spaceAfter: 120,
        })
      );

      // Hitung komponen biaya
      const uangHarian = biayaPelaksana.uang_harian || 0;
      const penginapan = biayaPelaksana.penginapan || 0;
      const transport = biayaPelaksana.transport || 0;
      const transportLokal = biayaPelaksana.transport_lokal || 0;
      const representasi = biayaPelaksana.representasi || 0;

      const rincianData = [
        ['No', 'Komponen Biaya', 'Tarif', 'Volume', 'Satuan', 'Jumlah'],
        [
          '1',
          'Uang Harian',
          formatRupiah(biayaPelaksana.tarif_uang_harian || 0),
          String(st.lama_hari),
          'OH',
          formatRupiah(uangHarian),
        ],
        [
          '2',
          'Penginapan',
          formatRupiah(biayaPelaksana.tarif_penginapan || 0),
          String(Math.max(0, st.lama_hari - 1)),
          'Malam',
          formatRupiah(penginapan),
        ],
        [
          '3',
          'Transport',
          '-',
          '1',
          'PP',
          formatRupiah(transport),
        ],
        [
          '4',
          'Transport Lokal',
          formatRupiah(biayaPelaksana.tarif_transport_lokal || 0),
          String(st.lama_hari),
          'Hari',
          formatRupiah(transportLokal),
        ],
      ];

      // Tambah representasi jika ada
      if (representasi > 0) {
        rincianData.push([
          '5',
          'Representasi',
          formatRupiah(biayaPelaksana.tarif_representasi || 0),
          String(st.lama_hari),
          'Hari',
          formatRupiah(representasi),
        ]);
      }

      // Hitung subtotal
      const subtotal = uangHarian + penginapan + transport + transportLokal + representasi;

      // Row total
      rincianData.push([
        '',
        'SUBTOTAL',
        '',
        '',
        '',
        formatRupiah(subtotal),
      ]);

      elements.push(createSimpleTable(rincianData, [400, 2200, 1200, 700, 700, 1600]));

      elements.push(...createSpacer(1));

      grandTotal += subtotal;
    });

    // === GRAND TOTAL ===
    elements.push(
      createParagraph(
        `TOTAL BIAYA PERJALANAN DINAS: ${formatRupiah(grandTotal)}`,
        { bold: true, size: 26, spaceAfter: 240 }
      )
    );

    elements.push(
      createParagraph(
        `Terbilang: ${terbilang(Math.floor(grandTotal))} Rupiah`,
        { italic: true, spaceAfter: 240 }
      )
    );

    // === KETERANGAN ===
    if (biaya && biaya[0]?.keterangan) {
      elements.push(
        createParagraph(`Keterangan: ${biaya[0].keterangan}`, {
          spaceAfter: 240,
        })
      );
    }

    // === TANDA TANGAN ===
    elements.push(
      createParagraph(`${satker.kota}, ${formatTanggalPanjang(new Date())}`, {
        align: 'center',
        spaceAfter: 240,
      })
    );

    // Tabel tanda tangan 2 kolom
    const signatureData = [
      [
        'Pegawai yang Melakukan Perjalanan Dinas',
        'Pejabat Pembuat Komitmen',
      ],
      ['', ''],
      ['', ''],
      ['', ''],
      [
        pelaksana[0]?.nama || '(...........................)',
        pejabat.ppk?.nama || pejabat.kpa?.nama || '(...........................)',
      ],
      [
        `NIP. ${pelaksana[0]?.nip || ''}`,
        `NIP. ${pejabat.ppk?.nip || pejabat.kpa?.nip || ''}`,
      ],
    ];

    elements.push(
      createSimpleTable(signatureData, [4500, 4500], {
        hasHeader: false,
        align: 'center',
      })
    );

    return elements;
  }

  /**
   * Dapatkan filename yang disarankan
   */
  getSuggestedFilename(data) {
    const nomor = data.st.nomor.replace(/\//g, '-');
    return `Rincian_Biaya_${nomor}.docx`;
  }
}

module.exports = { RincianBiayaPerdinGenerator };
