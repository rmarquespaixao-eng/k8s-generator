import { test } from 'node:test'
import assert from 'node:assert/strict'
import yaml from 'js-yaml'

import { defaultSpec } from '../src/renderer/src/core/defaultSpec.js'
import { buildManifests } from '../src/renderer/src/core/manifests.js'
import { buildOutput } from '../src/renderer/src/core/output/index.js'
import { tokenize, joinCommand } from '../src/renderer/src/core/generators/_shared.js'
import { parseManifests } from '../src/renderer/src/core/parse.js'

function fullSpec() {
  const s = defaultSpec()
  s.meta.name = 'demo'
  s.ingress.enabled = true
  s.configMap.enabled = true
  s.configMap.data = [{ key: 'A', value: '1' }]
  s.externalSecret.enabled = true
  s.externalSecret.data = [{ secretKey: 'DB', remoteKey: 'homelab/env', remoteProperty: 'DB' }]
  s.hpa.enabled = true
  s.pvc.enabled = true
  return s
}

test('tokenize respects quotes', () => {
  assert.deepEqual(tokenize('sh -c "echo hi"'), ['sh', '-c', 'echo hi'])
  assert.deepEqual(tokenize(''), [])
})

test('default spec yields a valid Deployment + Service', () => {
  const m = buildManifests(defaultSpec())
  const kinds = m.map((x) => x.kind)
  assert.ok(kinds.includes('Deployment'))
  assert.ok(kinds.includes('Service'))
})

test('HPA enabled drops replicas from Deployment', () => {
  const s = defaultSpec()
  s.hpa.enabled = true
  const dep = buildManifests(s).find((x) => x.kind === 'Deployment')
  const yml = yaml.load(buildOutput(s).preview.split('---')[0] || '')
  assert.equal(dep.resource.spec.replicas, undefined)
  assert.ok(yml) // sanity: preview parses
})

test('envFrom wires ConfigMap and ExternalSecret into Deployment', () => {
  const dep = buildManifests(fullSpec()).find((x) => x.kind === 'Deployment')
  const envFrom = dep.resource.spec.template.spec.containers[0].envFrom
  assert.ok(envFrom.some((e) => e.configMapRef))
  assert.ok(envFrom.some((e) => e.secretRef?.name === 'demo-secret'))
})

test('yaml output is parseable multi-doc', () => {
  const out = buildOutput(fullSpec())
  const docs = yaml.loadAll(out.preview)
  assert.ok(docs.length >= 6)
  for (const d of docs) assert.ok(d.apiVersion && d.kind)
})

test('kustomize output lists every resource', () => {
  const s = fullSpec()
  s.output.format = 'kustomize'
  const out = buildOutput(s)
  const kfile = out.files.find((f) => f.path.endsWith('kustomization.yaml'))
  const k = yaml.load(kfile.content)
  assert.equal(k.resources.length, out.files.length - 1)
})

test('helm chart has Chart.yaml, values.yaml and templates', () => {
  const s = fullSpec()
  s.output.format = 'helm'
  const out = buildOutput(s)
  const paths = out.files.map((f) => f.path)
  assert.ok(paths.some((p) => p.endsWith('Chart.yaml')))
  assert.ok(paths.some((p) => p.endsWith('values.yaml')))
  assert.ok(paths.some((p) => p.includes('templates/deployment.yaml')))
  // values.yaml must parse
  const v = yaml.load(out.files.find((f) => f.path.endsWith('values.yaml')).content)
  assert.equal(v.fullnameOverride, 'demo')
  assert.equal(v.autoscaling.enabled, true)
})

test('joinCommand quotes tokens with spaces', () => {
  assert.equal(joinCommand(['sh', '-c', 'echo hi']), 'sh -c "echo hi"')
  assert.equal(joinCommand([]), '')
})

test('round-trip: generate YAML -> parse back preserves the spec', () => {
  const s = fullSpec()
  s.deployment.command = 'sh -c "run me"'
  s.deployment.env = [{ key: 'LOG', value: 'debug' }]
  s.pvc.mountPath = '/var/lib/data'
  const yamlText = buildOutput(s).preview
  const back = parseManifests(yamlText)

  assert.equal(back.meta.name, 'demo')
  assert.equal(back.deployment.enabled, true)
  assert.equal(back.deployment.command, 'sh -c "run me"')
  assert.equal(back.deployment.env[0].key, 'LOG')
  assert.equal(back.service.enabled, true)
  assert.equal(back.ingress.enabled, true)
  assert.equal(back.configMap.enabled, true)
  assert.equal(back.configMap.data[0].key, 'A')
  assert.equal(back.externalSecret.enabled, true)
  assert.equal(back.externalSecret.data[0].remoteKey, 'homelab/env')
  assert.equal(back.hpa.enabled, true)
  assert.equal(back.pvc.enabled, true)
  assert.equal(back.pvc.mountPath, '/var/lib/data')
  // envFrom switches inferred from the Deployment
  assert.equal(back.configMap.mountAsEnv, true)
  assert.equal(back.externalSecret.mountAsEnv, true)
})

test('parseManifests rejects empty / non-k8s input', () => {
  assert.throws(() => parseManifests('just: a map\n'))
})
