import { rowsToObject } from '../util.js'

/** Quote-aware split of a command string into an argv array. */
export function tokenize(str) {
  if (!str) return []
  const tokens = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m
  while ((m = re.exec(str)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3])
  }
  return tokens
}

/** Inverse of tokenize: join an argv array into a string, quoting tokens with spaces. */
export function joinCommand(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')
}

/** Build the env list (explicit name/value pairs) for a container. */
export function buildEnv(rows) {
  return (rows || [])
    .filter((r) => r && r.key)
    .map((r) => ({ name: r.key, value: String(r.value ?? '') }))
}

/** envFrom entries when ConfigMap / ExternalSecret are wired as env sources. */
export function buildEnvFrom(spec) {
  const envFrom = []
  if (spec.configMap.enabled && spec.configMap.mountAsEnv) {
    envFrom.push({ configMapRef: { name: spec.meta.name } })
  }
  if (spec.externalSecret.enabled && spec.externalSecret.mountAsEnv) {
    envFrom.push({ secretRef: { name: targetSecretName(spec) } })
  }
  return envFrom
}

export function targetSecretName(spec) {
  return spec.externalSecret.targetName || `${spec.meta.name}-secret`
}

export { rowsToObject }
