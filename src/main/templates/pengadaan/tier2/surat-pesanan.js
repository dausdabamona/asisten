const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilangRupiah } = require('../../helpers/format-helper');

// Helper terbilang (sederhana untuk angka kecil)
function terbilang(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas'];
  const puluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

  if (n <= 15) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' belas';
  if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + satuan[n % 10] : '');
  return String(n);
}

class SuratPesananGenerator extends BaseDocumentGenerator {
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
    elements.push(createParagraph('SURAT PESANAN', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor_kontrak || lp.nomor}`, {
      align: 'center',
      spaceAfter: 240,
    }));

    // === PARA PIHAK ===
    elements.push(createParagraph('Pada hari ini, kami yang bertanda tangan di bawah ini:', { spaceAfter: 120 }));

    elements.push(createParagraph('I. PIHAK PERTAMA (PEMESAN)', { bold: true, spaceAfter: 60 }));
    elements.push(createParagraph(`Nama       : ${pejabat.ppk.nama}`, { indentLeft: 360 }));
    elements.push(createParagraph(`NIP        : ${pejabat.ppk.nip}`, { indentLeft: 360 }));
    elements.push(createParagraph(`Jabatan    : Pejabat Pembuat Komitmen`, { indentLeft: 360 }));
    elements.push(createParagraph(`Alamat     : ${satker.alamat}`, { indentLeft: 360 }));

    elements.push(...createSpacer(1));

    elements.push(createParagraph('II. PIHAK KEDUA (PENYEDIA)', { bold: true, spaceAfter: 60 }));
    elements.push(createParagraph(`Nama       : ${supplier.nama}`, { indentLeft: 360 }));
    elements.push(createParagraph(`Alamat     : ${supplier.alamat}`, { indentLeft: 360 }));
    elements.push(createParagraph(`NPWP       : ${supplier.npwp || '-'}`, { indentLeft: 360 }));
    elements.push(createParagraph(`Direktur   : ${supplier.nama_direktur || '-'}`, { indentLeft: 360 }));

    elements.push(...createSpacer(1));

    // === ISI PESANAN ===
    elements.push(createParagraph('Kedua belah pihak sepakat untuk mengadakan perjanjian pengadaan dengan ketentuan sebagai berikut:', { align: 'justify' }));

    elements.push(...createSpacer(1));

    // Pasal 1
    elements.push(createParagraph('Pasal 1 - LINGKUP PEKERJAAN', { bold: true }));
    elements.push(createParagraph(`PIHAK KEDUA berkewajiban untuk menyediakan ${lp.nama_pengadaan} dengan rincian sebagai berikut:`, { align: 'justify', firstLineIndent: 720 }));

    elements.push(...createSpacer(1));

    // Tabel rincian
    const tableData = [
      ['No', 'Uraian Barang/Jasa', 'Vol', 'Sat', 'Harga Satuan', 'Jumlah'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.volume,
        item.satuan,
        { text: formatRupiah(item.harga_satuan), align: 'right' },
        { text: formatRupiah(item.jumlah), align: 'right' },
      ]),
      ['', { text: 'TOTAL', bold: true }, '', '', '', { text: formatRupiah(lp.nilai_kontrak || lp.total_nilai), align: 'right', bold: true }],
    ];

    elements.push(createSimpleTable(tableData, [400, 2800, 600, 600, 1400, 1400]));

    elements.push(...createSpacer(1));

    // Pasal 2
    elements.push(createParagraph('Pasal 2 - NILAI PESANAN', { bold: true }));
    const nilaiKontrak = lp.nilai_kontrak || lp.total_nilai;
    elements.push(createParagraph(
      `Nilai Surat Pesanan ini adalah sebesar Rp ${formatRupiah(nilaiKontrak)} (${terbilangRupiah(nilaiKontrak)}).`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // Pasal 3
    elements.push(createParagraph('Pasal 3 - JANGKA WAKTU', { bold: true }));
    elements.push(createParagraph(
      `Jangka waktu pelaksanaan pekerjaan adalah selama ${lp.jangka_waktu_kontrak || 30} (${terbilang(lp.jangka_waktu_kontrak || 30)}) hari kalender, terhitung sejak tanggal ${formatTanggalPanjang(lp.tanggal_mulai_kontrak || lp.tanggal_kontrak || new Date())}.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // Pasal 4
    elements.push(createParagraph('Pasal 4 - PEMBAYARAN', { bold: true }));
    elements.push(createParagraph(
      'Pembayaran akan dilakukan setelah pekerjaan selesai 100% dan diterima dengan baik oleh PIHAK PERTAMA, yang dibuktikan dengan Berita Acara Serah Terima.',
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // Pasal 5
    elements.push(createParagraph('Pasal 5 - SANKSI', { bold: true }));
    elements.push(createParagraph(
      'Apabila PIHAK KEDUA tidak dapat menyelesaikan pekerjaan sesuai jangka waktu yang ditentukan, maka akan dikenakan denda keterlambatan sebesar 1/1000 (satu per seribu) dari nilai pesanan untuk setiap hari keterlambatan.',
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(2));

    // === TANDA TANGAN ===
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(lp.tanggal_kontrak || new Date())}`, { align: 'center' }));

    elements.push(...createSpacer(1));

    elements.push(createSignatureTable([
      { jabatan: 'PIHAK PERTAMA\nPejabat Pembuat Komitmen', nama: pejabat.ppk.nama, nip: pejabat.ppk.nip },
      { jabatan: `PIHAK KEDUA\n${supplier.nama}`, nama: supplier.nama_direktur || '', nip: '' },
    ]));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_kontrak || data.lp.nomor).replace(/\//g, '-');
    return `Surat_Pesanan_${nomor}.docx`;
  }
}

module.exports = { SuratPesananGenerator };
