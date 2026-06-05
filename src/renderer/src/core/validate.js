// Pure, framework-free validation of a spec. Returns [{ level, field, msg }].
// level: 'error' (invalid manifest) | 'warning' (likely mistake / best practice).

const DNS1123 = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/

/** Parse a CPU quantity to cores (number). "100m" -> 0.1, "1" -> 1. */
function cpuToCores(v) {
  const s = String(v || '').trim()
  if (!s) return NaN
  if (s.endsWith('m')) return parseFloat(s) / 1000
  return parseFloat(s)
}

const MEM_UNITS = { Ki: 2 ** 10, Mi: 2 ** 20, Gi: 2 ** 30, Ti: 2 ** 40, K: 1e3, M: 1e6, G: 1e9, T: 1e12 }

/** Parse a memory quantity to bytes (number). "128Mi" -> 134217728. */
function memToBytes(v) {
  const s = String(v || '').trim()
  const m = s.match(/^([0-9.]+)\s*([A-Za-z]+)?$/)
  if (!m) return NaN
  const n = parseFloat(m[1])
  const unit = m[2]
  return unit ? n * (MEM_UNITS[unit] || 1) : n
}

export function validateSpec(spec) {
  const out = []
  const add = (level, field, msg) => out.push({ level, field, msg })

  // --- names ---
  if (!DNS1123.test(spec.meta.name)) {
    add('error', 'meta.name', `Nome "${spec.meta.name}" inválido (DNS-1123: minúsculas, números e "-", começando/terminando com alfanumérico).`)
  }
  if (spec.meta.name.length > 63) add('error', 'meta.name', 'Nome excede 63 caracteres.')
  if (!DNS1123.test(spec.meta.namespace)) {
    add('error', 'meta.namespace', `Namespace "${spec.meta.namespace}" inválido (DNS-1123).`)
  }

  // --- resources: limit must be >= request ---
  const d = spec.deployment
  if (d.enabled) {
    const reqCpu = cpuToCores(d.resources.requests.cpu)
    const limCpu = cpuToCores(d.resources.limits.cpu)
    if (!isNaN(reqCpu) && !isNaN(limCpu) && limCpu < reqCpu) {
      add('warning', 'deployment.resources', `CPU limit (${d.resources.limits.cpu}) < request (${d.resources.requests.cpu}).`)
    }
    const reqMem = memToBytes(d.resources.requests.memory)
    const limMem = memToBytes(d.resources.limits.memory)
    if (!isNaN(reqMem) && !isNaN(limMem) && limMem < reqMem) {
      add('warning', 'deployment.resources', `Memória limit (${d.resources.limits.memory}) < request (${d.resources.requests.memory}).`)
    }
  }

  // --- service / workload port alignment ---
  if (spec.service.enabled && d.enabled && Number(spec.service.targetPort) !== Number(d.containerPort)) {
    add('warning', 'service.targetPort', `Service targetPort (${spec.service.targetPort}) ≠ porta do container (${d.containerPort}).`)
  }

  // --- ingress ---
  if (spec.ingress.enabled) {
    if (!spec.service.enabled) add('error', 'ingress', 'Ingress habilitado sem Service — não há backend.')
    if (!spec.ingress.tls.enabled) add('warning', 'ingress.tls', 'Ingress sem TLS — tráfego HTTP em texto claro.')
    if (!spec.ingress.host) add('warning', 'ingress.host', 'Ingress sem host definido.')
  }

  // --- HPA ---
  if (spec.hpa.enabled) {
    if (!d.enabled) add('warning', 'hpa', 'HPA habilitado sem workload para escalar.')
    if (Number(spec.hpa.minReplicas) > Number(spec.hpa.maxReplicas)) {
      add('error', 'hpa', 'minReplicas > maxReplicas.')
    }
    if (Number(spec.hpa.targetCPU) <= 0 && Number(spec.hpa.targetMemory) <= 0) {
      add('warning', 'hpa', 'HPA sem métrica de CPU nem de memória.')
    }
  }

  // --- StatefulSet needs a (headless) service ---
  if (d.enabled && d.kind === 'StatefulSet' && !spec.service.enabled) {
    add('warning', 'service', 'StatefulSet normalmente requer um Service headless para identidade de rede estável.')
  }

  // --- RBAC binding target ---
  if (spec.rbac.enabled && spec.rbac.bindToServiceAccount && !spec.serviceAccount.enabled) {
    add('warning', 'rbac', 'RoleBinding aponta para um ServiceAccount não gerado — habilite a seção ServiceAccount ou ele usará o default.')
  }

  // --- PVC mount path ---
  if (spec.pvc.enabled && !spec.pvc.mountPath) {
    add('warning', 'pvc.mountPath', 'PVC sem mountPath — o volume não será montado no container.')
  }

  // --- Argo Rollouts ---
  if (spec.rollout.enabled) {
    if (d.enabled) add('warning', 'rollout', 'Deployment e Rollout habilitados juntos — o Rollout substitui o Deployment; mantenha só um.')
    if (spec.rollout.strategy === 'canary' && !(spec.rollout.canarySteps || []).some((s) => s.weight !== '')) {
      add('warning', 'rollout', 'Rollout canary sem steps de peso definidos.')
    }
  }

  // --- Argo CD Application ---
  if (spec.argoApp.enabled) {
    if (!spec.argoApp.repoURL) add('error', 'argoApp.repoURL', 'Application sem repoURL.')
    if (spec.argoApp.sourceType === 'helm' && !spec.argoApp.chart && !spec.argoApp.path) {
      add('warning', 'argoApp', 'Source Helm sem chart nem path definido.')
    }
  }
  if (spec.argoAppSet.enabled && spec.argoAppSet.generatorType === 'list' && !(spec.argoAppSet.elements || []).some((e) => e.name)) {
    add('warning', 'argoAppSet', 'ApplicationSet com generator list vazio.')
  }

  // --- nothing enabled ---
  const anyWorkload =
    d.enabled || spec.cronjob.enabled || spec.job.enabled || spec.rollout.enabled || spec.argoWorkflow.enabled
  if (!anyWorkload && !spec.argoApp.enabled && !spec.argoAppSet.enabled) {
    add('warning', 'workload', 'Nenhum workload habilitado (Deployment/StatefulSet/DaemonSet, CronJob, Job, Rollout, Workflow ou Application).')
  }

  return out
}
