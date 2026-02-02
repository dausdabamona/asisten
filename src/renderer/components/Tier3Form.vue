<template>
  <div class="tier3-form">
    <!-- Header with Progress -->
    <div class="form-header bg-white shadow-sm rounded-lg p-4 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Pengadaan Tier 3</h2>
          <p class="text-gray-500">Nilai &gt; Rp 50 Juta</p>
        </div>
        <div class="flex items-center space-x-4">
          <span v-if="store.lastSaved" class="text-sm text-gray-500">
            Tersimpan: {{ formatTime(store.lastSaved) }}
          </span>
          <span v-if="store.isSaving" class="text-sm text-blue-600">
            Menyimpan...
          </span>
          <button @click="store.saveDraft()" class="btn-secondary text-sm">
            Simpan Draft
          </button>
        </div>
      </div>

      <!-- Step Progress -->
      <div class="step-progress">
        <div class="flex items-center justify-between">
          <template v-for="(label, index) in store.stepLabels" :key="index">
            <div
              class="step-item flex flex-col items-center cursor-pointer"
              :class="{
                'completed': store.formData.metadata.completedSteps.includes(index + 1),
                'active': store.currentStep === index + 1,
                'disabled': !canGoToStep(index + 1)
              }"
              @click="store.goToStep(index + 1)"
            >
              <div class="step-circle w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1"
                   :class="getStepClass(index + 1)">
                <span v-if="store.formData.metadata.completedSteps.includes(index + 1)">&#10003;</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="text-xs text-center max-w-16 leading-tight hidden md:block">{{ label }}</span>
            </div>
            <div v-if="index < store.stepLabels.length - 1"
                 class="step-line flex-1 h-1 mx-2"
                 :class="store.formData.metadata.completedSteps.includes(index + 1) ? 'bg-primary-600' : 'bg-gray-200'">
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="store.isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-600">Memproses...</p>
      </div>
    </div>

    <!-- Form Content -->
    <div class="form-content bg-white shadow-sm rounded-lg p-6">
      <!-- Step 1: Identification -->
      <div v-show="store.currentStep === 1" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 1: Identifikasi Paket</h3>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nama Paket Pengadaan *
            </label>
            <input
              v-model="store.formData.identification.packageName"
              type="text"
              class="input-field"
              placeholder="Contoh: Pengadaan Alat Laboratorium Kelautan"
              maxlength="300"
            />
            <p v-if="store.validationErrors.packageName" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.packageName }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Kategori Pengadaan *
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div v-for="cat in store.CATEGORIES" :key="cat.value"
                   class="category-card p-4 border rounded-lg cursor-pointer transition-all"
                   :class="store.formData.identification.category === cat.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
                   @click="store.formData.identification.category = cat.value">
                <p class="font-semibold text-gray-800">{{ cat.label }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ cat.description }}</p>
              </div>
            </div>
            <p v-if="store.validationErrors.category" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.category }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unit Pengusul *
              </label>
              <select v-model="store.formData.identification.unit" class="input-field">
                <option value="">Pilih Unit</option>
                <option value="TU">Tata Usaha</option>
                <option value="Akademik">Akademik</option>
                <option value="Lab">Laboratorium</option>
                <option value="Perpustakaan">Perpustakaan</option>
              </select>
              <p v-if="store.validationErrors.unit" class="text-red-500 text-sm mt-1">
                {{ store.validationErrors.unit }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tingkat Urgensi
              </label>
              <select v-model="store.formData.identification.urgency" class="input-field">
                <option value="normal">Normal</option>
                <option value="urgent">Mendesak</option>
                <option value="very_urgent">Sangat Mendesak</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Latar Belakang * <span class="text-gray-400">(min. 500 karakter)</span>
            </label>
            <textarea
              v-model="store.formData.identification.background"
              rows="6"
              class="input-field"
              placeholder="Jelaskan latar belakang kebutuhan pengadaan ini..."
            ></textarea>
            <div class="flex justify-between mt-1">
              <p v-if="store.validationErrors.background" class="text-red-500 text-sm">
                {{ store.validationErrors.background }}
              </p>
              <p class="text-sm text-gray-500 ml-auto">
                {{ store.formData.identification.background?.length || 0 }} / 500 karakter
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Justifikasi Kebutuhan *
            </label>
            <textarea
              v-model="store.formData.identification.justification"
              rows="4"
              class="input-field"
              placeholder="Jelaskan alasan dan justifikasi mengapa pengadaan ini diperlukan..."
            ></textarea>
            <p v-if="store.validationErrors.justification" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.justification }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Target Penyelesaian
            </label>
            <input
              v-model="store.formData.identification.targetDate"
              type="date"
              class="input-field w-auto"
            />
          </div>
        </div>
      </div>

      <!-- Step 2: Technical Specifications -->
      <div v-show="store.currentStep === 2" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 2: Spesifikasi Teknis</h3>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Spesifikasi Teknis Detail *
            </label>
            <textarea
              v-model="store.formData.technicalSpecs.specifications"
              rows="8"
              class="input-field font-mono text-sm"
              placeholder="Tuliskan spesifikasi teknis secara detail...&#10;&#10;Contoh:&#10;1. Kapasitas: ...&#10;2. Dimensi: ...&#10;3. Material: ...&#10;4. Fitur: ..."
            ></textarea>
            <p v-if="store.validationErrors.specifications" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.specifications }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Volume Pekerjaan *
              </label>
              <input
                v-model="store.formData.technicalSpecs.volumeOfWork"
                type="text"
                class="input-field"
                placeholder="Contoh: 10"
              />
              <p v-if="store.validationErrors.volumeOfWork" class="text-red-500 text-sm mt-1">
                {{ store.validationErrors.volumeOfWork }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Satuan
              </label>
              <input
                v-model="store.formData.technicalSpecs.volumeUnit"
                type="text"
                class="input-field"
                placeholder="Contoh: Unit, Paket, M2, dll"
              />
            </div>
          </div>

          <!-- Technical Drawings (for construction) -->
          <div v-if="store.formData.identification.category === 'construction'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Gambar Teknis *
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input type="file" multiple accept=".pdf,.dwg,.png,.jpg" class="hidden" id="technical-drawings" @change="handleDrawingUpload" />
              <label for="technical-drawings" class="cursor-pointer">
                <p class="text-gray-500">Klik untuk upload gambar teknis</p>
                <p class="text-xs text-gray-400 mt-1">Format: PDF, DWG, PNG, JPG</p>
              </label>
            </div>
            <div v-if="store.formData.technicalSpecs.technicalDrawings?.length" class="mt-2 space-y-1">
              <div v-for="(file, index) in store.formData.technicalSpecs.technicalDrawings" :key="index"
                   class="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span class="text-sm">{{ file.name }}</span>
                <button @click="store.formData.technicalSpecs.technicalDrawings.splice(index, 1)" class="text-red-500 text-sm">Hapus</button>
              </div>
            </div>
            <p v-if="store.validationErrors.technicalDrawings" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.technicalDrawings }}
            </p>
          </div>

          <!-- KPIs -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Indikator Kinerja (KPI) *
              </label>
              <button @click="store.addKpi()" type="button" class="text-sm text-primary-600 hover:text-primary-700">
                + Tambah KPI
              </button>
            </div>
            <div class="space-y-3">
              <div v-for="(kpi, index) in store.formData.technicalSpecs.kpis" :key="index"
                   class="grid grid-cols-12 gap-3 items-start">
                <input v-model="kpi.indicator" type="text" class="input-field col-span-5" placeholder="Indikator" />
                <input v-model="kpi.target" type="text" class="input-field col-span-3" placeholder="Target" />
                <input v-model="kpi.measurement" type="text" class="input-field col-span-3" placeholder="Pengukuran" />
                <button v-if="store.formData.technicalSpecs.kpis.length > 1"
                        @click="store.removeKpi(index)"
                        type="button"
                        class="col-span-1 text-red-500 hover:text-red-700 p-2">
                  &times;
                </button>
              </div>
            </div>
            <p v-if="store.validationErrors.kpis" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.kpis }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Persyaratan Tambahan
            </label>
            <textarea
              v-model="store.formData.technicalSpecs.additionalRequirements"
              rows="3"
              class="input-field"
              placeholder="Persyaratan tambahan lainnya (opsional)..."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Step 3: HPS Preparation -->
      <div v-show="store.currentStep === 3" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 3: Penyusunan HPS (Harga Perkiraan Sendiri)</h3>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Kode Anggaran *
              </label>
              <input
                v-model="store.formData.hpsPreparation.budgetCode"
                type="text"
                class="input-field"
                placeholder="Contoh: 5311"
              />
              <p v-if="store.validationErrors.budgetCode" class="text-red-500 text-sm mt-1">
                {{ store.validationErrors.budgetCode }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Sumber Anggaran
              </label>
              <input
                v-model="store.formData.hpsPreparation.budgetSource"
                type="text"
                class="input-field"
                placeholder="Contoh: APBN 2024"
              />
            </div>
          </div>

          <!-- RAB Line Items -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Rincian Anggaran Biaya (RAB) *
              </label>
              <button @click="store.addLineItem()" type="button" class="text-sm text-primary-600 hover:text-primary-700">
                + Tambah Item
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-200 rounded-lg">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">No</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Satuan</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Volume</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Harga Satuan</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Jumlah</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in store.formData.hpsPreparation.lineItems" :key="index" class="border-t">
                    <td class="px-3 py-2 text-sm">{{ index + 1 }}</td>
                    <td class="px-3 py-2">
                      <input v-model="item.description" type="text" class="input-field text-sm py-1" placeholder="Deskripsi item" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model="item.unit" type="text" class="input-field text-sm py-1 w-20" placeholder="Unit" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.quantity" type="number" class="input-field text-sm py-1 w-20 text-right" @change="store.updateLineItemTotal(index)" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.unitPrice" type="number" class="input-field text-sm py-1 w-32 text-right" @change="store.updateLineItemTotal(index)" />
                    </td>
                    <td class="px-3 py-2 text-right text-sm font-medium">
                      {{ formatCurrency(item.totalPrice) }}
                    </td>
                    <td class="px-3 py-2">
                      <button v-if="store.formData.hpsPreparation.lineItems.length > 1"
                              @click="store.removeLineItem(index)"
                              type="button"
                              class="text-red-500 hover:text-red-700">
                        &times;
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50">
                  <tr class="border-t">
                    <td colspan="5" class="px-3 py-2 text-right font-medium">Subtotal</td>
                    <td class="px-3 py-2 text-right font-medium">
                      {{ formatCurrency(store.formData.hpsPreparation.lineItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0)) }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p v-if="store.validationErrors.lineItems" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.lineItems }}
            </p>
          </div>

          <!-- Overhead, Profit, PPN -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Overhead (%)
              </label>
              <input
                v-model.number="store.formData.hpsPreparation.overhead"
                type="number"
                step="0.1"
                class="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Profit (%)
              </label>
              <input
                v-model.number="store.formData.hpsPreparation.profit"
                type="number"
                step="0.1"
                class="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                PPN (%)
              </label>
              <input
                v-model.number="store.formData.hpsPreparation.ppn"
                type="number"
                step="0.1"
                class="input-field"
                placeholder="11"
              />
            </div>
          </div>

          <!-- Total HPS -->
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-lg font-semibold text-primary-800">Total HPS</span>
              <span class="text-2xl font-bold text-primary-600">{{ formatCurrency(store.totalHpsValue) }}</span>
            </div>
            <p v-if="store.totalHpsValue < 50000000" class="text-red-500 text-sm mt-2">
              Total HPS harus minimal Rp 50.000.000 untuk Tier 3
            </p>
          </div>

          <!-- HPS Sources -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sumber Referensi Harga HPS *
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="source in store.HPS_SOURCES" :key="source.value"
                   class="flex items-start p-3 border rounded-lg cursor-pointer"
                   :class="store.formData.hpsPreparation.hpsSources.includes(source.value) ? 'border-primary-600 bg-primary-50' : 'border-gray-200'"
                   @click="toggleHpsSource(source.value)">
                <input type="checkbox" :checked="store.formData.hpsPreparation.hpsSources.includes(source.value)" class="mt-1 mr-3" />
                <div>
                  <p class="font-medium text-sm">{{ source.label }}</p>
                  <p class="text-xs text-gray-500">{{ source.description }}</p>
                </div>
              </div>
            </div>
            <p v-if="store.validationErrors.hpsSources" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.hpsSources }}
            </p>
          </div>

          <!-- Price References -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                Referensi Harga (min. 3 sumber) *
              </label>
              <button @click="store.addPriceReference()" type="button" class="text-sm text-primary-600 hover:text-primary-700">
                + Tambah Referensi
              </button>
            </div>
            <div class="space-y-3">
              <div v-for="(ref, index) in store.formData.hpsPreparation.priceReferences" :key="index"
                   class="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <input v-model="ref.source" type="text" class="input-field col-span-3" placeholder="Sumber" />
                <input v-model="ref.item" type="text" class="input-field col-span-3" placeholder="Item" />
                <input v-model.number="ref.price" type="number" class="input-field col-span-2" placeholder="Harga" />
                <input v-model="ref.date" type="date" class="input-field col-span-2" />
                <div class="col-span-1">
                  <input type="file" :id="'price-ref-' + index" class="hidden" @change="handlePriceRefUpload($event, index)" />
                  <label :for="'price-ref-' + index" class="btn-secondary text-xs py-1 px-2 cursor-pointer">Upload</label>
                </div>
                <button v-if="store.formData.hpsPreparation.priceReferences.length > 1"
                        @click="store.removePriceReference(index)"
                        type="button"
                        class="col-span-1 text-red-500 hover:text-red-700 p-2">
                  &times;
                </button>
              </div>
            </div>
            <p v-if="store.validationErrors.priceReferences" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.priceReferences }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Metode Perhitungan HPS
            </label>
            <select v-model="store.formData.hpsPreparation.calculationMethod" class="input-field">
              <option value="">Pilih metode</option>
              <option value="unit_price">Harga Satuan</option>
              <option value="lump_sum">Lump Sum</option>
              <option value="combined">Gabungan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Step 4: Provider Qualifications -->
      <div v-show="store.currentStep === 4" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 4: Persyaratan Kualifikasi Penyedia</h3>

        <div class="space-y-6">
          <!-- Business License -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Persyaratan Perizinan Usaha *
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="store.formData.providerQualifications.businessLicense.siup" class="mr-3" />
                <span>SIUP</span>
              </label>
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="store.formData.providerQualifications.businessLicense.nib" class="mr-3" />
                <span>NIB</span>
              </label>
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="store.formData.providerQualifications.businessLicense.npwp" class="mr-3" />
                <span>NPWP</span>
              </label>
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="store.formData.providerQualifications.businessLicense.domicile" class="mr-3" />
                <span>Domisili</span>
              </label>
            </div>
            <input v-model="store.formData.providerQualifications.businessLicense.other"
                   type="text"
                   class="input-field mt-3"
                   placeholder="Perizinan lainnya (opsional)" />
            <p v-if="store.validationErrors.businessLicense" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.businessLicense }}
            </p>
          </div>

          <!-- Technical Requirements -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Persyaratan Teknis
            </label>
            <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Pengalaman Minimal *</label>
                  <div class="flex gap-2">
                    <input v-model.number="store.formData.providerQualifications.technicalRequirements.minExperience"
                           type="number"
                           class="input-field flex-1"
                           placeholder="0" />
                    <select v-model="store.formData.providerQualifications.technicalRequirements.experienceUnit" class="input-field w-24">
                      <option value="years">Tahun</option>
                      <option value="projects">Proyek</option>
                    </select>
                  </div>
                  <p v-if="store.validationErrors.minExperience" class="text-red-500 text-sm mt-1">
                    {{ store.validationErrors.minExperience }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Sertifikasi</label>
                  <input v-model="certificationInput"
                         type="text"
                         class="input-field"
                         placeholder="Tekan Enter untuk menambah"
                         @keyup.enter="addCertification" />
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span v-for="(cert, index) in store.formData.providerQualifications.technicalRequirements.certifications"
                          :key="index"
                          class="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs flex items-center">
                      {{ cert }}
                      <button @click="store.formData.providerQualifications.technicalRequirements.certifications.splice(index, 1)" class="ml-1">&times;</button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Expert Staff -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs text-gray-600">Tenaga Ahli</label>
                  <button @click="store.addExpertStaff()" type="button" class="text-xs text-primary-600">+ Tambah</button>
                </div>
                <div class="space-y-2">
                  <div v-for="(staff, index) in store.formData.providerQualifications.technicalRequirements.expertStaff" :key="index"
                       class="grid grid-cols-12 gap-2">
                    <input v-model="staff.position" type="text" class="input-field col-span-4 text-sm" placeholder="Posisi" />
                    <input v-model="staff.qualification" type="text" class="input-field col-span-5 text-sm" placeholder="Kualifikasi" />
                    <input v-model.number="staff.quantity" type="number" class="input-field col-span-2 text-sm" placeholder="Jml" />
                    <button v-if="store.formData.providerQualifications.technicalRequirements.expertStaff.length > 1"
                            @click="store.removeExpertStaff(index)"
                            type="button"
                            class="col-span-1 text-red-500">&times;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial Capability -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Kemampuan Keuangan
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Minimal Aset</label>
                <input v-model.number="store.formData.providerQualifications.financialCapability.minAssets"
                       type="number"
                       class="input-field"
                       placeholder="0" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Minimal Omzet Tahunan</label>
                <input v-model.number="store.formData.providerQualifications.financialCapability.minTurnover"
                       type="number"
                       class="input-field"
                       placeholder="0" />
              </div>
            </div>
            <label class="flex items-center mt-4">
              <input type="checkbox" v-model="store.formData.providerQualifications.financialCapability.bankGuarantee" class="mr-2" />
              <span class="text-sm">Memerlukan Bank Garansi</span>
            </label>
            <div v-if="store.formData.providerQualifications.financialCapability.bankGuarantee" class="mt-2">
              <label class="block text-xs text-gray-600 mb-1">Persentase Bank Garansi (%)</label>
              <input v-model.number="store.formData.providerQualifications.financialCapability.bankGuaranteePercent"
                     type="number"
                     class="input-field w-32"
                     placeholder="5" />
            </div>
          </div>

          <!-- Not Blacklisted -->
          <div>
            <label class="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input type="checkbox" v-model="store.formData.providerQualifications.notBlacklisted" class="mr-3" />
              <div>
                <span class="font-medium">Tidak Masuk Daftar Hitam</span>
                <p class="text-xs text-gray-500">Penyedia tidak dalam daftar hitam LKPP</p>
              </div>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Persyaratan Tambahan
            </label>
            <textarea v-model="store.formData.providerQualifications.additionalRequirements"
                      rows="3"
                      class="input-field"
                      placeholder="Persyaratan kualifikasi tambahan..."></textarea>
          </div>
        </div>
      </div>

      <!-- Step 5: Procurement Method -->
      <div v-show="store.currentStep === 5" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 5: Metode Pengadaan</h3>

        <div class="space-y-6">
          <!-- Catalog Check -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label class="flex items-center">
              <input type="checkbox" v-model="store.formData.procurementMethod.isInCatalog" class="mr-3" />
              <div>
                <span class="font-medium">Tersedia di Katalog Elektronik</span>
                <p class="text-xs text-gray-600">Jika tersedia, wajib menggunakan e-Purchasing</p>
              </div>
            </label>
            <div v-if="store.formData.procurementMethod.isInCatalog" class="mt-3">
              <input v-model="store.formData.procurementMethod.catalogId"
                     type="text"
                     class="input-field"
                     placeholder="ID Katalog LKPP" />
            </div>
          </div>

          <!-- Urgency Check -->
          <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <label class="flex items-center">
              <input type="checkbox" v-model="store.formData.procurementMethod.isUrgent" class="mr-3" />
              <div>
                <span class="font-medium">Pengadaan Mendesak</span>
                <p class="text-xs text-gray-600">Dapat menggunakan metode tender cepat</p>
              </div>
            </label>
            <div v-if="store.formData.procurementMethod.isUrgent" class="mt-3">
              <label class="block text-xs text-gray-600 mb-1">Justifikasi Urgensi *</label>
              <textarea v-model="store.formData.procurementMethod.urgencyJustification"
                        rows="2"
                        class="input-field"
                        placeholder="Jelaskan alasan urgensi..."></textarea>
            </div>
          </div>

          <!-- Suggested Method -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-gray-600 mb-2">Metode yang Disarankan:</p>
            <p class="text-lg font-semibold text-green-700">
              {{ store.PROCUREMENT_METHODS.find(m => m.value === store.suggestedMethod)?.label }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Berdasarkan nilai HPS: {{ formatCurrency(store.totalHpsValue) }}
            </p>
          </div>

          <!-- Method Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Pilih Metode Pengadaan *
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="method in store.PROCUREMENT_METHODS" :key="method.value"
                   class="p-4 border rounded-lg cursor-pointer transition-all"
                   :class="{
                     'border-primary-600 bg-primary-50': store.formData.procurementMethod.method === method.value,
                     'border-gray-200 hover:border-gray-300': store.formData.procurementMethod.method !== method.value,
                     'opacity-50': !isMethodAllowed(method)
                   }"
                   @click="isMethodAllowed(method) && (store.formData.procurementMethod.method = method.value)">
                <p class="font-semibold">{{ method.label }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ method.description }}</p>
              </div>
            </div>
            <p v-if="store.validationErrors.method" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.method }}
            </p>
          </div>

          <!-- Direct Appointment Justification -->
          <div v-if="store.formData.procurementMethod.method === 'direct_appointment'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Justifikasi Penunjukan Langsung *
            </label>
            <textarea v-model="store.formData.procurementMethod.methodJustification"
                      rows="4"
                      class="input-field"
                      placeholder="Jelaskan alasan kuat untuk penunjukan langsung..."></textarea>
            <p v-if="store.validationErrors.methodJustification" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.methodJustification }}
            </p>
          </div>

          <!-- Timeline -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              Timeline Pengadaan
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Pengumuman</label>
                <input v-model="store.formData.procurementMethod.timeline.announcementDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Pendaftaran Mulai</label>
                <input v-model="store.formData.procurementMethod.timeline.registrationStart" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Pendaftaran Selesai</label>
                <input v-model="store.formData.procurementMethod.timeline.registrationEnd" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Batas Download Dokumen</label>
                <input v-model="store.formData.procurementMethod.timeline.documentDownloadEnd" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Aanwijzing</label>
                <input v-model="store.formData.procurementMethod.timeline.clarificationDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Batas Penawaran</label>
                <input v-model="store.formData.procurementMethod.timeline.bidSubmissionEnd" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Pembukaan Penawaran</label>
                <input v-model="store.formData.procurementMethod.timeline.bidOpeningDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Selesai Evaluasi</label>
                <input v-model="store.formData.procurementMethod.timeline.evaluationEnd" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Penetapan Pemenang</label>
                <input v-model="store.formData.procurementMethod.timeline.awardDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Penandatanganan Kontrak</label>
                <input v-model="store.formData.procurementMethod.timeline.contractSignDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Mulai Pekerjaan</label>
                <input v-model="store.formData.procurementMethod.timeline.workStartDate" type="date" class="input-field" />
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Selesai Pekerjaan</label>
                <input v-model="store.formData.procurementMethod.timeline.workEndDate" type="date" class="input-field" />
              </div>
            </div>
            <div class="mt-4 p-3 bg-gray-100 rounded-lg">
              <p class="text-sm">
                Total Hari Kerja: <span class="font-semibold" :class="store.calculatedWorkingDays < 30 ? 'text-red-600' : 'text-green-600'">{{ store.calculatedWorkingDays }} hari</span>
                <span v-if="store.calculatedWorkingDays < 30" class="text-red-500 text-xs ml-2">(Min. 30 hari)</span>
              </p>
            </div>
            <p v-if="store.validationErrors.timeline" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.timeline }}
            </p>
          </div>
        </div>
      </div>

      <!-- Step 6: Risk Analysis -->
      <div v-show="store.currentStep === 6" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 6: Analisis Risiko</h3>

        <div class="space-y-6">
          <!-- Risk Table -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-700">
                Identifikasi Risiko *
              </label>
              <button @click="store.addRisk()" type="button" class="text-sm text-primary-600 hover:text-primary-700">
                + Tambah Risiko
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-200 rounded-lg">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Risiko</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">Probabilitas</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">Dampak</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Mitigasi</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">Penanggung Jawab</th>
                    <th class="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(risk, index) in store.formData.riskAnalysis.risks" :key="index" class="border-t">
                    <td class="px-3 py-2">
                      <input v-model="risk.risk" type="text" class="input-field text-sm" placeholder="Deskripsi risiko" />
                    </td>
                    <td class="px-3 py-2">
                      <select v-model="risk.probability" class="input-field text-sm">
                        <option value="low">Rendah</option>
                        <option value="medium">Sedang</option>
                        <option value="high">Tinggi</option>
                      </select>
                    </td>
                    <td class="px-3 py-2">
                      <select v-model="risk.impact" class="input-field text-sm">
                        <option value="low">Rendah</option>
                        <option value="medium">Sedang</option>
                        <option value="high">Tinggi</option>
                      </select>
                    </td>
                    <td class="px-3 py-2">
                      <input v-model="risk.mitigation" type="text" class="input-field text-sm" placeholder="Langkah mitigasi" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model="risk.owner" type="text" class="input-field text-sm" placeholder="PIC" />
                    </td>
                    <td class="px-3 py-2">
                      <button v-if="store.formData.riskAnalysis.risks.length > 1"
                              @click="store.removeRisk(index)"
                              type="button"
                              class="text-red-500">&times;</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="store.validationErrors.risks" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.risks }}
            </p>
          </div>

          <!-- Sustainability Plan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rencana Keberlanjutan *
            </label>
            <textarea v-model="store.formData.riskAnalysis.sustainabilityPlan"
                      rows="4"
                      class="input-field"
                      placeholder="Jelaskan rencana keberlanjutan setelah pengadaan selesai..."></textarea>
            <p v-if="store.validationErrors.sustainabilityPlan" class="text-red-500 text-sm mt-1">
              {{ store.validationErrors.sustainabilityPlan }}
            </p>
          </div>

          <!-- Maintenance -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Anggaran Pemeliharaan
              </label>
              <input v-model.number="store.formData.riskAnalysis.maintenanceBudget"
                     type="number"
                     class="input-field"
                     placeholder="0" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Periode Pemeliharaan
              </label>
              <input v-model="store.formData.riskAnalysis.maintenancePeriod"
                     type="text"
                     class="input-field"
                     placeholder="Contoh: 1 tahun" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Masa Garansi
              </label>
              <input v-model="store.formData.riskAnalysis.warrantyPeriod"
                     type="text"
                     class="input-field"
                     placeholder="Contoh: 2 tahun" />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 7: Documents -->
      <div v-show="store.currentStep === 7" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 7: Upload Dokumen</h3>

        <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Status Kelengkapan Dokumen</p>
              <p class="text-sm text-gray-600">
                {{ store.documentStatus.uploaded }} / {{ store.documentStatus.required }} dokumen wajib terunggah
              </p>
            </div>
            <div class="text-right">
              <span v-if="store.documentStatus.complete" class="text-green-600 font-semibold">Lengkap</span>
              <span v-else class="text-orange-600 font-semibold">Belum Lengkap</span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div v-for="doc in store.requiredDocuments" :key="doc.id"
               class="p-4 border rounded-lg"
               :class="store.formData.documents[doc.id]?.length ? 'border-green-300 bg-green-50' : (doc.required ? 'border-orange-300 bg-orange-50' : 'border-gray-200')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="font-medium">
                  {{ doc.label }}
                  <span v-if="doc.required" class="text-red-500">*</span>
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ doc.description }}</p>
              </div>
              <div>
                <input type="file" :id="'doc-' + doc.id" class="hidden" multiple @change="handleDocumentUpload($event, doc.id)" />
                <label :for="'doc-' + doc.id" class="btn-secondary text-sm cursor-pointer">
                  {{ store.formData.documents[doc.id]?.length ? 'Tambah File' : 'Upload' }}
                </label>
              </div>
            </div>

            <!-- Uploaded files list -->
            <div v-if="store.formData.documents[doc.id]?.length" class="mt-3 space-y-1">
              <div v-for="(file, fIndex) in store.formData.documents[doc.id]" :key="fIndex"
                   class="flex items-center justify-between bg-white p-2 rounded text-sm">
                <span class="truncate flex-1 mr-2">{{ file.name }}</span>
                <span class="text-xs text-gray-500 mr-2">{{ formatFileSize(file.size) }}</span>
                <button @click="store.removeDocument(doc.id, fIndex)" class="text-red-500 hover:text-red-700">&times;</button>
              </div>
            </div>
          </div>
        </div>

        <p v-if="store.validationErrors.documents" class="text-red-500 text-sm mt-4">
          {{ store.validationErrors.documents }}
        </p>
      </div>

      <!-- Step 8: Review & Submit -->
      <div v-show="store.currentStep === 8" class="step-content">
        <h3 class="text-xl font-semibold mb-6">Step 8: Review & Submit</h3>

        <div class="space-y-6">
          <!-- Summary Sections -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Identification Summary -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">Identifikasi</h4>
              <dl class="space-y-2 text-sm">
                <div><dt class="text-gray-500">Nama Paket:</dt><dd class="font-medium">{{ store.formData.identification.packageName || '-' }}</dd></div>
                <div><dt class="text-gray-500">Kategori:</dt><dd>{{ store.CATEGORIES.find(c => c.value === store.formData.identification.category)?.label || '-' }}</dd></div>
                <div><dt class="text-gray-500">Unit:</dt><dd>{{ store.formData.identification.unit || '-' }}</dd></div>
                <div><dt class="text-gray-500">Urgensi:</dt><dd>{{ store.formData.identification.urgency }}</dd></div>
              </dl>
            </div>

            <!-- HPS Summary -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">HPS</h4>
              <dl class="space-y-2 text-sm">
                <div><dt class="text-gray-500">Total HPS:</dt><dd class="font-bold text-lg text-primary-600">{{ formatCurrency(store.totalHpsValue) }}</dd></div>
                <div><dt class="text-gray-500">Kode Anggaran:</dt><dd>{{ store.formData.hpsPreparation.budgetCode || '-' }}</dd></div>
                <div><dt class="text-gray-500">Jumlah Item RAB:</dt><dd>{{ store.formData.hpsPreparation.lineItems.filter(i => i.description).length }}</dd></div>
                <div><dt class="text-gray-500">Sumber Referensi:</dt><dd>{{ store.formData.hpsPreparation.priceReferences.filter(r => r.source).length }} sumber</dd></div>
              </dl>
            </div>

            <!-- Method Summary -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">Metode Pengadaan</h4>
              <dl class="space-y-2 text-sm">
                <div><dt class="text-gray-500">Metode:</dt><dd class="font-medium">{{ store.PROCUREMENT_METHODS.find(m => m.value === store.formData.procurementMethod.method)?.label || '-' }}</dd></div>
                <div><dt class="text-gray-500">Timeline:</dt><dd>{{ store.calculatedWorkingDays }} hari kerja</dd></div>
                <div><dt class="text-gray-500">Katalog:</dt><dd>{{ store.formData.procurementMethod.isInCatalog ? 'Ya' : 'Tidak' }}</dd></div>
                <div><dt class="text-gray-500">Mendesak:</dt><dd>{{ store.formData.procurementMethod.isUrgent ? 'Ya' : 'Tidak' }}</dd></div>
              </dl>
            </div>

            <!-- Document Summary -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">Dokumen</h4>
              <dl class="space-y-2 text-sm">
                <div><dt class="text-gray-500">Status:</dt><dd :class="store.documentStatus.complete ? 'text-green-600 font-medium' : 'text-orange-600'">{{ store.documentStatus.complete ? 'Lengkap' : 'Belum Lengkap' }}</dd></div>
                <div><dt class="text-gray-500">Terunggah:</dt><dd>{{ store.documentStatus.uploaded }} / {{ store.documentStatus.required }} wajib</dd></div>
                <div v-if="store.documentStatus.missing.length"><dt class="text-gray-500">Kurang:</dt><dd class="text-red-500 text-xs">{{ store.documentStatus.missing.join(', ') }}</dd></div>
              </dl>
            </div>
          </div>

          <!-- Approval Workflow Preview -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="font-semibold text-gray-700 mb-3">Alur Persetujuan (5 Tahap)</h4>
            <div class="flex items-center justify-between overflow-x-auto">
              <template v-for="(step, index) in store.APPROVAL_STEPS" :key="step.step">
                <div class="flex flex-col items-center min-w-20">
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {{ step.step }}
                  </div>
                  <p class="text-xs text-center mt-1 font-medium">{{ step.label }}</p>
                </div>
                <div v-if="index < store.APPROVAL_STEPS.length - 1" class="flex-1 h-0.5 bg-gray-300 mx-2"></div>
              </template>
            </div>
          </div>

          <!-- Validation Checklist -->
          <div class="p-4 border rounded-lg">
            <h4 class="font-semibold text-gray-700 mb-3">Checklist Validasi</h4>
            <div class="space-y-2">
              <div class="flex items-center" :class="store.formData.identification.packageName ? 'text-green-600' : 'text-red-500'">
                <span class="mr-2">{{ store.formData.identification.packageName ? '&#10003;' : '&#10007;' }}</span>
                <span>Nama paket terisi</span>
              </div>
              <div class="flex items-center" :class="store.totalHpsValue >= 50000000 ? 'text-green-600' : 'text-red-500'">
                <span class="mr-2">{{ store.totalHpsValue >= 50000000 ? '&#10003;' : '&#10007;' }}</span>
                <span>Nilai HPS &gt;= Rp 50 juta</span>
              </div>
              <div class="flex items-center" :class="store.formData.procurementMethod.method ? 'text-green-600' : 'text-red-500'">
                <span class="mr-2">{{ store.formData.procurementMethod.method ? '&#10003;' : '&#10007;' }}</span>
                <span>Metode pengadaan dipilih</span>
              </div>
              <div class="flex items-center" :class="store.calculatedWorkingDays >= 30 ? 'text-green-600' : 'text-red-500'">
                <span class="mr-2">{{ store.calculatedWorkingDays >= 30 ? '&#10003;' : '&#10007;' }}</span>
                <span>Timeline minimal 30 hari kerja</span>
              </div>
              <div class="flex items-center" :class="store.documentStatus.complete ? 'text-green-600' : 'text-red-500'">
                <span class="mr-2">{{ store.documentStatus.complete ? '&#10003;' : '&#10007;' }}</span>
                <span>Dokumen wajib lengkap</span>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="text-center">
            <button @click="handleSubmit"
                    :disabled="!store.isFormValid || store.isLoading"
                    class="btn-primary px-8 py-3 text-lg"
                    :class="{ 'opacity-50 cursor-not-allowed': !store.isFormValid }">
              {{ store.isLoading ? 'Memproses...' : 'Submit untuk Persetujuan' }}
            </button>
            <p v-if="!store.isFormValid" class="text-sm text-red-500 mt-2">
              Pastikan semua validasi terpenuhi sebelum submit
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="form-navigation flex justify-between mt-6">
      <button @click="store.previousStep()"
              v-show="!store.isFirstStep"
              class="btn-secondary px-6">
        Sebelumnya
      </button>
      <div v-show="store.isFirstStep"></div>

      <button @click="handleNextStep"
              v-show="!store.isLastStep"
              class="btn-primary px-6">
        Selanjutnya
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTier3FormStore } from '../stores/tier3FormStore'

