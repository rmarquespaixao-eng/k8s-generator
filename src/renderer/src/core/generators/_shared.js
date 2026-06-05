import { rowsToObject, commonLabels } from '../util.js'

/** Quote-aware split of a command string into an argv array. */
export function tokenize(str) {
  if (!str) return []
  const tokens = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m
  while ((m = re.exec(str)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3])
  }
  return tokens
}

/** Inverse of tokenize: join an argv array into a string, quoting tokens with spaces. */
export function joinCommand(arr) {
  if (!Array.isArray(arr)) return ''
  return arr.map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')
}

/** Build the env list (explicit name/value pairs) for a container. */
export function buildEnv(rows) {
  return (rows || [])
    .filter((r) => r && r.key)
    .map((r) => ({ name: r.key, value: String(r.value ?? '') }))
}

/** envFrom entries: ConfigMap, native Secret and ExternalSecret target wired as env. */
export function buildEnvFrom(spec) {
  const envFrom = []
  if (spec.configMap.enabled && spec.configMap.mountAsEnv) {
    envFrom.push({ configMapRef: { name: spec.meta.name } })
  }
  if (spec.secret.enabled && spec.secret.mountAsEnv) {
    envFrom.push({ secretRef: { name: spec.meta.name } })
  }
  if (spec.externalSecret.enabled && spec.externalSecret.mountAsEnv) {
    envFrom.push({ secretRef: { name: targetSecretName(spec) } })
  }
  return envFrom
}

export function targetSecretName(spec) {
  return spec.externalSecret.targetName || `${spec.meta.name}-secret`
}

export function serviceAccountName(spec) {
  if (!spec.serviceAccount.enabled) return spec.deployment.serviceAccountName || undefined
  return spec.serviceAccount.name || spec.meta.name
}

function containerSecurityContext(spec) {
  const sc = spec.deployment.securityContext
  if (!sc.enabled) return undefined
  return {
    allowPrivilegeEscalation: sc.allowPrivilegeEscalation,
    readOnlyRootFilesystem: sc.readOnlyRootFilesystem,
    capabilities: sc.dropAllCapabilities ? { drop: ['ALL'] } : undefined
  }
}

function podSecurityContext(spec) {
  const sc = spec.deployment.securityContext
  if (!sc.enabled) return undefined
  return {
    runAsNonRoot: sc.runAsNonRoot,
    runAsUser: Number(sc.runAsUser),
    fsGroup: Number(sc.fsGroup)
  }
}

/** Combine PVC mount + extra volumes into { volumes, mounts }. */
function buildVolumes(spec) {
  const volumes = []
  const mounts = []

  // PVC: a standalone PVC for Deployment/DaemonSet (StatefulSet uses volumeClaimTemplates).
  if (spec.pvc.enabled && spec.deployment.kind !== 'StatefulSet') {
    volumes.push({ name: 'data', persistentVolumeClaim: { claimName: `${spec.meta.name}-data` } })
    mounts.push({ name: 'data', mountPath: spec.pvc.mountPath })
  } else if (spec.pvc.enabled && spec.deployment.kind === 'StatefulSet') {
    // mount only; the volume comes from volumeClaimTemplates
    mounts.push({ name: 'data', mountPath: spec.pvc.mountPath })
  }

  for (const v of spec.deployment.extraVolumes || []) {
    if (!v.name) continue
    let vol
    switch (v.type) {
      case 'hostPath':
        vol = { name: v.name, hostPath: { path: v.source } }
        break
      case 'configMap':
        vol = { name: v.name, configMap: { name: v.source } }
        break
      case 'secret':
        vol = { name: v.name, secret: { secretName: v.source } }
        break
      case 'emptyDir':
      default:
        vol = { name: v.name, emptyDir: {} }
        break
    }
    volumes.push(vol)
    if (v.mountPath) mounts.push({ name: v.name, mountPath: v.mountPath })
  }

  return { volumes, mounts }
}

function buildAffinity(spec) {
  if (!spec.deployment.spreadAcrossNodes) return undefined
  return {
    podAntiAffinity: {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          weight: 100,
          podAffinityTerm: {
            labelSelector: { matchLabels: { 'app.kubernetes.io/name': spec.meta.name } },
            topologyKey: 'kubernetes.io/hostname'
          }
        }
      ]
    }
  }
}

function buildInitContainers(spec) {
  return (spec.deployment.initContainers || [])
    .filter((c) => c.name && c.image)
    .map((c) => ({ name: c.name, image: c.image, command: tokenize(c.command) }))
}

function buildImagePullSecrets(spec) {
  const fromWorkload = (spec.deployment.imagePullSecrets || []).map((r) => r.key).filter(Boolean)
  return fromWorkload.map((name) => ({ name }))
}

/** The main app container, shared by Deployment / StatefulSet / DaemonSet. */
export function buildContainer(spec) {
  const d = spec.deployment
  const { mounts } = buildVolumes(spec)

  const container = {
    name: spec.meta.name,
    image: d.image,
    imagePullPolicy: d.imagePullPolicy,
    command: tokenize(d.command),
    args: tokenize(d.args),
    ports: d.containerPort ? [{ containerPort: Number(d.containerPort) }] : [],
    env: buildEnv(d.env),
    envFrom: buildEnvFrom(spec),
    resources: {
      requests: { cpu: d.resources.requests.cpu, memory: d.resources.requests.memory },
      limits: { cpu: d.resources.limits.cpu, memory: d.resources.limits.memory }
    },
    securityContext: containerSecurityContext(spec),
    volumeMounts: mounts
  }

  if (d.probes.enabled) {
    const probe = {
      httpGet: { path: d.probes.path, port: Number(d.probes.port) },
      initialDelaySeconds: Number(d.probes.initialDelaySeconds),
      periodSeconds: Number(d.probes.periodSeconds)
    }
    container.livenessProbe = probe
    container.readinessProbe = probe
    if (d.probes.startup) {
      container.startupProbe = {
        httpGet: { path: d.probes.path, port: Number(d.probes.port) },
        periodSeconds: Number(d.probes.periodSeconds),
        failureThreshold: 30
      }
    }
  }

  return container
}

/** The full pod template (metadata + spec) shared by the workload kinds. */
export function buildPodTemplate(spec) {
  const { volumes } = buildVolumes(spec)
  return {
    metadata: {
      labels: commonLabels(spec.meta),
      annotations: rowsToObject(spec.meta.podAnnotations)
    },
    spec: {
      serviceAccountName: serviceAccountName(spec),
      securityContext: podSecurityContext(spec),
      imagePullSecrets: buildImagePullSecrets(spec),
      initContainers: buildInitContainers(spec),
      containers: [buildContainer(spec)],
      volumes,
      nodeSelector: rowsToObject(spec.deployment.nodeSelector),
      affinity: buildAffinity(spec),
      tolerations: (spec.deployment.tolerations || [])
        .filter((t) => t.key || t.operator === 'Exists')
        .map((t) => ({
          key: t.key || undefined,
          operator: t.operator || 'Equal',
          value: t.value || undefined,
          effect: t.effect || undefined
        }))
    }
  }
}

export { rowsToObject }
