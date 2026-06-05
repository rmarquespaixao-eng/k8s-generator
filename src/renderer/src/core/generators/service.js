import { commonLabels, selectorLabels } from '../util.js'

export function service(spec) {
  const s = spec.service
  if (!s.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      type: s.type,
      // Headless service for StatefulSet stable network identity.
      clusterIP:
        s.type === 'ClusterIP' && spec.deployment.enabled && spec.deployment.kind === 'StatefulSet'
          ? 'None'
          : undefined,
      selector: selectorLabels(spec.meta),
      ports: [
        {
          port: Number(s.port),
          targetPort: Number(s.targetPort),
          protocol: 'TCP'
        }
      ]
    }
  }
}
