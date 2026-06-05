import { objectToYaml } from '../toYaml.js'
import { tokenize, buildEnv, targetSecretName } from '../generators/_shared.js'
import { rowsToObject } from '../util.js'

/** Split "repo:tag" into { repository, tag } (tag defaults to "latest"). */
function splitImage(image) {
  const lastColon = image.lastIndexOf(':')
  // Avoid splitting on a registry port (e.g. host:5000/img)
  if (lastColon === -1 || image.indexOf('/', lastColon) !== -1) {
    return { repository: image, tag: 'latest' }
  }
  return { repository: image.slice(0, lastColon), tag: image.slice(lastColon + 1) }
}

function buildValues(spec) {
  const d = spec.deployment
  const img = splitImage(d.image)

  return {
    nameOverride: '',
    fullnameOverride: spec.meta.name,
    namespace: spec.meta.namespace,
    replicaCount: Number(d.replicas),
    image: { repository: img.repository, tag: img.tag, pullPolicy: d.imagePullPolicy },
    command: tokenize(d.command),
    args: tokenize(d.args),
    containerPort: Number(d.containerPort),
    env: buildEnv(d.env),
    envFrom: {
      configMap: spec.configMap.enabled && spec.configMap.mountAsEnv,
      externalSecret: spec.externalSecret.enabled && spec.externalSecret.mountAsEnv
    },
    resources: {
      requests: { cpu: d.resources.requests.cpu, memory: d.resources.requests.memory },
      limits: { cpu: d.resources.limits.cpu, memory: d.resources.limits.memory }
    },
    probes: {
      enabled: d.probes.enabled,
      path: d.probes.path,
      port: Number(d.probes.port),
      initialDelaySeconds: Number(d.probes.initialDelaySeconds),
      periodSeconds: Number(d.probes.periodSeconds)
    },
    service: {
      enabled: spec.service.enabled,
      type: spec.service.type,
      port: Number(spec.service.port),
      targetPort: Number(spec.service.targetPort)
    },
    ingress: {
      enabled: spec.ingress.enabled,
      className: spec.ingress.className,
      host: spec.ingress.host,
      path: spec.ingress.path,
      pathType: spec.ingress.pathType,
      annotations: rowsToObject(spec.ingress.annotations),
      tls: {
        enabled: spec.ingress.tls.enabled,
        secretName: spec.ingress.tls.secretName || `${spec.meta.name}-tls`
      }
    },
    configMap: { enabled: spec.configMap.enabled, data: rowsToObject(spec.configMap.data) },
    externalSecret: {
      enabled: spec.externalSecret.enabled,
      secretStoreName: spec.externalSecret.secretStoreName,
      secretStoreKind: spec.externalSecret.secretStoreKind,
      refreshInterval: spec.externalSecret.refreshInterval,
      targetName: targetSecretName(spec),
      data: (spec.externalSecret.data || [])
        .filter((r) => r && r.secretKey && r.remoteKey)
        .map((r) => ({
          secretKey: r.secretKey,
          remoteKey: r.remoteKey,
          remoteProperty: r.remoteProperty || ''
        }))
    },
    autoscaling: {
      enabled: spec.hpa.enabled,
      minReplicas: Number(spec.hpa.minReplicas),
      maxReplicas: Number(spec.hpa.maxReplicas),
      targetCPU: Number(spec.hpa.targetCPU),
      targetMemory: Number(spec.hpa.targetMemory)
    },
    cronjob: {
      enabled: spec.cronjob.enabled,
      schedule: spec.cronjob.schedule,
      image: spec.cronjob.image,
      command: tokenize(spec.cronjob.command),
      args: tokenize(spec.cronjob.args),
      restartPolicy: spec.cronjob.restartPolicy,
      concurrencyPolicy: spec.cronjob.concurrencyPolicy,
      successfulJobsHistoryLimit: Number(spec.cronjob.successfulJobsHistoryLimit),
      failedJobsHistoryLimit: Number(spec.cronjob.failedJobsHistoryLimit)
    },
    persistence: {
      enabled: spec.pvc.enabled,
      storageClassName: spec.pvc.storageClassName,
      accessMode: spec.pvc.accessMode,
      size: spec.pvc.size,
      mountPath: spec.pvc.mountPath
    }
  }
}

const HELPERS_TPL = `{{- define "app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "app.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "app.labels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "app.name" . }}
{{- end -}}
`

const DEPLOYMENT_TPL = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "app.labels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ include "app.name" . }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          {{- with .Values.command }}
          command:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          {{- with .Values.args }}
          args:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          ports:
            - containerPort: {{ .Values.containerPort }}
          {{- with .Values.env }}
          env:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          {{- if or .Values.envFrom.configMap .Values.envFrom.externalSecret }}
          envFrom:
            {{- if .Values.envFrom.configMap }}
            - configMapRef:
                name: {{ include "app.fullname" . }}
            {{- end }}
            {{- if .Values.envFrom.externalSecret }}
            - secretRef:
                name: {{ .Values.externalSecret.targetName }}
            {{- end }}
          {{- end }}
          {{- if .Values.probes.enabled }}
          livenessProbe:
            httpGet:
              path: {{ .Values.probes.path }}
              port: {{ .Values.probes.port }}
            initialDelaySeconds: {{ .Values.probes.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.periodSeconds }}
          readinessProbe:
            httpGet:
              path: {{ .Values.probes.path }}
              port: {{ .Values.probes.port }}
            initialDelaySeconds: {{ .Values.probes.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.periodSeconds }}
          {{- end }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- if .Values.persistence.enabled }}
          volumeMounts:
            - name: data
              mountPath: {{ .Values.persistence.mountPath }}
          {{- end }}
      {{- if .Values.persistence.enabled }}
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: {{ include "app.fullname" . }}-data
      {{- end }}
