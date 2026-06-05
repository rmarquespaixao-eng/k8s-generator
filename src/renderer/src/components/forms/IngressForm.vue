<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.ingress.enabled" title="Ingress" subtitle="roteamento HTTP externo">
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">ingressClassName</label>
        <input v-model="props.spec.ingress.className" class="form-control" placeholder="nginx / traefik" />
      </div>
      <div class="col-6">
        <label class="form-label">Host</label>
        <input v-model="props.spec.ingress.host" class="form-control" placeholder="app.example.com" />
      </div>
      <div class="col-6">
        <label class="form-label">Path</label>
        <input v-model="props.spec.ingress.path" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">pathType</label>
        <select v-model="props.spec.ingress.pathType" class="form-select">
          <option>Prefix</option>
          <option>Exact</option>
          <option>ImplementationSpecific</option>
        </select>
      </div>
    </div>

    <hr />
    <div class="form-check form-switch mb-2">
      <input
        id="tls"
        v-model="props.spec.ingress.tls.enabled"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="tls">TLS</label>
    </div>
    <div v-if="props.spec.ingress.tls.enabled" class="mb-2">
      <label class="form-label">Secret do certificado</label>
      <input
        v-model="props.spec.ingress.tls.secretName"
        class="form-control"
        :placeholder="`${props.spec.meta.name}-tls`"
      />
    </div>

    <hr />
    <label class="form-label">Annotations</label>
    <RowsEditor
      :rows="props.spec.ingress.annotations"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'cert-manager.io/cluster-issuer' },
        { field: 'value', label: 'valor', placeholder: 'letsencrypt-prod' }
      ]"
      add-label="+ annotation"
    />
  </FormSection>
</template>
