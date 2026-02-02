const { contextBridge } = require('electron');

console.log('🚀 TEST: Preload script executing!');
console.log('contextBridge available:', typeof contextBridge);

contextBridge.exposeInMainWorld('electronAPI', {
  test: () => 'Preload works!'
});

console.log('✅ TEST: electronAPI exposed');
