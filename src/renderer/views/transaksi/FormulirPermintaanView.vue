<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSatkerStore } from '../../stores/satkerStore';
import { usePegawaiStore } from '../../stores/pegawaiStore';
import FormSelect from '../../components/ui/FormSelect.vue';
import FormInput from '../../components/ui/FormInput.vue';

const router = useRouter();
const satkerStore = useSatkerStore();
const pegawaiStore = usePegawaiStore();

// Form Header
const formHeader = ref({
  tanggal: new Date().toISOString().split('T')[0],
  unit_kerja: '',
  sumber_dana: '',
  nama_kegiatan: ''
});

// Items table
const items = ref([
  { no: 1, nama_barang: '', spesifikasi: '', volume: 1, satuan: 'Buah', harga_satuan: 0 }
]);

// Signatures
const signatures = ref({
  pengaju: '',
  pengaju_jabatan: 'Yang mengajukan',
  verifikator: '',
  verifikator_jabatan: 'Verifikator',
  kpa: '',
  kpa_jabatan: 'Kuasa Pengguna Anggaran',
  mengetahui: '',
  mengetahui_jabatan: 'Mengetahui'
});

// Settings
const ppnPercentage = ref(11); // PPN 11%
const includePPN = ref(true);
const lokasi = ref('Sorong');
const urgency = ref('normal');

// Loading
const loading = ref(false);
const generating = ref(false);

// Computed
const subTotal = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (item.volume * item.harga_satuan);
  }, 0);
});

const ppnAmount = computed(() => {
  if (!includePPN.value) return 0;
  return Math.round(subTotal.value * ppnPercentage.value / 100);
});

const grandTotal = computed(() => {
  return subTotal.value + ppnAmount.value;
});

// Auto-determine tier based on total value
const tierConfig = {
  tier1: { max: 10000000, label: 'Tier 1', description: '< Rp 10 Juta', color: 'blue' },
  tier2: { min: 10000000, max: 50000000, label: 'Tier 2', description: 'Rp 10-50 Juta', color: 'green' },
  tier3: { min: 50000000, label: 'Tier 3', description: '> Rp 50 Juta', color: 'purple' }
};

const currentTier = computed(() => {
  const total = grandTotal.value;
  if (total >= 50000000) return 'tier3';
  if (total >= 10000000) return 'tier2';
  return 'tier1';
});

const currentTierConfig = computed(() => tierConfig[currentTier.value]);

const tierColorClass = computed(() => {
  switch (currentTier.value) {
    case 'tier1': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'tier2': return 'bg-green-100 text-green-800 border-green-300';
    case 'tier3': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800';
  }
});

const unitKerjaOptions = computed(() => {
  return satkerStore.unitKerja.map(u => ({
    value: u.nama,
    label: u.nama
  }));
});

const pegawaiOptions = computed(() => {
  return pegawaiStore.pegawaiList.map(p => ({
    value: p.id,
    label: `${p.nama}${p.nip ? ' - ' + p.nip : ''}`
  }));
});

const pejabatOptions = computed(() => {
  return satkerStore.pejabat.map(p => ({
    value: p.id,
    label: `${p.nama} (${p.jenis})`
  }));
});

// Methods
const addItem = () => {
  items.value.push({
    no: items.value.length + 1,
    nama_barang: '',
    spesifikasi: '',
    volume: 1,
    satuan: 'Buah',
    harga_satuan: 0
  });
};

const removeItem = (index) => {
  if (items.value.length > 1) {
    items.value.splice(index, 1);
    // Re-number items
    items.value.forEach((item, i) => {
      item.no = i + 1;
    });
  }
};

const getItemTotal = (item) => {
  return item.volume * item.harga_satuan;
};

