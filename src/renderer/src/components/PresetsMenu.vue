<script setup>
import { ref, onMounted, computed } from 'vue'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({ spec: { type: Object, required: true } })
const emit = defineEmits(['load', 'notify'])

const presets = ref({})
const open = ref(false)
const saveModal = ref(false)
const newName = ref('')

const names = computed(() => Object.keys(presets.value).sort())

onMounted(async () => {
  presets.value = (await window.api.loadPresets()) || {}
})

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

async function persist() {
  await window.api.savePresets(clone(presets.value))
}

async function confirmSave() {
  const name = newName.value.trim()
  if (!name) return
  presets.value[name] = clone(props.spec)
  await persist()
  saveModal.value = false
  newName.value = ''
  emit('notify', `Preset "${name}" salvo`)
}

function load(name) {
  emit('load', clone(presets.value[name]))
  open.value = false
  emit('notify', `Preset "${name}" carregado`)
}

async function remove(name) {
  delete presets.value[name]
  await persist()
  emit('notify', `Preset "${name}" removido`)
}

function openSave() {
  newName.value = props.spec.meta.name || ''
  saveModal.value = true
  open.value = false
}
</script>

<template>
  <div class="position-relative d-inline-block">
    <button class="btn btn-sm btn-outline-secondary" @click="open = !open">Presets ▾</button>

    <div v-if="open" class="presets-pop card shadow">
      <div class="list-group list-group-flush">
        <div v-if="!names.length" class="list-group-item text-muted small">Nenhum preset salvo.</div>
        <div
          v-for="n in names"
          :key="n"
          class="list-group-item d-flex align-items-center justify-content-between py-1"
        >
          <button class="btn btn-link btn-sm p-0 text-decoration-none flex-grow-1 text-start" @click="load(n)">
            {{ n }}
          </button>
          <button class="btn btn-sm btn-outline-danger py-0 px-1 ms-2" title="Remover" @click="remove(n)">
            ×
          </button>
        </div>
      </div>
      <div class="card-footer p-2">
        <button class="btn btn-sm btn-primary w-100" @click="openSave">Salvar configuração atual…</button>
      </div>
    </div>
  </div>

  <ModalDialog v-model="saveModal" title="Salvar preset">
    <label class="form-label">Nome do preset</label>
    <input
      v-model="newName"
      class="form-control"
      placeholder="ex: api-padrao"
      @keyup.enter="confirmSave"
    />
    <p v-if="names.includes(newName.trim())" class="text-warning small mt-2 mb-0">
      Já existe — será sobrescrito.
    </p>
    <template #footer>
      <button class="btn btn-secondary" @click="saveModal = false">Cancelar</button>
      <button class="btn btn-primary" :disabled="!newName.trim()" @click="confirmSave">Salvar</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.presets-pop {
  position: absolute;
  top: 110%;
  right: 0;
  z-index: 1040;
  width: 280px;
  max-height: 360px;
  overflow-y: auto;
}
</style>
