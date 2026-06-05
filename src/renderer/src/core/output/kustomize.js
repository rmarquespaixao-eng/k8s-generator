import { resourceToYaml, objectToYaml } from '../toYaml.js'

/**
 * Kustomize base layout:
 *   base/<resource>.yaml ...
 *   base/kustomization.yaml  (lists the resources)
 */
export function buildKustomize(spec, manifests) {
  const files = manifests.map((m) => ({
    path: `base/${m.filename}`,
    content: resourceToYaml(m.resource)
  }))

  const kustomization = {
    apiVersion: 'kustomize.config.k8s.io/v1beta1',
    kind: 'Kustomization',
    namespace: spec.meta.namespace,
    resources: manifests.map((m) => m.filename)
  }

  files.push({
    path: 'base/kustomization.yaml',
    content: objectToYaml(kustomization)
  })

  const preview = files
    .map((f) => `# === ${f.path} ===\n${f.content}`)
    .join('\n')

  return { files, preview }
}
