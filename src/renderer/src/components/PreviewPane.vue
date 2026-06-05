<script setup>
import { computed, ref } from 'vue'
import { buildOutput } from '../core/output/index.js'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({ spec: { type: Object, required: true } })
const emit = defineEmits(['notify'])

const output = computed(() => {
  try {
    return buildOutput(props.spec)
  } catch (err) {
    return {
      format: props.spec.output.format,
      preview: `# erro ao gerar:\n# ${err.message}`,
      files: [],
      resourceCount: 0
    }
  }
})

const formats = [
  { id: 'yaml', label: 'YAML' },
  { id: 'kustomize', label: 'Kustomize' },
  { id: 'helm', label: 'Helm' }
]

// --- validation state ---
const validateOpen = ref(false)
const validating = ref(false)
const validateResult = ref(null)

async function copy() {
  await navigator.clipboard.writeText(output.value.preview)
  emit('notify', 'Copiado para a área de transferência')
}

async function save() {
  const files = output.value.files
  if (!files.length) {
    emit('notify', 'Nada para salvar — habilite ao menos um recurso')
    return
  }
  const res = await window.api.saveFiles(JSON.parse(JSON.stringify(files)))
  if (res?.ok) emit('notify', `${res.written.length} arquivo(s) salvos em ${res.baseDir}`)
  else if (!res?.canceled) emit('notify', 'Falha ao salvar')
}

async function validate() {
  // Helm templates aren't plain YAML; kubectl validates rendered manifests.
  if (props.spec.output.format === 'helm') {
    emit('notify', 'Validação roda sobre YAML/Kustomize (Helm gera templates).')
    return
  }
  validateOpen.value = true
  validating.value = true
  validateResult.value = null
  validateResult.value = await window.api.validate(output.value.preview)
  validating.value = false
}
</script>

<template>
  <section class="app-preview">
    <div class="d-flex align-items-center gap-2 p-2 border-bottom" style="background: #252526">
      <div class="btn-group btn-group-sm" role="group">
        <button
          v-for="f in formats"
          :key="f.id"
          type="button"
          class="btn"
          :class="props.spec.output.format === f.id ? 'btn-primary' : 'btn-outline-light'"
          @click="props.spec.output.format = f.id"
        >
          {{ f.label }}
        </button>
      </div>

      <div
        v-if="props.spec.output.format === 'yaml'"
        class="form-check form-switch text-light small ms-2 mb-0"
      >
        <input
          id="split"
          v-model="props.spec.output.splitFiles"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="split">1 arquivo por recurso</label>
      </div>

      <span class="text-secondary small ms-auto">
        {{ output.resourceCount }} recurso(s) · {{ output.files.length }} arquivo(s)
      </span>
      <button class="btn btn-sm btn-outline-info" @click="validate">Validar</button>
      <button class="btn btn-sm btn-outline-light" @click="copy">Copiar</button>
      <button class="btn btn-sm btn-success" @click="save">Salvar…</button>
    </div>

    <pre class="preview-code"><code>{{ output.preview }}</code></pre>
  </section>

  <ModalDialog v-model="validateOpen" title="Validação kubectl (--dry-run=client)" wide>
    <div v-if="validating" class="text-center py-4">
      <div class="spinner-border text-info" role="status"></div>
      <p class="text-muted mt-2 mb-0">Validando…</p>
    </div>

    <div v-else-if="validateResult">
      <div v-if="!validateResult.available" class="alert alert-warning mb-0">
        <strong>kubectl não disponível.</strong>
        <div class="small mt-1">{{ validateResult.error }}</div>
        <div class="small mt-2 text-muted">
          Instale o kubectl e garanta que está no <code>PATH</code> para validar offline.
        </div>
      </div>

      <template v-else>
        <div :class="validateResult.ok ? 'alert alert-success' : 'alert alert-danger'">
          {{ validateResult.ok ? '✓ Manifestos válidos (schema client-side).' : '✗ Validação falhou.' }}
        </div>
        <pre v-if="validateResult.stdout" class="bg-body-secondary p-2 rounded small mb-2"><code>{{ validateResult.stdout }}</code></pre>
        <div v-if="validateResult.stderr">
          <label class="form-label small text-muted mb-1">stderr</label>
          <pre class="bg-body-secondary p-2 rounded small mb-0 text-danger"><code>{{ validateResult.stderr }}</code></pre>
        </div>
      </template>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="validateOpen = false">Fechar</button>
    </template>
  </ModalDialog>
</template>
