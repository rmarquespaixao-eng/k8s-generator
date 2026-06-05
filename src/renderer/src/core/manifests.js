import { namespace } from './generators/namespace.js'
import { serviceAccount } from './generators/serviceAccount.js'
import { role, roleBinding } from './generators/rbac.js'
import { configMap } from './generators/configmap.js'
import { secret } from './generators/secret.js'
import { externalSecret } from './generators/externalSecret.js'
import { pvc } from './generators/pvc.js'
import { resourceQuota } from './generators/resourceQuota.js'
import { limitRange } from './generators/limitRange.js'
import { deployment } from './generators/deployment.js'
import { service } from './generators/service.js'
import { ingress } from './generators/ingress.js'
import { networkPolicy } from './generators/networkPolicy.js'
import { pdb } from './generators/pdb.js'
import { hpa } from './generators/hpa.js'
import { cronjob } from './generators/cronjob.js'
import { job } from './generators/job.js'
import { rollout } from './generators/rollout.js'
import { argoWorkflow } from './generators/workflow.js'
import { argoApplication, argoApplicationSet } from './generators/argo.js'

// Ordered so cluster/identity/config come before the workload, then exposure & policy.
const GENERATORS = [
  { key: 'namespace', fn: namespace },
  { key: 'serviceaccount', fn: serviceAccount },
  { key: 'role', fn: role },
  { key: 'rolebinding', fn: roleBinding },
  { key: 'configmap', fn: configMap },
  { key: 'secret', fn: secret },
  { key: 'externalsecret', fn: externalSecret },
  { key: 'pvc', fn: pvc },
  { key: 'resourcequota', fn: resourceQuota },
  { key: 'limitrange', fn: limitRange },
  { key: 'workload', fn: deployment },
  { key: 'rollout', fn: rollout },
  { key: 'service', fn: service },
  { key: 'ingress', fn: ingress },
  { key: 'networkpolicy', fn: networkPolicy },
  { key: 'pdb', fn: pdb },
  { key: 'hpa', fn: hpa },
  { key: 'cronjob', fn: cronjob },
  { key: 'job', fn: job },
  { key: 'workflow', fn: argoWorkflow },
  { key: 'application', fn: argoApplication },
  { key: 'applicationset', fn: argoApplicationSet }
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
