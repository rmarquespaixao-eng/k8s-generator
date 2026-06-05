<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.cronjob.enabled" title="CronJob" subtitle="batch/v1">
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">Schedule (cron)</label>
        <input v-model="props.spec.cronjob.schedule" class="form-control" placeholder="0 * * * *" />
      </div>
      <div class="col-6">
        <label class="form-label">Imagem</label>
        <input v-model="props.spec.cronjob.image" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">command</label>
        <input v-model="props.spec.cronjob.command" class="form-control" placeholder='sh -c "..."' />
      </div>
      <div class="col-6">
        <label class="form-label">args</label>
        <input v-model="props.spec.cronjob.args" class="form-control" />
      </div>
      <div class="col-4">
        <label class="form-label">restartPolicy</label>
        <select v-model="props.spec.cronjob.restartPolicy" class="form-select">
          <option>OnFailure</option>
          <option>Never</option>
        </select>
      </div>
      <div class="col-4">
        <label class="form-label">concurrencyPolicy</label>
        <select v-model="props.spec.cronjob.concurrencyPolicy" class="form-select">
          <option>Allow</option>
          <option>Forbid</option>
          <option>Replace</option>
        </select>
      </div>
      <div class="col-2">
        <label class="form-label">histórico ✓</label>
        <input
          v-model.number="props.spec.cronjob.successfulJobsHistoryLimit"
          type="number"
          min="0"
          class="form-control"
        />
      </div>
      <div class="col-2">
        <label class="form-label">histórico ✗</label>
        <input
          v-model.number="props.spec.cronjob.failedJobsHistoryLimit"
          type="number"
          min="0"
          class="form-control"
        />
      </div>
    </div>
    <p class="text-muted small mt-3 mb-0">
      O CronJob herda <code>envFrom</code> do ConfigMap/ExternalSecret habilitados.
    </p>
  </FormSection>
</template>
