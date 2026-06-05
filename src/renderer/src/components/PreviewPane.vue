<script setup>
import { computed, ref } from 'vue'
import { buildOutput } from '../core/output/index.js'
import { highlightYaml } from '../core/highlight.js'
import { validateSpec } from '../core/validate.js'
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

const highlighted = computed(() => highlightYaml(output.value.preview))
const issues = computed(() => validateSpec(props.spec))
const errors = computed(() => issues.value.filter((i) => i.level === 'error'))
const warnings = computed(() => issues.value.filter((i) => i.level === 'warning'))
const showIssues = ref(false)

const formats = [
  { id: 'yaml', label: 'YAML' },
  { id: 'kustomize', label: 'Kustomize' },
  { id: 'helm', label: 'Helm' }
]

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
    <div class="preview-toolbar border-bottom p-2">
      <div class="d-flex flex-wrap align-items-center gap-2">
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

        <div v-if="props.spec.output.format === 'yaml'" class="form-check form-switch text-light small mb-0">
          <input id="split" v-model="props.spec.output.splitFiles" class="form-check-input" type="checkbox" role="switch" />
          <label class="form-check-label" for="split">1 arquivo/recurso</label>
        </div>

        <span class="text-secondary small ms-auto text-nowrap">
          {{ output.resourceCount }} rec · {{ output.files.length }} arq
        </span>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-2">
        <button class="btn btn-sm btn-outline-info flex-fill" @click="validate">Validar</button>
        <button class="btn btn-sm btn-outline-light flex-fill" @click="copy">Copiar</button>
        <button class="btn btn-sm btn-success flex-fill" @click="save">Salvar…</button>
      </div>
    </div>

    <!-- Inline validation strip -->
    <div
      v-if="issues.length"
      class="issues-bar"
      :class="errors.length ? 'has-error' : 'has-warning'"
      @click="showIssues = !showIssues"
    >
      <span v-if="errors.length" class="me-3">✗ {{ errors.length }} erro(s)</span>
      <span v-if="warnings.length">⚠ {{ warnings.length }} aviso(s)</span>
      <span class="ms-auto small">{{ showIssues ? 'ocultar ▴' : 'detalhes ▾' }}</span>
    </div>
    <ul v-if="issues.length && showIssues" class="issues-list">
      <li v-for="(i, idx) in issues" :key="idx" :class="i.level">
        <span class="badge" :class="i.level === 'error' ? 'text-bg-danger' : 'text-bg-warning'">
          {{ i.level === 'error' ? 'erro' : 'aviso' }}
        </span>
        {{ i.msg }}
      </li>
    </ul>

    <pre class="preview-code"><code v-html="highlighted"></code></pre>
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

<style scoped>
.preview-toolbar {
  background: #252526;
}
.issues-bar {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  font-size: 0.82rem;
  cursor: pointer;
  color: #1a1a1a;
}
.issues-bar.has-error {
  background: #f8d7da;
}
.issues-bar.has-warning {
  background: #fff3cd;
}
.issues-list {
  margin: 0;
  padding: 0.5rem 0.75rem;
  list-style: none;
  max-height: 30%;
  overflow-y: auto;
  background: #2d2d2d;
  border-bottom: 1px solid #444;
}
.issues-list li {
  font-size: 0.8rem;
  color: #ddd;
  padding: 0.15rem 0;
}
.issues-list .badge {
  font-size: 0.65rem;
}
</style>
