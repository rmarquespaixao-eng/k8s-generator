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

/**
 * Parse a multi-doc YAML string into a spec. Resources not present are disabled.
 * Throws on invalid YAML. Unknown kinds are ignored.
 */
export function parseManifests(text) {
  const docs = yaml.loadAll(text).filter((d) => d && d.kind)
  if (!docs.length) throw new Error('Nenhum recurso Kubernetes encontrado no YAML.')

  const spec = defaultSpec()
  // Import reflects exactly what's in the YAML: start with everything off.
  for (const k of ['deployment', 'service', 'ingress', 'configMap', 'externalSecret', 'hpa', 'cronjob', 'pvc']) {
    spec[k].enabled = false
  }

  let metaSet = false
  let pvcMountPath = null

  const setMeta = (md, force = false) => {
    if (!md) return
    if (force || !metaSet) {
      spec.meta.name = md.name || spec.meta.name
      spec.meta.namespace = md.namespace || spec.meta.namespace
      spec.meta.extraLabels = extraLabelsFrom(md)
      metaSet = true
    }
  }

  for (const doc of docs) {
    const md = doc.metadata || {}
    switch (doc.kind) {
      case 'Deployment': {
        setMeta(md, true) // Deployment wins for app name
        const d = spec.deployment
        d.enabled = true
        d.replicas = doc.spec?.replicas ?? 1
        const c = firstContainer(doc.spec?.template?.spec)
        d.image = c.image || d.image
        d.imagePullPolicy = c.imagePullPolicy || d.imagePullPolicy
        d.containerPort = c.ports?.[0]?.containerPort ?? d.containerPort
        d.command = joinCommand(c.command)
        d.args = joinCommand(c.args)
        d.env = (c.env || [])
          .filter((e) => e.value !== undefined)
          .map((e) => ({ key: e.name, value: String(e.value) }))
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
          d.probes.initialDelaySeconds =
            c.livenessProbe.initialDelaySeconds ?? d.probes.initialDelaySeconds
          d.probes.periodSeconds = c.livenessProbe.periodSeconds ?? d.probes.periodSeconds
        }
        // envFrom wiring (controls the mountAsEnv switches once those resources load)
        const envFrom = c.envFrom || []
        spec.configMap.mountAsEnv = envFrom.some((e) => e.configMapRef)
        spec.externalSecret.mountAsEnv = envFrom.some((e) => e.secretRef)
        const mount = (c.volumeMounts || []).find((m) => m.name === 'data')
        if (mount) pvcMountPath = mount.mountPath
        break
      }
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
      case 'ConfigMap': {
        setMeta(md)
        spec.configMap.enabled = true
        spec.configMap.data = objectToRows(doc.data)
        break
      }
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
        cj.successfulJobsHistoryLimit =
          doc.spec?.successfulJobsHistoryLimit ?? cj.successfulJobsHistoryLimit
        cj.failedJobsHistoryLimit = doc.spec?.failedJobsHistoryLimit ?? cj.failedJobsHistoryLimit
        const podSpec = doc.spec?.jobTemplate?.spec?.template?.spec
        cj.restartPolicy = podSpec?.restartPolicy || cj.restartPolicy
        const c = firstContainer(podSpec)
        cj.image = c.image || cj.image
        cj.command = joinCommand(c.command)
        cj.args = joinCommand(c.args)
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
        // unknown kind: ignore
        break
    }
  }

  if (spec.pvc.enabled && pvcMountPath) spec.pvc.mountPath = pvcMountPath

  return spec
}
