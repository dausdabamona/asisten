const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatTanggalHari } = require('../../helpers/format-helper');

class BAPemeriksaanPekerjaanGenerator extends BaseDocumentGenerator {
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
    const { satker, lp, supplier, pejabat, items, pemeriksaan } = data;
    const elements = [];

    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));

    // === JUDUL ===
    elements.push(createParagraph('BERITA ACARA PEMERIKSAAN PEKERJAAN', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));

    elements.push(createParagraph(`Nomor: ${lp.nomor_ba_pemeriksaan || lp.nomor}/BA-PERIKSA/${new Date().getFullYear()}`, {
      align: 'center',
      spaceAfter: 240,
    }));

    // === PEMBUKAAN ===
    elements.push(createParagraph(
      `Pada hari ini, ${formatTanggalHari(pemeriksaan?.tanggal || new Date())}, kami yang bertanda tangan di bawah ini:`,
      { align: 'justify' }
    ));

    elements.push(...createSpacer(1));

    // Inspektur/Quality Checker
    elements.push(createParagraph('1. INSPEKTUR PEKERJAAN', { bold: true }));
    elements.push(createParagraph(`   Nama     : ${pejabat.ppk.nama}`));
    elements.push(createParagraph(`   NIP      : ${pejabat.ppk.nip}`));
    elements.push(createParagraph(`   Jabatan  : Pejabat Pembuat Komitmen ${satker.nama}`));
    elements.push(createParagraph(`   yang selanjutnya disebut PIHAK PERTAMA`));

    elements.push(...createSpacer(1));

    // Penyedia/Supplier
    elements.push(createParagraph('2. PENYEDIA PEKERJAAN', { bold: true }));
    elements.push(createParagraph(`   Nama     : ${supplier.nama_direktur || supplier.nama}`));
    elements.push(createParagraph(`   Jabatan  : ${supplier.jabatan_direktur || 'Direktur'} ${supplier.nama}`));
    elements.push(createParagraph(`   Alamat   : ${supplier.alamat}`));
    elements.push(createParagraph(`   yang selanjutnya disebut PIHAK KEDUA`));

    elements.push(...createSpacer(1));

    // === IDENTITAS PEKERJAAN ===
    elements.push(createParagraph('IDENTITAS PEKERJAAN', { bold: true }));
    elements.push(createParagraph(`Nama Pekerjaan  : ${lp.nama_pengadaan}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Nomor Kontrak   : ${lp.nomor_kontrak || lp.nomor}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Tanggal Kontrak : ${formatTanggalPanjang(lp.tanggal_kontrak || new Date())}`, { spaceAfter: 0 }));
    elements.push(createParagraph(`Nilai Kontrak   : Rp ${(lp.nilai_kontrak || lp.total_nilai).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`, { spaceAfter: 240 }));

    // === HASIL PEMERIKSAAN ===
    elements.push(createParagraph('HASIL PEMERIKSAAN', { bold: true }));
    elements.push(...createSpacer(1));

    // Tabel pemeriksaan item
    const tableData = [
      ['No', 'Uraian Pekerjaan', 'Spesifikasi', 'Volume', 'Kondisi', 'Catatan'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.spesifikasi || '-',
        item.volume + ' ' + item.satuan,
        pemeriksaan?.items?.[idx]?.kondisi || 'Sesuai',
        pemeriksaan?.items?.[idx]?.catatan || 'OK',
      ]),
    ];

    elements.push(createSimpleTable(tableData, [400, 1800, 1600, 1000, 1000, 1400]));

    elements.push(...createSpacer(1));

    // === TEMUAN ===
    if (pemeriksaan?.temuan && pemeriksaan.temuan.length > 0) {
      elements.push(createParagraph('TEMUAN PEMERIKSAAN', { bold: true }));
      elements.push(...createSpacer(1));

      pemeriksaan.temuan.forEach((temuan, idx) => {
        elements.push(createParagraph(
          `${idx + 1}. ${temuan.deskripsi}`,
          { indentLeft: 360 }
        ));
        if (temuan.tindakan_perbaikan) {
          elements.push(createParagraph(
            `    Tindakan Perbaikan: ${temuan.tindakan_perbaikan}`,
            { indentLeft: 720, italics: true }
          ));
        }
      });

      elements.push(...createSpacer(1));
    }

    // === KETERANGAN FOTO ===
    if (pemeriksaan?.foto_lampiran && pemeriksaan.foto_lampiran.length > 0) {
      elements.push(createParagraph('DOKUMENTASI FOTO HASIL PEKERJAAN', { bold: true }));
      elements.push(...createSpacer(1));

      pemeriksaan.foto_lampiran.forEach((foto, idx) => {
        elements.push(createParagraph(
          `Foto ${idx + 1}: ${foto.keterangan || `Dokumentasi hasil pekerjaan ${idx + 1}`}`,
          { indentLeft: 360 }
        ));
      });

      elements.push(createParagraph(
        '[Catatan: Foto-foto lampiran terlampir secara terpisah sesuai daftar di atas]',
        { italics: true, spaceAfter: 240 }
      ));
    }

    // === KESIMPULAN ===
    elements.push(createParagraph('KESIMPULAN', { bold: true }));
    elements.push(...createSpacer(1));

    const statusPemeriksaan = pemeriksaan?.status || 'SESUAI';
    let kesimpulanText = '';

    if (statusPemeriksaan === 'SESUAI') {
      kesimpulanText = 'Pekerjaan yang telah dilakukan oleh PIHAK KEDUA telah sesuai dengan spesifikasi teknis, mutu, dan jangka waktu yang disepakati dalam kontrak. Pekerjaan siap untuk dilanjutkan ke tahap Berita Acara Serah Terima.';
    } else if (statusPemeriksaan === 'KONDISIONAL') {
      kesimpulanText = 'Pekerjaan yang telah dilakukan oleh PIHAK KEDUA masih memerlukan perbaikan/penyempurnaan sesuai dengan temuan dan tindakan perbaikan yang telah disepakati. Pemeriksaan ulang akan dilakukan setelah perbaikan selesai.';
    } else {
      kesimpulanText = 'Pekerjaan yang telah dilakukan oleh PIHAK KEDUA belum sesuai dengan spesifikasi teknis dan mutu yang disepakati. Perbaikan menyeluruh diperlukan sebelum pemeriksaan ulang dilakukan.';
    }

    elements.push(createParagraph(kesimpulanText, { align: 'justify' }));

    elements.push(...createSpacer(2));

    // === PERNYATAAN ===
    elements.push(createParagraph(
      'Demikian Berita Acara Pemeriksaan Pekerjaan ini dibuat dengan sebenarnya untuk digunakan sebagaimana mestinya.',
      { align: 'justify' }
    ));

    elements.push(...createSpacer(2));

    // === TANDA TANGAN ===
    elements.push(createSignatureTable([
      { jabatan: 'PIHAK KEDUA (PENYEDIA)\n' + supplier.nama, nama: supplier.nama_direktur || '', nip: '' },
      { jabatan: 'PIHAK PERTAMA (INSPEKTUR)\nPejabat Pembuat Komitmen', nama: pejabat.ppk.nama, nip: pejabat.ppk.nip },
    ]));

    elements.push(...createSpacer(1));

    // Catatan lampiran
    if (pemeriksaan?.foto_lampiran && pemeriksaan.foto_lampiran.length > 0) {
      elements.push(createParagraph('Lampiran:', { bold: true, size: 20 }));
      elements.push(createParagraph(`- ${pemeriksaan.foto_lampiran.length} lembar foto dokumentasi hasil pekerjaan`, { indentLeft: 360 }));
    }

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_ba_pemeriksaan || data.lp.nomor).replace(/\//g, '-');
    return `BA_Pemeriksaan_Pekerjaan_${nomor}.docx`;
  }
}

module.exports = { BAPemeriksaanPekerjaanGenerator };
