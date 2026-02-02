const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat, createTempatTanggal, createTandaTanganSingle } = require('../../helpers/kop-surat-helper');
const { createSimpleTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah } = require('../../helpers/format-helper');

class UndanganPenawaranGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    if (!data.pejabat?.ppk) throw new Error('Data PPK diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, supplier, pejabat, items } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === HEADER SURAT ===
    elements.push(createParagraph(`Nomor    : ${lp.nomor}/UND/${new Date().getFullYear()}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Lampiran : 1 (satu) berkas`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Perihal  : Undangan Penawaran ${lp.nama_pengadaan}`, { bold: true }));

    elements.push(...createSpacer(1));

    // === TUJUAN ===
    elements.push(createParagraph('Kepada Yth.'));
    elements.push(createParagraph(`${supplier.nama}`, { bold: true, indentLeft: 720 }));
    elements.push(createParagraph(`${supplier.alamat}`, { indentLeft: 720 }));
    elements.push(createParagraph(`di ${supplier.kota}`, { indentLeft: 720 }));

    elements.push(...createSpacer(1));

    // === ISI SURAT ===
    elements.push(createParagraph('Dengan hormat,'));
    elements.push(...createSpacer(1));

    elements.push(createParagraph(
      `Sehubungan dengan rencana pengadaan ${lp.nama_pengadaan} pada ${satker.nama}, dengan ini kami mengundang Saudara untuk menyampaikan penawaran harga dengan ketentuan sebagai berikut:`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // === TABEL KEBUTUHAN ===
    const tableData = [
      ['No', 'Uraian Barang/Jasa', 'Spesifikasi', 'Volume', 'Satuan'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.spesifikasi || '-',
        item.volume,
        item.satuan,
      ]),
    ];

    elements.push(createSimpleTable(tableData, [500, 3000, 2000, 800, 800]));

    elements.push(...createSpacer(1));

    // === KETENTUAN ===
    elements.push(createParagraph('Ketentuan:', { bold: true }));
    elements.push(createParagraph('1. Penawaran harga sudah termasuk biaya pengiriman sampai lokasi.', { indentLeft: 360 }));
    elements.push(createParagraph('2. Penawaran mencantumkan masa berlaku penawaran minimal 30 hari.', { indentLeft: 360 }));
    elements.push(createParagraph('3. Barang yang ditawarkan adalah barang baru dan berkualitas baik.', { indentLeft: 360 }));
    elements.push(createParagraph('4. Melampirkan fotokopi NPWP, NIB, dan dokumen legalitas usaha.', { indentLeft: 360 }));
    elements.push(createParagraph(`5. Penawaran disampaikan paling lambat tanggal ${formatTanggalPanjang(lp.batas_penawaran || new Date())}.`, { indentLeft: 360 }));

    elements.push(...createSpacer(1));

    // === PENUTUP ===
    elements.push(createParagraph(
      'Demikian undangan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.',
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // === TANDA TANGAN ===
    elements.push(createTempatTanggal(satker.kota, lp.tanggal_dibuat));
    elements.push(...createTandaTanganSingle(
      'Pejabat Pembuat Komitmen',
      pejabat.ppk.nama,
      pejabat.ppk.nip,
      { align: 'right' }
    ));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `Undangan_Penawaran_${nomor}.docx`;
  }
}

module.exports = { UndanganPenawaranGenerator };
