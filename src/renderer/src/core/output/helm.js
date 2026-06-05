import { buildManifests } from '../manifests.js'
import { objectToYaml } from '../toYaml.js'
import { prune } from '../util.js'

/** Split "repo:tag" into { repository, tag } (tag defaults to "latest"). */
function splitImage(image) {
  const lastColon = image.lastIndexOf(':')
  if (lastColon === -1 || image.indexOf('/', lastColon) !== -1) {
    return { repository: image, tag: 'latest' }
  }
  return { repository: image.slice(0, lastColon), tag: image.slice(lastColon + 1) }
}

const HELPERS_TPL = `{{- define "app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app.fullname" -}}
{{- default .Chart.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app.labels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}
`

const NS = '__NS_MARKER__'
const LABELS = '__LABELS_MARKER__'
const IMAGE = '__IMAGE_MARKER__'
const REPLICAS = '__REPLICAS_MARKER__'

/**
 * Convert a concrete resource object into a Helm template:
 *  - namespace      -> {{ .Values.namespace }}
 *  - top labels     -> include "app.labels"
 *  - main image     -> {{ .Values.image.* }}   (workload only)
 *  - replicas       -> {{ .Values.replicaCount }}
 * Everything else stays concrete, so the template always matches the generator.
 */
function toTemplate(resource, isWorkload) {
  const obj = JSON.parse(JSON.stringify(prune(resource)))

  if (obj.metadata) {
    if (obj.metadata.namespace) obj.metadata.namespace = NS
    if (obj.metadata.labels) obj.metadata.labels = LABELS
  }

  if (isWorkload) {
    if (obj.spec?.replicas !== undefined) obj.spec.replicas = REPLICAS
    const container = obj.spec?.template?.spec?.containers?.[0]
    if (container) container.image = IMAGE
  }

  let y = objectToYaml(obj)
  y = y.replace(`namespace: ${NS}`, 'namespace: {{ .Values.namespace }}')
  y = y.replace(
    `labels: ${LABELS}`,
    'labels:\n    {{- include "app.labels" . | nindent 4 }}'
  )
  y = y.replace(`replicas: ${REPLICAS}`, 'replicas: {{ .Values.replicaCount }}')
  y = y.replace(
    `image: ${IMAGE}`,
    'image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"'
  )
  return y
}

/** Build a Helm chart for the spec (one template per enabled resource). */
export function buildHelm(spec) {
  const name = spec.meta.name
  const manifests = buildManifests(spec)
  const img = splitImage(spec.deployment.image)

  const values = {
    nameOverride: '',
    fullnameOverride: name,
    namespace: spec.meta.namespace,
    replicaCount: Number(spec.deployment.replicas),
    image: {
      repository: img.repository,
      tag: img.tag,
      pullPolicy: spec.deployment.imagePullPolicy
    }
  }

  const chartYaml = {
    apiVersion: 'v2',
    name,
    description: `Helm chart for ${name}`,
    type: 'application',
    version: '0.1.0',
    appVersion: img.tag
  }

  const files = [
    { path: `${name}/Chart.yaml`, content: objectToYaml(chartYaml) },
    { path: `${name}/values.yaml`, content: objectToYaml(values) },
    { path: `${name}/templates/_helpers.tpl`, content: HELPERS_TPL }
  ]

  for (const m of manifests) {
    files.push({
      path: `${name}/templates/${m.key}.yaml`,
      content: toTemplate(m.resource, m.key === 'workload' || m.key === 'rollout')
    })
  }

  const preview = files.map((f) => `# === ${f.path} ===\n${f.content}`).join('\n')
  return { files, preview }
}
