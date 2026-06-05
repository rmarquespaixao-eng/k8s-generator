<script setup>
import { ref } from 'vue'
import ModalDialog from './ModalDialog.vue'
import { parseManifests } from '../core/parse.js'

const show = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['imported'])

const text = ref('')
const error = ref('')

async function pickFile() {
  const res = await window.api.openYaml()
  if (res?.ok) {
    text.value = res.content
    error.value = ''
  }
}

function doImport() {
  try {
    const spec = parseManifests(text.value)
    emit('imported', spec)
    show.value = false
    text.value = ''
    error.value = ''
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <ModalDialog v-model="show" title="Importar YAML" wide>
    <p class="text-muted small">
      Cole manifestos Kubernetes (multi-doc com <code>---</code>) ou carregue um arquivo. Os recursos
      reconhecidos preenchem o formulário; os demais são ignorados.
    </p>
    <textarea
      v-model="text"
      class="form-control font-monospace"
      rows="14"
      placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;..."
      style="font-size: 12.5px"
    ></textarea>
    <div v-if="error" class="alert alert-danger mt-2 mb-0 py-2 small">{{ error }}</div>

    <template #footer>
      <button class="btn btn-outline-secondary" @click="pickFile">Escolher arquivo…</button>
      <button class="btn btn-secondary" @click="show = false">Cancelar</button>
      <button class="btn btn-primary" :disabled="!text.trim()" @click="doImport">Importar</button>
    </template>
  </ModalDialog>
</template>
