import { commonLabels, rowsToObject } from '../util.js'

/** Native k8s Secret using stringData (values stay readable in the manifest). */
export function secret(spec) {
  const s = spec.secret
  if (!s.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    type: s.type,
    stringData: rowsToObject(s.data)
  }
}
