<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.rollout.enabled"
    title="Argo Rollout"
    subtitle="argoproj.io/v1alpha1 — substitui o Deployment"
  >
    <p class="text-muted small">
      Reusa imagem, recursos, env e config pod-level da seção Workload; aqui só a estratégia de
      release é definida.
    </p>

    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">strategy</label>
        <select v-model="props.spec.rollout.strategy" class="form-select">
          <option value="canary">canary</option>
          <option value="blueGreen">blueGreen</option>
        </select>
      </div>
    </div>

    <div v-if="props.spec.rollout.strategy === 'canary'">
      <label class="form-label mt-3">Steps</label>
      <RowsEditor
        :rows="props.spec.rollout.canarySteps"
        :columns="[
          { field: 'weight', label: 'peso (%)', placeholder: '20' },
          { field: 'pauseSeconds', label: 'pausa (s)', placeholder: 'vazio = manual' }
        ]"
        add-label="+ step"
      />
    </div>

    <div v-if="props.spec.rollout.strategy === 'blueGreen'">
      <div class="row g-3 mt-0">
        <div class="col-6">
          <label class="form-label">activeService</label>
          <input
            v-model="props.spec.rollout.activeService"
            class="form-control"
            :placeholder="props.spec.meta.name"
          />
        </div>
        <div class="col-6">
          <label class="form-label">previewService</label>
          <input v-model="props.spec.rollout.previewService" class="form-control" />
        </div>
      </div>
      <div class="form-check form-switch mt-3">
        <input
          id="rollout-autopromo"
          v-model="props.spec.rollout.autoPromotion"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="rollout-autopromo">autoPromotionEnabled</label>
      </div>
    </div>
  </FormSection>
</template>
