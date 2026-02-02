const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatTanggalHari, formatRupiah, terbilangRupiah } = require('../../helpers/format-helper');

class BANegosiasi extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier2');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    if (!data.pejabat?.ppk) throw new Error('Data PPK diperlukan');
    if (!data.negosiasi) throw new Error('Data negosiasi diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, supplier, pejabat, items, negosiasi } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('BERITA ACARA NEGOSIASI', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor}/BA-NEG/${new Date().getFullYear()}`, {
      align: 'center',
      spaceAfter: 240,
    }));

    // === PEMBUKAAN ===
    elements.push(createParagraph(
      `Pada hari ini, ${formatTanggalHari(negosiasi.tanggal || new Date())}, bertempat di ${satker.nama}, telah dilaksanakan negosiasi harga untuk pekerjaan:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    elements.push(createParagraph(`Nama Pekerjaan : ${lp.nama_pengadaan}`, { indentLeft: 720 }));
    elements.push(createParagraph(`HPS            : Rp ${formatRupiah(lp.hps || lp.total_nilai)}`, { indentLeft: 720 }));
    elements.push(createParagraph(`Sumber Dana    : ${lp.sumber_dana || 'DIPA Tahun Anggaran ' + new Date().getFullYear()}`, { indentLeft: 720 }));

    elements.push(...createSpacer(1));

    // === PIHAK-PIHAK ===
    elements.push(createParagraph('Negosiasi dilakukan antara:', { bold: true }));
    elements.push(createParagraph(`1. Nama    : ${pejabat.ppk.nama}`, { indentLeft: 360 }));
    elements.push(createParagraph(`   Jabatan : Pejabat Pembuat Komitmen`, { indentLeft: 360 }));
    elements.push(createParagraph(`   selanjutnya disebut PIHAK PERTAMA`, { indentLeft: 360 }));
    elements.push(...createSpacer(1));
    elements.push(createParagraph(`2. Nama    : ${supplier.nama_direktur || supplier.nama}`, { indentLeft: 360 }));
    elements.push(createParagraph(`   Jabatan : ${supplier.jabatan_direktur || 'Direktur'} ${supplier.nama}`, { indentLeft: 360 }));
    elements.push(createParagraph(`   selanjutnya disebut PIHAK KEDUA`, { indentLeft: 360 }));

    elements.push(...createSpacer(1));

    // === HASIL NEGOSIASI ===
    elements.push(createParagraph('Hasil Negosiasi:', { bold: true }));
    elements.push(...createSpacer(1));

    // Tabel perbandingan harga
    const tableData = [
      ['No', 'Uraian', 'Harga Penawaran', 'Harga Negosiasi', 'Selisih'],
      ...items.map((item, idx) => {
        const hargaPenawaran = item.harga_penawaran || item.harga_satuan;
        const hargaNegosiasi = item.harga_negosiasi || item.harga_satuan;
        const selisih = hargaPenawaran - hargaNegosiasi;
        return [
          idx + 1,
          item.uraian,
          { text: formatRupiah(hargaPenawaran), align: 'right' },
          { text: formatRupiah(hargaNegosiasi), align: 'right' },
          { text: formatRupiah(selisih), align: 'right' },
        ];
      }),
    ];

    elements.push(createSimpleTable(tableData, [400, 3000, 1500, 1500, 1200]));

    elements.push(...createSpacer(1));

    // Total
    const totalPenawaran = negosiasi.total_penawaran || lp.total_nilai;
    const totalNegosiasi = negosiasi.total_negosiasi || lp.nilai_kontrak || lp.total_nilai;

    elements.push(createParagraph(`Total Harga Penawaran  : Rp ${formatRupiah(totalPenawaran)}`));
    elements.push(createParagraph(`Total Harga Negosiasi  : Rp ${formatRupiah(totalNegosiasi)}`, { bold: true }));
    elements.push(createParagraph(`Selisih/Efisiensi      : Rp ${formatRupiah(totalPenawaran - totalNegosiasi)}`));

    elements.push(...createSpacer(1));

    // === KESIMPULAN ===
    elements.push(createParagraph(
      `Berdasarkan hasil negosiasi tersebut di atas, kedua belah pihak sepakat bahwa harga yang disepakati adalah sebesar Rp ${formatRupiah(totalNegosiasi)} (${terbilangRupiah(totalNegosiasi)}).`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    elements.push(createParagraph(
      'Demikian Berita Acara Negosiasi ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(2));

    // === TANDA TANGAN ===
    elements.push(createSignatureTable([
      { jabatan: 'PIHAK PERTAMA\nPejabat Pembuat Komitmen', nama: pejabat.ppk.nama, nip: pejabat.ppk.nip },
      { jabatan: `PIHAK KEDUA\n${supplier.nama}`, nama: supplier.nama_direktur || '', nip: '' },
    ]));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `BA_Negosiasi_${nomor}.docx`;
  }
}

module.exports = { BANegosiasi };
