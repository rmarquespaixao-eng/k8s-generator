<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.argoApp.enabled"
    title="Argo CD Application"
    subtitle="argoproj.io/v1alpha1"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">project</label>
        <input v-model="props.spec.argoApp.project" class="form-control" />
      </div>
      <div class="col-6">
        <label class="form-label">repoURL</label>
        <input
          v-model="props.spec.argoApp.repoURL"
          class="form-control"
          placeholder="git@gitea...:admin/app.git"
        />
      </div>
      <div class="col-6">
        <label class="form-label">targetRevision</label>
        <input
          v-model="props.spec.argoApp.targetRevision"
          class="form-control"
          placeholder="HEAD ou *"
        />
      </div>
      <div class="col-6">
        <label class="form-label">sourceType</label>
        <select v-model="props.spec.argoApp.sourceType" class="form-select">
          <option value="git">git</option>
          <option value="helm">helm</option>
        </select>
      </div>
    </div>

    <div v-if="props.spec.argoApp.sourceType === 'git'" class="row g-3 mt-0">
      <div class="col-6">
        <label class="form-label">path</label>
        <input v-model="props.spec.argoApp.path" class="form-control" placeholder="k8s/" />
      </div>
    </div>

    <div v-if="props.spec.argoApp.sourceType === 'helm'">
      <div class="row g-3 mt-0">
        <div class="col-6">
          <label class="form-label">chart</label>
          <input
            v-model="props.spec.argoApp.chart"
            class="form-control"
            placeholder="nome do chart (repo helm)"
          />
        </div>
        <div class="col-6">
          <label class="form-label">path</label>
          <input
            v-model="props.spec.argoApp.path"
            class="form-control"
            placeholder="ou caminho do chart no repo"
          />
        </div>
      </div>
      <label class="form-label mt-3">Parâmetros Helm</label>
      <RowsEditor
        :rows="props.spec.argoApp.helmParameters"
        :columns="[
          { field: 'key', label: 'parâmetro', placeholder: 'image.tag' },
          { field: 'value', label: 'valor', placeholder: '1.2.3' }
        ]"
        add-label="+ parâmetro"
      />
    </div>

    <hr />
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">destServer</label>
        <input
          v-model="props.spec.argoApp.destServer"
          class="form-control"
          placeholder="https://kubernetes.default.svc"
        />
      </div>
      <div class="col-6">
        <label class="form-label">destNamespace</label>
        <input
          v-model="props.spec.argoApp.destNamespace"
          class="form-control"
          :placeholder="props.spec.meta.namespace"
        />
      </div>
    </div>

    <hr />
    <div class="form-check form-switch mb-2">
      <input
        id="argo-sync"
        v-model="props.spec.argoApp.syncAutomated"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="argo-sync">Sync automático</label>
    </div>
    <div v-if="props.spec.argoApp.syncAutomated" class="d-flex flex-wrap gap-3 mb-2">
      <div class="form-check form-switch">
        <input
          id="argo-prune"
          v-model="props.spec.argoApp.prune"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="argo-prune">prune</label>
      </div>
      <div class="form-check form-switch">
        <input
          id="argo-selfheal"
          v-model="props.spec.argoApp.selfHeal"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="argo-selfheal">selfHeal</label>
      </div>
    </div>

    <div class="form-check form-switch">
      <input
        id="argo-createns"
        v-model="props.spec.argoApp.createNamespace"
        class="form-check-input"
        type="checkbox"
        role="switch"
      />
      <label class="form-check-label" for="argo-createns">CreateNamespace=true</label>
    </div>
  </FormSection>
</template>
