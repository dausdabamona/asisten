/**
 * ASISTEN - Template Configuration
 * Defines document templates per procurement phase
 */

export interface TemplateConfig {
  template: string;
  name: string;
  konstruksiOnly?: boolean;
}

// Document types per phase
export const PERENCANAAN_DOCS: Record<string, TemplateConfig> = {
  'kak': { template: 'kak.docx', name: 'Kerangka Acuan Kerja (KAK)' },
  'spesifikasi_teknis': { template: 'spesifikasi_teknis.docx', name: 'Spesifikasi Teknis' },
  'survey_harga': { template: 'survey_harga.docx', name: 'Survey Harga' },
  'ba_survey_harga': { template: 'ba_survey_harga.docx', name: 'Berita Acara Survey Harga' },
  'hps': { template: 'hps.docx', name: 'Harga Perkiraan Sendiri (HPS)' },
};

export const PEMILIHAN_DOCS: Record<string, TemplateConfig> = {
  'undangan_pl': { template: 'undangan_pl.docx', name: 'Undangan Pengadaan Langsung' },
  'bahp_konstruksi': { template: 'bahp_konstruksi.docx', name: 'BA Hasil Pengadaan Langsung (Konstruksi)' },
  'bahp_barang': { template: 'bahp_barang.docx', name: 'BA Hasil Pengadaan Langsung (Barang)' },
  'bahp_jasa_lainnya': { template: 'bahp_jasa_lainnya.docx', name: 'BA Hasil Pengadaan Langsung (Jasa Lainnya)' },
  'surat_pesanan': { template: 'surat_pesanan.docx', name: 'Surat Pesanan' },
};

export const KONTRAK_DOCS: Record<string, TemplateConfig> = {
  'spk_konstruksi': { template: 'spk_konstruksi.docx', name: 'SPK Konstruksi' },
  'spk_barang': { template: 'spk_barang.docx', name: 'SPK Barang' },
  'spk_jasa_lainnya': { template: 'spk_jasa_lainnya.docx', name: 'SPK Jasa Lainnya' },
  'spmk_konstruksi': { template: 'spmk_konstruksi.docx', name: 'SPMK Konstruksi' },
  'spmk_jasa_lainnya': { template: 'spmk_jasa_lainnya.docx', name: 'SPMK Jasa Lainnya' },
  'ssuk': { template: 'ssuk.docx', name: 'SSUK (Syarat-Syarat Umum Kontrak)' },
  'sskk': { template: 'sskk.docx', name: 'SSKK (Syarat-Syarat Khusus Kontrak)' },
};

export const PELAKSANAAN_DOCS: Record<string, TemplateConfig> = {
  'laporan_kemajuan': { template: 'laporan_kemajuan.docx', name: 'Laporan Kemajuan' },
  'ba_mc': { template: 'ba_mc.docx', name: 'BA Mutual Check / MC-0' },
  'bap_sekaligus': { template: 'bap_sekaligus.docx', name: 'BA Pemeriksaan (Sekaligus)' },
};

export const SERAH_TERIMA_DOCS: Record<string, TemplateConfig> = {
  'bast_konstruksi_pho': { template: 'bast_konstruksi_pho.docx', name: 'BAST Konstruksi (PHO)' },
  'bast_konstruksi_fho': { template: 'bast_konstruksi_fho.docx', name: 'BAST Konstruksi (FHO)' },
  'bast_barang': { template: 'bast_barang.docx', name: 'BAST Barang' },
  'bast_jasa_lainnya': { template: 'bast_jasa_lainnya.docx', name: 'BAST Jasa Lainnya' },
};

export const PEMBAYARAN_DOCS: Record<string, TemplateConfig> = {
  'kuitansi': { template: 'kuitansi.docx', name: 'Kuitansi Pembayaran' },
  'spp_ls': { template: 'spp_ls.docx', name: 'SPP-LS' },
  'spm_ls': { template: 'spm_ls.docx', name: 'SPM-LS' },
  'checklist_ls': { template: 'checklist_ls.docx', name: 'Checklist Kelengkapan LS' },
};

