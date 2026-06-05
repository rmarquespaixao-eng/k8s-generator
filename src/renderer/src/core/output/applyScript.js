// Generates an apply.sh that applies every generated file in dependency order.
// YAML  -> kubectl apply -f <file> (na ordem dos manifests)
// Kustomize -> kubectl apply -k base/
// Helm  -> helm upgrade --install <name> ./<name>

function header() {
  return [
    '#!/usr/bin/env bash',
    '# Gerado por k8s-generator — aplica os recursos na ordem de dependência.',
    'set -euo pipefail',
    ''
  ]
}

/**
 * @param {object} spec
 * @param {'yaml'|'kustomize'|'helm'} format
 * @param {string[]} manifestPaths  caminhos dos manifestos (só usado no formato yaml)
 */
export function applyScript(spec, format, manifestPaths = []) {
  const name = spec.meta.name
  const ns = spec.meta.namespace
  const lines = header()

  if (format === 'helm') {
    lines.push('# Instala ou atualiza o chart Helm')
    lines.push(`helm upgrade --install ${name} "$(dirname "$0")/${name}" \\`)
    lines.push(`  --namespace ${ns} --create-namespace`)
  } else if (format === 'kustomize') {
    lines.push('# Aplica o overlay base via Kustomize')
    lines.push('kubectl apply -k "$(dirname "$0")/base"')
  } else {
    lines.push('cd "$(dirname "$0")"')
    lines.push('')
    for (const p of manifestPaths) {
      lines.push(`kubectl apply -f "${p}"`)
    }
  }

  lines.push('')
  lines.push('echo "✓ aplicado"')
  lines.push('')
  return lines.join('\n')
}
