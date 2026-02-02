# Fase 10A Integration Guide

## Quick Start

### 1. Verify Installation

```bash
cd /workspaces/ppk-asisten
npm list docx
# Expected: docx@8.5.0
```

### 2. Import in Main Process

```javascript
// src/main/main.js

// Import dokumen API
const { registerGenerator, initializeDocumentAPI } = require('./api/dokumen');

// After creating all windows and initializing app:
registerGenerator('ST', STGenerator);
registerGenerator('SPPD', SPPDGenerator);
// ... register other generators as created

initializeDocumentAPI();
console.log('Document generation system initialized');
```

### 3. Use in Renderer Process

```vue
<!-- src/renderer/components/GenerateDocumentBtn.vue -->
<template>
  <button @click="generateDocument">Generate ST</button>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  methods: {
    async generateDocument() {
      try {
        const data = {
          nomor_st: 'ST-2024-001',
          tanggal_st: new Date(),
          // ... other data
        };
        
        const result = await ipcRenderer.invoke('dokumen:generate', 'ST', data, {
          fileName: `ST-${data.nomor_st}.docx`
        });
        
        if (result.success) {
          console.log('Generated:', result.filePath);
          // Open file or show success message
        } else {
          console.error('Error:', result.error);
        }
      } catch (error) {
        console.error('IPC Error:', error);
      }
    }
  }
};
</script>
```

## File Structure Review

```
src/main/templates/
├── config/
│   ├── doc-config.js           ✅ Created
│   └── style-config.js         ✅ Created
├── helpers/
│   ├── format-helper.js        ✅ Created
│   ├── doc-helper.js           ✅ Created
│   ├── table-helper.js         ✅ Created
│   └── kop-surat-helper.js     ✅ Created
├── generators/
│   ├── base-generator.js       ✅ Created
│   ├── st-generator.js         ⏳ (Fase 10B)
│   └── ...
└── templates/                  ⏳ (Optional static templates)
```

## API Usage Examples

### Example 1: Generate Simple Document

```javascript
const BaseGenerator = require('./templates/generators/base-generator');
const { createKopSurat, createTempatTanggal } = require('./templates/helpers/kop-surat-helper');
const { createParagraph, createDocument } = require('./templates/helpers/doc-helper');

class SimpleGenerator extends BaseGenerator {
  validate() {
    if (!this.data.title) throw new Error('Title required');
  }
  
  buildContent() {
    const margins = this.getMargins();
    
    return [{
      properties: {
        page: {
          margins: margins
        }
      },
      children: [
        ...createKopSurat({
          ministri: 'KEMENTERIAN KETENAGAKERJAAN',
          institusi: 'Direktorat Jenderal',
          subunit: 'Bagian Administrasi'
        }),
        createTempatTanggal({ tempat: 'Jakarta', tanggal: new Date() }),
        createParagraph({
          text: this.data.title,
          bold: true,
          align: 'center',
          spacing: { after: 300 }
        }),
        createParagraph({
          text: this.data.content
        })
      ]
    }];
  }
}

// Register dan gunakan
registerGenerator('SIMPLE', SimpleGenerator);
```

### Example 2: Generate Table Document

```javascript
const { createSimpleTable } = require('./templates/helpers/table-helper');

class ListGenerator extends BaseGenerator {
  buildContent() {
    const headers = ['No', 'Nama', 'Jabatan', 'Status'];
    const data = this.data.items.map((item, idx) => [
      (idx + 1).toString(),
      item.nama,
      item.jabatan,
      item.status
    ]);
    
    const table = createSimpleTable(headers, data, {
      headerBackground: 'A9D08E'
    });
    
    return [{
      children: [
        ...createKopSurat(this.data.kop),
        table
      ]
    }];
  }
}
```

### Example 3: Format Data for Document

```javascript
const { formatRupiah, formatTanggalPanjang, terbilangRupiah } = require('./templates/helpers/format-helper');

const documentData = {
  nomor_st: 'ST-2024-001',
  tanggal: formatTanggalPanjang(new Date()),
  biaya_total: formatRupiah(5000000),
  biaya_terbilang: terbilangRupiah(5000000),
  // Output:
  // tanggal: "15 Januari 2024"
  // biaya_total: "Rp. 5.000.000,00"
  // biaya_terbilang: "lima juta rupiah"
};
```

## Configuration Usage

### Using DOC_CONFIG

```javascript
const DOC_CONFIG = require('./config/doc-config');

// Get page size
const pageSize = DOC_CONFIG.PAGE.F4;  // {width: 3090, height: 4680}

// Get margins
const margins = DOC_CONFIG.MARGINS.NORMAL;  // {top: 1440, right: 1080, ...}

// Get font sizes
const titleSize = DOC_CONFIG.FONT_SIZES.TITLE;  // 32 (half-points = 16pt)
```

### Using STYLE_CONFIG

```javascript
const STYLE_CONFIG = require('./config/style-config');

// Reference paragraph styles
const normalStyle = STYLE_CONFIG.PARAGRAPH_STYLES.Normal;

// Reference character styles
const strongStyle = STYLE_CONFIG.CHARACTER_STYLES.Strong;
```

