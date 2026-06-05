import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  /** Save generated files to a directory the user picks. */
  saveFiles: (files) => ipcRenderer.invoke('save-files', files),
  /** Open a YAML file -> { ok, content, path } | { ok:false, canceled }. */
  openYaml: () => ipcRenderer.invoke('open-yaml'),
  /** Load persisted presets map. */
  loadPresets: () => ipcRenderer.invoke('presets-load'),
  /** Persist the full presets map. */
  savePresets: (presets) => ipcRenderer.invoke('presets-save', presets),
  /** Validate YAML via kubectl --dry-run=client. */
  validate: (yamlText) => ipcRenderer.invoke('kubectl-validate', yamlText)
})
