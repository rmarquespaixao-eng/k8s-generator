import { deployment } from './generators/deployment.js'
import { service } from './generators/service.js'
import { ingress } from './generators/ingress.js'
import { configMap } from './generators/configmap.js'
import { externalSecret } from './generators/externalSecret.js'
import { hpa } from './generators/hpa.js'
import { cronjob } from './generators/cronjob.js'
import { pvc } from './generators/pvc.js'

// Ordered so dependencies (config/secret/storage) come before the workload.
const GENERATORS = [
  { key: 'configmap', fn: configMap },
  { key: 'externalsecret', fn: externalSecret },
  { key: 'pvc', fn: pvc },
  { key: 'deployment', fn: deployment },
  { key: 'service', fn: service },
  { key: 'ingress', fn: ingress },
  { key: 'hpa', fn: hpa },
  { key: 'cronjob', fn: cronjob }
]

/**
 * Build the list of enabled resources for a spec.
 * Returns: Array<{ key, kind, name, filename, resource }>
 */
export function buildManifests(spec) {
  const out = []
  for (const { key, fn } of GENERATORS) {
    const resource = fn(spec)
    if (!resource) continue
    out.push({
      key,
      kind: resource.kind,
      name: resource.metadata.name,
      filename: `${key}.yaml`,
      resource
    })
  }
  return out
}
