import { commonLabels } from '../util.js'
import { serviceAccountName } from './_shared.js'

function csv(value, fallback) {
  const parts = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length ? parts : fallback
}

function roleName(spec) {
  return `${spec.meta.name}-role`
}

export function role(spec) {
  const r = spec.rbac
  if (!r.enabled) return null

  const obj = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: r.scope, // Role | ClusterRole
    metadata: {
      name: roleName(spec),
      labels: commonLabels(spec.meta)
    },
    rules: (r.rules || []).map((rule) => ({
      apiGroups: csv(rule.apiGroups, ['']),
      resources: csv(rule.resources, []),
      verbs: csv(rule.verbs, [])
    }))
  }
  // Namespaced Role carries a namespace; ClusterRole is cluster-scoped.
  if (r.scope === 'Role') obj.metadata.namespace = spec.meta.namespace
  return obj
}

export function roleBinding(spec) {
  const r = spec.rbac
  if (!r.enabled || !r.bindToServiceAccount) return null

  const isCluster = r.scope === 'ClusterRole'
  const obj = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: isCluster ? 'ClusterRoleBinding' : 'RoleBinding',
    metadata: {
      name: `${spec.meta.name}-binding`,
      labels: commonLabels(spec.meta)
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: r.scope,
      name: roleName(spec)
    },
    subjects: [
      {
        kind: 'ServiceAccount',
        name: serviceAccountName(spec) || spec.meta.name,
        namespace: spec.meta.namespace
      }
    ]
  }
  if (!isCluster) obj.metadata.namespace = spec.meta.namespace
  return obj
}
