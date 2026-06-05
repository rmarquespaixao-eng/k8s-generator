import { commonLabels } from '../util.js'

function buildSource(a) {
  const source = { repoURL: a.repoURL, targetRevision: a.targetRevision }
  if (a.sourceType === 'helm') {
    if (a.chart) source.chart = a.chart
    else source.path = a.path
    const parameters = (a.helmParameters || [])
      .filter((r) => r.key)
      .map((r) => ({ name: r.key, value: String(r.value ?? '') }))
    source.helm = { parameters }
  } else {
    source.path = a.path
  }
  return source
}

/** Argo CD Application — GitOps wrapper pointing at a repo/path or Helm chart. */
export function argoApplication(spec) {
  const a = spec.argoApp
  if (!a.enabled) return null

  const syncPolicy = {}
  if (a.syncAutomated) {
    syncPolicy.automated = { prune: a.prune, selfHeal: a.selfHeal }
  }
  if (a.createNamespace) {
    syncPolicy.syncOptions = ['CreateNamespace=true']
  }

  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      name: spec.meta.name,
      namespace: 'argocd',
      labels: commonLabels(spec.meta)
    },
    spec: {
      project: a.project,
      source: buildSource(a),
      destination: {
        server: a.destServer,
        namespace: a.destNamespace || spec.meta.namespace
      },
      syncPolicy: Object.keys(syncPolicy).length ? syncPolicy : undefined
    }
  }
}

/** Argo CD ApplicationSet — templates N Applications from a generator. */
export function argoApplicationSet(spec) {
  const a = spec.argoAppSet
  if (!a.enabled) return null

  let generators
  if (a.generatorType === 'list') {
    generators = [
      {
        list: {
          elements: (a.elements || [])
            .filter((e) => e.name)
            .map((e) => ({ name: e.name, namespace: e.namespace || e.name }))
        }
      }
    ]
  } else if (a.generatorType === 'git') {
    generators = [
      { git: { repoURL: a.repoURL, revision: a.targetRevision, directories: [{ path: a.gitDirectories }] } }
    ]
  } else {
    generators = [{ clusters: {} }]
  }

  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      name: spec.meta.name,
      namespace: 'argocd',
      labels: commonLabels(spec.meta)
    },
    spec: {
      goTemplate: false,
      generators,
      template: {
        metadata: { name: `${spec.meta.name}-{{name}}` },
        spec: {
          project: a.project,
          source: { repoURL: a.repoURL, targetRevision: a.targetRevision, path: a.path },
          destination: { server: a.destServer, namespace: '{{namespace}}' }
        }
      }
    }
  }
}
