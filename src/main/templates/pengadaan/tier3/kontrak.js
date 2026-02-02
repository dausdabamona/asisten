const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer, createPageBreak } = require('../../helpers/doc-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilangRupiah } = require('../../helpers/format-helper');

// Helper terbilang untuk angka
function terbilangAngka(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const puluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

  if (n <= 11) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' belas';
  if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + satuan[n % 10] : '');
  return String(n);
}

class KontrakLengkapGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier3');
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
    const nilaiKontrak = lp.nilai_kontrak || lp.total_nilai;

    // ============================================================
    // HALAMAN JUDUL KONTRAK
    // ============================================================
    elements.push(...createSpacer(5));

    elements.push(createParagraph('SURAT PERJANJIAN', {
      align: 'center',
      bold: true,
      size: 36,
    }));

    elements.push(createParagraph('UNTUK PELAKSANAAN', {
      align: 'center',
      size: 28,
    }));

    elements.push(createParagraph(lp.nama_pengadaan.toUpperCase(), {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 240,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor_kontrak || lp.nomor}`, {
      align: 'center',
      size: 28,
      spaceAfter: 480,
    }));

    elements.push(...createSpacer(5));

    elements.push(createParagraph('ANTARA', { align: 'center', bold: true }));
    elements.push(...createSpacer(1));
    elements.push(createParagraph(satker.nama.toUpperCase(), { align: 'center', bold: true, size: 22 }));
    elements.push(...createSpacer(1));
    elements.push(createParagraph('DENGAN', { align: 'center', bold: true }));
    elements.push(...createSpacer(1));
    elements.push(createParagraph(supplier.nama.toUpperCase(), { align: 'center', bold: true, size: 22 }));

    elements.push(...createSpacer(5));

    elements.push(createParagraph(`TAHUN ANGGARAN ${new Date().getFullYear()}`, { align: 'center' }));

    elements.push(createPageBreak());

    // ============================================================
    // ISI KONTRAK
    // ============================================================
    elements.push(createParagraph('SURAT PERJANJIAN', {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 120,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor_kontrak || lp.nomor}`, {
      align: 'center',
      spaceAfter: 240,
    }));

    // Pembukaan
    elements.push(createParagraph(
      `Surat Perjanjian ini, selanjutnya disebut "Kontrak", dibuat dan ditandatangani pada hari ini, ${formatTanggalPanjang(lp.tanggal_kontrak || new Date())}, antara:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // PIHAK PERTAMA
    elements.push(createParagraph('I. PIHAK PERTAMA:', { bold: true }));
    elements.push(createParagraph(`   Nama       : ${pejabat.ppk.nama}`));
    elements.push(createParagraph(`   NIP        : ${pejabat.ppk.nip}`));
    elements.push(createParagraph(`   Jabatan    : Pejabat Pembuat Komitmen`));
    elements.push(createParagraph(`   Alamat     : ${satker.alamat}`));
    elements.push(createParagraph(
      `   Dalam hal ini bertindak untuk dan atas nama ${satker.nama}, selanjutnya disebut "PIHAK PERTAMA".`,
      { spaceAfter: 240 }
    ));

    // PIHAK KEDUA
    elements.push(createParagraph('II. PIHAK KEDUA:', { bold: true }));
    elements.push(createParagraph(`   Nama Perusahaan : ${supplier.nama}`));
    elements.push(createParagraph(`   Alamat          : ${supplier.alamat}`));
    elements.push(createParagraph(`   NPWP            : ${supplier.npwp || '-'}`));
    elements.push(createParagraph(`   Yang diwakili oleh:`));
    elements.push(createParagraph(`   Nama            : ${supplier.nama_direktur || '-'}`));
    elements.push(createParagraph(`   Jabatan         : ${supplier.jabatan_direktur || 'Direktur'}`));
    elements.push(createParagraph(
      `   Dalam hal ini bertindak untuk dan atas nama ${supplier.nama}, selanjutnya disebut "PIHAK KEDUA".`,
      { spaceAfter: 240 }
    ));

    elements.push(createParagraph(
      'Para Pihak menerangkan terlebih dahulu bahwa PIHAK PERTAMA telah melakukan proses pemilihan penyedia dan PIHAK KEDUA telah ditetapkan sebagai Penyedia. Selanjutnya Para Pihak sepakat untuk mengikatkan diri dalam Kontrak ini dengan ketentuan-ketentuan sebagai berikut:',
      { align: 'justify' }
    ));

    elements.push(createPageBreak());

    // ============================================================
    // PASAL 1 - LINGKUP PEKERJAAN
    // ============================================================
    elements.push(createParagraph('PASAL 1', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('LINGKUP PEKERJAAN', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `PIHAK KEDUA berkewajiban untuk melaksanakan pekerjaan ${lp.nama_pengadaan} sesuai dengan spesifikasi yang tercantum dalam Kontrak ini, yang meliputi:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // Tabel rincian
    const tableData = [
      ['No', 'Uraian Barang/Jasa', 'Volume', 'Satuan', 'Harga Satuan', 'Jumlah'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.volume,
        item.satuan,
        { text: formatRupiah(item.harga_satuan), align: 'right' },
        { text: formatRupiah(item.jumlah), align: 'right' },
      ]),
      ['', { text: 'TOTAL', bold: true }, '', '', '', { text: formatRupiah(nilaiKontrak), align: 'right', bold: true }],
    ];

    elements.push(createSimpleTable(tableData, [400, 2500, 600, 600, 1300, 1400]));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 2 - NILAI KONTRAK
    // ============================================================
    elements.push(createParagraph('PASAL 2', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('NILAI KONTRAK', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `(1) Nilai Kontrak termasuk keuntungan, biaya overhead, dan pajak-pajak yang berlaku adalah sebesar Rp ${formatRupiah(nilaiKontrak)} (${terbilangRupiah(nilaiKontrak)}).`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(2) Nilai Kontrak sebagaimana dimaksud pada ayat (1) merupakan nilai tetap dan pasti (lump sum) tidak dapat diubah kecuali terdapat perubahan ruang lingkup pekerjaan.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 3 - JANGKA WAKTU
    // ============================================================
    elements.push(createParagraph('PASAL 3', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('JANGKA WAKTU PELAKSANAAN', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `(1) Jangka waktu pelaksanaan pekerjaan adalah selama ${lp.jangka_waktu_kontrak || 30} (${terbilangAngka(lp.jangka_waktu_kontrak || 30)}) hari kalender.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(2) Waktu pelaksanaan dihitung sejak tanggal ${formatTanggalPanjang(lp.tanggal_mulai_kontrak || lp.tanggal_kontrak)} sampai dengan tanggal ${formatTanggalPanjang(lp.tanggal_selesai_kontrak || new Date())}.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 4 - HAK DAN KEWAJIBAN
    // ============================================================
    elements.push(createParagraph('PASAL 4', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('HAK DAN KEWAJIBAN PARA PIHAK', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph('(1) Hak dan Kewajiban PIHAK PERTAMA:', { bold: true, indentLeft: 360 }));
    elements.push(createParagraph('    a. Mengawasi dan memeriksa pekerjaan yang dilaksanakan oleh PIHAK KEDUA;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    b. Meminta laporan pelaksanaan pekerjaan secara berkala;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    c. Membayar pekerjaan sesuai dengan nilai Kontrak setelah pekerjaan diterima dengan baik;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    d. Memberikan fasilitas berupa sarana dan prasarana yang diperlukan oleh PIHAK KEDUA.', { align: 'justify', indentLeft: 720, spaceAfter: 120 }));

    elements.push(createParagraph('(2) Hak dan Kewajiban PIHAK KEDUA:', { bold: true, indentLeft: 360 }));
    elements.push(createParagraph('    a. Menerima pembayaran sesuai nilai Kontrak setelah pekerjaan diterima dengan baik;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    b. Melaksanakan dan menyelesaikan pekerjaan sesuai dengan Kontrak;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    c. Memberikan keterangan yang diperlukan untuk pemeriksaan pekerjaan;', { align: 'justify', indentLeft: 720 }));
    elements.push(createParagraph('    d. Menyerahkan hasil pekerjaan sesuai jadwal yang ditetapkan.', { align: 'justify', indentLeft: 720 }));

    elements.push(createPageBreak());

    // ============================================================
    // PASAL 5 - PEMBAYARAN
    // ============================================================
    elements.push(createParagraph('PASAL 5', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('CARA PEMBAYARAN', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `(1) Pembayaran dilakukan setelah pekerjaan selesai 100% (seratus persen) dan diterima dengan baik oleh PIHAK PERTAMA, yang dibuktikan dengan Berita Acara Serah Terima Pekerjaan.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(2) Pembayaran dilakukan melalui transfer ke rekening PIHAK KEDUA:`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(`    Bank         : ${supplier.nama_bank || '-'}`, { indentLeft: 720 }));
    elements.push(createParagraph(`    No. Rekening : ${supplier.nomor_rekening || '-'}`, { indentLeft: 720 }));
    elements.push(createParagraph(`    Atas Nama    : ${supplier.nama_rekening || supplier.nama}`, { indentLeft: 720 }));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 6 - SANKSI DAN DENDA
    // ============================================================
    elements.push(createParagraph('PASAL 6', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('SANKSI DAN DENDA KETERLAMBATAN', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `(1) Apabila PIHAK KEDUA tidak dapat menyelesaikan pekerjaan sesuai dengan jangka waktu yang ditetapkan, maka PIHAK KEDUA dikenakan denda keterlambatan sebesar 1/1000 (satu per seribu) dari nilai Kontrak untuk setiap hari keterlambatan.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(2) Denda keterlambatan sebagaimana dimaksud pada ayat (1) maksimal sebesar 5% (lima persen) dari nilai Kontrak.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(3) Apabila denda keterlambatan telah mencapai 5% (lima persen), maka PIHAK PERTAMA dapat memutuskan Kontrak secara sepihak.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 7 - PENYELESAIAN PERSELISIHAN
    // ============================================================
    elements.push(createParagraph('PASAL 7', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('PENYELESAIAN PERSELISIHAN', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `(1) Apabila terjadi perselisihan antara Para Pihak, maka akan diselesaikan secara musyawarah untuk mufakat.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(createParagraph(
      `(2) Apabila penyelesaian secara musyawarah tidak tercapai, maka akan diselesaikan melalui Pengadilan Negeri ${satker.kota || 'setempat'}.`,
      { align: 'justify', indentLeft: 360, hangingIndent: 360 }
    ));

    elements.push(...createSpacer(1));

    // ============================================================
    // PASAL 8 - PENUTUP
    // ============================================================
    elements.push(createParagraph('PASAL 8', { align: 'center', bold: true, size: 24 }));
    elements.push(createParagraph('PENUTUP', { align: 'center', bold: true, size: 24, spaceAfter: 120 }));

    elements.push(createParagraph(
      `Surat Perjanjian ini dibuat dalam rangkap 2 (dua) bermeterai cukup, masing-masing mempunyai kekuatan hukum yang sama, 1 (satu) rangkap untuk PIHAK PERTAMA dan 1 (satu) rangkap untuk PIHAK KEDUA.`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(2));

    // ============================================================
    // TANDA TANGAN
    // ============================================================
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
    return `Kontrak_Lengkap_${nomor}.docx`;
  }
}

module.exports = { KontrakLengkapGenerator };