`

const SERVICE_TPL = `{{- if .Values.service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  selector:
    {{- include "app.selectorLabels" . | nindent 4 }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
{{- end }}
`

const INGRESS_TPL = `{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  ingressClassName: {{ .Values.ingress.className }}
  {{- if .Values.ingress.tls.enabled }}
  tls:
    - hosts:
        - {{ .Values.ingress.host | quote }}
      secretName: {{ .Values.ingress.tls.secretName }}
  {{- end }}
  rules:
    - host: {{ .Values.ingress.host | quote }}
      http:
        paths:
          - path: {{ .Values.ingress.path }}
            pathType: {{ .Values.ingress.pathType }}
            backend:
              service:
                name: {{ include "app.fullname" . }}
                port:
                  number: {{ .Values.service.port }}
{{- end }}
`

const CONFIGMAP_TPL = `{{- if .Values.configMap.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
{{- with .Values.configMap.data }}
data:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
`

const EXTERNALSECRET_TPL = `{{- if .Values.externalSecret.enabled }}
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  refreshInterval: {{ .Values.externalSecret.refreshInterval }}
  secretStoreRef:
    name: {{ .Values.externalSecret.secretStoreName }}
    kind: {{ .Values.externalSecret.secretStoreKind }}
  target:
    name: {{ .Values.externalSecret.targetName }}
    creationPolicy: Owner
  data:
    {{- range .Values.externalSecret.data }}
    - secretKey: {{ .secretKey }}
      remoteRef:
        key: {{ .remoteKey }}
        {{- if .remoteProperty }}
        property: {{ .remoteProperty }}
        {{- end }}
    {{- end }}
{{- end }}
`

const HPA_TPL = `{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "app.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if gt (int .Values.autoscaling.targetCPU) 0 }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPU }}
    {{- end }}
    {{- if gt (int .Values.autoscaling.targetMemory) 0 }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemory }}
    {{- end }}
{{- end }}
`

const CRONJOB_TPL = `{{- if .Values.cronjob.enabled }}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: {{ include "app.fullname" . }}
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  schedule: {{ .Values.cronjob.schedule | quote }}
  concurrencyPolicy: {{ .Values.cronjob.concurrencyPolicy }}
  successfulJobsHistoryLimit: {{ .Values.cronjob.successfulJobsHistoryLimit }}
  failedJobsHistoryLimit: {{ .Values.cronjob.failedJobsHistoryLimit }}
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            {{- include "app.labels" . | nindent 12 }}
        spec:
          restartPolicy: {{ .Values.cronjob.restartPolicy }}
          containers:
            - name: {{ include "app.name" . }}
              image: {{ .Values.cronjob.image }}
              {{- with .Values.cronjob.command }}
              command:
                {{- toYaml . | nindent 16 }}
              {{- end }}
              {{- with .Values.cronjob.args }}
              args:
                {{- toYaml . | nindent 16 }}
              {{- end }}
{{- end }}
`

const PVC_TPL = `{{- if .Values.persistence.enabled }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "app.fullname" . }}-data
  namespace: {{ .Values.namespace }}
  labels:
    {{- include "app.labels" . | nindent 4 }}
spec:
  accessModes:
    - {{ .Values.persistence.accessMode }}
  {{- if .Values.persistence.storageClassName }}
  storageClassName: {{ .Values.persistence.storageClassName }}
  {{- end }}
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
{{- end }}
`

/** Build a Helm chart for the spec. Always includes the templates the spec enables. */
export function buildHelm(spec) {
  const name = spec.meta.name
  const values = buildValues(spec)

  const chartYaml = {
    apiVersion: 'v2',
    name,
    description: `Helm chart for ${name}`,
    type: 'application',
    version: '0.1.0',
    appVersion: values.image.tag
  }

  const files = [
    { path: `${name}/Chart.yaml`, content: objectToYaml(chartYaml) },
    { path: `${name}/values.yaml`, content: objectToYaml(values) },
    { path: `${name}/templates/_helpers.tpl`, content: HELPERS_TPL }
  ]

  // Deployment / cronjob: a chart has one workload kind.
  if (spec.cronjob.enabled) {
    files.push({ path: `${name}/templates/cronjob.yaml`, content: CRONJOB_TPL })
  }
  if (spec.deployment.enabled) {
    files.push({ path: `${name}/templates/deployment.yaml`, content: DEPLOYMENT_TPL })
  }
  if (spec.service.enabled) {
    files.push({ path: `${name}/templates/service.yaml`, content: SERVICE_TPL })
  }
  if (spec.ingress.enabled) {
    files.push({ path: `${name}/templates/ingress.yaml`, content: INGRESS_TPL })
  }
  if (spec.configMap.enabled) {
    files.push({ path: `${name}/templates/configmap.yaml`, content: CONFIGMAP_TPL })
  }
  if (spec.externalSecret.enabled) {
    files.push({ path: `${name}/templates/externalsecret.yaml`, content: EXTERNALSECRET_TPL })
  }
  if (spec.hpa.enabled) {
    files.push({ path: `${name}/templates/hpa.yaml`, content: HPA_TPL })
  }
  if (spec.pvc.enabled) {
    files.push({ path: `${name}/templates/pvc.yaml`, content: PVC_TPL })
  }

  const preview = files
    .map((f) => `# === ${f.path} ===\n${f.content}`)
    .join('\n')

  return { files, preview }
}
