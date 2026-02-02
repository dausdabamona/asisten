const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { createKopSurat } = require('../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah } = require('../helpers/format-helper');

/**
 * Generator untuk Daftar Nominatif Pembayaran Honorarium Narasumber/Pemateri
 * 
 * Dokumen ini berisi daftar lengkap narasumber/pemateri kegiatan beserta perhitungan honor,
 * PPh 21, dan jumlah netto yang diterima. Digunakan sebagai lampiran untuk proses
 * pembayaran honorarium narasumber.
 */
class NominatifHonorGenerator extends BaseDocumentGenerator {
  constructor() {
    super('kegiatan', 'nominatif-honor');
  }
  
  validate(data) {
    const errors = [];
    
    if (!data.satker) errors.push('Data satker diperlukan');
    if (!data.lp || !data.lp.nomor) errors.push('Nomor LP (Lembar Pengesahan) diperlukan');
    if (!data.kegiatan) errors.push('Data kegiatan diperlukan');
    if (!data.kegiatan.nama_kegiatan) errors.push('Nama kegiatan diperlukan');
    if (!data.kegiatan.tanggal_mulai) errors.push('Tanggal kegiatan diperlukan');
    if (!data.kegiatan.tempat) errors.push('Tempat kegiatan diperlukan');
    
    if (!data.narasumber || !Array.isArray(data.narasumber) || data.narasumber.length === 0) {
      errors.push('Minimal 1 narasumber diperlukan');
    } else {
      data.narasumber.forEach((n, idx) => {
        if (!n.nama) errors.push(`Nama narasumber #${idx + 1} diperlukan`);
        if (!n.jumlah_jp) errors.push(`Jumlah JP narasumber #${idx + 1} diperlukan`);
        if (!n.tarif_per_jp) errors.push(`Tarif per JP narasumber #${idx + 1} diperlukan`);
      });
    }
    
    if (!data.pejabat) errors.push('Data pejabat diperlukan');
    if (!data.pejabat.bendahara || !data.pejabat.bendahara.nama) {
      errors.push('Data Bendahara Pengeluaran diperlukan');
    }
    if (!data.pejabat.ppk || !data.pejabat.ppk.nama) {
      errors.push('Data PPK diperlukan');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validasi gagal:\n${errors.join('\n')}`);
    }
  }
  
  buildContent(data) {
    const { satker, lp, kegiatan, narasumber, pejabat } = data;
    const elements = [];
    
    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));
    
    // === JUDUL ===
    elements.push(createParagraph('DAFTAR NOMINATIF', {
      align: 'center',
      bold: true,
      size: 28,
    }));
    elements.push(createParagraph('PEMBAYARAN HONORARIUM NARASUMBER/PEMATERI', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 240,
    }));
    
    // === INFO KEGIATAN ===
    elements.push(createParagraph(`Nama Kegiatan : ${kegiatan.nama_kegiatan}`));
    
    // Format tanggal kegiatan
    const tanggalKegiatan = kegiatan.tanggal_selesai && kegiatan.tanggal_selesai !== kegiatan.tanggal_mulai
      ? `${formatTanggalPanjang(kegiatan.tanggal_mulai)} s.d. ${formatTanggalPanjang(kegiatan.tanggal_selesai)}`
      : formatTanggalPanjang(kegiatan.tanggal_mulai);
    
    elements.push(createParagraph(`Tanggal       : ${tanggalKegiatan}`));
    elements.push(createParagraph(`Tempat        : ${kegiatan.tempat}`));
    elements.push(createParagraph(`Nomor LP      : ${lp.nomor}`));
    
    elements.push(...createSpacer(1));
    
    // === TABEL NOMINATIF ===
    const tableData = [
      ['No', 'Nama / Instansi', 'Materi', 'JP', 'Tarif', 'Bruto', 'PPh 21', 'Netto', 'TTD'],
    ];
    
    let totalBruto = 0;
    let totalPph = 0;
    let totalNetto = 0;
    
    narasumber.forEach((n, idx) => {
      // Hitung honor
      const bruto = n.honor_bruto || (n.jumlah_jp * n.tarif_per_jp);
      
      // Hitung PPh 21: 15% jika ber-NPWP, 20% jika tanpa NPWP
      const tarifPph = n.npwp ? 0.15 : 0.20;
      const pph = n.pph21 || (bruto * tarifPph);
      const netto = bruto - pph;
      
      totalBruto += bruto;
      totalPph += pph;
      totalNetto += netto;
      
      tableData.push([
        (idx + 1).toString(),
        `${n.nama}${n.gelar ? ', ' + n.gelar : ''}\n${n.instansi || '-'}`,
        n.judul_materi || '-',
        n.jumlah_jp.toString(),
        { text: formatRupiah(n.tarif_per_jp), align: 'right' },
        { text: formatRupiah(bruto), align: 'right' },
        { text: formatRupiah(pph), align: 'right' },
        { text: formatRupiah(netto), align: 'right' },
        '', // TTD
      ]);
    });
    
    // Total row
    tableData.push([
      { text: '', colSpan: 2 }, 
      { text: 'TOTAL', bold: true, align: 'right' }, 
      '', 
      '',
      { text: formatRupiah(totalBruto), align: 'right', bold: true },
      { text: formatRupiah(totalPph), align: 'right', bold: true },
      { text: formatRupiah(totalNetto), align: 'right', bold: true },
      '',
    ]);
    
    elements.push(createSimpleTable(tableData, [350, 1800, 1200, 400, 900, 1000, 900, 1000, 600], {
      fontSize: 20
    }));
    
    elements.push(...createSpacer(1));
    
    // Keterangan PPh
    elements.push(createParagraph('Keterangan: PPh 21 = 15% (ber-NPWP) / 20% (tanpa NPWP)', { 
      size: 20, 
      italics: true 
    }));
    
    elements.push(...createSpacer(2));
    
    // === TANDA TANGAN ===
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(new Date())}`, { 
      align: 'right' 
    }));
    elements.push(...createSpacer(1));
    
    elements.push(createSignatureTable([
      { 
        jabatan: 'Bendahara Pengeluaran', 
        nama: pejabat.bendahara?.nama || '', 
        nip: pejabat.bendahara?.nip || '' 
      },
      { 
        jabatan: 'Pejabat Pembuat Komitmen', 
        nama: pejabat.ppk?.nama || '', 
        nip: pejabat.ppk?.nip || '' 
      },
    ]));
    
    return elements;
  }
  
  getSuggestedFilename(data) {
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `Nominatif_Honor_${nomor}.docx`;
  }
}

module.exports = { NominatifHonorGenerator };