// All docs combined for lookup
export const ALL_DOCS: Record<string, TemplateConfig> = {
  ...PERENCANAAN_DOCS,
  ...PEMILIHAN_DOCS,
  ...KONTRAK_DOCS,
  ...PELAKSANAAN_DOCS,
  ...SERAH_TERIMA_DOCS,
  ...PEMBAYARAN_DOCS,
};

export const DOCS_BY_TAHAP: Record<string, Record<string, TemplateConfig>> = {
  PERENCANAAN: PERENCANAAN_DOCS,
  PEMILIHAN: PEMILIHAN_DOCS,
  KONTRAK: KONTRAK_DOCS,
  PELAKSANAAN: PELAKSANAAN_DOCS,
  SERAH_TERIMA: SERAH_TERIMA_DOCS,
  PEMBAYARAN: PEMBAYARAN_DOCS,
};

// Template variables reference - available variables per group
export const TEMPLATE_VARIABLES: Record<string, { label: string; variables: string[] }> = {
  'Paket': {
    label: 'Data Paket',
    variables: [
      'kode_paket', 'nama_paket', 'tahun_anggaran', 'jangka_waktu', 'jangka_waktu_terbilang',
      'jenis_pengadaan', 'metode_pengadaan', 'lokasi_pekerjaan',
    ],
  },
  'Nilai': {
    label: 'Nilai & Anggaran',
    variables: [
      'nilai_pagu_fmt', 'nilai_pagu:terbilang',
      'subtotal_item_fmt', 'ppn_item_fmt', 'grand_total_item_fmt', 'grand_total_item_terbilang',
    ],
  },
  'Satker': {
    label: 'Satuan Kerja',
    variables: ['satker_nama', 'satker_kota', 'satker_kementerian'],
  },
  'PPK': {
    label: 'PPK',
    variables: ['ppk_nama', 'ppk_nip', 'ppk_nip:nip'],
  },
  'Tanggal': {
    label: 'Tanggal',
    variables: ['tanggal_hari_ini_fmt', 'hari'],
  },
  'Kontrak': {
    label: 'Data Kontrak',
    variables: [
      'nomor_kontrak', 'tanggal_kontrak', 'nilai_kontrak_fmt', 'nilai_kontrak_terbilang',
      'nilai_negosiasi_fmt', 'tanggal_mulai', 'tanggal_selesai',
      'ppn_kontrak_fmt', 'pph_kontrak_fmt', 'netto_kontrak_fmt',
    ],
  },
  'Penyedia': {
    label: 'Data Penyedia',
    variables: [
      'penyedia_nama', 'penyedia_alamat', 'penyedia_npwp', 'penyedia_nama_npwp',
      'penyedia_nama_bank', 'penyedia_no_rekening', 'penyedia_nama_rekening',
      'penyedia_pic', 'penyedia_telepon',
    ],
  },
  'KAK': {
    label: 'KAK / Spesifikasi',
    variables: [
      'latar_belakang', 'maksud_pekerjaan', 'tujuan_pekerjaan', 'target_sasaran',
      'ruang_lingkup', 'output_pekerjaan', 'metode_pelaksanaan',
      'sumber_dana', 'kode_akun',
    ],
  },
  'Survey': {
    label: 'Survey Harga',
    variables: [
      'survey1_nama', 'survey1_alamat_lengkap', 'survey1_jenis',
      'survey2_nama', 'survey2_alamat_lengkap', 'survey2_jenis',
      'survey3_nama', 'survey3_alamat_lengkap', 'survey3_jenis',
      'nomor_ba_survey',
    ],
  },
  'Loop': {
    label: 'Loop / Tabel',
    variables: [
      'items (no, uraian, spesifikasi, satuan, volume, harga_satuan, total)',
      'boq_items (no, uraian, volume, satuan, harga_satuan, jumlah_harga)',
    ],
  },
};
