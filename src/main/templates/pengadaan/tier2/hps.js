const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat, createTempatTanggal } = require('../../helpers/kop-surat-helper');
const { createSimpleTable } = require('../../helpers/table-helper');
const { formatRupiah, formatTanggalPanjang } = require('../../helpers/format-helper');

class HPSGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.items || data.items.length === 0) throw new Error('Data items diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, items, pejabat } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('HARGA PERKIRAAN SENDIRI', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    elements.push(createParagraph('(HPS)', {
      align: 'center',
      bold: true,
      spaceAfter: 240,
    }));

    // === INFORMASI DOKUMEN ===
    elements.push(createParagraph('INFORMASI PENGADAAN', { bold: true }));
    elements.push(createParagraph(`Nama Pekerjaan      : ${lp.nama_pengadaan}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Nomor Lembar Permintaan : ${lp.nomor}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Tahun Anggaran      : ${new Date().getFullYear()}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Sumber Dana         : ${lp.sumber_dana || 'DIPA'}`, { spaceAfter: 240 }));

    // === TABEL HPS ===
    const tableData = [
      ['No', 'Uraian Barang/Jasa', 'Volume', 'Satuan', 'Harga Satuan', 'Jumlah'],
      ...items.map((item, idx) => {
        const jumlah = (item.harga_satuan || 0) * (item.volume || 0);
        return [
          idx + 1,
          item.uraian,
          item.volume,
          item.satuan,
          { text: formatRupiah(item.harga_satuan || 0), align: 'right' },
          { text: formatRupiah(jumlah), align: 'right' },
        ];
      }),
    ];

    // Total HPS
    const totalHPS = items.reduce((sum, item) => sum + ((item.harga_satuan || 0) * (item.volume || 0)), 0);

    elements.push(createSimpleTable(tableData, [400, 3000, 800, 800, 1200, 1200]));

    elements.push(...createSpacer(1));

    // === RINGKASAN HPS ===
    elements.push(createParagraph('RINGKASAN HPS', { bold: true }));
    elements.push(...createSpacer(1));

    const ringkasan = [
      ['Uraian', 'Jumlah'],
      ['Subtotal', { text: formatRupiah(totalHPS), align: 'right' }],
      ['PPn 11% (jika ada)', { text: formatRupiah(totalHPS * 0.11), align: 'right' }],
      ['TOTAL HPS', { text: formatRupiah(totalHPS * 1.11), align: 'right', bold: true }],
    ];

    elements.push(createSimpleTable(ringkasan, [3500, 2500]));

    elements.push(...createSpacer(2));

    // === PERNYATAAN ===
    elements.push(createParagraph(
      'Demikian Harga Perkiraan Sendiri (HPS) ini dibuat untuk digunakan sebagai acuan dalam proses pengadaan berdasarkan hasil survey pasar dan analisis harga.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // === TANDA TANGAN ===
    if (pejabat?.ppk) {
      elements.push(createTempatTanggal(satker.kota, lp.tanggal_dibuat || new Date()));
      elements.push(...createSpacer(1));
      elements.push(createParagraph('Disusun oleh:', { bold: true }));
      elements.push(...createSpacer(1));
      elements.push(createParagraph(pejabat.ppk.nama));
      elements.push(createParagraph(`NIP. ${pejabat.ppk.nip}`));
    }

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `HPS_${nomor}.docx`;
  }
}

module.exports = { HPSGenerator };
