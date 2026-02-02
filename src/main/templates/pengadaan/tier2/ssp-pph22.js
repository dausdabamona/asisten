const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable } = require('../../helpers/table-helper');
const { formatRupiah, formatTanggalPanjang } = require('../../helpers/format-helper');

class SSPPph22Generator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    if (!data.pph22_amount) throw new Error('Jumlah PPh 22 diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, supplier, pph22_amount } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('SURAT SETORAN PAJAK (SSP)', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 60,
    }));

    elements.push(createParagraph('PPh PASAL 22', {
      align: 'center',
      bold: true,
      size: 24,
      spaceAfter: 240,
    }));

    // === INFORMASI SETORAN ===
    elements.push(createParagraph('IDENTITAS WAJIB PAJAK', { bold: true }));
    elements.push(...createSpacer(1));

    const taxpayerTable = [
      ['Nama WP', satker.nama],
      ['NPWP WP', satker.npwp || '-'],
      ['Alamat', satker.alamat],
    ];

    elements.push(createSimpleTable(taxpayerTable, [1500, 4500]));

    elements.push(...createSpacer(1));

    // === IDENTITAS OBYEK PAJAK ===
    elements.push(createParagraph('IDENTITAS OBYEK PAJAK', { bold: true }));
    elements.push(...createSpacer(1));

    const objectTable = [
      ['Nama Penerima', supplier.nama],
      ['NPWP Penerima', supplier.npwp || '-'],
      ['Alamat Penerima', supplier.alamat],
      ['Uraian Pengadaan', lp.nama_pengadaan],
      ['Nomor Kontrak', lp.nomor_kontrak || lp.nomor],
    ];

    elements.push(createSimpleTable(objectTable, [1500, 4500]));

    elements.push(...createSpacer(1));

    // === RINCIAN SETORAN ===
    elements.push(createParagraph('RINCIAN SETORAN PPh PASAL 22', { bold: true }));
    elements.push(...createSpacer(1));

    const settlementTable = [
      ['Uraian', 'Jumlah'],
      ['Nilai Pengadaan', { text: formatRupiah(lp.nilai_kontrak || lp.total_nilai), align: 'right' }],
      ['Tarif PPh Pasal 22 (1.5%)', '1.5%'],
      ['Jumlah Setoran PPh', { text: formatRupiah(pph22_amount), align: 'right', bold: true }],
    ];

    elements.push(createSimpleTable(settlementTable, [3000, 2500]));

    elements.push(...createSpacer(1));

    // === KETERANGAN SETORAN ===
    elements.push(createParagraph('KETERANGAN SETORAN', { bold: true }));
    elements.push(...createSpacer(1));

    const infoTable = [
      ['Kode Pajak', '411121 (PPh Pasal 22)'],
      ['Masa Pajak', formatTanggalPanjang(new Date())],
      ['Tanggal Setoran', formatTanggalPanjang(new Date())],
      ['Tempat Setor', 'Bank Persepsi / Kantor Pos'],
    ];

    elements.push(createSimpleTable(infoTable, [1500, 4500]));

    elements.push(...createSpacer(2));

    // === PERNYATAAN ===
    elements.push(createParagraph(
      'Surat Setoran Pajak (SSP) ini dibuat sebagai bukti setor pajak PPh Pasal 22 yang telah disetor ke kas negara melalui Bank/Kantor Pos yang ditunjuk.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(new Date())}`, { align: 'right' }));

    elements.push(...createSpacer(1));

    elements.push(createParagraph('Dibuat oleh:', { bold: true }));
    elements.push(...createSpacer(1));
    elements.push(createParagraph(`${satker.nama}`));
    elements.push(createParagraph(`(${satker.npwp || 'NPWP'})`));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_kontrak || data.lp.nomor).replace(/\//g, '-');
    return `SSP_PPh22_${nomor}.docx`;
  }
}

module.exports = { SSPPph22Generator };
