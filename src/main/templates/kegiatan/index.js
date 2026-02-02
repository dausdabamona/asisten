const { NominatifHonorGenerator } = require('./nominatif-honor');
const { KwitansiNarasumberGenerator } = require('./kwitansi-narasumber');

/**
 * Registry untuk semua generator dokumen kegiatan
 * 
 * Kategori: Kegiatan & Narasumber
 * Generators: 2 (akan bertambah untuk SK Panitia, Undangan, Daftar Hadir, dll)
 */
const kegiatanGenerators = {
  'NOMINATIF_HONOR': new NominatifHonorGenerator(),
  'KWITANSI_NARASUMBER': new KwitansiNarasumberGenerator(),
  // TODO: Tambahkan generator lainnya
  // 'SK_PANITIA': new SKPanitiaGenerator(),
  // 'UNDANGAN_NARASUMBER': new UndanganNarasumberGenerator(),
  // 'DAFTAR_HADIR': new DaftarHadirGenerator(),
};

module.exports = { kegiatanGenerators };
