const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer, createPageBreak } = require('../../helpers/doc-helper');
const { createSimpleTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah } = require('../../helpers/format-helper');

// Helper terbilang untuk angka
function terbilangAngka(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const puluhan = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

  if (n <= 11) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' belas';
  if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + satuan[n % 10] : '');
  return String(n);
}

class KAKTORGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier3');
  }

  validate(data) {
    super.validate(data);
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.items || data.items.length === 0) throw new Error('Data items diperlukan');
    return true;
  }

  buildContent(data) {
    const { satker, lp, kak = {}, pejabat } = data;
    const elements = [];

    // === HALAMAN JUDUL ===
    elements.push(...createSpacer(5));

    elements.push(createParagraph('KERANGKA ACUAN KERJA', {
      align: 'center',
      bold: true,
      size: 36,
    }));

    elements.push(createParagraph('(TERM OF REFERENCE)', {
      align: 'center',
      size: 28,
      spaceAfter: 480,
    }));

    elements.push(createParagraph(lp.nama_pengadaan.toUpperCase(), {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 480,
    }));

    elements.push(...createSpacer(10));

    elements.push(createParagraph(satker.nama.toUpperCase(), {
      align: 'center',
      bold: true,
    }));

    elements.push(createParagraph(`TAHUN ANGGARAN ${new Date().getFullYear()}`, {
      align: 'center',
    }));

    // === PAGE BREAK ===
    elements.push(createPageBreak());

    // === BAB I PENDAHULUAN ===
    elements.push(createParagraph('BAB I', {
      align: 'center',
      bold: true,
      size: 24,
    }));
    elements.push(createParagraph('PENDAHULUAN', {
      align: 'center',
      bold: true,
      size: 24,
      spaceAfter: 240,
    }));

    // 1.1 Latar Belakang
    elements.push(createParagraph('1.1 Latar Belakang', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      kak.latar_belakang || `${satker.nama} memerlukan ${lp.nama_pengadaan} dalam rangka mendukung pelaksanaan tugas dan fungsi organisasi. Pengadaan ini diperlukan untuk meningkatkan kualitas pelayanan dan operasional satuan kerja.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // 1.2 Maksud dan Tujuan
    elements.push(createParagraph('1.2 Maksud dan Tujuan', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph('Maksud:', { bold: true, indentLeft: 360 }));
    elements.push(createParagraph(
      kak.maksud || `Maksud dari pengadaan ${lp.nama_pengadaan} ini adalah untuk memenuhi kebutuhan ${satker.nama} dalam melaksanakan tugas dan fungsinya.`,
      { align: 'justify', indentLeft: 360 }
    ));

    elements.push(createParagraph('Tujuan:', { bold: true, indentLeft: 360 }));
    elements.push(createParagraph(
      kak.tujuan || `Tujuan dari pengadaan ini adalah tersedianya ${lp.nama_pengadaan} yang berkualitas dan sesuai dengan kebutuhan.`,
      { align: 'justify', indentLeft: 360 }
    ));

    elements.push(...createSpacer(1));

    // 1.3 Sasaran
    elements.push(createParagraph('1.3 Sasaran', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      kak.sasaran || `Sasaran dari kegiatan pengadaan ini adalah terpenuhinya kebutuhan ${lp.nama_pengadaan} sesuai dengan spesifikasi teknis yang ditetapkan.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // 1.4 Sumber Pendanaan
    elements.push(createParagraph('1.4 Sumber Pendanaan', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      `Pengadaan ${lp.nama_pengadaan} ini dibiayai dari DIPA ${satker.nama} Tahun Anggaran ${new Date().getFullYear()} dengan rincian:`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(createParagraph(`Kode Akun    : ${lp.kode_akun || '-'}`, { indentLeft: 720 }));
    elements.push(createParagraph(`Pagu Anggaran: Rp ${formatRupiah(lp.total_nilai)}`, { indentLeft: 720 }));

    // === PAGE BREAK ===
    elements.push(createPageBreak());

    // === BAB II RUANG LINGKUP ===
    elements.push(createParagraph('BAB II', {
      align: 'center',
      bold: true,
      size: 24,
    }));
    elements.push(createParagraph('RUANG LINGKUP PEKERJAAN', {
      align: 'center',
      bold: true,
      size: 24,
      spaceAfter: 240,
    }));

    // 2.1 Lingkup Pekerjaan
    elements.push(createParagraph('2.1 Lingkup Pekerjaan', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      `Lingkup pekerjaan pengadaan ${lp.nama_pengadaan} meliputi:`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // Rincian item
    if (data.items && data.items.length > 0) {
      const tableData = [
        ['No', 'Uraian', 'Spesifikasi', 'Volume', 'Satuan'],
        ...data.items.map((item, idx) => [
          idx + 1,
          item.uraian,
          item.spesifikasi || '-',
          item.volume,
          item.satuan,
        ]),
      ];

      elements.push(createSimpleTable(tableData, [500, 3000, 2500, 700, 700]));
    }

    elements.push(...createSpacer(1));

    // 2.2 Lokasi Pekerjaan
    elements.push(createParagraph('2.2 Lokasi Pekerjaan', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      `Lokasi penyerahan/pelaksanaan pekerjaan adalah di ${lp.lokasi_pelaksanaan || satker.alamat}.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(1));

    // 2.3 Jangka Waktu
    elements.push(createParagraph('2.3 Jangka Waktu Pelaksanaan', {
      bold: true,
      size: 22,
    }));

    elements.push(createParagraph(
      `Jangka waktu pelaksanaan pekerjaan adalah selama ${lp.jangka_waktu_kontrak || 30} (${terbilangAngka(lp.jangka_waktu_kontrak || 30)}) hari kalender, terhitung sejak tanggal penandatanganan kontrak.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    // === PAGE BREAK ===
    elements.push(createPageBreak());

    // === BAB III SPESIFIKASI TEKNIS ===
    elements.push(createParagraph('BAB III', {
      align: 'center',
      bold: true,
      size: 24,
    }));
    elements.push(createParagraph('SPESIFIKASI TEKNIS', {
      align: 'center',
      bold: true,
      size: 24,
      spaceAfter: 240,
    }));

    // Detail spesifikasi per item
    if (data.items && data.items.length > 0) {
      data.items.forEach((item, idx) => {
        elements.push(createParagraph(`3.${idx + 1} ${item.uraian}`, {
          bold: true,
          size: 22,
        }));

        elements.push(createParagraph(
          item.spesifikasi_detail || item.spesifikasi || 'Sesuai dengan standar yang berlaku.',
          { align: 'justify', indentLeft: 360 }
        ));

        if (item.standar) {
          elements.push(createParagraph(
            `Standar: ${item.standar}`,
            { indentLeft: 360, italics: true }
          ));
        }

        elements.push(...createSpacer(1));
      });
    }

    // === PAGE BREAK ===
    elements.push(createPageBreak());

    // === BAB IV PENUTUP ===
    elements.push(createParagraph('BAB IV', {
      align: 'center',
      bold: true,
      size: 24,
    }));
    elements.push(createParagraph('PENUTUP', {
      align: 'center',
      bold: true,
      size: 24,
      spaceAfter: 240,
    }));

    elements.push(createParagraph(
      `Demikian Kerangka Acuan Kerja (KAK) ini disusun sebagai pedoman dalam pelaksanaan pengadaan ${lp.nama_pengadaan} pada ${satker.nama} Tahun Anggaran ${new Date().getFullYear()}.`,
      { align: 'justify', firstLineIndent: 720 }
    ));

    elements.push(...createSpacer(2));

    // Tempat tanggal dan tanda tangan
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(new Date())}`, { align: 'right' }));
    elements.push(createParagraph('Pejabat Pembuat Komitmen', { align: 'right' }));
    elements.push(...createSpacer(3));
    elements.push(createParagraph(pejabat?.ppk?.nama || '________________________', { align: 'right', bold: true, underline: true }));
    elements.push(createParagraph(`NIP. ${pejabat?.ppk?.nip || '________________________'}`, { align: 'right' }));

    return elements;
  }

  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `KAK_TOR_${nomor}.docx`;
  }
}

module.exports = { KAKTORGenerator };