const formatRupiah = (value) => {
  if (!value) return '0';
  return Number(value).toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

const goBack = () => {
  router.back();
};

const saveFormulir = async () => {
  loading.value = true;
  try {
    // Prepare data
    const data = {
      ...formHeader.value,
      items: items.value.filter(item => item.nama_barang),
      sub_total: subTotal.value,
      ppn: ppnAmount.value,
      total: grandTotal.value,
      estimated_value: grandTotal.value,
      tier: currentTier.value,
      tier_label: currentTierConfig.value.label,
      urgency: urgency.value,
      signatures: signatures.value,
      status: 'draft'
    };
    
    // Save to database via API
    const result = await window.electronAPI?.formulirPermintaan?.create(data);
    
    if (result?.success) {
      alert(`Formulir berhasil disimpan!\nNomor: ${result.data?.nomor || 'Generated'}`);
      router.push('/transaksi');
    } else {
      throw new Error(result?.error || 'Gagal menyimpan ke database');
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    loading.value = false;
  }
};

const generateDocx = async () => {
  generating.value = true;
  try {
    // Import docx library dynamically
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, 
            TextRun, AlignmentType, WidthType, BorderStyle, 
            HeadingLevel, convertInchesToTwip } = await import('docx');
    
    // Create table rows for items
    const tableRows = [];
    
    // Header row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'No', alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Nama Barang', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Spesifikasi', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Volume', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Satuan', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Harga Satuan', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Total', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        ],
        tableHeader: true
      })
    );
    
    // Item rows
    items.value.forEach((item) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: String(item.no), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: item.nama_barang })] }),
            new TableCell({ children: [new Paragraph({ text: item.spesifikasi || '' })] }),
            new TableCell({ children: [new Paragraph({ text: String(item.volume), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: item.satuan, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: formatRupiah(item.harga_satuan), alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: formatRupiah(getItemTotal(item)), alignment: AlignmentType.RIGHT })] }),
          ]
        })
      );
    });
    
    // Add empty rows to make 6 minimum
    const minRows = 6;
    for (let i = items.value.length; i < minRows; i++) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: String(i + 1), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
          ]
        })
      );
    }
    
    // Sub Total row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: '' })], columnSpan: 5 }),
          new TableCell({ children: [new Paragraph({ text: 'SUB TOTAL', alignment: AlignmentType.RIGHT, style: 'strong' })] }),
          new TableCell({ children: [new Paragraph({ text: formatRupiah(subTotal.value), alignment: AlignmentType.RIGHT })] }),
        ]
      })
    );
    
    // PPN row
    if (includePPN.value) {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: '' })], columnSpan: 5 }),
            new TableCell({ children: [new Paragraph({ text: `PPn ${ppnPercentage.value}%`, alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ text: formatRupiah(ppnAmount.value), alignment: AlignmentType.RIGHT })] }),
          ]
        })
      );
    }
    
    // Total row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: '' })], columnSpan: 5 }),
          new TableCell({ children: [new Paragraph({ text: 'TOTAL', alignment: AlignmentType.RIGHT, style: 'strong' })] }),
          new TableCell({ children: [new Paragraph({ text: formatRupiah(grandTotal.value), alignment: AlignmentType.RIGHT, style: 'strong' })] }),
        ]
      })
    );
    
    // Get signature names
    const getPejabatName = (id) => {
      const pejabat = satkerStore.pejabat.find(p => p.id === id);
      return pejabat ? pejabat.nama : '';
    };
    const getPegawaiName = (id) => {
      const pegawai = pegawaiStore.pegawaiList.find(p => p.id === id);
      return pegawai ? pegawai.nama : '';
    };
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: 'FORMULIR PERMINTAAN REALISASI KEGIATAN', bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: satkerStore.satker?.nama_satker || 'POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', bold: true, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          
          // Header info
          new Paragraph({ children: [new TextRun({ text: `Hari/Tanggal\t: ${formatDate(formHeader.value.tanggal)}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Unit Kerja\t: ${formHeader.value.unit_kerja}` })] }),
          new Paragraph({ children: [new TextRun({ text: `Sumber Dana\t: ${formHeader.value.sumber_dana}` })] }),
          new Paragraph({ 
            children: [new TextRun({ text: `Nama Kegiatan\t: ${formHeader.value.nama_kegiatan}` })],
            spacing: { after: 300 }
          }),
          
          // Items table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
          }),
          
          // Location & Date
          new Paragraph({
            children: [new TextRun({ text: `${lokasi.value}, ${formatDate(formHeader.value.tanggal)}` })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300 }
          }),
          
          // Signature table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              // Labels
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ text: 'Yang mengajukan', alignment: AlignmentType.CENTER })],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ text: 'Verifikator', alignment: AlignmentType.CENTER })],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  }),
                ]
              }),
              // Signature space
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '\n\n\n' })] }),
                  new TableCell({ children: [new Paragraph({ text: '\n\n\n' })] }),
                ]
              }),
              // Names
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: getPegawaiName(signatures.value.pengaju), underline: {} })],
                      alignment: AlignmentType.CENTER 
                    })]
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: getPegawaiName(signatures.value.verifikator), underline: {} })],
                      alignment: AlignmentType.CENTER 
                    })]
                  }),
                ]
              }),
              // Second row labels
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [
                      new Paragraph({ text: '\nMengetahui dan Menyetujui', alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: 'Kuasa Pengguna Anggaran', alignment: AlignmentType.CENTER })
                    ]
                  }),
                  new TableCell({ 
                    children: [
                      new Paragraph({ text: '\nMengetahui', alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: signatures.value.mengetahui_jabatan, alignment: AlignmentType.CENTER })
                    ]
                  }),
                ]
              }),
              // Second row signature space
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: '\n\n\n' })] }),
                  new TableCell({ children: [new Paragraph({ text: '\n\n\n' })] }),
                ]
              }),
              // Second row names
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: getPejabatName(signatures.value.kpa), underline: {} })],
                      alignment: AlignmentType.CENTER 
                    })]
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: getPejabatName(signatures.value.mengetahui), underline: {} })],
                      alignment: AlignmentType.CENTER 
                    })]
                  }),
                ]
              }),
            ]
          })
        ]
      }]
    });
    
    // Generate blob
    const blob = await Packer.toBlob(doc);
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Formulir_Permintaan_${formHeader.value.nama_kegiatan || 'Kegiatan'}_${formHeader.value.tanggal}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('File DOCX berhasil di-generate!');
  } catch (err) {
    console.error('Error generating DOCX:', err);
    alert('Gagal generate DOCX: ' + err.message);
  } finally {
    generating.value = false;
  }
};

