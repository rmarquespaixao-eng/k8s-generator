import { commonLabels, selectorLabels } from '../util.js'
import { buildPodTemplate } from './_shared.js'

/** Emits the primary workload: Deployment, StatefulSet or DaemonSet (per spec.deployment.kind). */
export function deployment(spec) {
  const d = spec.deployment
  if (!d.enabled) return null

  const metadata = {
    name: spec.meta.name,
    namespace: spec.meta.namespace,
    labels: commonLabels(spec.meta)
  }
  const selector = { matchLabels: selectorLabels(spec.meta) }
  const template = buildPodTemplate(spec)

  if (d.kind === 'DaemonSet') {
    return {
      apiVersion: 'apps/v1',
      kind: 'DaemonSet',
      metadata,
      spec: { selector, template }
    }
  }

  if (d.kind === 'StatefulSet') {
    const obj = {
      apiVersion: 'apps/v1',
      kind: 'StatefulSet',
      metadata,
      spec: {
        serviceName: d.serviceName || spec.meta.name,
        replicas: spec.hpa.enabled ? undefined : Number(d.replicas),
        selector,
        template
      }
    }
    if (spec.pvc.enabled) {
      obj.spec.volumeClaimTemplates = [
        {
          metadata: { name: 'data' },
          spec: {
            accessModes: [spec.pvc.accessMode],
            storageClassName: spec.pvc.storageClassName || undefined,
            resources: { requests: { storage: spec.pvc.size } }
          }
        }
      ]
    }
    return obj
  }

  // Default: Deployment
  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata,
    spec: {
      replicas: spec.hpa.enabled ? undefined : Number(d.replicas),
      selector,
      template
    }
  }
}
