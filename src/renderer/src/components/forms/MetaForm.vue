<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection title="Aplicação" subtitle="metadados base de todos os recursos">
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">Nome</label>
        <input v-model="props.spec.meta.name" class="form-control" placeholder="my-app" />
        <div class="form-text">Vira o nome de todos os recursos e o selector.</div>
      </div>
      <div class="col-6">
        <label class="form-label">Namespace</label>
        <input v-model="props.spec.meta.namespace" class="form-control" placeholder="default" />
      </div>
    </div>
    <div class="form-check form-switch mt-3">
      <input
        id="emit-ns"
        v-model="props.spec.meta.emitNamespace"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="emit-ns">Gerar também o recurso Namespace</label>
    </div>
    <hr />
    <label class="form-label">Labels extras</label>
    <RowsEditor
      :rows="props.spec.meta.extraLabels"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'team' },
        { field: 'value', label: 'valor', placeholder: 'platform' }
      ]"
      add-label="+ label"
    />
    <hr />
    <label class="form-label">Annotations do pod</label>
    <RowsEditor
      :rows="props.spec.meta.podAnnotations"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'prometheus.io/scrape' },
        { field: 'value', label: 'valor', placeholder: 'true' }
      ]"
      add-label="+ annotation"
    />
  </FormSection>
</template>
