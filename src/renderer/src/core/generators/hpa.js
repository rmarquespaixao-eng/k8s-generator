import { commonLabels } from '../util.js'

export function hpa(spec) {
  const h = spec.hpa
  if (!h.enabled) return null

  const metrics = []
  if (Number(h.targetCPU) > 0) {
    metrics.push({
      type: 'Resource',
      resource: {
        name: 'cpu',
        target: { type: 'Utilization', averageUtilization: Number(h.targetCPU) }
      }
    })
  }
  if (Number(h.targetMemory) > 0) {
    metrics.push({
      type: 'Resource',
      resource: {
        name: 'memory',
        target: { type: 'Utilization', averageUtilization: Number(h.targetMemory) }
      }
    })
  }

  return {
    apiVersion: 'autoscaling/v2',
    kind: 'HorizontalPodAutoscaler',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      scaleTargetRef: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        name: spec.meta.name
      },
      minReplicas: Number(h.minReplicas),
      maxReplicas: Number(h.maxReplicas),
      metrics
    }
  }
}
