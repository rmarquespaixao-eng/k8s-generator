import yaml from 'js-yaml'
import { defaultSpec } from './defaultSpec.js'
import { objectToRows } from './util.js'
import { joinCommand } from './generators/_shared.js'

const MANAGED_LABELS = new Set([
  'app.kubernetes.io/name',
  'app.kubernetes.io/instance',
  'app.kubernetes.io/managed-by',
  'helm.sh/chart'
])

function extraLabelsFrom(metadata) {
  const labels = metadata?.labels || {}
  return Object.entries(labels)
    .filter(([k]) => !MANAGED_LABELS.has(k))
    .map(([key, value]) => ({ key, value: String(value) }))
}

function firstContainer(podSpec) {
  return podSpec?.containers?.[0] || {}
}

const OPTIONAL_KEYS = [
  'deployment', 'job', 'service', 'ingress', 'configMap', 'secret', 'externalSecret',
  'serviceAccount', 'rbac', 'networkPolicy', 'pdb', 'resourceQuota', 'limitRange',
  'hpa', 'cronjob', 'pvc'
]

function parsePodLevel(spec, podSpec) {
  const d = spec.deployment
  d.serviceAccountName = podSpec.serviceAccountName || ''
  d.nodeSelector = objectToRows(podSpec.nodeSelector)
  d.tolerations = (podSpec.tolerations || []).map((t) => ({
    key: t.key || '',
    operator: t.operator || 'Equal',
    value: t.value || '',
    effect: t.effect || ''
  }))
  d.initContainers = (podSpec.initContainers || []).map((c) => ({
    name: c.name || '',
    image: c.image || '',
    command: joinCommand(c.command)
  }))
  d.imagePullSecrets = (podSpec.imagePullSecrets || []).map((s) => ({ key: s.name }))
  d.spreadAcrossNodes = !!podSpec.affinity?.podAntiAffinity
  const psc = podSpec.securityContext
  const c = firstContainer(podSpec)
  if (psc || c.securityContext) {
    d.securityContext.enabled = true
    if (psc) {
      d.securityContext.runAsNonRoot = psc.runAsNonRoot ?? d.securityContext.runAsNonRoot
      d.securityContext.runAsUser = psc.runAsUser ?? d.securityContext.runAsUser
      d.securityContext.fsGroup = psc.fsGroup ?? d.securityContext.fsGroup
    }
    if (c.securityContext) {
      d.securityContext.readOnlyRootFilesystem =
        c.securityContext.readOnlyRootFilesystem ?? d.securityContext.readOnlyRootFilesystem
      d.securityContext.allowPrivilegeEscalation =
        c.securityContext.allowPrivilegeEscalation ?? d.securityContext.allowPrivilegeEscalation
      d.securityContext.dropAllCapabilities = (c.securityContext.capabilities?.drop || []).includes('ALL')
    }
  }
  // extra volumes (skip the reserved 'data' PVC volume)
  d.extraVolumes = (podSpec.volumes || [])
    .filter((v) => v.name !== 'data')
    .map((v) => {
      const mount = (c.volumeMounts || []).find((m) => m.name === v.name)
      let type = 'emptyDir'
      let source = ''
      if (v.hostPath) {
        type = 'hostPath'
        source = v.hostPath.path
      } else if (v.configMap) {
        type = 'configMap'
        source = v.configMap.name
      } else if (v.secret) {
        type = 'secret'
        source = v.secret.secretName
      }
      return { name: v.name, type, source, mountPath: mount?.mountPath || '' }
    })
}