onMounted(async () => {
  await satkerStore.initialize();
  await pegawaiStore.fetchPegawaiList({ limit: 1000 });
});
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <button @click="goBack" class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Formulir Permintaan Realisasi Kegiatan</h1>
          <p class="text-gray-500">Buat permintaan pengadaan barang/jasa dalam format tabel</p>
        </div>
      </div>
      <div class="flex space-x-3">
        <button
          @click="generateDocx"
          :disabled="generating"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {{ generating ? 'Generating...' : 'Download DOCX' }}
        </button>
        <button
          @click="saveFormulir"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Menyimpan...' : 'Simpan' }}
        </button>
      </div>
    </div>

    <!-- Form Header Section -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Informasi Kegiatan</h2>
      <div class="grid grid-cols-2 gap-6">
        <FormInput
          v-model="formHeader.tanggal"
          label="Hari/Tanggal"
          type="date"
          required
        />
        <FormSelect
          v-model="formHeader.unit_kerja"
          label="Unit Kerja"
          :options="unitKerjaOptions"
          placeholder="Pilih Unit Kerja"
          required
        />
        <FormInput
          v-model="formHeader.sumber_dana"
          label="Sumber Dana"
          placeholder="Contoh: DIPA POLTEK KP TA. 2026"
          required
        />
        <FormInput
          v-model="formHeader.nama_kegiatan"
          label="Nama Kegiatan"
          placeholder="Nama kegiatan..."
        />
      </div>
    </div>

    <!-- Items Table Section -->
    <div class="bg-white rounded-lg shadow mb-6">
      <div class="p-6 border-b flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-800">Daftar Barang/Jasa</h2>
        <button
          @click="addItem"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah Item
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">No</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Barang</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spesifikasi</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Volume</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Satuan</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-36">Harga Satuan</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-36">Total</th>
              <th class="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="index" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-center text-gray-500">{{ item.no }}</td>
              <td class="px-4 py-3">
                <input
                  v-model="item.nama_barang"
                  type="text"
                  class="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama barang..."
                />
              </td>
              <td class="px-4 py-3">
                <input
                  v-model="item.spesifikasi"
                  type="text"
                  class="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Spesifikasi..."
                />
              </td>
              <td class="px-4 py-3">
                <input
                  v-model.number="item.volume"
                  type="number"
                  min="1"
                  class="w-full px-3 py-1.5 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td class="px-4 py-3">
                <select
                  v-model="item.satuan"
                  class="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Buah">Buah</option>
                  <option value="Unit">Unit</option>
                  <option value="Paket">Paket</option>
                  <option value="Set">Set</option>
                  <option value="Lembar">Lembar</option>
                  <option value="Rim">Rim</option>
                  <option value="Dus">Dus</option>
                  <option value="Botol">Botol</option>
                  <option value="Liter">Liter</option>
                  <option value="Kg">Kg</option>
                  <option value="Meter">Meter</option>
                  <option value="Roll">Roll</option>
                  <option value="Orang">Orang</option>
                  <option value="Hari">Hari</option>
                  <option value="Bulan">Bulan</option>
                </select>
              </td>
              <td class="px-4 py-3">
                <input
                  v-model.number="item.harga_satuan"
                  type="number"
                  min="0"
                  class="w-full px-3 py-1.5 border rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td class="px-4 py-3 text-right font-medium text-gray-800">
                Rp {{ formatRupiah(getItemTotal(item)) }}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  v-if="items.length > 1"
                  @click="removeItem(index)"
                  class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50">
            <tr>
              <td colspan="6" class="px-4 py-3 text-right font-medium text-gray-700">SUB TOTAL</td>
              <td class="px-4 py-3 text-right font-bold text-gray-800">Rp {{ formatRupiah(subTotal) }}</td>
              <td></td>
            </tr>
            <tr v-if="includePPN">
              <td colspan="6" class="px-4 py-3 text-right font-medium text-gray-700">
                PPn 
                <input
                  v-model.number="ppnPercentage"
                  type="number"
                  min="0"
                  max="100"
                  class="w-16 px-2 py-1 border rounded text-center ml-2"
                />%
              </td>
              <td class="px-4 py-3 text-right font-bold text-gray-800">Rp {{ formatRupiah(ppnAmount) }}</td>
              <td></td>
            </tr>
            <tr class="bg-blue-50">
              <td colspan="6" class="px-4 py-3 text-right font-bold text-gray-800">TOTAL</td>
              <td class="px-4 py-3 text-right font-bold text-blue-600 text-lg">Rp {{ formatRupiah(grandTotal) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Tier Badge & PPN Toggle -->
      <div class="p-4 border-t flex items-center justify-between">
        <label class="flex items-center cursor-pointer">
          <input
            v-model="includePPN"
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span class="ml-2 text-sm text-gray-700">Termasuk PPn</span>
        </label>
        
        <!-- Auto Tier Badge -->
        <div class="flex items-center space-x-3">
          <span class="text-sm text-gray-500">Kategori Pengadaan:</span>
          <div :class="['px-4 py-2 rounded-lg border-2 font-semibold', tierColorClass]">
            <span class="text-lg">{{ currentTierConfig.label }}</span>
            <span class="text-sm ml-2 opacity-75">({{ currentTierConfig.description }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Signature Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Penandatangan</h2>
      
      <div class="mb-4">
        <FormInput
          v-model="lokasi"
          label="Lokasi"
          placeholder="Contoh: Sorong"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-6">
        <!-- Yang Mengajukan -->
        <div class="border rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Yang mengajukan</h3>
          <FormSelect
            v-model="signatures.pengaju"
            label="Nama Pengaju"
            :options="pegawaiOptions"
            placeholder="Pilih pegawai..."
          />
        </div>
        
        <!-- Verifikator -->
        <div class="border rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Verifikator</h3>
          <FormSelect
            v-model="signatures.verifikator"
            label="Nama Verifikator"
            :options="pegawaiOptions"
            placeholder="Pilih pegawai..."
          />
        </div>
        
        <!-- KPA -->
        <div class="border rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Mengetahui dan Menyetujui</h3>
          <p class="text-xs text-gray-500 mb-2">Kuasa Pengguna Anggaran</p>
          <FormSelect
            v-model="signatures.kpa"
            label="Nama KPA"
            :options="pejabatOptions"
            placeholder="Pilih pejabat..."
          />
        </div>
        
        <!-- Mengetahui -->
        <div class="border rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Mengetahui</h3>
          <FormInput
            v-model="signatures.mengetahui_jabatan"
            label="Jabatan"
            placeholder="Contoh: Pudir III"
            class="mb-3"
          />
          <FormSelect
            v-model="signatures.mengetahui"
            label="Nama Pejabat"
            :options="pejabatOptions"
            placeholder="Pilih pejabat..."
          />
        </div>
      </div>
    </div>
  </div>
</template>
