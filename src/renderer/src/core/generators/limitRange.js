import { commonLabels } from '../util.js'

export function limitRange(spec) {
  const l = spec.limitRange
  if (!l.enabled) return null

  return {
    apiVersion: 'v1',
    kind: 'LimitRange',
    metadata: {
      name: `${spec.meta.name}-limits`,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      limits: [
        {
          type: 'Container',
          default: { cpu: l.defaultLimitCpu, memory: l.defaultLimitMemory },
          defaultRequest: { cpu: l.defaultRequestCpu, memory: l.defaultRequestMemory }
        }
      ]
    }
  }
}
