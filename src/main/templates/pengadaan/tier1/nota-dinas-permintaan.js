const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat, createTempatTanggal, createTandaTanganSingle } = require('../../helpers/kop-surat-helper');
const { createKeyValueTable, createSimpleTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah } = require('../../helpers/format-helper');

class NotaDinasPermintaanGenerator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier1');
  }
  
  validate(data) {
    super.validate(data);
    
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.pengusul) throw new Error('Data pengusul diperlukan');
    if (!data.items || data.items.length === 0) throw new Error('Rincian item diperlukan');
    
    return true;
  }
  
  buildContent(data) {
    const { satker, lp, pengusul, penerima, items } = data;
    const elements = [];
    
    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));
    
    // === JUDUL ===
    elements.push(createParagraph('NOTA DINAS', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 120,
    }));
    
    elements.push(createParagraph(`Nomor: ${lp.nomor}`, {
      align: 'center',
      spaceAfter: 240,
    }));
    
    // === HEADER NOTA DINAS ===
    elements.push(createKeyValueTable([
      { label: 'Kepada Yth.', value: penerima.jabatan },
      { label: 'Dari', value: pengusul.jabatan },
      { label: 'Tanggal', value: formatTanggalPanjang(lp.tanggal_dibuat) },
      { label: 'Perihal', value: `Permintaan ${lp.nama_pengadaan}`, bold: true },
    ]));
    
    elements.push(...createSpacer(1));
    
    // === ISI ===
    elements.push(createParagraph(
      'Dengan hormat,',
      { spaceAfter: 120 }
    ));
    
    elements.push(createParagraph(
      `Sehubungan dengan kebutuhan operasional ${pengusul.unit_kerja}, dengan ini kami mengajukan permintaan pengadaan sebagai berikut:`,
      { align: 'justify', firstLineIndent: 720 }
    ));
    
    elements.push(...createSpacer(1));
    
    // === TABEL RINCIAN ===
    const tableData = [
      ['No', 'Uraian', 'Spesifikasi', 'Vol', 'Sat', 'Harga', 'Jumlah'],
      ...items.map((item, idx) => [
        idx + 1,
        item.uraian,
        item.spesifikasi || '-',
        item.volume,
        item.satuan,
        { text: formatRupiah(item.harga_satuan), align: 'right' },
        { text: formatRupiah(item.jumlah), align: 'right' },
      ]),
      ['', { text: 'TOTAL', bold: true }, '', '', '', '', { text: formatRupiah(lp.total_nilai), align: 'right', bold: true }],
    ];
    
    elements.push(createSimpleTable(tableData, [400, 2500, 1500, 600, 600, 1200, 1400]));
    
    elements.push(...createSpacer(1));
    
    // === JUSTIFIKASI ===
    if (lp.justifikasi) {
      elements.push(createParagraph(
        `Justifikasi: ${lp.justifikasi}`,
        { align: 'justify', firstLineIndent: 720 }
      ));
      elements.push(...createSpacer(1));
    }
    
    // === PENUTUP ===
    elements.push(createParagraph(
      'Demikian nota dinas ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.',
      { align: 'justify', firstLineIndent: 720 }
    ));
    
    elements.push(...createSpacer(1));
    
    // === TANDA TANGAN ===
    elements.push(createTempatTanggal(satker.kota, lp.tanggal_dibuat));
    elements.push(...createTandaTanganSingle(
      pengusul.jabatan,
      pengusul.nama,
      pengusul.nip,
      { align: 'right' }
    ));
    
    return elements;
  }
  
  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `Nota_Dinas_${nomor}.docx`;
  }
}

module.exports = { NotaDinasPermintaanGenerator };
