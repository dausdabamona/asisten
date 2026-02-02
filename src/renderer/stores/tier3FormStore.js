/**
 * Tier 3 Form Store
 *
 * Manages multi-step wizard state for Tier 3 procurement (>50 million)
 * Supports draft saving, validation, and form navigation
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// Procurement categories
export const CATEGORIES = [
  { value: 'goods', label: 'Barang', description: 'Pengadaan barang/peralatan' },
  { value: 'construction', label: 'Konstruksi', description: 'Pekerjaan konstruksi/bangunan' },
  { value: 'consultancy', label: 'Jasa Konsultansi', description: 'Jasa konsultansi/keahlian' },
  { value: 'other_services', label: 'Jasa Lainnya', description: 'Jasa lainnya (non-konsultansi)' }
]

// Procurement methods
export const PROCUREMENT_METHODS = [
  { value: 'e_purchasing', label: 'e-Purchasing', minValue: 0, maxValue: Infinity, description: 'Pembelian melalui katalog elektronik' },
  { value: 'tender', label: 'Tender', minValue: 200000000, maxValue: Infinity, description: 'Tender/lelang umum' },
  { value: 'quick_tender', label: 'Tender Cepat', minValue: 50000000, maxValue: 200000000, description: 'Tender cepat untuk kebutuhan mendesak' },
  { value: 'direct_appointment', label: 'Penunjukan Langsung', minValue: 0, maxValue: Infinity, description: 'Penunjukan langsung dengan justifikasi kuat' },
  { value: 'direct_procurement', label: 'Pengadaan Langsung', minValue: 0, maxValue: 200000000, description: 'Pengadaan langsung' }
]

// HPS reference sources
export const HPS_SOURCES = [
  { value: 'market_price', label: 'Harga Pasar', description: 'Minimal 3 sumber harga pasar', minSources: 3 },
  { value: 'similar_contract', label: 'Kontrak Sejenis', description: 'Harga dari kontrak sejenis sebelumnya' },
  { value: 'standard_price', label: 'Harga Standar', description: 'Standar harga Kementerian/Daerah' },
  { value: 'bow_sni', label: 'Analisis BOW/SNI', description: 'Analisis berdasarkan BOW/SNI' }
]

// Document requirements
export const REQUIRED_DOCUMENTS = [
  { id: 'request_letter', label: 'Surat Permintaan Resmi', required: true, description: 'Surat permintaan yang ditandatangani pejabat berwenang' },
  { id: 'tor', label: 'Kerangka Acuan Kerja (KAK/TOR)', required: true, description: 'Terms of Reference lengkap' },
  { id: 'technical_spec', label: 'Spesifikasi Teknis', required: true, description: 'Spesifikasi teknis detail' },
  { id: 'drawings', label: 'Gambar/Desain', required: false, category: 'construction', description: 'Gambar teknis/desain (untuk konstruksi)' },
  { id: 'rab', label: 'RAB Detail + Analisis', required: true, description: 'Rincian Anggaran Biaya dengan analisis' },
  { id: 'price_survey', label: 'Survei Harga (min 3 sumber)', required: true, description: 'Hasil survei harga dari minimal 3 sumber' },
  { id: 'technical_justification', label: 'Justifikasi Teknis', required: true, description: 'Justifikasi teknis pemilihan spesifikasi' },
  { id: 'site_plan', label: 'Site Plan/Peta Lokasi', required: false, category: 'construction', description: 'Denah lokasi (untuk konstruksi)' },
  { id: 'environmental_impact', label: 'Dokumen Lingkungan', required: false, description: 'Analisis dampak lingkungan (jika diperlukan)' },
  { id: 'feasibility_study', label: 'Studi Kelayakan', required: false, description: 'Studi kelayakan (untuk proyek besar)' }
]

// Workflow approval steps for Tier 3
export const APPROVAL_STEPS = [
  { step: 1, role: 'unit_head', label: 'Kepala Unit', description: 'Persetujuan kepala unit pengusul' },
  { step: 2, role: 'ppk', label: 'PPK', description: 'Review dan persetujuan PPK' },
  { step: 3, role: 'technical_team', label: 'Tim Teknis', description: 'Verifikasi spesifikasi teknis' },
  { step: 4, role: 'budget_team', label: 'Tim Anggaran', description: 'Verifikasi ketersediaan anggaran' },
  { step: 5, role: 'ppspm', label: 'PPSPM', description: 'Persetujuan final PPSPM' }
]

// Initial form state
const getInitialFormState = () => ({
  // Step 1: Identification
  identification: {
    packageName: '',
    category: '',
    background: '',
    justification: '',
    unit: '',
    requesterId: '',
    targetDate: '',
    urgency: 'normal'
  },

  // Step 2: Technical Specifications
  technicalSpecs: {
    specifications: '',
    volumeOfWork: '',
    volumeUnit: '',
    technicalDrawings: [],
    kpis: [
      { indicator: '', target: '', measurement: '' }
    ],
    additionalRequirements: ''
  },

  // Step 3: HPS Preparation
  hpsPreparation: {
    totalValue: 0,
    budgetCode: '',
    budgetSource: '',
    lineItems: [
      { description: '', unit: '', quantity: 0, unitPrice: 0, totalPrice: 0 }
    ],
    hpsSources: [],
    priceReferences: [
      { source: '', item: '', price: 0, date: '', documentPath: '' }
    ],
    calculationMethod: '',
    overhead: 0,
    profit: 0,
    ppn: 0
  },

  // Step 4: Provider Qualifications
  providerQualifications: {
    businessLicense: {
      siup: true,
      nib: true,
      npwp: true,
      domicile: true,
      other: ''
    },
    technicalRequirements: {
      minExperience: 0,
      experienceUnit: 'years',
      certifications: [],
      equipment: [],
      expertStaff: [
        { position: '', qualification: '', quantity: 0 }
      ]
    },
    financialCapability: {
      minAssets: 0,
      minTurnover: 0,
      bankGuarantee: false,
      bankGuaranteePercent: 0
    },
    notBlacklisted: true,
    additionalRequirements: ''
  },

  // Step 5: Procurement Method
  procurementMethod: {
    method: '',
    methodJustification: '',
    isInCatalog: false,
    catalogId: '',
    isUrgent: false,
    urgencyJustification: '',
    timeline: {
      announcementDate: '',
      registrationStart: '',
      registrationEnd: '',
      documentDownloadEnd: '',
      clarificationDate: '',
      bidSubmissionEnd: '',
      bidOpeningDate: '',
      evaluationEnd: '',
      awardDate: '',
      contractSignDate: '',
      workStartDate: '',
      workEndDate: ''
    },
    workingDays: 30
  },

  // Step 6: Risk Analysis
  riskAnalysis: {
    risks: [
      {
        risk: '',
        probability: 'low',
        impact: 'low',
        mitigation: '',
        owner: ''
      }
    ],
    sustainabilityPlan: '',
    maintenanceBudget: 0,
    maintenancePeriod: '',
    warrantyPeriod: ''
  },

  // Step 7: Documents
  documents: {},

  // Metadata
  metadata: {
    draftId: null,
    createdAt: null,
    updatedAt: null,
    currentStep: 1,
    completedSteps: [],
    validationErrors: {}
  }
})

export const useTier3FormStore = defineStore('tier3Form', () => {
  // State
  const formData = ref(getInitialFormState())
  const currentStep = ref(1)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref(null)
  const validationErrors = ref({})

  // Total steps
  const totalSteps = 8

  // Step labels
  const stepLabels = [
    'Identifikasi',
    'Spesifikasi Teknis',
    'Penyusunan HPS',
    'Kualifikasi Penyedia',
    'Metode Pengadaan',
    'Analisis Risiko',
    'Upload Dokumen',
    'Review & Submit'
  ]

  // Computed: Current step label
  const currentStepLabel = computed(() => stepLabels[currentStep.value - 1])

  // Computed: Is first step
  const isFirstStep = computed(() => currentStep.value === 1)

  // Computed: Is last step
  const isLastStep = computed(() => currentStep.value === totalSteps)

  // Computed: Progress percentage
  const progress = computed(() => Math.round((currentStep.value / totalSteps) * 100))

  // Computed: Total HPS value
  const totalHpsValue = computed(() => {
    const items = formData.value.hpsPreparation.lineItems
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    const overhead = formData.value.hpsPreparation.overhead || 0
    const profit = formData.value.hpsPreparation.profit || 0
    const ppn = formData.value.hpsPreparation.ppn || 0

    const withOverhead = subtotal * (1 + overhead / 100)
    const withProfit = withOverhead * (1 + profit / 100)
    const withPpn = withProfit * (1 + ppn / 100)

    return Math.round(withPpn)
  })

  // Computed: Suggested procurement method
  const suggestedMethod = computed(() => {
    const value = totalHpsValue.value
    const isUrgent = formData.value.procurementMethod.isUrgent
    const isInCatalog = formData.value.procurementMethod.isInCatalog

    if (isInCatalog) return 'e_purchasing'
    if (value > 200000000) return isUrgent ? 'quick_tender' : 'tender'
    if (value > 50000000) return 'quick_tender'
    return 'direct_procurement'
  })

  // Computed: Required documents for current category
  const requiredDocuments = computed(() => {
    const category = formData.value.identification.category
    return REQUIRED_DOCUMENTS.filter(doc => {
      if (doc.category && doc.category !== category) return false
      return true
    })
  })

  // Computed: Document completion status
  const documentStatus = computed(() => {
    const docs = formData.value.documents
    const required = requiredDocuments.value.filter(d => d.required)
    const uploaded = required.filter(d => docs[d.id]?.length > 0)

    return {
      required: required.length,
      uploaded: uploaded.length,
      complete: uploaded.length >= required.length,
      missing: required.filter(d => !docs[d.id]?.length).map(d => d.label)
    }
  })

  // Computed: Overall form validity
  const isFormValid = computed(() => {
    return Object.keys(validationErrors.value).length === 0 &&
           totalHpsValue.value >= 50000000 &&
           documentStatus.value.complete
  })

  // Computed: Calculate working days
  const calculatedWorkingDays = computed(() => {
    const timeline = formData.value.procurementMethod.timeline
    if (!timeline.announcementDate || !timeline.contractSignDate) return 0

    const start = new Date(timeline.announcementDate)
    const end = new Date(timeline.contractSignDate)
    let days = 0
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++
      }
      current.setDate(current.getDate() + 1)
    }

    return days
  })

  // Actions
  function nextStep() {
    if (validateCurrentStep() && currentStep.value < totalSteps) {
      if (!formData.value.metadata.completedSteps.includes(currentStep.value)) {
        formData.value.metadata.completedSteps.push(currentStep.value)
      }
      currentStep.value++
      saveDraft()
    }
  }

  function previousStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
      // Can only go to completed steps or current + 1
      if (step <= currentStep.value || formData.value.metadata.completedSteps.includes(step - 1)) {
        currentStep.value = step
      }
    }
  }

  function validateCurrentStep() {
    const errors = {}

    switch (currentStep.value) {
      case 1: // Identification
        if (!formData.value.identification.packageName?.trim()) {
          errors.packageName = 'Nama paket wajib diisi'
        }
        if (!formData.value.identification.category) {
          errors.category = 'Kategori wajib dipilih'
        }
        if (!formData.value.identification.background?.trim()) {
          errors.background = 'Latar belakang wajib diisi'
        }
        if (formData.value.identification.background?.length < 500) {
          errors.background = 'Latar belakang minimal 500 karakter'
        }
        if (!formData.value.identification.justification?.trim()) {
          errors.justification = 'Justifikasi wajib diisi'
        }
        if (!formData.value.identification.unit) {
          errors.unit = 'Unit wajib dipilih'
        }
        break

      case 2: // Technical Specifications
        if (!formData.value.technicalSpecs.specifications?.trim()) {
          errors.specifications = 'Spesifikasi teknis wajib diisi'
        }
        if (!formData.value.technicalSpecs.volumeOfWork) {
          errors.volumeOfWork = 'Volume pekerjaan wajib diisi'
        }
        if (formData.value.identification.category === 'construction') {
          if (!formData.value.technicalSpecs.technicalDrawings?.length) {
            errors.technicalDrawings = 'Gambar teknis wajib diunggah untuk konstruksi'
          }
        }
        const validKpis = formData.value.technicalSpecs.kpis.filter(k => k.indicator?.trim())
        if (validKpis.length === 0) {
          errors.kpis = 'Minimal 1 KPI wajib diisi'
        }
        break

      case 3: // HPS Preparation
        if (totalHpsValue.value < 50000000) {
          errors.totalValue = 'Total HPS harus >= Rp 50 juta untuk Tier 3'
        }
        if (!formData.value.hpsPreparation.budgetCode?.trim()) {
          errors.budgetCode = 'Kode anggaran wajib diisi'
        }
        const validItems = formData.value.hpsPreparation.lineItems.filter(i => i.description?.trim())
        if (validItems.length === 0) {
          errors.lineItems = 'Minimal 1 item RAB wajib diisi'
        }
        if (!formData.value.hpsPreparation.hpsSources?.length) {
          errors.hpsSources = 'Sumber referensi HPS wajib dipilih'
        }
        const validRefs = formData.value.hpsPreparation.priceReferences.filter(r => r.source?.trim())
        if (validRefs.length < 3) {
          errors.priceReferences = 'Minimal 3 sumber harga wajib diisi'
        }
        break

      case 4: // Provider Qualifications
        const quals = formData.value.providerQualifications
        if (!quals.businessLicense.siup && !quals.businessLicense.nib) {
          errors.businessLicense = 'SIUP atau NIB wajib dipilih'
        }
        if (quals.technicalRequirements.minExperience <= 0) {
          errors.minExperience = 'Pengalaman minimal wajib diisi'
        }
        break

      case 5: // Procurement Method
        if (!formData.value.procurementMethod.method) {
          errors.method = 'Metode pengadaan wajib dipilih'
        }
        if (formData.value.procurementMethod.method === 'direct_appointment') {
          if (!formData.value.procurementMethod.methodJustification?.trim()) {
            errors.methodJustification = 'Justifikasi penunjukan langsung wajib diisi'
          }
        }
        if (calculatedWorkingDays.value < 30) {
          errors.timeline = 'Timeline minimal 30 hari kerja'
        }
        break

      case 6: // Risk Analysis
        const validRisks = formData.value.riskAnalysis.risks.filter(r => r.risk?.trim())
        if (validRisks.length === 0) {
          errors.risks = 'Minimal 1 risiko wajib diidentifikasi'
        }
        if (!formData.value.riskAnalysis.sustainabilityPlan?.trim()) {
          errors.sustainabilityPlan = 'Rencana keberlanjutan wajib diisi'
        }
        break

      case 7: // Documents
        const missingDocs = documentStatus.value.missing
        if (missingDocs.length > 0) {
          errors.documents = `Dokumen wajib belum lengkap: ${missingDocs.join(', ')}`
        }
        break

      case 8: // Review
        // Final validation - check all previous steps
        if (!isFormValid.value) {
          errors.form = 'Form belum lengkap atau valid'
        }
        break
    }

    validationErrors.value = errors
    return Object.keys(errors).length === 0
  }

  function updateLineItemTotal(index) {
    const item = formData.value.hpsPreparation.lineItems[index]
    if (item) {
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
    }
    formData.value.hpsPreparation.totalValue = totalHpsValue.value
  }

  function addLineItem() {
    formData.value.hpsPreparation.lineItems.push({
      description: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0
    })
  }

  function removeLineItem(index) {
    if (formData.value.hpsPreparation.lineItems.length > 1) {
      formData.value.hpsPreparation.lineItems.splice(index, 1)
    }
  }

  function addKpi() {
    formData.value.technicalSpecs.kpis.push({
      indicator: '',
      target: '',
      measurement: ''
    })
  }

  function removeKpi(index) {
    if (formData.value.technicalSpecs.kpis.length > 1) {
      formData.value.technicalSpecs.kpis.splice(index, 1)
    }
  }

  function addPriceReference() {
    formData.value.hpsPreparation.priceReferences.push({
      source: '',
      item: '',
      price: 0,
      date: '',
      documentPath: ''
    })
  }

  function removePriceReference(index) {
    if (formData.value.hpsPreparation.priceReferences.length > 1) {
      formData.value.hpsPreparation.priceReferences.splice(index, 1)
    }
  }

  function addExpertStaff() {
    formData.value.providerQualifications.technicalRequirements.expertStaff.push({
      position: '',
      qualification: '',
      quantity: 0
    })
  }

  function removeExpertStaff(index) {
    if (formData.value.providerQualifications.technicalRequirements.expertStaff.length > 1) {
      formData.value.providerQualifications.technicalRequirements.expertStaff.splice(index, 1)
    }
  }

  function addRisk() {
    formData.value.riskAnalysis.risks.push({
      risk: '',
      probability: 'low',
      impact: 'low',
      mitigation: '',
      owner: ''
    })
  }

  function removeRisk(index) {
    if (formData.value.riskAnalysis.risks.length > 1) {
      formData.value.riskAnalysis.risks.splice(index, 1)
    }
  }

  function setDocument(docId, files) {
    formData.value.documents[docId] = files
  }

  function removeDocument(docId, fileIndex) {
    if (formData.value.documents[docId]) {
      formData.value.documents[docId].splice(fileIndex, 1)
    }
  }

  async function saveDraft() {
    if (isSaving.value) return

    isSaving.value = true
    formData.value.metadata.updatedAt = new Date().toISOString()

    try {
      const draftData = {
        ...formData.value,
        tier: 'tier3',
        status: 'draft',
        estimated_value: totalHpsValue.value
      }

      if (formData.value.metadata.draftId) {
        // Update existing draft
        await window.electronAPI.request.update(
          formData.value.metadata.draftId,
          {
            draft_data: JSON.stringify(draftData),
            estimated_value: totalHpsValue.value
          }
        )
      } else {
        // Create new draft
        const result = await window.electronAPI.request.create({
          tier: 'tier3',
          requester_id: formData.value.identification.requesterId || 'admin-id',
          unit: formData.value.identification.unit || 'TU',
          item_name: formData.value.identification.packageName || 'Draft Tier 3',
          description: formData.value.identification.background,
          estimated_value: totalHpsValue.value || 50000001,
          budget_code: formData.value.hpsPreparation.budgetCode || 'DRAFT',
          status: 'draft',
          urgency: formData.value.identification.urgency || 'normal'
        })

        if (result.success) {
          formData.value.metadata.draftId = result.data.id
          formData.value.metadata.createdAt = new Date().toISOString()
        }
      }

      lastSaved.value = new Date()
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      isSaving.value = false
    }
  }

  async function loadDraft(draftId) {
    isLoading.value = true
    try {
      const result = await window.electronAPI.request.getById(draftId)
      if (result.success && result.data.draft_data) {
        const draftData = JSON.parse(result.data.draft_data)
        formData.value = { ...getInitialFormState(), ...draftData }
        currentStep.value = formData.value.metadata.currentStep || 1
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function submitForm() {
    if (!validateCurrentStep() || !isFormValid.value) {
      return { success: false, error: 'Form tidak valid' }
    }

    isLoading.value = true
    try {
      // Prepare submission data
      const submissionData = {
        tier: 'tier3',
        requester_id: formData.value.identification.requesterId,
        unit: formData.value.identification.unit,
        item_name: formData.value.identification.packageName,
        description: formData.value.identification.background,
        specifications: JSON.stringify({
          category: formData.value.identification.category,
          justification: formData.value.identification.justification,
          technicalSpecs: formData.value.technicalSpecs,
          providerQualifications: formData.value.providerQualifications,
          procurementMethod: formData.value.procurementMethod,
          riskAnalysis: formData.value.riskAnalysis
        }),
        estimated_value: totalHpsValue.value,
        budget_code: formData.value.hpsPreparation.budgetCode,
        budget_source: formData.value.hpsPreparation.budgetSource,
        urgency: formData.value.identification.urgency,
        target_date: formData.value.identification.targetDate,
        status: 'draft'
      }

      let requestId = formData.value.metadata.draftId

      if (requestId) {
        // Update existing
        await window.electronAPI.request.update(requestId, submissionData)
      } else {
        // Create new
        const result = await window.electronAPI.request.create(submissionData)
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to create request')
        }
        requestId = result.data.id
      }

      // Submit for approval
      const submitResult = await window.electronAPI.request.submit(requestId)

      if (submitResult.success) {
        resetForm()
        return { success: true, data: submitResult.data }
      } else {
        throw new Error(submitResult.error?.message || 'Failed to submit')
      }
    } catch (error) {
      console.error('Submit failed:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  function resetForm() {
    formData.value = getInitialFormState()
    currentStep.value = 1
    validationErrors.value = {}
    lastSaved.value = null
  }

  // Auto-save on changes (debounced)
  let saveTimeout = null
  watch(formData, () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      if (formData.value.identification.packageName) {
        saveDraft()
      }
    }, 5000) // Auto-save every 5 seconds after change
  }, { deep: true })

  return {
    // State
    formData,
    currentStep,
    isLoading,
    isSaving,
    lastSaved,
    validationErrors,

    // Constants
    totalSteps,
    stepLabels,
    CATEGORIES,
    PROCUREMENT_METHODS,
    HPS_SOURCES,
    REQUIRED_DOCUMENTS,
    APPROVAL_STEPS,

    // Computed
    currentStepLabel,
    isFirstStep,
    isLastStep,
    progress,
    totalHpsValue,
    suggestedMethod,
    requiredDocuments,
    documentStatus,
    isFormValid,
    calculatedWorkingDays,

    // Actions
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    updateLineItemTotal,
    addLineItem,
    removeLineItem,
    addKpi,
    removeKpi,
    addPriceReference,
    removePriceReference,
    addExpertStaff,
    removeExpertStaff,
    addRisk,
    removeRisk,
    setDocument,
    removeDocument,
    saveDraft,
    loadDraft,
    submitForm,
    resetForm
  }
})
