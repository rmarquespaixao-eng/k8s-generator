// Official documentation links per sidebar section (verified on the web, jun/2026).
// Keyed by the section id used in App.vue. Each value is a list of { label, url }.
export const DOCS = {
  meta: [
    { label: 'Namespace', url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/' }
  ],
  workload: [
    { label: 'Deployment', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { label: 'StatefulSet', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/' },
    { label: 'DaemonSet', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/' }
  ],
  cron: [
    { label: 'CronJob', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' }
  ],
  job: [{ label: 'Job', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' }],
  service: [
    { label: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }
  ],
  ingress: [
    { label: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }
  ],
  netpol: [
    { label: 'NetworkPolicy', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }
  ],
  config: [
    { label: 'ConfigMap', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' },
    { label: 'ExternalSecret', url: 'https://external-secrets.io/latest/api/externalsecret/' }
  ],
  secret: [
    { label: 'Secret', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' }
  ],
  sa: [
    { label: 'ServiceAccount', url: 'https://kubernetes.io/docs/concepts/security/service-accounts/' }
  ],
  rbac: [{ label: 'RBAC', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' }],
  scaling: [
    { label: 'HPA', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/' }
  ],
  pdb: [
    { label: 'PodDisruptionBudget', url: 'https://kubernetes.io/docs/concepts/workloads/pods/disruptions/' }
  ],
  storage: [
    { label: 'PersistentVolume', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' }
  ],
  quota: [
    { label: 'ResourceQuota', url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/' },
    { label: 'LimitRange', url: 'https://kubernetes.io/docs/concepts/policy/limit-range/' }
  ],
  argoapp: [
    { label: 'Application Spec', url: 'https://argo-cd.readthedocs.io/en/latest/user-guide/application-specification/' }
  ],
  argoappset: [
    { label: 'ApplicationSet Spec', url: 'https://argo-cd.readthedocs.io/en/latest/operator-manual/applicationset/applicationset-specification/' }
  ],
  rollout: [
    { label: 'Rollout Spec', url: 'https://argo-rollouts.readthedocs.io/en/stable/features/specification/' },
    { label: 'Canary', url: 'https://argo-rollouts.readthedocs.io/en/stable/features/canary/' }
  ],
  workflow: [
    { label: 'Argo Workflows', url: 'https://argo-workflows.readthedocs.io/en/latest/' }
  ]
}
