import { commonLabels, selectorLabels } from '../util.js'
import { tokenize, buildEnv, buildEnvFrom } from './_shared.js'

export function deployment(spec) {
  const d = spec.deployment
  if (!d.enabled) return null

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
    volumeMounts: spec.pvc.enabled
      ? [{ name: 'data', mountPath: spec.pvc.mountPath }]
      : []
  }

  if (d.probes.enabled) {
    const probe = {
      httpGet: { path: d.probes.path, port: Number(d.probes.port) },
      initialDelaySeconds: Number(d.probes.initialDelaySeconds),
      periodSeconds: Number(d.probes.periodSeconds)
    }
    container.livenessProbe = probe
    container.readinessProbe = probe
  }

  return {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      // HPA owns replicas when enabled; omit to avoid fighting the autoscaler.
      replicas: spec.hpa.enabled ? undefined : Number(d.replicas),
      selector: { matchLabels: selectorLabels(spec.meta) },
      template: {
        metadata: { labels: commonLabels(spec.meta) },
        spec: {
          containers: [container],
          volumes: spec.pvc.enabled
            ? [{ name: 'data', persistentVolumeClaim: { claimName: `${spec.meta.name}-data` } }]
            : []
        }
      }
    }
  }
}
