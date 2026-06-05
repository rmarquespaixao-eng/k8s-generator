<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.configMap.enabled"
    title="ConfigMap"
    subtitle="config não-sensível"
  >
    <div class="form-check form-switch mb-3">
      <input
        id="cm-env"
        v-model="props.spec.configMap.mountAsEnv"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="cm-env">
        Injetar como variáveis de ambiente (envFrom)
      </label>
    </div>
    <RowsEditor
      :rows="props.spec.configMap.data"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'API_BASE_URL' },
        { field: 'value', label: 'valor', placeholder: 'https://api...' }
      ]"
      add-label="+ entrada"
    />
  </FormSection>

  <FormSection
    v-model="props.spec.externalSecret.enabled"
    title="ExternalSecret"
    subtitle="external-secrets.io"
  >
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">SecretStore</label>
        <input v-model="props.spec.externalSecret.secretStoreName" class="form-control" />
      </div>
      <div class="col-3">
        <label class="form-label">Kind</label>
        <select v-model="props.spec.externalSecret.secretStoreKind" class="form-select">
          <option>ClusterSecretStore</option>
          <option>SecretStore</option>
        </select>
      </div>
      <div class="col-3">
        <label class="form-label">refreshInterval</label>
        <input v-model="props.spec.externalSecret.refreshInterval" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">Secret alvo (k8s)</label>
        <input
          v-model="props.spec.externalSecret.targetName"
          class="form-control"
          :placeholder="`${props.spec.meta.name}-secret`"
        />
      </div>
      <div class="col-6 d-flex align-items-end">
        <div class="form-check form-switch">
          <input
            id="es-env"
            v-model="props.spec.externalSecret.mountAsEnv"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="es-env">Injetar como env (envFrom)</label>
        </div>
      </div>
    </div>
    <label class="form-label">Chaves remotas</label>
    <RowsEditor
      :rows="props.spec.externalSecret.data"
      :columns="[
        { field: 'secretKey', label: 'chave local', placeholder: 'DB_PASSWORD' },
        { field: 'remoteKey', label: 'chave remota', placeholder: 'homelab/vps-env' },
        { field: 'remoteProperty', label: 'property', placeholder: 'DB_PASSWORD (opc.)' }
      ]"
      add-label="+ chave"
    />
  </FormSection>
</template>