function parseWorkload(spec, doc, kind) {
  const d = spec.deployment
  d.enabled = true
  d.kind = kind
  d.replicas = doc.spec?.replicas ?? 1
  if (kind === 'StatefulSet') d.serviceName = doc.spec?.serviceName || ''
  const podSpec = doc.spec?.template?.spec || {}
  const c = firstContainer(podSpec)
  d.image = c.image || d.image
  d.imagePullPolicy = c.imagePullPolicy || d.imagePullPolicy
  d.containerPort = c.ports?.[0]?.containerPort ?? d.containerPort
  d.command = joinCommand(c.command)
  d.args = joinCommand(c.args)
  d.env = (c.env || []).filter((e) => e.value !== undefined).map((e) => ({ key: e.name, value: String(e.value) }))
  if (c.resources?.requests) {
    d.resources.requests.cpu = c.resources.requests.cpu ?? ''
    d.resources.requests.memory = c.resources.requests.memory ?? ''
  }
  if (c.resources?.limits) {
    d.resources.limits.cpu = c.resources.limits.cpu ?? ''
    d.resources.limits.memory = c.resources.limits.memory ?? ''
  }
  const lp = c.livenessProbe?.httpGet
  if (lp) {
    d.probes.enabled = true
    d.probes.path = lp.path ?? d.probes.path
    d.probes.port = lp.port ?? d.probes.port
    d.probes.initialDelaySeconds = c.livenessProbe.initialDelaySeconds ?? d.probes.initialDelaySeconds
    d.probes.periodSeconds = c.livenessProbe.periodSeconds ?? d.probes.periodSeconds
    d.probes.startup = !!c.startupProbe
  }
  const envFrom = c.envFrom || []
  spec.configMap.mountAsEnv = envFrom.some((e) => e.configMapRef)
  // a secretRef to <name> is the native Secret; to <name>-secret is the ExternalSecret target
  spec.secret.mountAsEnv = envFrom.some((e) => e.secretRef?.name === spec.meta.name)
  spec.externalSecret.mountAsEnv = envFrom.some(
    (e) => e.secretRef && e.secretRef.name !== spec.meta.name
  )
  spec.meta.podAnnotations = objectToRows(doc.spec?.template?.metadata?.annotations)
  parsePodLevel(spec, podSpec)

  // Standalone-PVC mount path (Deployment/DaemonSet) lives on the container.
  if (kind !== 'StatefulSet') {
    const dataMount = (c.volumeMounts || []).find((m) => m.name === 'data')
    if (dataMount) spec.pvc.mountPath = dataMount.mountPath
  }

  // StatefulSet volumeClaimTemplates -> pvc
  const vct = doc.spec?.volumeClaimTemplates?.[0]
  if (vct) {
    spec.pvc.enabled = true
    spec.pvc.accessMode = vct.spec?.accessModes?.[0] || spec.pvc.accessMode
    spec.pvc.storageClassName = vct.spec?.storageClassName || ''
    spec.pvc.size = vct.spec?.resources?.requests?.storage || spec.pvc.size
    const mount = (c.volumeMounts || []).find((m) => m.name === 'data')
    if (mount) spec.pvc.mountPath = mount.mountPath
  }
}

/**
 * Parse a multi-doc YAML string into a spec. Resources not present are disabled.
 * Throws on invalid YAML. Unknown kinds are ignored.
 */
