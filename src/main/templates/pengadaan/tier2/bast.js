const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatTanggalHari } = require('../../helpers/format-helper');

class BASTGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    if (!data.pejabat?.ppk) throw new Error('Data PPK diperlukan');
    if (!data.items || data.items.length === 0) throw new Error('Data items diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, supplier, pejabat, items } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('BERITA ACARA SERAH TERIMA', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 60,
    }));

    elements.push(createParagraph('BARANG/HASIL PEKERJAAN', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor_bast || lp.nomor}/BAST/${new Date().getFullYear()}`, {
      align: 'center',
      spaceAfter: 240,
    }));

    // === PEMBUKAAN ===
    elements.push(createParagraph(
      `Pada hari ini, ${formatTanggalHari(lp.tanggal_serah_terima || new Date())}, kami yang bertanda tangan di bawah ini:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // Pihak Pertama (PPK)
    elements.push(createParagraph('1. PIHAK PERTAMA', { bold: true }));
    elements.push(createParagraph(`   Nama     : ${pejabat.ppk.nama}`));
    elements.push(createParagraph(`   NIP      : ${pejabat.ppk.nip}`));
    elements.push(createParagraph(`   Jabatan  : Pejabat Pembuat Komitmen ${satker.nama}`));
    elements.push(createParagraph(`   yang selanjutnya disebut PIHAK YANG MENERIMA`));

    elements.push(...createSpacer(1));

    // Pihak Kedua (Penyedia)
    elements.push(createParagraph('2. PIHAK KEDUA', { bold: true }));
    elements.push(createParagraph(`   Nama     : ${supplier.nama_direktur || supplier.nama}`));
    elements.push(createParagraph(`   Jabatan  : ${supplier.jabatan_direktur || 'Direktur'} ${supplier.nama}`));
    elements.push(createParagraph(`   Alamat   : ${supplier.alamat}`));
    elements.push(createParagraph(`   yang selanjutnya disebut PIHAK YANG MENYERAHKAN`));

    elements.push(...createSpacer(1));

    // === ISI BAST ===
    elements.push(createParagraph(
      'Berdasarkan Surat Pesanan/Kontrak Nomor ' + (lp.nomor_kontrak || lp.nomor) + ' tanggal ' + formatTanggalPanjang(lp.tanggal_kontrak || new Date()) + ', PIHAK KEDUA telah menyelesaikan pekerjaan dan menyerahkan kepada PIHAK PERTAMA berupa:',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // Tabel barang
    const tableData = [
      ['No', 'Uraian Barang/Jasa', 'Volume', 'Satuan', 'Kondisi'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.volume,
        item.satuan,
        item.kondisi || 'Baik',
      ]),
    ];

    elements.push(createSimpleTable(tableData, [500, 3500, 800, 800, 1000]));

    elements.push(...createSpacer(1));

    // Pernyataan
    elements.push(createParagraph(
      'Barang/hasil pekerjaan tersebut di atas telah diterima dalam keadaan baik dan lengkap sesuai dengan spesifikasi yang tercantum dalam Surat Pesanan/Kontrak.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    if (lp.catatan_serah_terima) {
      elements.push(createParagraph(`Catatan: ${lp.catatan_serah_terima}`, { italics: true }));
      elements.push(...createSpacer(1));
    }

    elements.push(createParagraph(
      'Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(2));

    // === TANDA TANGAN ===
    elements.push(createSignatureTable([
      { jabatan: 'PIHAK YANG MENYERAHKAN\n' + supplier.nama, nama: supplier.nama_direktur || '', nip: '' },
      { jabatan: 'PIHAK YANG MENERIMA\nPejabat Pembuat Komitmen', nama: pejabat.ppk.nama, nip: pejabat.ppk.nip },
    ]));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_bast || data.lp.nomor).replace(/\//g, '-');
    return `BAST_${nomor}.docx`;
  }
}

module.exports = { BASTGenerator };
