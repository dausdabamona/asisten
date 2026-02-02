const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { createSimpleTable } = require('../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilangRupiah } = require('../helpers/format-helper');

/**
 * Generator untuk Surat Setoran Pajak (SSP) - PPh Pasal 21/22/23
 * 
 * Dokumen ini merupakan bukti pembayaran/penyetoran pajak penghasilan (PPh)
 * ke kas negara. Digunakan untuk PPh Pasal 21 (pegawai), PPh Pasal 22 (pembelian),
 * dan PPh Pasal 23 (jasa).
 */
class SSPPPhGenerator extends BaseDocumentGenerator {
  constructor() {
    super('keuangan', 'ssp-pph');
  }
  
  validate(data) {
    const errors = [];
    
    if (!data.satker) errors.push('Data satker diperlukan');
    if (!data.satker.npwp) errors.push('NPWP satker diperlukan');
    if (!data.satker.nama_wp && !data.satker.nama) {
      errors.push('Nama wajib pajak diperlukan');
    }
    if (!data.satker.alamat) errors.push('Alamat wajib pajak diperlukan');
    if (!data.satker.kota) errors.push('Kota diperlukan');
    
    if (!data.pph) errors.push('Data PPh diperlukan');
    if (data.pph && !data.pph.jenis) {
      errors.push('Jenis PPh diperlukan (PPH21, PPH22, atau PPH23)');
    }
    if (data.pph && data.pph.jenis && !['PPH21', 'PPH22', 'PPH23'].includes(data.pph.jenis)) {
      errors.push('Jenis PPh tidak valid. Gunakan: PPH21, PPH22, atau PPH23');
    }
    if (data.pph && !data.pph.nilai) {
      errors.push('Nilai PPh diperlukan');
    }
    if (data.pph && data.pph.nilai && data.pph.nilai <= 0) {
      errors.push('Nilai PPh harus lebih besar dari 0');
    }
    
    if (errors.length > 0) {
      throw new Error(`Validasi gagal:\n${errors.join('\n')}`);
    }
  }
  
  buildContent(data) {
    const { satker, pph, periode } = data;
    const elements = [];
    
    // === HEADER SSP ===
    elements.push(createParagraph('SURAT SETORAN PAJAK', {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 60,
    }));
    
    elements.push(createParagraph('(SSP)', {
      align: 'center',
      bold: true,
      size: 28,
      spaceAfter: 240,
    }));
    
    // === FORM SSP ===
    // Determine masa pajak
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const masaPajak = periode || `${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
    
    const sspData = [
      ['NPWP', ':', satker.npwp],
      ['Nama Wajib Pajak', ':', satker.nama_wp || satker.nama],
      ['Alamat', ':', satker.alamat],
      ['', '', ''],
      ['Kode Akun Pajak', ':', this.getKodeAkunPajak(pph.jenis)],
      ['Kode Jenis Setoran', ':', this.getKodeJenisSetoran(pph.jenis)],
      ['Uraian Pembayaran', ':', this.getUraianPajak(pph.jenis)],
      ['Masa Pajak', ':', masaPajak],
      ['Tahun Pajak', ':', currentYear.toString()],
      ['', '', ''],
      ['Jumlah Pembayaran', ':', `Rp ${formatRupiah(pph.nilai)}`],
      ['Terbilang', ':', terbilangRupiah(pph.nilai)],
    ];
    
    elements.push(createSimpleTable(sspData, [2500, 300, 5000], { 
      hasHeader: false, 
      noBorder: true,
      fontSize: 22
    }));
    
    elements.push(...createSpacer(2));
    
    // === KETERANGAN TAMBAHAN ===
    if (pph.keterangan) {
      elements.push(createParagraph('Keterangan:', { bold: true }));
      elements.push(createParagraph(pph.keterangan, { 
        indentLeft: 720,
        size: 20
      }));
      elements.push(...createSpacer(1));
    }
    
    // === TANDA TANGAN ===
    const tanggalSetor = data.tanggal_setor || new Date();
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(tanggalSetor)}`, { 
      align: 'right' 
    }));
    elements.push(createParagraph('Wajib Pajak/Penyetor', { 
      align: 'right',
      bold: true
    }));
    
    elements.push(...createSpacer(3));
    
    // Signature line
    const namaPenyetor = data.penyetor?.nama || satker.nama_wp || satker.nama;
    elements.push(createParagraph(`( ${namaPenyetor} )`, { 
      align: 'right',
      bold: true
    }));
    
    if (data.penyetor?.nip) {
      elements.push(createParagraph(`NIP: ${data.penyetor.nip}`, { 
        align: 'right',
        size: 20
      }));
    }
    
    // === LAMPIRAN (OPSIONAL) ===
    if (pph.daftar && pph.daftar.length > 0) {
      elements.push(...this.buildLampiranDaftar(pph.daftar, pph.jenis));
    }
    
    return elements;
  }
  
  /**
   * Build lampiran daftar rincian (untuk PPh 21/23 dengan multiple penerima)
   */
  buildLampiranDaftar(daftar, jenisPph) {
    const elements = [];
    
    elements.push(...createSpacer(2));
    
    elements.push(createParagraph('LAMPIRAN', {
      bold: true,
      size: 24,
      align: 'center',
      spaceAfter: 120
    }));
    
    elements.push(createParagraph(`Rincian ${this.getUraianPajak(jenisPph)}`, {
      bold: true,
      size: 22,
      spaceAfter: 120
    }));
    
    // Table header
    const tableData = [
      ['No', 'Nama', 'NPWP', 'Nilai PPh']
    ];
    
    // Rows
    let totalNilai = 0;
    daftar.forEach((item, idx) => {
      tableData.push([
        (idx + 1).toString(),
        item.nama || '-',
        item.npwp || 'Tidak ber-NPWP',
        { text: formatRupiah(item.nilai), align: 'right' }
      ]);
      totalNilai += item.nilai || 0;
    });
    
    // Total row
    tableData.push([
      { text: 'TOTAL', colSpan: 3, bold: true, align: 'right' },
      '',
      '',
      { text: formatRupiah(totalNilai), align: 'right', bold: true }
    ]);
    
    elements.push(createSimpleTable(tableData, [400, 2500, 2000, 1500], {
      fontSize: 20
    }));
    
    return elements;
  }
  
  /**
   * Get kode akun pajak berdasarkan jenis PPh
   */
  getKodeAkunPajak(jenis) {
    switch (jenis) {
      case 'PPH21': return '411121'; // PPh Pasal 21
      case 'PPH22': return '411122'; // PPh Pasal 22
      case 'PPH23': return '411124'; // PPh Pasal 23
      default: return '-';
    }
  }
  
  /**
   * Get kode jenis setoran
   */
  getKodeJenisSetoran(jenis) {
    switch (jenis) {
      case 'PPH21': return '100'; // Masa PPh 21
      case 'PPH22': return '100'; // Masa PPh 22
      case 'PPH23': return '100'; // Masa PPh 23
      default: return '100';
    }
  }
  
  /**
   * Get uraian pajak
   */
  getUraianPajak(jenis) {
    switch (jenis) {
      case 'PPH21': return 'PPh Pasal 21 atas Penghasilan Pegawai/Penerima';
      case 'PPH22': return 'PPh Pasal 22 atas Pembelian Barang';
      case 'PPH23': return 'PPh Pasal 23 atas Jasa/Sewa';
      default: return '-';
    }
  }
  
  getSuggestedFilename(data) {
    const bulan = new Date().getMonth() + 1;
    const tahun = new Date().getFullYear();
    const jenis = data.pph.jenis;
    return `SSP_${jenis}_${bulan.toString().padStart(2, '0')}_${tahun}.docx`;
  }
}

module.exports = { SSPPPhGenerator };
