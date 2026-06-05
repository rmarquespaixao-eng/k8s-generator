import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'path'
import { mkdir, writeFile, readFile } from 'fs/promises'
import { spawn } from 'child_process'

const isDev = !!process.env['ELECTRON_RENDERER_URL']

function presetsPath() {
  return join(app.getPath('userData'), 'presets.json')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'k8s-generator',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Save a set of generated files to a user-chosen directory.
 * files: Array<{ path: string, content: string }>  (path may contain subdirs)
 */
ipcMain.handle('save-files', async (_evt, files) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Escolha a pasta de destino',
    properties: ['openDirectory', 'createDirectory']
  })
  if (canceled || !filePaths.length) return { ok: false, canceled: true }

  const baseDir = filePaths[0]
  const written = []
  for (const f of files) {
    const target = join(baseDir, f.path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, f.content, 'utf8')
    written.push(target)
  }
  return { ok: true, baseDir, written }
})

/** Open a single YAML file and return its contents. */
ipcMain.handle('open-yaml', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Importar manifesto YAML',
    properties: ['openFile'],
    filters: [
      { name: 'YAML', extensions: ['yaml', 'yml'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })
  if (canceled || !filePaths.length) return { ok: false, canceled: true }
  const content = await readFile(filePaths[0], 'utf8')
  return { ok: true, path: filePaths[0], content }
})

/** Load the persisted presets map ({ name: spec }). */
ipcMain.handle('presets-load', async () => {
  try {
    return JSON.parse(await readFile(presetsPath(), 'utf8'))
  } catch {
    return {}
  }
})

/** Persist the full presets map. */
ipcMain.handle('presets-save', async (_evt, presets) => {
  await mkdir(dirname(presetsPath()), { recursive: true })
  await writeFile(presetsPath(), JSON.stringify(presets, null, 2), 'utf8')
  return { ok: true }
})

/** Validate YAML with `kubectl apply --dry-run=client` (offline schema check). */
ipcMain.handle('kubectl-validate', async (_evt, yamlText) => {
  return new Promise((resolve) => {
    let proc
    try {
      proc = spawn('kubectl', ['apply', '--dry-run=client', '-f', '-'])
    } catch (err) {
      resolve({ ok: false, available: false, error: err.message })
      return
    }
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => (stdout += d))
    proc.stderr.on('data', (d) => (stderr += d))
    proc.on('error', (err) => {
      const missing = err.code === 'ENOENT'
      resolve({
        ok: false,
        available: !missing,
        error: missing ? 'kubectl não encontrado no PATH.' : err.message
      })
    })
    proc.on('close', (code) => {
      resolve({ ok: code === 0, available: true, code, stdout: stdout.trim(), stderr: stderr.trim() })
    })
    proc.stdin.write(yamlText)
    proc.stdin.end()
  })
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
