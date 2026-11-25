import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const localPython = join(root, '.venv', ...(process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python']))
const python = process.env.AIRE_PYTHON || (existsSync(localPython) ? localPython : ['python3', 'python', 'py'].find(command => spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0))
if (!python) { console.error('Python not found. Create .venv or set AIRE_PYTHON.'); process.exit(1) }
const apiOnly = process.argv.includes('--api-only')
let healthy = false
try { const response = await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(1500) }); healthy = response.ok && (await response.json()).status === 'ok' } catch { /* start API */ }
const children = []
let stopping = false
function stop(code = 0) { if (stopping) return; stopping = true; for (const child of children) child.kill(); process.exitCode = code }
function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' }); children.push(child)
  child.on('error', error => { console.error(error.message); stop(1) })
  child.on('exit', code => stop(code ?? 1))
}
if (!healthy) start(python, ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'])
else console.log('Reusing local API on port 8000.')
if (!apiOnly) start(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js')])
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
