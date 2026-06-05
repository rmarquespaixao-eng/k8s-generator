# k8s-generator

App desktop (Electron + Vue 3) que gera manifestos Kubernetes a partir de um
formulário, com preview ao vivo e exportação em **YAML cru**, **Kustomize** ou
**Helm chart**.

## Recursos suportados

| Categoria | Recursos |
|---|---|
| Workload | Deployment / StatefulSet / DaemonSet (seletor de tipo), CronJob, Job |
| Rede | Service (headless automático p/ StatefulSet), Ingress, NetworkPolicy |
| Config | ConfigMap, Secret nativo, ExternalSecret (`external-secrets.io/v1`) |
| Segurança | ServiceAccount, Role/ClusterRole + RoleBinding/ClusterRoleBinding |
| Escala & confiabilidade | HorizontalPodAutoscaler, PodDisruptionBudget, PVC |
| Limites | ResourceQuota, LimitRange |
| Cluster | Namespace |

Pod-level avançado no workload: `initContainers`, volumes extras
(emptyDir/hostPath/configMap/secret), `nodeSelector`, `tolerations`,
podAntiAffinity (spread), `securityContext` (pod + container), startup probe,
`imagePullSecrets` e annotations de pod.

Cada recurso é ligado/desligado por um switch. O workload cabeia automaticamente:

- `envFrom` → ConfigMap, Secret nativo e/ou Secret do ExternalSecret (quando ligados);
- `volumeMounts`/`volumes` → PVC (Deployment/DaemonSet) ou `volumeClaimTemplates` (StatefulSet);
- `serviceAccountName` quando o ServiceAccount está ligado;
- omite `replicas` quando o HPA está ligado (pra não brigar com o autoscaler);
- `scaleTargetRef` do HPA segue o tipo do workload (Deployment/StatefulSet).

## Formatos de saída

- **YAML** — multi-doc (`---`), salvando 1 arquivo por recurso ou um combinado.
- **Kustomize** — `base/<recurso>.yaml` + `base/kustomization.yaml`.
- **Helm** — chart parametrizado: `Chart.yaml`, `values.yaml`,
  `templates/_helpers.tpl` e um template por recurso habilitado.

## Recursos da ferramenta

- **Importar YAML** — cole manifestos ou carregue um arquivo `.yaml`; o parser
  reconstrói o formulário a partir dos recursos reconhecidos (inverso dos
  geradores). Kinds desconhecidos são ignorados.
- **Presets** — salve a configuração atual com um nome e recarregue/exclua depois.
  Persistido em `presets.json` no diretório de dados do app
  (`app.getPath('userData')`).
- **Validar** — roda `kubectl apply --dry-run=client` sobre o YAML/Kustomize
  gerado (validação de schema offline, sem precisar de cluster). Requer `kubectl`
  no `PATH`; se ausente, o app avisa em vez de quebrar.
- **Validação inline** — barra no preview com erros/avisos em tempo real
  (nome DNS-1123, limit < request, Ingress sem TLS, min > max do HPA, etc.).
- **Tema claro/escuro** + preview com syntax highlight de YAML.
- **Nav por categorias** colapsáveis com indicador de recurso habilitado.

## Desenvolvimento

```bash
npm install        # baixa também o binário do Electron
npm run dev        # janela com hot-reload
npm test           # testes do núcleo de geração (node --test)
npm run build      # bundle de produção em out/
npm start          # roda o bundle (electron-vite preview)
```

## Arquitetura

O núcleo de geração é **JS puro, sem dependência de Vue/Electron**, e fica em
[`src/renderer/src/core/`](src/renderer/src/core/):

```
core/
├── defaultSpec.js          # modelo editável (o que os formulários alteram)
├── util.js                 # prune de vazios, labels padrão
├── manifests.js            # orquestra os geradores → lista de recursos
├── toYaml.js               # serialização via js-yaml
├── generators/             # 1 arquivo por recurso (função pura → objeto k8s)
└── output/                 # yaml | kustomize | helm
```

Isso torna a lógica testável fora da UI — ver [`test/core.test.mjs`](test/core.test.mjs).
A camada Electron ([`src/main`](src/main), [`src/preload`](src/preload)) só abre
a janela e faz o diálogo de salvar arquivos via IPC (`window.api.saveFiles`).

> Nota: a saída do gerador é genérica (qualquer cluster). Os defaults do
> ExternalSecret já vêm preenchidos com `aws-secretsmanager` /
> `ClusterSecretStore`, alinhados ao padrão homelab, mas todos os campos são
> editáveis.
