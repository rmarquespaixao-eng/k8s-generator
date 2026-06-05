# k8s-generator

App desktop (Electron + Vue 3) que gera manifestos Kubernetes a partir de um
formulário, com preview ao vivo e exportação em **YAML cru**, **Kustomize** ou
**Helm chart**.

## Recursos suportados

| Recurso | apiVersion |
|---|---|
| Deployment | `apps/v1` |
| Service | `v1` |
| Ingress | `networking.k8s.io/v1` |
| ConfigMap | `v1` |
| ExternalSecret | `external-secrets.io/v1` |
| HorizontalPodAutoscaler | `autoscaling/v2` |
| CronJob | `batch/v1` |
| PersistentVolumeClaim | `v1` |

Cada recurso é ligado/desligado por um switch. O Deployment cabeia
automaticamente:

- `envFrom` → ConfigMap e/ou Secret do ExternalSecret (quando ligados);
- `volumeMounts`/`volumes` → PVC (quando ligado);
- omite `replicas` quando o HPA está ligado (pra não brigar com o autoscaler).

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
