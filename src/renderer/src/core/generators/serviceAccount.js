import { commonLabels, rowsToObject } from '../util.js'

export function serviceAccount(spec) {
  const sa = spec.serviceAccount
  if (!sa.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
      name: sa.name || spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta),
      annotations: rowsToObject(sa.annotations)
    },
    automountServiceAccountToken: sa.automountToken,
    imagePullSecrets: (sa.imagePullSecrets || [])
      .map((r) => r.key)
      .filter(Boolean)
      .map((name) => ({ name }))
  }
}
