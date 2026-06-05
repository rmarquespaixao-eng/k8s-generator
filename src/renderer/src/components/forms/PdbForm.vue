<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.pdb.enabled" title="PodDisruptionBudget" subtitle="policy/v1">
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">Modo</label>
        <select v-model="props.spec.pdb.mode" class="form-select">
          <option>minAvailable</option>
          <option>maxUnavailable</option>
        </select>
      </div>
      <div class="col-6">
        <label class="form-label">Valor</label>
        <input v-model="props.spec.pdb.value" class="form-control" placeholder="1 ou 50%" />
        <div class="form-text">Aceita número ou porcentagem.</div>
      </div>
    </div>
  </FormSection>
</template>
