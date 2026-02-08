/**
 * ASISTEN - Document Generator Routes
 * Generate Word documents from templates for Paket Pekerjaan
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { STORAGE } from '../config/storage';
import { ALL_DOCS, DOCS_BY_TAHAP } from '../config/templateConfig';

const router = Router();
const prisma = new PrismaClient();

// Use templates from STORAGE (user data path), fallback to bundled templates
const TEMPLATE_DIR = STORAGE.TEMPLATE_PATH || path.join(__dirname, '../../template_word');

// Helper functions
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('IDR', 'Rp');
}

function terbilang(angka: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  if (angka < 12) return bilangan[angka];
  if (angka < 20) return terbilang(angka - 10) + ' Belas';
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh' + (angka % 10 > 0 ? ' ' + terbilang(angka % 10) : '');
  if (angka < 200) return 'Seratus' + (angka % 100 > 0 ? ' ' + terbilang(angka % 100) : '');
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus' + (angka % 100 > 0 ? ' ' + terbilang(angka % 100) : '');
  if (angka < 2000) return 'Seribu' + (angka % 1000 > 0 ? ' ' + terbilang(angka % 1000) : '');
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu' + (angka % 1000 > 0 ? ' ' + terbilang(angka % 1000) : '');
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta' + (angka % 1000000 > 0 ? ' ' + terbilang(angka % 1000000) : '');
  if (angka < 1000000000000) return terbilang(Math.floor(angka / 1000000000)) + ' Miliar' + (angka % 1000000000 > 0 ? ' ' + terbilang(angka % 1000000000) : '');
  return terbilang(Math.floor(angka / 1000000000000)) + ' Triliun' + (angka % 1000000000000 > 0 ? ' ' + terbilang(angka % 1000000000000) : '');
}

function formatTanggalLong(date: Date): string {
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function formatNIP(nip: string): string {
  if (!nip || nip.length !== 18) return nip || '-';
  return `${nip.slice(0,8)} ${nip.slice(8,14)} ${nip.slice(14,15)} ${nip.slice(15)}`;
}

// Get list of available document templates for a phase
router.get('/templates/:tahap', async (req: Request, res: Response) => {
  try {
    const { tahap } = req.params;
    const templates = DOCS_BY_TAHAP[tahap.toUpperCase()] || {};

    // Check which templates actually exist on disk
    const result: Record<string, any> = {};
    for (const [key, config] of Object.entries(templates)) {
      const templatePath = path.join(TEMPLATE_DIR, config.template);
      result[key] = { ...config, exists: fs.existsSync(templatePath) };
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate document
router.post('/generate/:paketId/:docType', async (req: Request, res: Response) => {
  try {
    const { paketId, docType } = req.params;
    const { surveyData, kakData } = req.body; // Additional data from frontend

    // Get document config from all phases
    const docConfig = ALL_DOCS[docType];
    if (!docConfig) {
      return res.status(400).json({ success: false, error: 'Tipe dokumen tidak valid' });
    }

    // Check template exists
    const templatePath = path.join(TEMPLATE_DIR, docConfig.template);
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan' });
    }

    // Get paket data with relations
    const paket = await prisma.paket.findUnique({
      where: { id: paketId },
      include: {
        satker: true,
        penyedia: true,
        permintaan: {
          where: { is_deleted: false },
          include: {
            items: {
              where: { is_deleted: false },
              include: { survey_harga: { where: { is_deleted: false } } }
            }
          }
        },
        boq: { where: { is_deleted: false }, orderBy: [{ kelompok: 'asc' }, { nomor: 'asc' }] },
      }
    });

    if (!paket) {
      return res.status(404).json({ success: false, error: 'Paket tidak ditemukan' });
    }

    // Get PPK info from satker or request body
    const ppkData = {
      nama: paket.satker?.ppk_nama || req.body.ppk?.nama || 'PPK Belum Ditentukan',
      nip: paket.satker?.ppk_nip || req.body.ppk?.nip || '000000000000000000'
    };

    // Prepare items from permintaan
    const items: any[] = [];
    let subtotal = 0;

    for (const perm of paket.permintaan) {
      for (const item of perm.items) {
        const hargaSatuan = Number(item.harga_perkiraan || item.harga_hps || 0);
        const volume = Number(item.volume || 1);
        const total = hargaSatuan * volume;
        subtotal += total;

        // Get survey prices if available
        const surveys = item.survey_harga || [];
        const hargaSurvey1 = surveys[0]?.harga || 0;
        const hargaSurvey2 = surveys[1]?.harga || 0;
        const hargaSurvey3 = surveys[2]?.harga || 0;
        const hargaRata = surveys.length > 0
          ? Math.round(surveys.reduce((sum: number, s: any) => sum + Number(s.harga || 0), 0) / surveys.length)
          : hargaSatuan;

        items.push({
          no: items.length + 1,
          uraian: item.nama,
          spesifikasi: item.spesifikasi || '-',
          satuan: item.satuan || 'Unit',
          volume: volume,
          harga_satuan: formatRupiah(hargaSatuan),
          harga_survey1: formatRupiah(Number(hargaSurvey1)),
          harga_survey2: formatRupiah(Number(hargaSurvey2)),
          harga_survey3: formatRupiah(Number(hargaSurvey3)),
          harga_rata: formatRupiah(hargaRata),
          harga_hps_satuan: formatRupiah(hargaRata),
          total: formatRupiah(total),
          total_hps: formatRupiah(hargaRata * volume),
        });
      }
    }

    const ppn = Math.round(subtotal * 0.11);
    const grandTotal = subtotal + ppn;
    const pagu = Number(paket.pagu || 0);

    // Prepare template data
    const templateData: any = {
      // Paket info
      kode_paket: paket.kode,
      nama_paket: paket.nama,
      tahun_anggaran: paket.tahun,
      jangka_waktu: paket.jangka_waktu || 30,
      jangka_waktu_terbilang: terbilang(paket.jangka_waktu || 30),

      // Values
      nilai_pagu: pagu,
      'nilai_pagu:rupiah': formatRupiah(pagu),
      nilai_pagu_fmt: formatRupiah(pagu),
      'nilai_pagu:terbilang': terbilang(pagu) + ' Rupiah',
      subtotal_item_fmt: formatRupiah(subtotal),
      ppn_item_fmt: formatRupiah(ppn),
      grand_total_item_fmt: formatRupiah(grandTotal),
      grand_total_item_terbilang: terbilang(grandTotal) + ' Rupiah',

      // Satker info
      satker_nama: paket.satker?.nama || 'Satuan Kerja',
      satker_kota: paket.satker?.kota || 'Kota',
      satker_eselon1: paket.satker?.kementerian || 'Kementerian Kelautan dan Perikanan',
      satker_kementerian: paket.satker?.kementerian || 'Kementerian Kelautan dan Perikanan',

      // PPK info
      ppk_nama: ppkData.nama,
      ppk_nip: ppkData.nip,
      'ppk_nip:nip': formatNIP(ppkData.nip),

      // Dates
      tanggal_dokumen: new Date(),
      'tanggal_dokumen:tanggal_long': formatTanggalLong(new Date()),
      tanggal_hari_ini_fmt: formatTanggalLong(new Date()),
      hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()],

      // Items
      items: items,

      // KAK specific fields (can be provided from frontend or use defaults)
      latar_belakang: kakData?.latar_belakang || `Dalam rangka mendukung pelaksanaan kegiatan di ${paket.satker?.nama || 'unit kerja'}, diperlukan pengadaan ${paket.nama}.`,
      maksud_pekerjaan: kakData?.maksud_pekerjaan || `Pengadaan ${paket.nama} untuk mendukung operasional.`,
      tujuan_pekerjaan: kakData?.tujuan_pekerjaan || `Tersedianya ${paket.nama} yang memenuhi spesifikasi teknis.`,
      target_sasaran: kakData?.target_sasaran || `${paket.satker?.nama || 'Unit Kerja'}`,
      ruang_lingkup: kakData?.ruang_lingkup || `Ruang lingkup pekerjaan meliputi penyediaan ${paket.nama} sesuai spesifikasi teknis.`,
      output_pekerjaan: kakData?.output_pekerjaan || `${paket.nama} sesuai spesifikasi teknis`,
      metode_pelaksanaan: kakData?.metode_pelaksanaan || 'Pengadaan dilaksanakan dengan metode kontraktual.',
      tenaga_pelaksana: kakData?.tenaga_pelaksana || 'Penyedia barang/jasa yang memenuhi kualifikasi.',
      peralatan: kakData?.peralatan || 'Sesuai kebutuhan pekerjaan.',
      ketentuan_laporan: kakData?.ketentuan_laporan || 'Laporan diserahkan bersama dengan barang/jasa.',
      sumber_dana: 'APBN',
      kode_akun: kakData?.kode_akun || '-',
      metode_hps: 'Berdasarkan hasil survey harga pasar',

      // Survey source info (can be provided from frontend)
      survey1_nama: surveyData?.survey1?.nama || 'Toko/Vendor 1',
      survey1_alamat_lengkap: surveyData?.survey1?.alamat || 'Alamat Toko/Vendor 1',
      survey1_jenis: surveyData?.survey1?.jenis || 'Toko',
      survey2_nama: surveyData?.survey2?.nama || 'Toko/Vendor 2',
      survey2_alamat_lengkap: surveyData?.survey2?.alamat || 'Alamat Toko/Vendor 2',
      survey2_jenis: surveyData?.survey2?.jenis || 'Toko',
      survey3_nama: surveyData?.survey3?.nama || 'Marketplace/Online',
      survey3_alamat_lengkap: surveyData?.survey3?.alamat || 'www.tokopedia.com / www.bukalapak.com',
      survey3_jenis: surveyData?.survey3?.jenis || 'Online',

      // BA Survey
      nomor_ba_survey: surveyData?.nomor_ba || `-/BA.SH/${paket.tahun}`,

      // Kontrak/SPK data
      nomor_kontrak: paket.nomor_kontrak || '-',
      tanggal_kontrak: paket.tanggal_kontrak ? formatTanggalLong(new Date(paket.tanggal_kontrak)) : '-',
      nilai_kontrak: Number(paket.nilai_kontrak || 0),
      nilai_kontrak_fmt: formatRupiah(Number(paket.nilai_kontrak || 0)),
      nilai_kontrak_terbilang: terbilang(Number(paket.nilai_kontrak || 0)) + ' Rupiah',
      nilai_negosiasi: Number(paket.nilai_negosiasi || 0),
      nilai_negosiasi_fmt: formatRupiah(Number(paket.nilai_negosiasi || 0)),
      tanggal_mulai: paket.tanggal_mulai ? formatTanggalLong(new Date(paket.tanggal_mulai)) : '-',
      tanggal_selesai: paket.tanggal_selesai ? formatTanggalLong(new Date(paket.tanggal_selesai)) : '-',
      lokasi_pekerjaan: paket.lokasi || '-',
      jenis_pengadaan: paket.jenis_pengadaan || '-',
      metode_pengadaan: paket.metode_pengadaan || 'LANGSUNG',

      // Penyedia data
      penyedia_nama: paket.penyedia?.nama || '-',
      penyedia_alamat: paket.penyedia?.alamat || '-',
      penyedia_npwp: paket.penyedia?.npwp || '-',
      penyedia_nama_npwp: paket.penyedia?.nama_npwp || '-',
      penyedia_nama_bank: paket.penyedia?.nama_bank || '-',
      penyedia_no_rekening: paket.penyedia?.no_rekening || '-',
      penyedia_nama_rekening: paket.penyedia?.nama_rekening || '-',
      penyedia_pic: paket.penyedia?.pic_nama || '-',
      penyedia_telepon: paket.penyedia?.pic_telepon || '-',

      // BOQ items for construction
      boq_items: (paket.boq || []).map((b: any, idx: number) => ({
        no: idx + 1,
        uraian: b.uraian_pekerjaan,
        volume: Number(b.volume),
        satuan: b.satuan,
        harga_satuan: formatRupiah(Number(b.harga_satuan)),
        jumlah_harga: formatRupiah(Number(b.jumlah_harga)),
      })),

      // PPN calc on kontrak
      ppn_kontrak_fmt: formatRupiah(Math.round(Number(paket.nilai_kontrak || 0) * 0.11)),
      pph_kontrak_fmt: formatRupiah(Math.round(Number(paket.nilai_kontrak || 0) * 0.015)),
      netto_kontrak_fmt: formatRupiah(Math.round(Number(paket.nilai_kontrak || 0) - Number(paket.nilai_kontrak || 0) * 0.015)),
    };

    // Load and process template
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
    });

    doc.render(templateData);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Set response headers for download
    const filename = `${docType}_${paket.kode.replace(/\//g, '-')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length);

    res.send(buf);

  } catch (error: any) {
    console.error('[DOC GENERATE ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get document generation status for a paket (all phases)
router.get('/status/:paketId', async (req: Request, res: Response) => {
  try {
    const { paketId } = req.params;
    const { tahap } = req.query;

    // Get uploaded documents for this paket (optionally filter by phase)
    const where: any = { paket_id: paketId, is_deleted: false };
    if (tahap) where.tahap = tahap;

    const dokumen = await prisma.dokumen_paket.findMany({
      where,
      select: {
        id: true,
        jenis: true,
        tahap: true,
        nama: true,
        status: true,
        file_name: true,
        created_at: true,
      }
    });

    // Map to document types per phase
    const status: Record<string, Record<string, any>> = {};

    for (const [phase, docs] of Object.entries(DOCS_BY_TAHAP)) {
      if (tahap && phase !== tahap) continue;
      status[phase] = {};
      for (const [key, config] of Object.entries(docs)) {
        const uploaded = dokumen.find(d => d.jenis === key.toUpperCase() && d.tahap === phase);
        const templatePath = path.join(TEMPLATE_DIR, config.template);
        status[phase][key] = {
          name: config.name,
          template: config.template,
          canGenerate: fs.existsSync(templatePath),
          uploaded: uploaded ? {
            id: uploaded.id,
            nama: uploaded.nama,
            status: uploaded.status,
            file_name: uploaded.file_name,
            created_at: uploaded.created_at,
          } : null,
        };
      }
    }

    res.json({ success: true, data: tahap ? status[tahap as string] || {} : status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
