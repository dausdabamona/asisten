const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatRupiah, terbilangRupiah } = require('../../helpers/format-helper');

class KwitansiTier2Generator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.pejabat?.ppk) throw new Error('Data PPK diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, supplier, pejabat } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('KWITANSI', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    // === NOMOR DAN TANGGAL ===
    elements.push(createParagraph(`Nomor   : ${lp.nomor_kwi || lp.nomor}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Tanggal : ${new Date().toLocaleDateString('id-ID')}`, { spaceAfter: 240 }));

    // === PENERIMA ===
    elements.push(createParagraph('Telah diterima dari :', { spaceAfter: 60 }));
    elements.push(createParagraph(`${pejabat.ppk.nama} (${pejabat.ppk.nip})`, { bold: true, indentLeft: 360 }));
    elements.push(createParagraph(`sebagai Pejabat Pembuat Komitmen ${satker.nama}`, { indentLeft: 360 }));

    elements.push(...createSpacer(1));

    // === JUMLAH UANG ===
    const nilaiKontrak = lp.nilai_kontrak || lp.total_nilai;
    const ppnAmount = Math.round(nilaiKontrak * 0.11);
    const totalBersih = nilaiKontrak - ppnAmount;

    elements.push(createParagraph('Uang sebesar :', { spaceAfter: 60 }));
    elements.push(createParagraph(`Rp ${formatRupiah(nilaiKontrak)}`, {
      bold: true,
      size: 24,
      align: 'center',
      indentLeft: 360,
    }));
    elements.push(createParagraph(`(${terbilangRupiah(nilaiKontrak)})`, {
      align: 'center',
      indentLeft: 360,
      spaceAfter: 240,
    }));

    // === UNTUK PEMBAYARAN ===
    elements.push(createParagraph(
      `Untuk pembayaran ${lp.nama_pengadaan} kepada:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    elements.push(createParagraph(`Nama       : ${supplier.nama}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Alamat     : ${supplier.alamat}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`NPWP       : ${supplier.npwp || '-'}`, { spaceAfter: 240 }));

    // === TABEL RINCIAN ===
    elements.push(createParagraph('Rincian Pembayaran:', { bold: true, spaceAfter: 120 }));

    const breakdownTable = [
      ['Uraian', 'Jumlah'],
      ['Nilai Pengadaan', { text: formatRupiah(nilaiKontrak), align: 'right' }],
      ['PPN 11%', { text: formatRupiah(ppnAmount), align: 'right' }],
      ['Netto', { text: formatRupiah(totalBersih), align: 'right', bold: true }],
    ];

    elements.push(createSimpleTable(breakdownTable, [3500, 2500]));

    elements.push(...createSpacer(2));

    // === PERNYATAAN ===
    elements.push(createParagraph(
      'Dengan ini kami menyatakan telah menerima uang tersebut dalam jumlah dan kondisi sebagaimana tersebut di atas dengan baik dan sempurna.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(2));

    // === TANDA TANGAN ===
    elements.push(createSignatureTable([
      { jabatan: 'Pejabat Pembuat Komitmen', nama: pejabat.ppk.nama, nip: pejabat.ppk.nip },
      { jabatan: 'Penerima Uang\n' + supplier.nama, nama: supplier.nama_direktur || '', nip: supplier.npwp || '' },
      { jabatan: 'Saksi\nBendahara', nama: pejabat.bendahara?.nama || '', nip: pejabat.bendahara?.nip || '' },
    ]));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_kwi || data.lp.nomor).replace(/\//g, '-');
    return `Kwitansi_Tier2_${nomor}.docx`;
  }
}

module.exports = { KwitansiTier2Generator };
