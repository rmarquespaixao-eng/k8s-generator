<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.resourceQuota.enabled"
    title="ResourceQuota"
    subtitle="v1 — limites do namespace"
  >
    <div class="row g-3">
      <div class="col-4">
        <label class="form-label">requests.cpu</label>
        <input v-model="props.spec.resourceQuota.requestsCpu" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">requests.memory</label>
        <input v-model="props.spec.resourceQuota.requestsMemory" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">pods</label>
        <input v-model="props.spec.resourceQuota.pods" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">limits.cpu</label>
        <input v-model="props.spec.resourceQuota.limitsCpu" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">limits.memory</label>
        <input v-model="props.spec.resourceQuota.limitsMemory" class="form-control" />
      </div>
    </div>
  </FormSection>

  <FormSection
    v-model="props.spec.limitRange.enabled"
    title="LimitRange"
    subtitle="v1 — defaults por container"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">defaultRequest.cpu</label>
        <input v-model="props.spec.limitRange.defaultRequestCpu" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">defaultRequest.memory</label>
        <input v-model="props.spec.limitRange.defaultRequestMemory" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">default.cpu</label>
        <input v-model="props.spec.limitRange.defaultLimitCpu" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">default.memory</label>
        <input v-model="props.spec.limitRange.defaultLimitMemory" class="form-control" />
      </div>
    </div>
  </FormSection>
</template>
