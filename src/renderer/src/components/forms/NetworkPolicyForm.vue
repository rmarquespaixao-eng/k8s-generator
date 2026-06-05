<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.networkPolicy.enabled"
    title="NetworkPolicy"
    subtitle="networking.k8s.io/v1"
  >
    <div class="form-check form-switch mb-2">
      <input
        id="np-deny-ingress"
        v-model="props.spec.networkPolicy.denyAllIngress"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="np-deny-ingress">Negar todo ingress por padrão</label>
    </div>
    <div class="form-check form-switch mb-2">
      <input
        id="np-same-ns"
        v-model="props.spec.networkPolicy.allowSameNamespace"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="np-same-ns">Permitir do mesmo namespace</label>
    </div>
    <div class="form-check form-switch mb-3">
      <input
        id="np-deny-egress"
        v-model="props.spec.networkPolicy.denyAllEgress"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="np-deny-egress">Negar todo egress</label>
    </div>
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">Permitir do CIDR</label>
        <input
          v-model="props.spec.networkPolicy.allowFromCIDR"
          class="form-control"
          placeholder="10.0.0.0/8"
        />
      </div>
    </div>
    <label class="form-label">Portas permitidas</label>
    <RowsEditor
      :rows="props.spec.networkPolicy.allowPorts"
      :columns="[{ field: 'key', label: 'porta', placeholder: '8080' }]"
      add-label="+ porta"
    />
  </FormSection>
</template>
