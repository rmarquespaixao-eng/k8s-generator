/**
 * Remove undefined / null / '' / empty-object / empty-array values recursively
 * so generated manifests stay clean (no `env: null`, no `resources: {}`).
 */
export function prune(value) {
  if (Array.isArray(value)) {
    const arr = value.map(prune).filter((v) => !isEmpty(v))
    return arr
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const pv = prune(v)
      if (!isEmpty(pv)) out[k] = pv
    }
    return out
  }
  return value
}

function isEmpty(v) {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v).length === 0
  return false
}

/** Convert a list of {key,value} rows into a plain object, skipping blank keys. */
export function rowsToObject(rows) {
  const out = {}
  for (const row of rows || []) {
    if (row && row.key) out[row.key] = String(row.value ?? '')
  }
  return out
}

/** Inverse of rowsToObject: turn a plain object into {key,value} rows. */
export function objectToRows(obj, keyField = 'key', valueField = 'value') {
  return Object.entries(obj || {}).map(([k, v]) => ({
    [keyField]: k,
    [valueField]: String(v ?? '')
  }))
}

/** Standard recommended labels for a workload. */
export function commonLabels(meta) {
  return {
    'app.kubernetes.io/name': meta.name,
    'app.kubernetes.io/instance': meta.name,
    'app.kubernetes.io/managed-by': 'k8s-generator',
    ...rowsToObject(meta.extraLabels)
  }
}

/** Selector labels (the stable subset used by Service/Deployment selectors). */
export function selectorLabels(meta) {
  return { 'app.kubernetes.io/name': meta.name }
}
