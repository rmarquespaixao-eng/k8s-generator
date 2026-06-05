import { commonLabels } from '../util.js'
import { tokenize, buildEnvFrom } from './_shared.js'

export function job(spec) {
  const j = spec.job
  if (!j.enabled) return null

  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: `${spec.meta.name}-job`,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      completions: Number(j.completions),
      parallelism: Number(j.parallelism),
      backoffLimit: Number(j.backoffLimit),
      template: {
        metadata: { labels: commonLabels(spec.meta) },
        spec: {
          restartPolicy: j.restartPolicy,
          containers: [
            {
              name: `${spec.meta.name}-job`,
              image: j.image,
              command: tokenize(j.command),
              args: tokenize(j.args),
              envFrom: buildEnvFrom(spec)
            }
          ]
        }
      }
    }
  }
}
