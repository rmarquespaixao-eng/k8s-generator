import { commonLabels, selectorLabels } from '../util.js'
import { buildPodTemplate } from './_shared.js'

/** Argo Rollouts Rollout — same pod template as the workload, with a release strategy. */
export function rollout(spec) {
  const r = spec.rollout
  if (!r.enabled) return null

  let strategy
  if (r.strategy === 'blueGreen') {
    strategy = {
      blueGreen: {
        activeService: r.activeService || spec.meta.name,
        previewService: r.previewService || undefined,
        autoPromotionEnabled: r.autoPromotion
      }
    }
  } else {
    const steps = []
    for (const s of r.canarySteps || []) {
      if (s.weight === '' || s.weight === undefined) continue
      steps.push({ setWeight: Number(s.weight) })
      steps.push(s.pauseSeconds ? { pause: { duration: `${s.pauseSeconds}s` } } : { pause: {} })
    }
    strategy = { canary: { steps } }
  }

  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Rollout',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      replicas: spec.hpa.enabled ? undefined : Number(spec.deployment.replicas),
      selector: { matchLabels: selectorLabels(spec.meta) },
      template: buildPodTemplate(spec),
      strategy
    }
  }
}
