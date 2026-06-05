<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.hpa.enabled"
    title="HorizontalPodAutoscaler"
    subtitle="autoscaling/v2"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">minReplicas</label>
        <input v-model.number="props.spec.hpa.minReplicas" type="number" min="1" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">maxReplicas</label>
        <input v-model.number="props.spec.hpa.maxReplicas" type="number" min="1" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">CPU alvo (%)</label>
        <input v-model.number="props.spec.hpa.targetCPU" type="number" min="0" class="form-control" />
        <div class="form-text">0 = desabilitar métrica de CPU.</div>
      </div>
      <div class="col-6">
        <label class="form-label">Memória alvo (%)</label>
        <input v-model.number="props.spec.hpa.targetMemory" type="number" min="0" class="form-control" />
        <div class="form-text">0 = desabilitar métrica de memória.</div>
      </div>
    </div>
    <p class="text-muted small mt-3 mb-0">
      Com HPA ligado, o Deployment omite <code>replicas</code> para não brigar com o autoscaler.
    </p>
  </FormSection>
</template>
