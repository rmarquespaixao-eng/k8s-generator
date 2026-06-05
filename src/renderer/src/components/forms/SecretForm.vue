<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.secret.enabled" title="Secret (nativo)" subtitle="v1 — stringData">
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">Tipo</label>
        <select v-model="props.spec.secret.type" class="form-select">
          <option>Opaque</option>
          <option>kubernetes.io/tls</option>
          <option>kubernetes.io/dockerconfigjson</option>
        </select>
      </div>
      <div class="col-6 d-flex align-items-end">
        <div class="form-check form-switch">
          <input
            id="secret-env"
            v-model="props.spec.secret.mountAsEnv"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="secret-env">
            Injetar como variáveis de ambiente (envFrom)
          </label>
        </div>
      </div>
    </div>
    <RowsEditor
      :rows="props.spec.secret.data"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'DB_PASSWORD' },
        { field: 'value', label: 'valor', placeholder: 's3cr3t' }
      ]"
      add-label="+ entrada"
    />
    <p class="text-warning small mt-3 mb-0">
      Os valores ficam em texto no manifesto. Use ExternalSecret para produção.
    </p>
  </FormSection>
</template>
