import { commonLabels } from '../util.js'

export function pvc(spec) {
  const p = spec.pvc
  if (!p.enabled) return null
  // A StatefulSet manages its own PVCs via volumeClaimTemplates.
  if (spec.deployment.enabled && spec.deployment.kind === 'StatefulSet') return null

  return {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: `${spec.meta.name}-data`,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      accessModes: [p.accessMode],
      storageClassName: p.storageClassName || undefined,
      resources: {
        requests: { storage: p.size }
      }
    }
  }
}
