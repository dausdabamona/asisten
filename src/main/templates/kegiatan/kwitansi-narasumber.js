const { BaseDocumentGenerator } = require('../generators/base-generator');
const { createParagraph, createSpacer } = require('../helpers/doc-helper');
const { createKopSurat } = require('../helpers/kop-surat-helper');
const { createSimpleTable, createSignatureTable } = require('../helpers/table-helper');
const { formatTanggalPanjang, formatRupiah, terbilangRupiah } = require('../helpers/format-helper');

/**
 * Generator untuk Kwitansi Pembayaran Honorarium Narasumber/Pemateri
 * 
 * Dokumen ini merupakan bukti pembayaran individual untuk setiap narasumber/pemateri.
 * Mencakup rincian honor bruto, potongan PPh 21, honor netto, serta biaya transport
 * dan akomodasi (jika ada).
 */
class KwitansiNarasumberGenerator extends BaseDocumentGenerator {
  constructor() {
    super('kegiatan', 'kwitansi-narasumber');
  }
  
  validate(data) {
    const errors = [];
    
    if (!data.satker) errors.push('Data satker diperlukan');
    if (!data.lp || !data.lp.nomor) errors.push('Nomor LP diperlukan');
    if (!data.kegiatan) errors.push('Data kegiatan diperlukan');
    if (!data.kegiatan.nama_kegiatan) errors.push('Nama kegiatan diperlukan');
    
    if (!data.narasumber) {
      errors.push('Data narasumber diperlukan');
    } else {
      const n = data.narasumber;
      if (!n.nama) errors.push('Nama narasumber diperlukan');
      if (!n.jumlah_jp) errors.push('Jumlah JP narasumber diperlukan');
      if (!n.tarif_per_jp) errors.push('Tarif per JP narasumber diperlukan');
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
    // narasumber di sini adalah 1 orang (bukan array)
    const n = narasumber;
    const elements = [];
    
    // === PERHITUNGAN ===
    // Honor bruto
    const bruto = n.honor_bruto || (n.jumlah_jp * n.tarif_per_jp);
    
    // PPh 21: 15% jika ber-NPWP, 20% jika tanpa NPWP
    const tarifPph = n.npwp ? 0.15 : 0.20;
    const pph = n.pph21 || (bruto * tarifPph);
    const netto = bruto - pph;
    
    // Komponen tambahan
    const transport = n.biaya_transport || 0;
    const akomodasi = n.biaya_penginapan || 0;
    const totalDiterima = netto + transport + akomodasi;
    
    // === KOP SURAT ===
    elements.push(...createKopSurat(satker));
    
    // === JUDUL ===
    elements.push(createParagraph('KWITANSI', {
      align: 'center',
      bold: true,
      size: 32,
      spaceAfter: 120,
    }));
    
    // Nomor kwitansi
    const nomorKwitansi = n.nomor_kwitansi || `${lp.nomor}/KW-NS/${new Date().getFullYear()}`;
    elements.push(createParagraph(`Nomor: ${nomorKwitansi}`, {
      align: 'center',
      spaceAfter: 240,
    }));
    
    // === ISI KWITANSI ===
    elements.push(createParagraph('Sudah terima dari:'));
    elements.push(createParagraph(`Kuasa Pengguna Anggaran ${satker.nama}`, { 
      indentLeft: 720, 
      bold: true 
    }));
    
    elements.push(...createSpacer(1));
    
    elements.push(createParagraph('Uang sebanyak:'));
    elements.push(createParagraph(terbilangRupiah(totalDiterima), { 
      indentLeft: 720, 
      italics: true,
      bold: true
    }));
    
    elements.push(...createSpacer(1));
    
    elements.push(createParagraph('Untuk pembayaran:'));
    elements.push(createParagraph(`Honorarium Narasumber/Pemateri`, { indentLeft: 720 }));
    elements.push(createParagraph(`Kegiatan: ${kegiatan.nama_kegiatan}`, { indentLeft: 720 }));
    
    if (n.judul_materi) {
      elements.push(createParagraph(`Materi: ${n.judul_materi}`, { indentLeft: 720 }));
    }
    
    const tanggalKegiatan = n.tanggal || kegiatan.tanggal_mulai;
    elements.push(createParagraph(`Tanggal: ${formatTanggalPanjang(tanggalKegiatan)}`, { 
      indentLeft: 720 
    }));
    
    elements.push(...createSpacer(1));
    
    // === TABEL RINCIAN ===
    const rincianData = [
      [
        'Honor Bruto', 
        `${n.jumlah_jp} JP × ${formatRupiah(n.tarif_per_jp)}`, 
        { text: formatRupiah(bruto), align: 'right' }
      ],
      [
        `PPh 21 (${n.npwp ? '15%' : '20%'})`, 
        '', 
        { text: `(${formatRupiah(pph)})`, align: 'right' }
      ],
      [
        'Honor Netto', 
        '', 
        { text: formatRupiah(netto), align: 'right', bold: true }
      ],
    ];
    
    if (transport > 0) {
      rincianData.push([
        'Transport', 
        '', 
        { text: formatRupiah(transport), align: 'right' }
      ]);
    }
    
    if (akomodasi > 0) {
      const jumlahMalam = n.jumlah_malam || 1;
      rincianData.push([
        'Akomodasi', 
        `${jumlahMalam} malam`, 
        { text: formatRupiah(akomodasi), align: 'right' }
      ]);
    }
    
    // Separator
    elements.push(...createSpacer(0.5));
    
    // Total row
    rincianData.push([
      { text: 'JUMLAH DITERIMA', bold: true }, 
      '', 
      { text: formatRupiah(totalDiterima), align: 'right', bold: true }
    ]);
    
    elements.push(createSimpleTable(rincianData, [2500, 2500, 2000], { 
      hasHeader: false, 
      fontSize: 22
    }));
    
    elements.push(...createSpacer(2));
    
    // === TANDA TANGAN ===
    const tanggalBayar = n.tanggal_bayar || new Date();
    elements.push(createParagraph(`${satker.kota}, ${formatTanggalPanjang(tanggalBayar)}`, { 
      align: 'right' 
    }));
    elements.push(...createSpacer(1));
    
    // Signature table dengan 3 kolom
    elements.push(createSignatureTable([
      { 
        jabatan: 'Mengetahui,\nPejabat Pembuat Komitmen', 
        nama: pejabat.ppk?.nama || '', 
        nip: pejabat.ppk?.nip || '' 
      },
      { 
        jabatan: 'Lunas dibayar,\nBendahara Pengeluaran', 
        nama: pejabat.bendahara?.nama || '', 
        nip: pejabat.bendahara?.nip || '' 
      },
      { 
        jabatan: `Yang menerima,\n${n.nama}${n.gelar ? ', ' + n.gelar : ''}`, 
        nama: '', 
        nip: n.npwp ? `NPWP: ${n.npwp}` : '' 
      },
    ]));
    
    return elements;
  }
  
  getSuggestedFilename(data) {
    const nama = data.narasumber.nama.split(' ')[0];
    const nomor = data.lp.nomor.replace(/\//g, '-');
    return `Kwitansi_Narasumber_${nama}_${nomor}.docx`;
  }
}

module.exports = { KwitansiNarasumberGenerator };
