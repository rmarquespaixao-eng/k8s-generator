import { rowsToObject } from '../util.js'

export function namespace(spec) {
  if (!spec.meta.emitNamespace) return null

  return {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: spec.meta.namespace,
      labels: {
        'app.kubernetes.io/managed-by': 'k8s-generator',
        ...rowsToObject(spec.meta.extraLabels)
      }
    }
  }
}
