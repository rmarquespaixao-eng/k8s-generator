<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.job.enabled" title="Job" subtitle="batch/v1 (execução única)">
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">Imagem</label>
        <input v-model="props.spec.job.image" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">command</label>
        <input v-model="props.spec.job.command" class="form-control" placeholder='sh -c "..."' />
      </div>
      <div class="col-6">
        <label class="form-label">args</label>
        <input v-model="props.spec.job.args" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">restartPolicy</label>
        <select v-model="props.spec.job.restartPolicy" class="form-select">
          <option>OnFailure</option>
          <option>Never</option>
        </select>
      </div>
      <div class="col-4">
        <label class="form-label">completions</label>
        <input v-model.number="props.spec.job.completions" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">parallelism</label>
        <input v-model.number="props.spec.job.parallelism" type="number" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">backoffLimit</label>
        <input v-model.number="props.spec.job.backoffLimit" type="number" class="form-control" />
      </div>
    </div>
    <p class="text-muted small mt-3 mb-0">
      O Job herda <code>envFrom</code> do ConfigMap/Secret habilitados.
    </p>
  </FormSection>
</template>