const store = useTier3FormStore()

// Local state
const certificationInput = ref('')

// Methods
function formatCurrency(value) {
  if (!value) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getStepClass(step) {
  if (store.formData.metadata.completedSteps.includes(step)) {
    return 'bg-primary-600 text-white'
  }
  if (store.currentStep === step) {
    return 'bg-primary-100 text-primary-600 border-2 border-primary-600'
  }
  return 'bg-gray-200 text-gray-500'
}

function canGoToStep(step) {
  return step <= store.currentStep || store.formData.metadata.completedSteps.includes(step - 1)
}

function toggleHpsSource(value) {
  const sources = store.formData.hpsPreparation.hpsSources
  const index = sources.indexOf(value)
  if (index === -1) {
    sources.push(value)
  } else {
    sources.splice(index, 1)
  }
}

function isMethodAllowed(method) {
  const value = store.totalHpsValue
  if (method.value === 'tender' && value < 200000000) return false
  if (method.value === 'direct_procurement' && value > 200000000) return false
  return true
}

function addCertification() {
  if (certificationInput.value.trim()) {
    store.formData.providerQualifications.technicalRequirements.certifications.push(certificationInput.value.trim())
    certificationInput.value = ''
  }
}

function handleDrawingUpload(event) {
  const files = Array.from(event.target.files)
  store.formData.technicalSpecs.technicalDrawings.push(...files.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type,
    file: f
  })))
}

function handlePriceRefUpload(event, index) {
  const file = event.target.files[0]
  if (file) {
    store.formData.hpsPreparation.priceReferences[index].documentPath = file.name
  }
}

function handleDocumentUpload(event, docId) {
  const files = Array.from(event.target.files)
  if (!store.formData.documents[docId]) {
    store.formData.documents[docId] = []
  }
  store.formData.documents[docId].push(...files.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type,
    file: f
  })))
}

function handleNextStep() {
  store.nextStep()
}

async function handleSubmit() {
  const result = await store.submitForm()
  if (result.success) {
    alert(`Pengadaan berhasil disubmit!\nNomor: ${result.data.request_number || 'N/A'}`)
  } else {
    alert(`Gagal submit: ${result.error}`)
  }
}
</script>

<style scoped>
.tier3-form {
  max-width: 1200px;
  margin: 0 auto;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}

.btn-primary {
  @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors;
}

.step-content {
  min-height: 400px;
}
</style>
