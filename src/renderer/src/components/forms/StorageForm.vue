<script setup>
import FormSection from '../FormSection.vue'
const props = defineProps({ spec: { type: Object, required: true } })
</script>

<template>
  <FormSection
    v-model="props.spec.pvc.enabled"
    title="PersistentVolumeClaim"
    subtitle="volume persistente"
  >
    <div class="row g-3">
      <div class="col-6">
        <label class="form-label">storageClassName</label>
        <input
          v-model="props.spec.pvc.storageClassName"
          class="form-control"
          placeholder="(vazio = default do cluster)"
        />
      </div>
      <div class="col-6">
        <label class="form-label">accessMode</label>
        <select v-model="props.spec.pvc.accessMode" class="form-select">
          <option>ReadWriteOnce</option>
          <option>ReadOnlyMany</option>
          <option>ReadWriteMany</option>
        </select>
      </div>
      <div class="col-6">
        <label class="form-label">Tamanho</label>
        <input v-model="props.spec.pvc.size" class="form-control" placeholder="1Gi" />
      </div>
      <div class="col-6">
        <label class="form-label">mountPath no container</label>
        <input v-model="props.spec.pvc.mountPath" class="form-control" placeholder="/data" />
      </div>
    </div>
    <p class="text-muted small mt-3 mb-0">
      O Deployment monta este volume como <code>data</code> em <code>{{ props.spec.pvc.mountPath }}</code>.
    </p>
  </FormSection>
</template>
