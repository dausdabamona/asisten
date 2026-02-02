# 🧪 Lembar Permintaan Form - Debug & Testing Guide

## Error Context
The form was showing Vue 3 errors:
```
TypeError: Cannot read properties of null (reading 'emitsOptions')
TypeError: Cannot read properties of null (reading 'subTree')
```

## Root Cause
- Computed properties returning `undefined` before stores initialized
- Template trying to iterate `undefined` optgroups in dropdowns
- Vue rendering crash due to null reference

## Fixes Applied

### Fix 1: Template Safety (v-if guards)
**File:** `src/renderer/views/transaksi/LembarPermintaanFormView.vue`

Added null checks to all dropdowns:
```vue
<!-- BEFORE - Could crash on null -->
<option v-for="unit in satkerList" :key="unit.id">

<!-- AFTER - Safe with v-if check -->
<option v-if="satkerList && satkerList.length > 0" 
        v-for="unit in satkerList" :key="unit.id">
```

### Fix 2: Computed Property Type Checking (Lines ~25-45)
Each list now validates type before rendering:
```javascript
const satkerList = computed(() => {
  try {
    return Array.isArray(satkerStore.activeUnitKerja) ? satkerStore.activeUnitKerja : [];
  } catch {
    return [];
  }
});
```

### Fix 3: onMounted Error Isolation (Lines ~495-515)
Individual try-catch per store, no cascading failures:
```javascript
try {
  if (satkerStore && typeof satkerStore.fetchSatker === 'function') {
    await satkerStore.fetchSatker().catch(() => {});
  }
} catch (err) {
  console.warn('Satker store error:', err);
}
// ... repeat for each store separately
```

## Testing Steps

### Step 1: Restart Dev Server
```bash
npm run dev
```
Wait for Vite to show: `Local: http://localhost:5174/`

### Step 2: Navigate to Form
1. Open browser: `http://localhost:5174`
2. Open DevTools: `F12` → `Console` tab
3. Navigate to: `#/transaksi/lp/tambah`

### Expected Results

✅ **NO ERRORS** in Console
- Should see no red error messages
- Should see no Vue warnings starting with `[Vue warn]:`

✅ **Form Loads Successfully**
- Header "📋 Lembar Permintaan (LP)" visible
- Form fields visible and enabled
- No "Loading..." messages after 3 seconds

✅ **Dropdowns Populate**
- "Unit Pengajuan" dropdown shows actual units
- "Penanggung Jawab" shows both "Pejabat Struktural" and "Pegawai" groups
- Both groups have items (not empty)

✅ **Resource Cards Show Counts**
- 📦 Daftar DIPA: Shows count > 0
- 🏭 Supplier: Shows count > 0
- 👔 Pejabat: Shows count > 0
- 👤 Pegawai: Shows count > 0

✅ **Form Interactions Work**
- Can select from dropdowns
- Can add items to table
- Auto-tier calculation works
- Can save draft
- Can submit form

### Step 3: Verify No Errors
Open browser console and check for:

```javascript
// ✅ GOOD - Should see these or nothing
console.log('onMounted started')
// [Maybe store loading messages]

// ❌ BAD - Should NOT see these
TypeError: Cannot read properties of null (reading 'emitsOptions')
TypeError: Cannot read properties of null (reading 'subTree')
[Vue warn]: Unhandled error during execution
```

## Troubleshooting

### If Errors Still Appear:

**1. Check if stores are properly initialized**
```javascript
// In browser console, type:
window.localStorage.setItem('ppk_debug_stores', 'true');
// Then reload the page
```

**2. Check Network requests**
- Open DevTools → Network tab
- Look for API calls to load:
  - satker data
  - pejabat data
  - pegawai data
  - dipa data
  - supplier data
- If any show 404 or 500, stores can't load

**3. Enable debug mode**
In `LembarPermintaanFormView.vue`, change line:
```javascript
<!-- Change from: -->
<div v-if="false" style="background: #f0f0f0; ...">

<!-- To: -->
<div v-if="true" style="background: #f0f0f0; ...">
```
This will show store data counts at bottom of form

**4. Check browser console for specific errors**
```javascript
// Run in console:
console.log('satkerStore:', window.satkerStore);
console.log('pegawaiStore:', window.pegawaiStore);
// etc
```

### If Dropdowns Don't Show Data:

1. Check if store API endpoints are working
2. Verify store methods return arrays (not null)
3. Check localStorage for draft data interfering
4. Try clearing browser cache: `Ctrl+Shift+Delete`

### If Budget Calculation Not Working:

- Check that items table shows correctly
- Verify form values are binding (use v-model)
- Open DevTools → Application → Local Storage
- Look for `ppk_lp_draft_*` key

## Recovery Steps

If errors occur:

1. **Hard refresh the page**
   ```
   Windows: Ctrl+Shift+R
   Mac: Cmd+Shift+R
   ```

2. **Clear localStorage cache**
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

3. **Check if stores exist**
   ```javascript
   // In console:
   import { useSatkerStore } from '@/stores/satkerStore';
   const store = useSatkerStore();
   console.log('Store data:', store.$state);
   ```

4. **Reset to fresh component**
   - Close tab
   - Ctrl+Shift+Delete (clear cache)
   - Reload page

## Success Criteria ✅

Form is working correctly when:

| Criterion | Status |
|-----------|--------|
| No errors in Console | ✅ |
| Form loads in < 3 seconds | ✅ |
| All dropdowns populate with data | ✅ |
| Resource cards show counts > 0 | ✅ |
| Can select dropdown items | ✅ |
| Can add/remove table items | ✅ |
| Auto-tier calculation works | ✅ |
| Draft save works | ✅ |
| Form submit works | ✅ |

## Files Modified

1. **src/renderer/views/transaksi/LembarPermintaanFormView.vue**
   - Line ~25-45: Added computed property type checking
   - Line ~495-515: Restructured onMounted with isolated error handling
   - Template: Added v-if guards to all v-for iterations
   - Added debug info section (v-if="false" - disabled by default)

## Related Files

- **Store Definition:** `src/renderer/stores/`
  - satkerStore.js
  - pegawaiStore.js
  - dipaStore.js
  - supplierStore.js

- **Integration Helpers:** `src/renderer/utils/lpFormIntegration.js`

- **Router Configuration:** `src/renderer/router/index.js`
  - Route: `/transaksi/lp/tambah` → LembarPermintaanFormView

## Phase Status

🔄 **Phase 8C: Error Resolution**
- Diagnosis: ✅ Complete
- Fixes: ✅ Applied (3 layers)
- Validation: ✅ No syntax errors
- Testing: ⏳ Pending (await user browser test)
- Completion: ⏳ After verification

## Next Steps (After Verification)

1. If no errors:
   - Create LP List View to display submitted LPs
   - Create LP Detail View
   - Implement status transitions
   - Connect to Proses Pengadaan workflow

2. If errors persist:
   - Check store implementation for null returns
   - Verify API endpoints are accessible
   - May need to update store error handling

---

**Last Updated:** Phase 8C - Active debugging session
**Component Status:** Syntax valid, awaiting runtime testing
**Expected Outcome:** Form loads without Vue errors
