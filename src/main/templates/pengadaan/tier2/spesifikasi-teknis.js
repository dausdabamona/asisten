const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable } = require('../../helpers/table-helper');

class SpesifikasiTeknis extends BaseDocumentGenerator {
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
    const { satker, lp, items } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('SPESIFIKASI TEKNIS', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    // === INFORMASI DOKUMEN ===
    elements.push(createParagraph(`Pengadaan  : ${lp.nama_pengadaan}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Satker     : ${satker.nama}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Tanggal    : ${new Date().toLocaleDateString('id-ID')}`, { spaceAfter: 240 }));

    // === PENJELASAN UMUM ===
    elements.push(createParagraph('PENJELASAN UMUM', { bold: true, size: 24 }));
    elements.push(...createSpacer(1));

    elements.push(createParagraph(
      lp.penjelasan_umum || `Spesifikasi teknis ini menjelaskan detail kebutuhan untuk pengadaan ${lp.nama_pengadaan} yang akan dilakukan oleh ${satker.nama}.`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // === SPESIFIKASI PER ITEM ===
    elements.push(createParagraph('SPESIFIKASI TEKNIS PER ITEM', { bold: true, size: 24 }));
    elements.push(...createSpacer(1));

    items.forEach((item, idx) => {
      elements.push(createParagraph(`${idx + 1}. ${item.uraian}`, { bold: true }));

      // Tabel spesifikasi detail
      const specTable = [
        ['Aspek', 'Spesifikasi'],
        ['Deskripsi', item.deskripsi || '-'],
        ['Spesifikasi Teknis', item.spesifikasi || '-'],
        ['Standar/SNI', item.standar || '-'],
        ['Volume', `${item.volume} ${item.satuan}`],
        ['Keterangan', item.keterangan || '-'],
      ];

      elements.push(createSimpleTable(specTable, [2000, 4500]));
      elements.push(...createSpacer(1));
    });

    // === CATATAN ===
    if (lp.catatan_spesifikasi) {
      elements.push(...createSpacer(1));
      elements.push(createParagraph('CATATAN KHUSUS:', { bold: true }));
      elements.push(createParagraph(lp.catatan_spesifikasi, { align: 'justify' }));
    }

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `Spesifikasi_Teknis_${nomor}.docx`;
  }
}

module.exports = { SpesifikasiTeknis };
