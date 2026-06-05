import { commonLabels, selectorLabels } from '../util.js'

export function networkPolicy(spec) {
  const n = spec.networkPolicy
  if (!n.enabled) return null

  const policyTypes = []
  const obj = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      podSelector: { matchLabels: selectorLabels(spec.meta) }
    }
  }

  if (n.denyAllIngress || n.allowSameNamespace || n.allowFromCIDR || (n.allowPorts || []).length) {
    policyTypes.push('Ingress')
    const from = []
    if (n.allowSameNamespace) from.push({ podSelector: {} })
    if (n.allowFromCIDR) from.push({ ipBlock: { cidr: n.allowFromCIDR } })
    const ports = (n.allowPorts || [])
      .map((r) => r.key)
      .filter(Boolean)
      .map((p) => ({ protocol: 'TCP', port: Number(p) }))

    // A rule with sources/ports allows them; an empty ingress array means deny-all.
    obj.spec.ingress = from.length || ports.length ? [{ from, ports }] : []
  }

  if (n.denyAllEgress) {
    policyTypes.push('Egress')
    obj.spec.egress = []
  }

  obj.spec.policyTypes = policyTypes
  return obj
}
