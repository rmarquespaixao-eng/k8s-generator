<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.serviceAccount.enabled" title="ServiceAccount" subtitle="v1">
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">Nome</label>
        <input
          v-model="props.spec.serviceAccount.name"
          class="form-control"
          :placeholder="props.spec.meta.name"
        />
      </div>
      <div class="col-6 d-flex align-items-end">
        <div class="form-check form-switch">
          <input
            id="sa-automount"
            v-model="props.spec.serviceAccount.automountToken"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="sa-automount">
            automountServiceAccountToken
          </label>
        </div>
      </div>
    </div>
    <label class="form-label">Annotations</label>
    <RowsEditor
      :rows="props.spec.serviceAccount.annotations"
      :columns="[
        { field: 'key', label: 'chave', placeholder: 'eks.amazonaws.com/role-arn' },
        { field: 'value', label: 'valor', placeholder: 'arn:aws:iam::...' }
      ]"
      add-label="+ annotation"
    />
    <label class="form-label mt-3">imagePullSecrets</label>
    <RowsEditor
      :rows="props.spec.serviceAccount.imagePullSecrets"
      :columns="[{ field: 'key', label: 'secret', placeholder: 'regcred' }]"
      add-label="+ pull secret"
    />
  </FormSection>
</template>
