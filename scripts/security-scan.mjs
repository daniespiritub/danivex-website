import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const patterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bAKIA[0-9A-Z]{16}\b/, /\bsk-(?:proj-|svcacct-)[A-Za-z0-9_-]{40,}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/]
const findings = []
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => /\.(?:js|jsx|mjs|json|html|yml|md|txt)$/.test(f))
for (const file of files) {
  const value = await readFile(file, 'utf8')
  if (patterns.some((pattern) => pattern.test(value))) findings.push({ file, reason: 'credential_pattern' })
}
async function scanBundle(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, item.name)
    if (item.isDirectory()) await scanBundle(file)
    else if (/\.(js|html|map)$/.test(file)) {
      const value = await readFile(file, 'utf8')
      if (item.name.endsWith('.map')) findings.push({ file, reason: 'public_source_map' })
      if (patterns.some((p) => p.test(value)) || /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|KV_REST_API_TOKEN/.test(value)) findings.push({ file, reason: 'server_secret_in_client' })
      if (/quge5\.com|nap5k\.com|5gvci\.com|3nbf4\.com/.test(value)) findings.push({ file, reason: 'advertising_domain' })
    }
  }
}
await scanBundle('dist')
console.log(JSON.stringify({ trackedTextFiles: files.length, findings }, null, 2))
if (findings.length) process.exitCode = 1
