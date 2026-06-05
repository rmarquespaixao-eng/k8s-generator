<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.argoWorkflow.enabled"
    title="Argo Workflow"
    subtitle="argoproj.io/v1alpha1"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">kind</label>
        <select v-model="props.spec.argoWorkflow.kind" class="form-select">
          <option value="Workflow">Workflow</option>
          <option value="CronWorkflow">CronWorkflow</option>
        </select>
      </div>
      <div v-if="props.spec.argoWorkflow.kind === 'CronWorkflow'" class="col-6">
        <label class="form-label">schedule</label>
        <input
          v-model="props.spec.argoWorkflow.schedule"
          class="form-control"
          placeholder="0 * * * *"
        />
      </div>
    </div>

    <div class="row g-3 mt-0">
      <div class="col-6">
        <label class="form-label">entrypoint</label>
        <input
          v-model="props.spec.argoWorkflow.entrypoint"
          class="form-control"
          placeholder="main"
        />
      </div>
      <div class="col-6">
        <label class="form-label">image</label>
        <input v-model="props.spec.argoWorkflow.image" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">command</label>
        <input
          v-model="props.spec.argoWorkflow.command"
          class="form-control"
          placeholder='sh -c "..."'
        />
      </div>
      <div class="col-6">
        <label class="form-label">args</label>
        <input v-model="props.spec.argoWorkflow.args" class="form-control" />
      </div>
    </div>
  </FormSection>
</template>
