import { commonLabels } from '../util.js'
import { tokenize, buildEnvFrom } from './_shared.js'

export function cronjob(spec) {
  const c = spec.cronjob
  if (!c.enabled) return null

  return {
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta)
    },
    spec: {
      schedule: c.schedule,
      concurrencyPolicy: c.concurrencyPolicy,
      successfulJobsHistoryLimit: Number(c.successfulJobsHistoryLimit),
      failedJobsHistoryLimit: Number(c.failedJobsHistoryLimit),
      jobTemplate: {
        spec: {
          template: {
            metadata: { labels: commonLabels(spec.meta) },
            spec: {
              restartPolicy: c.restartPolicy,
              containers: [
                {
                  name: spec.meta.name,
                  image: c.image,
                  command: tokenize(c.command),
                  args: tokenize(c.args),
                  envFrom: buildEnvFrom(spec)
                }
              ]
            }
          }
        }
      }
    }
  }
}