export function parseManifests(text) {
  const docs = yaml.loadAll(text).filter((d) => d && d.kind)
  if (!docs.length) throw new Error('Nenhum recurso Kubernetes encontrado no YAML.')

  const spec = defaultSpec()
  for (const k of OPTIONAL_KEYS) spec[k].enabled = false

  let metaSet = false
  let pvcMountPath = null

  const setMeta = (md, force = false) => {
    if (!md) return
    if (force || !metaSet) {
      spec.meta.name = md.name || spec.meta.name
      if (md.namespace) spec.meta.namespace = md.namespace
      spec.meta.extraLabels = extraLabelsFrom(md)
      metaSet = true
    }
  }

  for (const doc of docs) {
    const md = doc.metadata || {}
    switch (doc.kind) {
      case 'Deployment':
        setMeta(md, true)
        parseWorkload(spec, doc, 'Deployment')
        break
      case 'StatefulSet':
        setMeta(md, true)
        parseWorkload(spec, doc, 'StatefulSet')
        break
      case 'DaemonSet':
        setMeta(md, true)
        parseWorkload(spec, doc, 'DaemonSet')
        break
      case 'Service': {
        setMeta(md)
        const s = spec.service
        s.enabled = true
        s.type = doc.spec?.type || s.type
        const p = doc.spec?.ports?.[0] || {}
        s.port = p.port ?? s.port
        s.targetPort = p.targetPort ?? s.targetPort
        break
      }
      case 'Ingress': {
        setMeta(md)
        const i = spec.ingress
        i.enabled = true
        i.className = doc.spec?.ingressClassName || i.className
        i.annotations = objectToRows(md.annotations)
        const rule = doc.spec?.rules?.[0] || {}
        i.host = rule.host || i.host
        const path = rule.http?.paths?.[0] || {}
        i.path = path.path || i.path
        i.pathType = path.pathType || i.pathType
        const tls = doc.spec?.tls?.[0]
        if (tls) {
          i.tls.enabled = true
          i.tls.secretName = tls.secretName || ''
        }
        break
      }
      case 'ConfigMap':
        setMeta(md)
        spec.configMap.enabled = true
        spec.configMap.data = objectToRows(doc.data)
        break
      case 'Secret':
        setMeta(md)
        spec.secret.enabled = true
        spec.secret.type = doc.type || 'Opaque'
        spec.secret.data = objectToRows(doc.stringData || doc.data)
        break
      case 'ExternalSecret': {
        setMeta(md)
        const e = spec.externalSecret
        e.enabled = true
        e.secretStoreName = doc.spec?.secretStoreRef?.name || e.secretStoreName
        e.secretStoreKind = doc.spec?.secretStoreRef?.kind || e.secretStoreKind
        e.refreshInterval = doc.spec?.refreshInterval || e.refreshInterval
        e.targetName = doc.spec?.target?.name || ''
        e.data = (doc.spec?.data || []).map((row) => ({
          secretKey: row.secretKey || '',
          remoteKey: row.remoteRef?.key || '',
          remoteProperty: row.remoteRef?.property || ''
        }))
        break
      }
      case 'ServiceAccount': {
        setMeta(md)
        const sa = spec.serviceAccount
        sa.enabled = true
        sa.name = md.name || ''
        sa.automountToken = doc.automountServiceAccountToken ?? true
        sa.annotations = objectToRows(md.annotations)
        sa.imagePullSecrets = (doc.imagePullSecrets || []).map((s) => ({ key: s.name }))
        break
      }
      case 'Role':
      case 'ClusterRole': {
        setMeta(md)
        const r = spec.rbac
        r.enabled = true
        r.scope = doc.kind
        r.rules = (doc.rules || []).map((rule) => ({
          apiGroups: (rule.apiGroups || []).join(','),
          resources: (rule.resources || []).join(','),
          verbs: (rule.verbs || []).join(',')
        }))
        break
      }
      case 'RoleBinding':
      case 'ClusterRoleBinding':
        spec.rbac.enabled = true
        spec.rbac.bindToServiceAccount = true
        break
      case 'NetworkPolicy': {
        setMeta(md)
        const n = spec.networkPolicy
        n.enabled = true
        const types = doc.spec?.policyTypes || []
        const ing = doc.spec?.ingress
        n.denyAllIngress = types.includes('Ingress')
        n.denyAllEgress = types.includes('Egress') && (doc.spec?.egress || []).length === 0
        const rule = ing?.[0]
        if (rule) {
          n.allowSameNamespace = (rule.from || []).some((f) => f.podSelector && !f.namespaceSelector)
          const cidr = (rule.from || []).find((f) => f.ipBlock)?.ipBlock?.cidr
          n.allowFromCIDR = cidr || ''
          n.allowPorts = (rule.ports || []).map((p) => ({ key: String(p.port) }))
        }
        break
      }
      case 'PodDisruptionBudget': {
        setMeta(md)
        const p = spec.pdb
        p.enabled = true
        if (doc.spec?.minAvailable !== undefined) {
          p.mode = 'minAvailable'
          p.value = String(doc.spec.minAvailable)
        } else if (doc.spec?.maxUnavailable !== undefined) {
          p.mode = 'maxUnavailable'
          p.value = String(doc.spec.maxUnavailable)
        }
        break
      }
      case 'ResourceQuota': {
        setMeta(md)
        const q = spec.resourceQuota
        q.enabled = true
        const hard = doc.spec?.hard || {}
        q.requestsCpu = hard['requests.cpu'] ?? q.requestsCpu
        q.requestsMemory = hard['requests.memory'] ?? q.requestsMemory
        q.limitsCpu = hard['limits.cpu'] ?? q.limitsCpu
        q.limitsMemory = hard['limits.memory'] ?? q.limitsMemory
        q.pods = String(hard.pods ?? q.pods)
        break
      }
      case 'LimitRange': {
        setMeta(md)
        const l = spec.limitRange
        l.enabled = true
        const item = (doc.spec?.limits || []).find((x) => x.type === 'Container') || {}
        l.defaultLimitCpu = item.default?.cpu ?? l.defaultLimitCpu
        l.defaultLimitMemory = item.default?.memory ?? l.defaultLimitMemory
        l.defaultRequestCpu = item.defaultRequest?.cpu ?? l.defaultRequestCpu
        l.defaultRequestMemory = item.defaultRequest?.memory ?? l.defaultRequestMemory
        break
      }
      case 'Namespace':
        spec.meta.emitNamespace = true
        spec.meta.namespace = md.name || spec.meta.namespace
        break
      case 'HorizontalPodAutoscaler': {
        setMeta(md)
        const h = spec.hpa
        h.enabled = true
        h.minReplicas = doc.spec?.minReplicas ?? h.minReplicas
        h.maxReplicas = doc.spec?.maxReplicas ?? h.maxReplicas
        h.targetCPU = 0
        h.targetMemory = 0
        for (const m of doc.spec?.metrics || []) {
          const util = m.resource?.target?.averageUtilization
          if (m.resource?.name === 'cpu') h.targetCPU = util ?? 0
          if (m.resource?.name === 'memory') h.targetMemory = util ?? 0
        }
        break
      }
      case 'CronJob': {
        setMeta(md)
        const cj = spec.cronjob
        cj.enabled = true
        cj.schedule = doc.spec?.schedule || cj.schedule
        cj.concurrencyPolicy = doc.spec?.concurrencyPolicy || cj.concurrencyPolicy
        cj.successfulJobsHistoryLimit = doc.spec?.successfulJobsHistoryLimit ?? cj.successfulJobsHistoryLimit
        cj.failedJobsHistoryLimit = doc.spec?.failedJobsHistoryLimit ?? cj.failedJobsHistoryLimit
        const podSpec = doc.spec?.jobTemplate?.spec?.template?.spec
        cj.restartPolicy = podSpec?.restartPolicy || cj.restartPolicy
        const c = firstContainer(podSpec)
        cj.image = c.image || cj.image
        cj.command = joinCommand(c.command)
        cj.args = joinCommand(c.args)
        break
      }
      case 'Job': {
        setMeta(md)
        const j = spec.job
        j.enabled = true
        j.completions = doc.spec?.completions ?? j.completions
        j.parallelism = doc.spec?.parallelism ?? j.parallelism
        j.backoffLimit = doc.spec?.backoffLimit ?? j.backoffLimit
        const podSpec = doc.spec?.template?.spec
        j.restartPolicy = podSpec?.restartPolicy || j.restartPolicy
        const c = firstContainer(podSpec)
        j.image = c.image || j.image
        j.command = joinCommand(c.command)
        j.args = joinCommand(c.args)
        break
      }
      case 'PersistentVolumeClaim': {
        setMeta(md)
        const p = spec.pvc
        p.enabled = true
        p.accessMode = doc.spec?.accessModes?.[0] || p.accessMode
        p.storageClassName = doc.spec?.storageClassName || ''
        p.size = doc.spec?.resources?.requests?.storage || p.size
        break
      }
      default:
        break
    }
  }

  if (spec.pvc.enabled && pvcMountPath) spec.pvc.mountPath = pvcMountPath

  return spec
}
