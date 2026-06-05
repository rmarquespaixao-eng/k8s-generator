import { commonLabels } from '../util.js'
import { targetSecretName } from './_shared.js'

/** External Secrets Operator (external-secrets.io/v1) resource. */
export function externalSecret(spec) {
  const e = spec.externalSecret
  if (!e.enabled) return null

  const data = (e.data || [])
    .filter((row) => row && row.secretKey && row.remoteKey)
    .map((row) => ({
      secretKey: row.secretKey,
      remoteRef: {
        key: row.remoteKey,
        property: row.remoteProperty || undefined
      }
    }))

  return {
    apiVersion: 'external-secrets.io/v1',
    kind: 'ExternalSecret',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      refreshInterval: e.refreshInterval,
      secretStoreRef: {
        name: e.secretStoreName,
        kind: e.secretStoreKind
      },
      target: {
        name: targetSecretName(spec),
        creationPolicy: 'Owner'
      },
      data
    }
  }
}
