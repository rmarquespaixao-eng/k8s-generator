/** The full editable model. Every form binds to a slice of this. */
export function defaultSpec() {
  return {
    meta: {
      name: 'my-app',
      namespace: 'default',
      extraLabels: [] // [{ key, value }]
    },
    deployment: {
      enabled: true,
      replicas: 1,
      image: 'nginx:latest',
      imagePullPolicy: 'IfNotPresent',
      containerPort: 80,
      command: '', // space/newline separated -> array
      args: '',
      env: [], // [{ key, value }]
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '256Mi' }
      },
      probes: {
        enabled: false,
        path: '/healthz',
        port: 80,
        initialDelaySeconds: 10,
        periodSeconds: 10
      }
    },
    service: {
      enabled: true,
      type: 'ClusterIP', // ClusterIP | NodePort | LoadBalancer
      port: 80,
      targetPort: 80
    },
    ingress: {
      enabled: false,
      className: 'nginx',
      host: 'app.example.com',
      path: '/',
      pathType: 'Prefix',
      tls: { enabled: false, secretName: '' },
      annotations: [] // [{ key, value }]
    },
    configMap: {
      enabled: false,
      data: [], // [{ key, value }]
      mountAsEnv: true // envFrom configMapRef
    },
    externalSecret: {
      enabled: false,
      secretStoreName: 'aws-secretsmanager',
      secretStoreKind: 'ClusterSecretStore', // ClusterSecretStore | SecretStore
      refreshInterval: '1h',
      targetName: '', // defaults to <name>-secret
      mountAsEnv: true, // envFrom secretRef
      data: [] // [{ secretKey, remoteKey, remoteProperty }]
    },
    hpa: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 5,
      targetCPU: 80,
      targetMemory: 0 // 0 = disabled
    },
    cronjob: {
      enabled: false,
      schedule: '0 * * * *',
      image: 'busybox:latest',
      command: 'sh -c "echo hello"',
      args: '',
      restartPolicy: 'OnFailure', // OnFailure | Never
      concurrencyPolicy: 'Allow', // Allow | Forbid | Replace
      successfulJobsHistoryLimit: 3,
      failedJobsHistoryLimit: 1
    },
    pvc: {
      enabled: false,
      storageClassName: '',
      accessMode: 'ReadWriteOnce', // ReadWriteOnce | ReadOnlyMany | ReadWriteMany
      size: '1Gi',
      mountPath: '/data'
    },
    output: {
      format: 'yaml', // yaml | kustomize | helm
      splitFiles: true // when saving: one file per resource
    }
  }
}
