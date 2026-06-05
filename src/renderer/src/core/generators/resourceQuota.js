import { commonLabels } from '../util.js'

export function resourceQuota(spec) {
  const q = spec.resourceQuota
  if (!q.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    metadata: {
      name: `${spec.meta.name}-quota`,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      hard: {
        'requests.cpu': q.requestsCpu,
        'requests.memory': q.requestsMemory,
        'limits.cpu': q.limitsCpu,
        'limits.memory': q.limitsMemory,
        pods: q.pods
      }
    }
  }
}