## Testing Checklist

- [ ] **Installation**: `npm list docx` returns version 8.5.0
- [ ] **Config Access**: Can import and access DOC_CONFIG, STYLE_CONFIG
- [ ] **Format Helpers**:
  - [ ] `formatRupiah(1000000)` returns "Rp. 1.000.000,00"
  - [ ] `formatTanggalPanjang(new Date())` returns "DD Bulan YYYY"
  - [ ] `terbilang(1000000)` returns "satu juta"
- [ ] **Doc Helpers**:
  - [ ] `createDocument()` returns Document instance
  - [ ] `createParagraph()` accepts options and returns Paragraph
  - [ ] `createPageBreak()` works
- [ ] **Table Helpers**:
  - [ ] `createSimpleTable()` creates table with borders
  - [ ] `createKeyValueTable()` creates 2-column table
  - [ ] `createSignatureTable()` creates signature table
- [ ] **Base Generator**:
  - [ ] Can extend BaseGenerator class
  - [ ] `validate()` method works
  - [ ] `generate()` returns Document
  - [ ] `generateBuffer()` returns Promise<Buffer>
- [ ] **IPC Handlers**: All 6 handlers registered and callable

## Common Patterns

### Pattern 1: Generator with Validation

```javascript
class ValidatedGenerator extends BaseGenerator {
  validate() {
    const required = ['nomor', 'tanggal', 'nama'];
    for (const field of required) {
      if (!this.data[field]) {
        throw new Error(`${field} is required`);
      }
    }
  }
  
  buildContent() {
    // ... build content
  }
}
```

### Pattern 2: Generator with Multiple Sections

```javascript
class MultiSectionGenerator extends BaseGenerator {
  buildContent() {
    return [
      {
        children: [/* Section 1 */]
      },
      {
        pageBreakBefore: true,
        children: [/* Section 2 */]
      }
    ];
  }
}
```

### Pattern 3: Using Conditional Content

```javascript
buildContent() {
  const content = [];
  
  if (this.data.include_tanda_tangan) {
    content.push(...createTandaTanganGanda(this.data.signatories));
  }
  
  return [{ children: content }];
}
```

## Debugging Tips

### 1. Check Document Object
```javascript
const generator = new MyGenerator(data);
const doc = generator.generate();
console.log(doc);  // Inspect structure
```

### 2. Debug IPC Calls
```javascript
ipcRenderer.invoke('dokumen:generate', 'ST', data)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### 3. Check Generated Buffer
```javascript
const buffer = await generator.generateBuffer();
console.log(buffer.length, 'bytes');
// Should be > 0 and contain valid docx header
```

### 4. Verify File
```javascript
// After file saved, check with file command
fs.existsSync(filePath)  // true/false
fs.statSync(filePath).size  // file size in bytes
```

## Troubleshooting

### Issue: "Generator 'ST' not registered"
**Cause**: registerGenerator() not called or generator not created yet
**Solution**: 
```javascript
// In main.js, BEFORE ipcMain.handle calls:
const STGenerator = require('./templates/generators/st-generator');
registerGenerator('ST', STGenerator);
```

### Issue: Date formatting returns undefined
**Cause**: Date object not passed correctly
**Solution**:
```javascript
// Ensure date is Date object or ISO string
formatTanggalPanjang(new Date())  // ✅ Correct
formatTanggalPanjang('2024-01-15')  // ✅ Also works
formatTanggalPanjang('15-01-2024')  // ❌ Wrong format
```

### Issue: Terbilang cuts off at certain numbers
**Cause**: Function only supports up to triliun
**Solution**: Check number range (0 to 999,999,999,999,999)

### Issue: Table borders not showing
**Cause**: Using BORDERS.NONE instead of BORDERS.SINGLE
**Solution**:
```javascript
createSimpleTable(headers, rows, {
  borders: BORDERS.SINGLE  // Explicitly set
})
```

### Issue: IPC handler timeout
**Cause**: Large document generation taking too long or async issue
**Solution**:
```javascript
// Increase timeout or use streaming
ipcRenderer.invoke('dokumen:generate', ..., {timeout: 30000})
```

## Performance Notes

- **Small documents** (<10 pages): <500ms
- **Medium documents** (10-100 pages): 500ms-2s
- **Large documents** (>100 pages): >2s (consider streaming)

## Next Steps (Fase 10B)

1. Create STGenerator extending BaseGenerator
2. Implement validate() for ST-specific rules
3. Implement buildContent() with:
   - Kop surat pemerintah
   - ST content (dasar, pelaksana, rute, biaya)
   - Tanda tangan section
4. Register in main.js
5. Test with real ST data

## Resources

- **DOCX Library**: https://github.com/dolanmiu/docx
- **DayJS**: https://day.js.org/
- **Office OpenXML**: https://en.wikipedia.org/wiki/Office_Open_XML
- **Indonesian Standards**: https://www.kemenpu.go.id/

---

**Last Updated**: 2024
**Status**: Ready for Fase 10B
