<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.deployment.enabled"
    title="Workload"
    subtitle="Deployment / StatefulSet / DaemonSet"
  >
    <div class="row g-3">
      <div class="col-4">
        <label class="form-label">Tipo</label>
        <select v-model="props.spec.deployment.kind" class="form-select">
          <option>Deployment</option>
          <option>StatefulSet</option>
          <option>DaemonSet</option>
        </select>
      </div>
      <div class="col-4">
        <label class="form-label">Réplicas</label>
        <input
          v-model.number="props.spec.deployment.replicas"
          type="number"
          min="0"
          class="form-control"
          :disabled="props.spec.hpa.enabled || props.spec.deployment.kind === 'DaemonSet'"
        />
        <div v-if="props.spec.hpa.enabled" class="form-text">Gerenciado pelo HPA.</div>
        <div v-else-if="props.spec.deployment.kind === 'DaemonSet'" class="form-text">
          DaemonSet roda 1 por nó.
        </div>
      </div>
      <div v-if="props.spec.deployment.kind === 'StatefulSet'" class="col-4">
        <label class="form-label">serviceName (headless)</label>
        <input
          v-model="props.spec.deployment.serviceName"
          class="form-control"
          :placeholder="props.spec.meta.name"
        />
      </div>
    </div>

    <div class="row g-3 mt-0">
      <div class="col-8">
        <label class="form-label">Imagem</label>
        <input v-model="props.spec.deployment.image" class="form-control" placeholder="nginx:1.27" />
      </div>
      <div class="col-4">
        <label class="form-label">imagePullPolicy</label>
        <select v-model="props.spec.deployment.imagePullPolicy" class="form-select">
          <option>IfNotPresent</option>
          <option>Always</option>
          <option>Never</option>
        </select>
      </div>
      <div class="col-4">
        <label class="form-label">Porta do container</label>
        <input v-model.number="props.spec.deployment.containerPort" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">command</label>
        <input v-model="props.spec.deployment.command" class="form-control" placeholder='sh -c "..."' />
      </div>
      <div class="col-4">
        <label class="form-label">args</label>
        <input v-model="props.spec.deployment.args" class="form-control" />
      </div>
    </div>

    <hr />
    <div class="row g-3">
      <div class="col-3">
        <label class="form-label">CPU request</label>
        <input v-model="props.spec.deployment.resources.requests.cpu" class="form-control" />
      </div>
      <div class="col-3">
        <label class="form-label">Mem request</label>
        <input v-model="props.spec.deployment.resources.requests.memory" class="form-control" />
      </div>
      <div class="col-3">
        <label class="form-label">CPU limit</label>
        <input v-model="props.spec.deployment.resources.limits.cpu" class="form-control" />
      </div>
      <div class="col-3">
        <label class="form-label">Mem limit</label>
        <input v-model="props.spec.deployment.resources.limits.memory" class="form-control" />
      </div>
    </div>

    <hr />
    <div class="form-check form-switch mb-2">
      <input
        id="probes"
        v-model="props.spec.deployment.probes.enabled"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="probes">Health probes (liveness + readiness)</label>
    </div>
    <div v-if="props.spec.deployment.probes.enabled" class="row g-3">
      <div class="col-6">
        <label class="form-label">Path</label>
        <input v-model="props.spec.deployment.probes.path" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">Porta</label>
        <input v-model.number="props.spec.deployment.probes.port" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">initialDelay (s)</label>
        <input v-model.number="props.spec.deployment.probes.initialDelaySeconds" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">period (s)</label>
        <input v-model.number="props.spec.deployment.probes.periodSeconds" type="number" class="form-control" />
      </div>
      <div class="col-4 d-flex align-items-end">
        <div class="form-check form-switch">
          <input
            id="startup"
            v-model="props.spec.deployment.probes.startup"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="startup">startupProbe</label>
        </div>
      </div>
    </div>

    <hr />
    <label class="form-label">Variáveis de ambiente (inline)</label>
    <RowsEditor
      :rows="props.spec.deployment.env"
      :columns="[
        { field: 'key', label: 'nome', placeholder: 'LOG_LEVEL' },
        { field: 'value', label: 'valor', placeholder: 'info' }
      ]"
      add-label="+ env"
    />

    <!-- Advanced pod-level configuration -->
    <details class="adv mt-3">
      <summary>Segurança (securityContext)</summary>
      <div class="form-check form-switch my-2">
        <input
          id="sc-on"
          v-model="props.spec.deployment.securityContext.enabled"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="sc-on">Aplicar securityContext</label>
      </div>
      <div v-if="props.spec.deployment.securityContext.enabled" class="row g-3">
        <div class="col-4">
          <label class="form-label">runAsUser</label>
          <input v-model.number="props.spec.deployment.securityContext.runAsUser" type="number" class="form-control" />
        </div>
        <div class="col-4">
          <label class="form-label">fsGroup</label>
          <input v-model.number="props.spec.deployment.securityContext.fsGroup" type="number" class="form-control" />
        </div>
        <div class="col-12 d-flex flex-wrap gap-3">
          <div class="form-check form-switch">
            <input id="sc-nonroot" v-model="props.spec.deployment.securityContext.runAsNonRoot" class="form-check-input" type="checkbox" role="switch" />
            <label class="form-check-label" for="sc-nonroot">runAsNonRoot</label>
          </div>
          <div class="form-check form-switch">
            <input id="sc-rofs" v-model="props.spec.deployment.securityContext.readOnlyRootFilesystem" class="form-check-input" type="checkbox" role="switch" />
            <label class="form-check-label" for="sc-rofs">readOnlyRootFilesystem</label>
          </div>
          <div class="form-check form-switch">
            <input id="sc-priv" v-model="props.spec.deployment.securityContext.allowPrivilegeEscalation" class="form-check-input" type="checkbox" role="switch" />
            <label class="form-check-label" for="sc-priv">allowPrivilegeEscalation</label>
          </div>
          <div class="form-check form-switch">
            <input id="sc-drop" v-model="props.spec.deployment.securityContext.dropAllCapabilities" class="form-check-input" type="checkbox" role="switch" />
            <label class="form-check-label" for="sc-drop">drop ALL capabilities</label>
          </div>
        </div>
      </div>
    </details>

    <details class="adv">
      <summary>Agendamento (nodeSelector, tolerations, spread)</summary>
      <div class="form-check form-switch my-2">
        <input id="spread" v-model="props.spec.deployment.spreadAcrossNodes" class="form-check-input" type="checkbox" role="switch" />
        <label class="form-check-label" for="spread">Espalhar pods entre nós (podAntiAffinity)</label>
      </div>
      <label class="form-label">nodeSelector</label>
      <RowsEditor
        :rows="props.spec.deployment.nodeSelector"
        :columns="[
          { field: 'key', label: 'chave', placeholder: 'disktype' },
          { field: 'value', label: 'valor', placeholder: 'ssd' }
        ]"
        add-label="+ seletor"
      />
      <label class="form-label mt-2">tolerations</label>
      <RowsEditor
        :rows="props.spec.deployment.tolerations"
        :columns="[
          { field: 'key', label: 'key', placeholder: 'gpu' },
          { field: 'operator', label: 'operator', placeholder: 'Equal' },
          { field: 'value', label: 'value', placeholder: 'true' },
          { field: 'effect', label: 'effect', placeholder: 'NoSchedule' }
        ]"
        add-label="+ toleration"
      />
    </details>

    <details class="adv">
      <summary>initContainers</summary>
      <RowsEditor
        :rows="props.spec.deployment.initContainers"
        :columns="[
          { field: 'name', label: 'nome', placeholder: 'init-db' },
          { field: 'image', label: 'imagem', placeholder: 'busybox:latest' },
          { field: 'command', label: 'command', placeholder: 'sh -c \'...\'' }
        ]"
        add-label="+ initContainer"
      />
    </details>

    <details class="adv">
      <summary>Volumes extras</summary>
      <RowsEditor
        :rows="props.spec.deployment.extraVolumes"
        :columns="[
          { field: 'name', label: 'nome', placeholder: 'cache' },
          { field: 'type', label: 'tipo', placeholder: 'emptyDir|hostPath|configMap|secret' },
          { field: 'source', label: 'origem', placeholder: 'path/nome (n/a p/ emptyDir)' },
          { field: 'mountPath', label: 'mountPath', placeholder: '/cache' }
        ]"
        add-label="+ volume"
      />
    </details>

    <details class="adv">
      <summary>imagePullSecrets</summary>
      <RowsEditor
        :rows="props.spec.deployment.imagePullSecrets"
        :columns="[{ field: 'key', label: 'secret', placeholder: 'regcred' }]"
        add-label="+ pull secret"
      />
    </details>
  </FormSection>
</template>

<style scoped>
.adv {
  border: 1px solid var(--bs-border-color);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}
.adv > summary {
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
}
.adv[open] > summary {
  margin-bottom: 0.5rem;
}
</style>
