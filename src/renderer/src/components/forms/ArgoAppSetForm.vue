<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.argoAppSet.enabled"
    title="Argo CD ApplicationSet"
    subtitle="argoproj.io/v1alpha1"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">project</label>
        <input v-model="props.spec.argoAppSet.project" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">generatorType</label>
        <select v-model="props.spec.argoAppSet.generatorType" class="form-select">
          <option value="list">list</option>
          <option value="git">git</option>
          <option value="cluster">cluster</option>
        </select>
      </div>
      <div class="col-6">
        <label class="form-label">repoURL</label>
        <input v-model="props.spec.argoAppSet.repoURL" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">path</label>
        <input v-model="props.spec.argoAppSet.path" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">targetRevision</label>
        <input v-model="props.spec.argoAppSet.targetRevision" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">destServer</label>
        <input v-model="props.spec.argoAppSet.destServer" class="form-control" />
      </div>
    </div>

    <div v-if="props.spec.argoAppSet.generatorType === 'list'">
      <label class="form-label mt-3">Elementos</label>
      <RowsEditor
        :rows="props.spec.argoAppSet.elements"
        :columns="[
          { field: 'name', label: 'nome', placeholder: 'dev' },
          { field: 'namespace', label: 'namespace', placeholder: 'dev' }
        ]"
        add-label="+ elemento"
      />
    </div>

    <div v-if="props.spec.argoAppSet.generatorType === 'git'" class="row g-3 mt-0">
      <div class="col-6">
        <label class="form-label">Diretórios (glob)</label>
        <input
          v-model="props.spec.argoAppSet.gitDirectories"
          class="form-control"
          placeholder="apps/*"
        />
      </div>
    </div>

    <p class="text-muted small mt-3 mb-0">
      O template usa <code v-pre>{{name}}</code> e <code v-pre>{{namespace}}</code> de cada gerador
      para nomear as Applications geradas.
    </p>
  </FormSection>
</template>
