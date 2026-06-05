import { commonLabels, rowsToObject } from '../util.js'

export function ingress(spec) {
  const i = spec.ingress
  if (!i.enabled) return null

  const rule = {
    host: i.host,
    http: {
      paths: [
        {
          path: i.path,
          pathType: i.pathType,
          backend: {
            service: {
              name: spec.meta.name,
              port: { number: Number(spec.service.port) }
            }
          }
        }
      ]
    }
  }

  const obj = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: spec.meta.name,
      namespace: spec.meta.namespace,
      labels: commonLabels(spec.meta),
      annotations: rowsToObject(i.annotations)
    },
    spec: {
      ingressClassName: i.className,
      rules: [rule]
    }
  }

  if (i.tls.enabled) {
    obj.spec.tls = [
      {
        hosts: [i.host],
        secretName: i.tls.secretName || `${spec.meta.name}-tls`
      }
    ]
  }

  return obj
}
