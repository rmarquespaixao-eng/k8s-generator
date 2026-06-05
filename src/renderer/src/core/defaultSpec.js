/** The full editable model. Every form binds to a slice of this. */
export function defaultSpec() {
  return {
    meta: {
      name: 'my-app',
      namespace: 'default',
      emitNamespace: false, // also generate the Namespace resource
      extraLabels: [], // [{ key, value }]
      podAnnotations: [] // [{ key, value }] -> pod template annotations
    },
    deployment: {
      enabled: true,
      kind: 'Deployment', // Deployment | StatefulSet | DaemonSet
      replicas: 1,
      serviceName: '', // StatefulSet headless service name (defaults to <name>)
      image: 'nginx:latest',
      imagePullPolicy: 'IfNotPresent',
      containerPort: 80,
      command: '',
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
        periodSeconds: 10,
        startup: false // also emit a startupProbe
      },
      serviceAccountName: '', // set automatically when ServiceAccount is enabled
      securityContext: {
        enabled: false,
        runAsNonRoot: true,
        runAsUser: 1000,
        fsGroup: 1000,
        readOnlyRootFilesystem: false,
        allowPrivilegeEscalation: false,
        dropAllCapabilities: true
      },
      nodeSelector: [], // [{ key, value }]
      tolerations: [], // [{ key, operator, value, effect }]
      spreadAcrossNodes: false, // podAntiAffinity by hostname
      initContainers: [], // [{ name, image, command }]
      extraVolumes: [], // [{ name, type, source, mountPath }]  type: emptyDir|hostPath|configMap|secret
      imagePullSecrets: [] // [{ key }] -> secret names
    },
    job: {
      enabled: false,
      image: 'busybox:latest',
      command: 'sh -c "echo done"',
      args: '',
      completions: 1,
      parallelism: 1,
      backoffLimit: 4,
      restartPolicy: 'OnFailure' // OnFailure | Never
    },
    service: {
      enabled: true,
      type: 'ClusterIP',
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
      annotations: []
    },
    configMap: {
      enabled: false,
      data: [],
      mountAsEnv: true
    },
    secret: {
      enabled: false,
      type: 'Opaque', // Opaque | kubernetes.io/tls | kubernetes.io/dockerconfigjson
      data: [], // [{ key, value }] -> stringData
      mountAsEnv: true
    },
    externalSecret: {
      enabled: false,
      secretStoreName: 'aws-secretsmanager',
      secretStoreKind: 'ClusterSecretStore',
      refreshInterval: '1h',
      targetName: '',
      mountAsEnv: true,
      data: [] // [{ secretKey, remoteKey, remoteProperty }]
    },
    serviceAccount: {
      enabled: false,
      name: '', // defaults to <app name>
      automountToken: true,
      annotations: [],
      imagePullSecrets: [] // [{ key }]
    },
    rbac: {
      enabled: false,
      scope: 'Role', // Role | ClusterRole
      rules: [{ apiGroups: '', resources: 'pods', verbs: 'get,list,watch' }],
      bindToServiceAccount: true
    },
    networkPolicy: {
      enabled: false,
      denyAllIngress: true,
      allowSameNamespace: false,
      allowFromCIDR: '', // e.g. 10.0.0.0/8
      allowPorts: [], // [{ key }] -> port numbers
      denyAllEgress: false
    },
    pdb: {
      enabled: false,
      mode: 'minAvailable', // minAvailable | maxUnavailable
      value: '1' // number or percentage like "50%"
    },
    resourceQuota: {
      enabled: false,
      requestsCpu: '2',
      requestsMemory: '2Gi',
      limitsCpu: '4',
      limitsMemory: '4Gi',
      pods: '10'
    },
    limitRange: {
      enabled: false,
      defaultRequestCpu: '100m',
      defaultRequestMemory: '128Mi',
      defaultLimitCpu: '500m',
      defaultLimitMemory: '256Mi'
    },
    hpa: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 5,
      targetCPU: 80,
      targetMemory: 0
    },
    cronjob: {
      enabled: false,
      schedule: '0 * * * *',
      image: 'busybox:latest',
      command: 'sh -c "echo hello"',
      args: '',
      restartPolicy: 'OnFailure',
      concurrencyPolicy: 'Allow',
      successfulJobsHistoryLimit: 3,
      failedJobsHistoryLimit: 1
    },
    pvc: {
      enabled: false,
      storageClassName: '',
      accessMode: 'ReadWriteOnce',
      size: '1Gi',
      mountPath: '/data'
    },
    output: {
      format: 'yaml', // yaml | kustomize | helm
      splitFiles: true
    }
  }
}
