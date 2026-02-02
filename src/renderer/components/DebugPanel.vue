<!-- Debug Helper Component for API Issues -->
<template>
  <div v-if="showDebugPanel" class="debug-panel">
    <div class="debug-header">
      <h3>🔧 DEBUG INFO</h3>
      <button @click="showDebugPanel = false" class="close-btn">✕</button>
    </div>
    
    <div class="debug-content">
      <div class="debug-section">
        <h4>API Status</h4>
        <div :class="['status-item', electronAPIStatus]">
          <span>electronAPI: {{ electronAPIStatus }}</span>
        </div>
        <div :class="['status-item', dipaAPIStatus]">
          <span>electronAPI.dipa: {{ dipaAPIStatus }}</span>
        </div>
        <div :class="['status-item', pegawaiAPIStatus]">
          <span>electronAPI.pegawai: {{ pegawaiAPIStatus }}</span>
        </div>
      </div>
      
      <div class="debug-section">
        <h4>Database Status</h4>
        <div class="status-text">
          <p>Pegawai Records: {{ pegawaiCount }}</p>
          <p>DIPA Records: {{ dipaCount }}</p>
          <p>Satker Records: {{ satkerCount }}</p>
        </div>
      </div>
      
      <div class="debug-section">
        <h4>Actions</h4>
        <button @click="testAPI" class="btn-test">Test APIs</button>
        <button @click="reloadApis" class="btn-reload">Reload APIs</button>
        <button @click="showDiagnostics" class="btn-diag">Show Diagnostics</button>
      </div>
      
      <div v-if="debugLog.length > 0" class="debug-section">
        <h4>Log</h4>
        <div class="debug-log">
          <div v-for="(log, idx) in debugLog.slice(-10)" :key="idx" class="log-line">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showDebugPanel = ref(false)
const electronAPIStatus = ref('checking...')
const dipaAPIStatus = ref('checking...')
const pegawaiAPIStatus = ref('checking...')
const pegawaiCount = ref(0)
const dipaCount = ref(0)
const satkerCount = ref(0)
const debugLog = ref([])

function addLog(message) {
  debugLog.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
}

async function checkStatus() {
  addLog('Checking API status...')
  
  // Check electronAPI
  if (typeof window.electronAPI !== 'undefined') {
    electronAPIStatus.value = 'available'
    addLog('✅ electronAPI available')
  } else {
    electronAPIStatus.value = 'undefined'
    addLog('❌ electronAPI undefined - preload script not loaded')
  }
  
  // Check DIPA API
  if (window.electronAPI?.dipa) {
    dipaAPIStatus.value = 'available'
    addLog('✅ DIPA API available')
  } else {
    dipaAPIStatus.value = 'undefined'
    addLog('❌ DIPA API undefined')
  }
  
  // Check Pegawai API
  if (window.electronAPI?.pegawai) {
    pegawaiAPIStatus.value = 'available'
    addLog('✅ Pegawai API available')
  } else {
    pegawaiAPIStatus.value = 'undefined'
    addLog('❌ Pegawai API undefined')
  }
}

async function testAPI() {
  addLog('Testing APIs...')
  
  try {
    if (window.electronAPI?.dipa?.list) {
      const result = await window.electronAPI.dipa.list({ limit: 1 })
      addLog(`DIPA test: ${result.success ? '✅ success' : '❌ failed'}`)
      dipaCount.value = result.total || 0
    }
  } catch (err) {
    addLog(`DIPA test error: ${err.message}`)
  }
  
  try {
    if (window.electronAPI?.pegawai?.list) {
      const result = await window.electronAPI.pegawai.list({ limit: 1 })
      addLog(`Pegawai test: ${result.success ? '✅ success' : '❌ failed'}`)
      pegawaiCount.value = result.total || 0
    }
  } catch (err) {
    addLog(`Pegawai test error: ${err.message}`)
  }
}

async function reloadApis() {
  addLog('Reloading APIs...')
  await checkStatus()
}

function showDiagnostics() {
  addLog('=== DIAGNOSTICS ===')
  addLog(`Node environment: ${process.env.NODE_ENV || 'unknown'}`)
  addLog(`App root: ${process.env.VITE_BASE || '/'}`)
  addLog(`electronAPI type: ${typeof window.electronAPI}`)
  if (window.electronAPI) {
    addLog(`Available APIs: ${Object.keys(window.electronAPI).join(', ')}`)
  }
}

onMounted(async () => {
  await checkStatus()
  
  // Also check browser console for preload execution
  addLog('💡 Tip: Check browser console (F12) for preload script logs')
  addLog('💡 If electronAPI is undefined, restart the app or use production build')
})

// Make debug panel accessible from console
window.__DEBUG_PANEL = {
  show: () => { showDebugPanel.value = true },
  hide: () => { showDebugPanel.value = false },
  test: () => testAPI(),
  log: (msg) => addLog(msg)
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1a1a1a;
  color: #fff;
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  font-size: 12px;
  z-index: 9999;
  max-width: 400px;
  max-height: 600px;
  overflow-y: auto;
  font-family: monospace;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #ff6b6b;
  color: #000;
  font-weight: bold;
  border-bottom: 2px solid #ff6b6b;
}

.debug-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #000;
  font-size: 16px;
  cursor: pointer;
  padding: 0 5px;
}

.debug-content {
  padding: 10px;
}

.debug-section {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  color: #4fc3f7;
}

.status-item {
  padding: 5px;
  margin: 3px 0;
  border-left: 3px solid #ccc;
  padding-left: 8px;
}

.status-item.available {
  border-left-color: #4caf50;
  color: #4caf50;
}

.status-item.undefined {
  border-left-color: #ff6b6b;
  color: #ff6b6b;
}

.status-item.checking {
  border-left-color: #ffc107;
  color: #ffc107;
}

.status-text p {
  margin: 5px 0;
  padding-left: 8px;
}

.btn-test, .btn-reload, .btn-diag {
  background: #2196f3;
  color: white;
  border: none;
  padding: 5px 10px;
  margin: 3px;
  cursor: pointer;
  border-radius: 3px;
  font-size: 11px;
}

.btn-test:hover, .btn-reload:hover, .btn-diag:hover {
  background: #1976d2;
}

.debug-log {
  background: #0a0a0a;
  border: 1px solid #333;
  padding: 8px;
  border-radius: 3px;
  max-height: 200px;
  overflow-y: auto;
}

.log-line {
  margin: 2px 0;
  color: #4fc3f7;
  word-break: break-word;
}
</style>
