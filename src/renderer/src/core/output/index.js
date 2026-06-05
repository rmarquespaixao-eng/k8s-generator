import { buildManifests } from '../manifests.js'
import { resourceToYaml } from '../toYaml.js'
import { buildKustomize } from './kustomize.js'
import { buildHelm } from './helm.js'
import { applyScript } from './applyScript.js'

/** Raw YAML: a single multi-doc preview + either split files or one combined file. */
function buildYaml(spec, manifests) {
  const docs = manifests.map((m) => resourceToYaml(m.resource))
  const preview = docs.join('---\n')

  const files = spec.output.splitFiles
    ? manifests.map((m) => ({ path: m.filename, content: resourceToYaml(m.resource) }))
    : [{ path: 'manifests.yaml', content: preview }]

  if (manifests.length) {
    files.push({ path: 'apply.sh', content: applyScript(spec, 'yaml', files.map((f) => f.path)) })
  }

  return { files, preview }
}

/**
 * Build output for the spec's selected format.
 * Returns: { format, preview, files, resourceCount }
 */
export function buildOutput(spec) {
  const manifests = buildManifests(spec)
  let result

  switch (spec.output.format) {
    case 'kustomize':
      result = buildKustomize(spec, manifests)
      break
    case 'helm':
      result = buildHelm(spec)
      break
    case 'yaml':
    default:
      result = buildYaml(spec, manifests)
      break
  }

  return {
    format: spec.output.format,
    preview: result.preview || '# (nenhum recurso habilitado)\n',
    files: result.files,
    resourceCount: manifests.length
  }
}
