const { BaseDocumentGenerator } = require('../../generators/base-generator');
const { createParagraph, createSpacer } = require('../../helpers/doc-helper');
const { createKopSurat } = require('../../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilangRupiah } = require('../../helpers/format-helper');
const { DOC_CONFIG } = require('../../config/doc-config');

class KwitansiTier1Generator extends BaseDocumentGenerator {
  constructor() {
    super('pengadaan', 'tier1');
  }
  
  validate(data) {
    super.validate(data);
    
    if (!data.satker) throw new Error('Data satker diperlukan');
    if (!data.lp) throw new Error('Data lembar permintaan diperlukan');
    if (!data.pejabat) throw new Error('Data pejabat diperlukan');
    if (!data.supplier) throw new Error('Data supplier diperlukan');
    
    return true;
  }
  
  buildContent(data) {
    const { satker, lp, pejabat, supplier, pajak = {} } = data;
    const elements = [];
    
    // Hitung nilai
    const nilaiTagihan = lp.nilai_tagihan || lp.total_nilai;
    const ppn = pajak.ppn || 0;
    const pph = pajak.pph22 || pajak.pph21 || 0;
    const nilaiBersih = nilaiTagihan + ppn - pph;
    
    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));
    
    // === JUDUL ===
    elements.push(createParagraph('KWITANSI', {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 120,
    }));
    
    elements.push(createParagraph(`Nomor: ${lp.nomor_kwitansi || '-'}`, {
      align: 'center',
      spaceAfter: 240,
    }));
    
    // === ISI KWITANSI ===
    elements.push(createParagraph([
      { text: 'Sudah terima dari', size: DOC_CONFIG.FONT_SIZES.NORMAL },
    ]));
    elements.push(createParagraph(`Kuasa Pengguna Anggaran ${satker.nama}`, {
      indentLeft: 2880,
      bold: true,
    }));
    
    elements.push(...createSpacer(1));
    
    elements.push(createParagraph([
      { text: 'Uang sebanyak', size: DOC_CONFIG.FONT_SIZES.NORMAL },
    ]));
    
    // Box terbilang
    elements.push(createParagraph(terbilangRupiah(nilaiBersih), {
      indentLeft: 2880,
      italics: true,
      spaceAfter: 240,
    }));
    
    elements.push(...createSpacer(1));
    
    elements.push(createParagraph([
      { text: 'Untuk pembayaran', size: DOC_CONFIG.FONT_SIZES.NORMAL },
    ]));
    elements.push(createParagraph(lp.nama_pengadaan, {
      indentLeft: 2880,
    }));
    elements.push(createParagraph(`sesuai Nota Dinas Nomor ${lp.nomor}`, {
      indentLeft: 2880,
      spaceAfter: 240,
    }));
    
    // === TABEL RINCIAN PEMBAYARAN ===
    const rincianData = [
      ['Nilai Pengadaan', { text: `Rp ${formatRupiah(nilaiTagihan)}`, align: 'right' }],
    ];
    
    if (ppn > 0) {
      rincianData.push(['PPN 11%', { text: `Rp ${formatRupiah(ppn)}`, align: 'right' }]);
    }
    
    if (pph > 0) {
      const pphLabel = pajak.pph22 ? 'PPh Pasal 22 (1,5%)' : 'PPh Pasal 21';
      rincianData.push([pphLabel, { text: `Rp (${formatRupiah(pph)})`, align: 'right' }]);
    }
    
    rincianData.push([
      { text: 'Jumlah yang dibayarkan', bold: true },
      { text: `Rp ${formatRupiah(nilaiBersih)}`, align: 'right', bold: true }
    ]);
    
    elements.push(createSimpleTable(rincianData, [5000, 3000], { 
      hasHeader: false,
      noBorder: true 
    }));
    
    elements.push(...createSpacer(2));
    
    // === TEMPAT TANGGAL ===
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(lp.tanggal_bayar || new Date())}`, {
      align: 'right',
      spaceAfter: 120,
    }));
    
    // === TANDA TANGAN 3 KOLOM ===
    elements.push(createSignatureTable([
      { 
        jabatan: 'Mengetahui/Menyetujui,\nPejabat Pembuat Komitmen', 
        nama: pejabat.ppk?.nama || '', 
        nip: pejabat.ppk?.nip || '' 
      },
      { 
        jabatan: 'Lunas dibayar,\nBendahara Pengeluaran', 
        nama: pejabat.bendahara?.nama || '', 
        nip: pejabat.bendahara?.nip || '' 
      },
      { 
        jabatan: 'Yang menerima,\n' + (supplier.nama || ''), 
        nama: '', 
        nip: '' 
      },
    ]));
    
    return elements;
  }
  
  getSuggestedFilename(data) {
    const nomor = (data.lp.nomor_kwitansi || data.lp.nomor).replace(/\//g, '-');
    return `Kwitansi_${nomor}.docx`;
  }
}

module.exports = { KwitansiTier1Generator };
