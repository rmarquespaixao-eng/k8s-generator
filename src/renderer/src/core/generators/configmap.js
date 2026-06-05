import { commonLabels, rowsToObject } from '../util.js'

export function configMap(spec) {
  const c = spec.configMap
  if (!c.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    data: rowsToObject(c.data)
  }
}
