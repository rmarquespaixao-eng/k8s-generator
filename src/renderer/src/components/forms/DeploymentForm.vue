<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.deployment.enabled"
    title="Deployment"
    subtitle="workload principal"
  >
    <div class="row g-3">
      <div class="col-8">
        <label class="form-label">Imagem</label>
        <input v-model="props.spec.deployment.image" class="form-control" placeholder="nginx:1.27" />
      </div>
      <div class="col-4">
        <label class="form-label">Réplicas</label>
        <input
          v-model.number="props.spec.deployment.replicas"
          type="number"
          min="0"
          class="form-control"
          :disabled="props.spec.hpa.enabled"
        />
        <div v-if="props.spec.hpa.enabled" class="form-text">Gerenciado pelo HPA.</div>
      </div>
      <div class="col-6">
        <label class="form-label">imagePullPolicy</label>
        <select v-model="props.spec.deployment.imagePullPolicy" class="form-select">
          <option>IfNotPresent</option>
          <option>Always</option>
          <option>Never</option>
        </select>
      </div>
      <div class="col-6">
        <label class="form-label">Porta do container</label>
        <input
          v-model.number="props.spec.deployment.containerPort"
          type="number"
          class="form-control"
        />
      </div>
      <div class="col-6">
        <label class="form-label">command (opcional)</label>
        <input
          v-model="props.spec.deployment.command"
          class="form-control"
          placeholder='sh -c "..."'
        />
      </div>
      <div class="col-6">
        <label class="form-label">args (opcional)</label>
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
      <div class="col-6">
        <label class="form-label">initialDelaySeconds</label>
        <input
          v-model.number="props.spec.deployment.probes.initialDelaySeconds"
          type="number"
          class="form-control"
        />
      </div>
      <div class="col-6">
        <label class="form-label">periodSeconds</label>
        <input
          v-model.number="props.spec.deployment.probes.periodSeconds"
          type="number"
          class="form-control"
        />
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
  </FormSection>
</template>
