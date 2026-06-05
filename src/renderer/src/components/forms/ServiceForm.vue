<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.service.enabled" title="Service" subtitle="exposição interna">
    <div class="row g-3">
      <div class="col-4">
        <label class="form-label">Tipo</label>
        <select v-model="props.spec.service.type" class="form-select">
          <option>ClusterIP</option>
          <option>NodePort</option>
          <option>LoadBalancer</option>
        </select>
      </div>
      <div class="col-4">
        <label class="form-label">Porta do service</label>
        <input v-model.number="props.spec.service.port" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">targetPort (container)</label>
        <input v-model.number="props.spec.service.targetPort" type="number" class="form-control" />
      </div>
    </div>
  </FormSection>
</template>
