import { test } from 'node:test'
import assert from 'node:assert/strict'
import yaml from 'js-yaml'

import { defaultSpec } from '../src/renderer/src/core/defaultSpec.js'
import { buildManifests } from '../src/renderer/src/core/manifests.js'
import { buildOutput } from '../src/renderer/src/core/output/index.js'
import { tokenize, joinCommand } from '../src/renderer/src/core/generators/_shared.js'
import { parseManifests } from '../src/renderer/src/core/parse.js'
import { validateSpec } from '../src/renderer/src/core/validate.js'
import { highlightYaml } from '../src/renderer/src/core/highlight.js'

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

test('helm chart has Chart.yaml, values.yaml and workload template', () => {
  const s = fullSpec()
  s.hpa.enabled = false // keep replicas on the workload so it gets parameterized
  s.output.format = 'helm'
  const out = buildOutput(s)
  const paths = out.files.map((f) => f.path)
  assert.ok(paths.some((p) => p.endsWith('Chart.yaml')))
  assert.ok(paths.some((p) => p.endsWith('values.yaml')))
  assert.ok(paths.some((p) => p.includes('templates/workload.yaml')))
  // values.yaml must parse and carry the parameterized knobs
  const v = yaml.load(out.files.find((f) => f.path.endsWith('values.yaml')).content)
  assert.equal(v.fullnameOverride, 'demo')
  assert.equal(v.namespace, 'default')
  assert.ok(v.image.repository)
  // workload template references the values, not literal image/replicas
  const wl = out.files.find((f) => f.path.includes('templates/workload.yaml')).content
  assert.match(wl, /\.Values\.image\.repository/)
  assert.match(wl, /\.Values\.replicaCount/)
  assert.match(wl, /include "app\.labels"/)
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

function everythingSpec() {
  const s = defaultSpec()
  s.meta.name = 'full'
  s.meta.emitNamespace = true
  s.job.enabled = true
  s.service.enabled = true
  s.ingress.enabled = true
  s.configMap.enabled = true
  s.secret.enabled = true
  s.secret.data = [{ key: 'PW', value: 's3cr3t' }]
  s.externalSecret.enabled = true
  s.externalSecret.data = [{ secretKey: 'X', remoteKey: 'r', remoteProperty: '' }]
  s.serviceAccount.enabled = true
  s.rbac.enabled = true
  s.networkPolicy.enabled = true
  s.networkPolicy.allowPorts = [{ key: '8080' }]
  s.pdb.enabled = true
  s.resourceQuota.enabled = true
  s.limitRange.enabled = true
  s.hpa.enabled = true
  s.cronjob.enabled = true
  s.pvc.enabled = true
  return s
}

test('every resource enabled produces parseable, well-formed docs', () => {
  const out = buildOutput(everythingSpec())
  const docs = yaml.loadAll(out.preview)
  const kinds = docs.map((d) => d.kind)
  for (const k of [
    'Namespace', 'ServiceAccount', 'Role', 'RoleBinding', 'ConfigMap', 'Secret',
    'ExternalSecret', 'PersistentVolumeClaim', 'ResourceQuota', 'LimitRange',
    'Deployment', 'Service', 'Ingress', 'NetworkPolicy', 'PodDisruptionBudget',
    'HorizontalPodAutoscaler', 'CronJob', 'Job'
  ]) {
    assert.ok(kinds.includes(k), `missing kind ${k}`)
  }
  for (const d of docs) assert.ok(d.apiVersion && d.kind && d.metadata?.name)
})

test('StatefulSet uses volumeClaimTemplates and a headless service; no standalone PVC', () => {
  const s = everythingSpec()
  s.deployment.kind = 'StatefulSet'
  const m = buildManifests(s)
  const sts = m.find((x) => x.kind === 'StatefulSet')
  assert.ok(sts.resource.spec.volumeClaimTemplates?.length)
  assert.equal(sts.resource.spec.serviceName, 'full')
  assert.equal(m.find((x) => x.kind === 'PersistentVolumeClaim'), undefined)
  const svc = m.find((x) => x.kind === 'Service')
  assert.equal(svc.resource.spec.clusterIP, 'None')
})

test('DaemonSet has no replicas', () => {
  const s = defaultSpec()
  s.deployment.kind = 'DaemonSet'
  const ds = buildManifests(s).find((x) => x.kind === 'DaemonSet')
  assert.equal(ds.resource.spec.replicas, undefined)
})

test('securityContext, nodeSelector and tolerations land in the pod spec', () => {
  const s = defaultSpec()
  s.deployment.securityContext.enabled = true
  s.deployment.nodeSelector = [{ key: 'disktype', value: 'ssd' }]
  s.deployment.tolerations = [{ key: 'gpu', operator: 'Equal', value: 'true', effect: 'NoSchedule' }]
  s.deployment.spreadAcrossNodes = true
  const pod = buildManifests(s).find((x) => x.kind === 'Deployment').resource.spec.template.spec
  assert.equal(pod.securityContext.runAsNonRoot, true)
  assert.equal(pod.nodeSelector.disktype, 'ssd')
  assert.equal(pod.tolerations[0].key, 'gpu')
  assert.ok(pod.affinity.podAntiAffinity)
  assert.deepEqual(pod.containers[0].securityContext.capabilities.drop, ['ALL'])
})

test('RBAC role rules parse CSV fields; binding targets the ServiceAccount', () => {
  const s = defaultSpec()
  s.serviceAccount.enabled = true
  s.rbac.enabled = true
  s.rbac.rules = [{ apiGroups: 'apps,', resources: 'deployments,pods', verbs: 'get,list' }]
  const m = buildManifests(s)
  const role = m.find((x) => x.kind === 'Role')
  assert.deepEqual(role.resource.rules[0].resources, ['deployments', 'pods'])
  assert.deepEqual(role.resource.rules[0].verbs, ['get', 'list'])
  const binding = m.find((x) => x.kind === 'RoleBinding')
  assert.equal(binding.resource.subjects[0].name, 'my-app')
})

test('round-trip with StatefulSet + securityContext + pod-level', () => {
  const s = everythingSpec()
  s.deployment.kind = 'StatefulSet'
  s.deployment.securityContext.enabled = true
  s.deployment.nodeSelector = [{ key: 'zone', value: 'a' }]
  const back = parseManifests(buildOutput(s).preview)
  assert.equal(back.deployment.kind, 'StatefulSet')
  assert.equal(back.deployment.securityContext.enabled, true)
  assert.equal(back.deployment.nodeSelector[0].key, 'zone')
  assert.equal(back.pvc.enabled, true) // recovered from volumeClaimTemplates
  assert.equal(back.serviceAccount.enabled, true)
  assert.equal(back.rbac.enabled, true)
  assert.equal(back.networkPolicy.enabled, true)
  assert.equal(back.pdb.enabled, true)
  assert.equal(back.secret.enabled, true)
  assert.equal(back.meta.emitNamespace, true)
})

test('validateSpec flags invalid name, ingress without TLS, and limit < request', () => {
  const s = defaultSpec()
  s.meta.name = 'Bad_Name'
  s.ingress.enabled = true
  s.ingress.tls.enabled = false
  s.deployment.resources.limits.cpu = '50m'
  s.deployment.resources.requests.cpu = '100m'
  const issues = validateSpec(s)
  assert.ok(issues.some((i) => i.level === 'error' && i.field === 'meta.name'))
  assert.ok(issues.some((i) => i.field === 'ingress.tls'))
  assert.ok(issues.some((i) => i.field === 'deployment.resources'))
})

test('validateSpec is clean for a sane default + service', () => {
  const s = defaultSpec()
  const errors = validateSpec(s).filter((i) => i.level === 'error')
  assert.equal(errors.length, 0)
})

test('highlightYaml wraps keys and escapes HTML', () => {
  const html = highlightYaml('kind: Deployment\n# comment\nreplicas: 3\n')
  assert.match(html, /class="hl-key"/)
  assert.match(html, /class="hl-num"/)
  assert.match(html, /class="hl-comment"/)
  assert.doesNotMatch(highlightYaml('a: <b>'), /<b>/)
})
