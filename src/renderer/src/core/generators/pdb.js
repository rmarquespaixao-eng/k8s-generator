import { commonLabels, selectorLabels } from '../util.js'

/** Allow either a number ("1") or a percentage ("50%"). */
function parseValue(v) {
  const str = String(v).trim()
  return /%$/.test(str) ? str : Number(str)
}

export function pdb(spec) {
  const p = spec.pdb
  if (!p.enabled) return null

  const obj = {
    apiVersion: 'policy/v1',
    kind: 'PodDisruptionBudget',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      selector: { matchLabels: selectorLabels(spec.meta) }
    }
  }
  obj.spec[p.mode] = parseValue(p.value)
  return obj
}
