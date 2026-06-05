import { commonLabels } from '../util.js'
import { tokenize } from './_shared.js'

/** Argo Workflows Workflow / CronWorkflow with a single container template. */
export function argoWorkflow(spec) {
  const w = spec.argoWorkflow
  if (!w.enabled) return null

  const workflowSpec = {
    entrypoint: w.entrypoint,
    templates: [
      {
        name: w.entrypoint,
        container: {
          image: w.image,
          command: tokenize(w.command),
          args: tokenize(w.args)
        }
      }
    ]
  }

  const metadata = {
    name: spec.meta.name,
    namespace: spec.meta.namespace,
    labels: commonLabels(spec.meta)
  }

  if (w.kind === 'CronWorkflow') {
    return {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'CronWorkflow',
      metadata,
      spec: { schedule: w.schedule, workflowSpec }
    }
  }

  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Workflow',
    metadata,
    spec: workflowSpec
  }
}
