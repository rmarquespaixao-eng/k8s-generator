<script setup>
import FormSection from '../FormSection.vue'
import RowsEditor from '../RowsEditor.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection v-model="props.spec.rbac.enabled" title="RBAC" subtitle="Role/ClusterRole + Binding">
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">Escopo</label>
        <select v-model="props.spec.rbac.scope" class="form-select">
          <option>Role</option>
          <option>ClusterRole</option>
        </select>
      </div>
      <div class="col-6 d-flex align-items-end">
        <div class="form-check form-switch">
          <input
            id="rbac-bind"
            v-model="props.spec.rbac.bindToServiceAccount"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="rbac-bind">
            Criar RoleBinding para o ServiceAccount
          </label>
        </div>
      </div>
    </div>
    <label class="form-label">Regras</label>
    <RowsEditor
      :rows="props.spec.rbac.rules"
      :columns="[
        { field: 'apiGroups', label: 'apiGroups', placeholder: 'apps (vazio = core)' },
        { field: 'resources', label: 'resources', placeholder: 'pods,deployments' },
        { field: 'verbs', label: 'verbs', placeholder: 'get,list,watch' }
      ]"
      add-label="+ regra"
    />
    <p class="text-muted small mt-3 mb-0">
      Os campos aceitam lista separada por vírgula. O binding aponta para o ServiceAccount (habilite
      a seção ServiceAccount).
    </p>
  </FormSection>
</template>
